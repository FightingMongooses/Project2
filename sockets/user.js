"use strict";
// REF: http://www.codedevlog.com/blog/2014/10/23/socket-dot-io-user-sessions-with-redis-and-json-web-tokens
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/
// REF: https://github.com/auth0/node-jsonwebtoken

module.exports = function (io,socket) {
    // Function to check if at least one of the sockets is still alive
    var checkSocketLive = function(element,index,array){
        if(typeof io.sockets.connected[element] === "undefined"){
            return false;
        } else {
            return true;
        }
    };
    // Token verifier, check if socket id in token exists, if it does, verify that current socket/user matches it
    validator.extend("isValidToken",function(token){
        var decoded = null;
        var thisSocket = socket.id;
        try {
            decoded = jwt.verify(token, secret);
        } catch(err) {
            decoded = null;
        }

        // Function to check if the current socket"s IP matches any other live IP"s for this token
        var compareSocketIP = function(element,index,array){
            if(typeof io.sockets.connected[element] === "undefined"){
                return false;
            } else if(io.sockets.connected[element].conn._remoteAddress !== io.sockets.connected[thisSocket].conn._remoteAddress) {
                return false;
            } else {
                return true;
            }
        };

        console.log({isValidToken:decoded});
        if(decoded === null || typeof decoded.sockets === "undefined"){ // Token error of some sort
            console.log({isValidToken:"Error, decoded null or undefined",decoded:decoded});
            socket.emit("user:signinError", {token: true}); // Run token delete command client-side
            return false;
        } else if(decoded.sockets.indexOf(thisSocket) > -1 ){ // Sockets match, no need to verify further since token passed as valid
            console.log({isValidToken:"This socket is in the token list",decoded:decoded});
            return decoded;
        } else { // Current socket not listed in token, verify by IP for now
            // Token socket garbage collection(Trim dead sockets from decoded list)
            decoded.sockets = decoded.sockets.filter(checkSocketLive);
            if(decoded.sockets.length === 0){ // All listed sockets dead, this one is probably ok(user closed+reopened tab?)
                decoded.sockets.push(thisSocket);
                console.log({isValidToken:"All old sockets dead",decoded:decoded});
                return decoded;
            } else if(decoded.sockets.some(compareSocketIP)){ // There are still active sockets, if at least one has matching IP, still good
                console.log({isValidToken:"IP address matches one of the sockets",decoded:decoded});
                return decoded;
            } else { // Active socket on another IP is using this token, assume socket jacking attempt
                console.log({isValidToken:"Either no matching IP, or all sockets",decoded:decoded});
                socket.emit("user:signinError", {token: true}); // Run token delete command client-side
                return false;
            }
        }
    });

    // Token generator/signer, should only be used within the user class
    var tokenGenerator = function(userId,userEmail,userSockets,userDisplayname){
        var allSockets = [];
        if(!validator.isAlphanumeric(userDisplayname)){
            userDisplayname = null;
        }
        if(typeof userSockets === "string"){
            allSockets.push(userSockets);
        } else {
            allSockets = _.unique(userSockets);
        }
        allSockets = allSockets.filter(checkSocketLive);
        console.log({userSockets:allSockets,what:typeof allSockets});
        var token = jwt.sign(
            {id: userId, email: userEmail, displayname: userDisplayname, sockets: allSockets},
            secret,
            {expiresInMinutes: 10080});
        // REF: http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io <-- For the basic idea
        // REF: http://stackoverflow.com/a/24722062 <-- for socket.io > 1.0
        allSockets.forEach(function(element,index,array){ // Send this message to all sockets in this list
            //socket.emit("user:setToken", {token: token});
            console.log({token:token,element:element});
            io.to(element).emit("user:setToken",{token: token});
        });
        return token;
    };

    // User functions
    socket.on("user:",function(msg){
        console.log("User: "+msg);
    });
    socket.on("user:checkToken",function(msg){
        if(msg.token !== null){
            var decode = validator.isValidToken(msg.token);
            if(decode !== false){ // Token is valid, we have data
                console.log({decode:decode});
                var User = mongoose.model("User");
                User.findOne({email: decode.email}, function (err, result) {
                    if(result) { // If user was found
                        decode.sockets.push(socket.id);
                        var token = tokenGenerator(result._id,result.email,decode.sockets,result.displayname);
                        console.log({id: result._id, email: result.email, token: token});
                        socket.emit("user:accountInfo", {
                            id: result._id,
                            email: result.email,
                            displayname: result.displayname
                        });
                        //socket.emit("user:setToken", {token: token});
                        if (typeof result.displayname === "undefined") {
                            socket.emit("user:trigger", {settings: true});
                        }
                    } else { // No user found
                        socket.emit("user:signinError", {token: true});
                    }
                });
            } else { // Invalid token
                socket.emit("user:signinError", {token: true});
            }
        }
    });
    socket.on("user:register",function(msg){
        console.log({action:"register",msg:msg});
        if(validator.isEmail(msg.email)) {
            // Check if user exist in DB
            var User = mongoose.model("User");
            User.findOne({email: msg.email}, function (err, result) { // Check if email has been used already
                if (result === null) { // No user found, create and return JWT token
                    var create = new User({
                        email: msg.email,
                        password: msg.password
                    });
                    create.save();
                    var token = tokenGenerator(create._id,create.email,socket.id);
                    console.log({id: create._id, email: create.email, token: token});
                    socket.emit("user:accountInfo",{id:create._id,email:create.email,displayname:create.displayname});
                    //socket.emit("user:setToken", {token: token});
                    socket.emit("user:trigger", {settings: true});
                } else { // User account found, return error to user
                    socket.emit("user:signinError", {email: true});
                }
            });
        } else { // Invalid email address
            socket.emit("user:signinError", {email: true});
        }
    });
    socket.on("user:signin",function(msg){
        console.log({action:"signin",msg:msg});
        if(validator.isEmail(msg.email)) {
            // Attempt login
            var User = mongoose.model("User");
            User.findOne({email: msg.email}, function (err, result) { // Check if email exists
                if (result !== null) {
                    result.comparePassword(msg.password, function (err, match) {
                        if (err) { // Unknown error
                            socket.emit("user:signinError", {password: true});
                        } else if (match) { // Password matches, send JWT Token
                            var token = tokenGenerator(result._id,result.email,socket.id);
                            socket.emit("user:accountInfo",{id:result._id,email:result.email,displayname:result.displayname});
                            //socket.emit("user:setToken", {token: token});
                            if(typeof result.displayname === "undefined"){
                                socket.emit("user:trigger", {settings: true});
                            }
                        } else { // Password doesn't match
                            socket.emit("user:signinError", {password: true});
                        }
                    });
                }
            });
        } else { // Invalid email address
            socket.emit("user:signinError", {email: true});
        }
    });
    socket.on("user:settings",function(msg){

        if(validator.isAlphanumeric(msg.displayname) && validator.isEmail(msg.email)) {
            console.log({action:"settings",msg:msg});
            var User = mongoose.model("User");
            User.findOneAndUpdate({"email": msg.email}, {displayname: msg.displayname},function(err,entry){
                console.log({entry:entry});
                socket.emit("user:trigger", {settings: false});
            });

        } else {
            socket.emit("user:signinError",{displayname:true});
        }
    });
    socket.on("user:changepassword",function(msg){
        console.log({action:"changepassword",msg:msg});
        if(msg.newpassword === msg.confirmpassword && msg.newpassword !== msg.oldpassword) { // new + confirm passwords match, and don't match oldpassword
            if (validator.isValidToken(msg.token)) { // Check token is valid
                var User = mongoose.model("User");
                User.findOne(msg.email, function (err, result) { // Find the user's account
                    if (result !== null) { // Account was found
                        result.comparePassword(msg.oldpassword, function (err, match) { // Check if oldpassword was valid
                            if (match) { // Password was a match
                                result.password = msg.newpassword;
                                result.save();
                                console.log({action:"Password changed",msg:msg});
                                socket.emit("user:trigger", {changePassword: false});
                            } else { // Error of some sort, old password probably didn't match
                                socket.emit("user:signinError",{oldpassword:true});
                            }
                        });
                    } else { // Account wasn't found... new issue....
                        console.log({account:"notfound",msg:msg});
                    }
                });
            }
        } else { // Confirm and new don't match
            socket.emit("user:signinError",{newpassword:true,confirmpassword:true});
        }
    });
    socket.on("user:logout",function(msg){
        var decode = validator.isValidToken(msg.token);
        if(decode !== false) { // Token is valid, we have data
            console.log({action:"logout",msg:msg});
            decode.sockets.forEach(function(element,index,array){ // logging all active sockets out from this user
                console.log({token:msg.token,element:element});
                io.to(element).emit("user:signinError",{token: true}); // Tell all sockets to clear their tokens(which logs them out)
            });
        }
    });
};