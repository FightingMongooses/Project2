"use strict";
// REF: http://www.codedevlog.com/blog/2014/10/23/socket-dot-io-user-sessions-with-redis-and-json-web-tokens
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/
// REF: https://github.com/auth0/node-jsonwebtoken

module.exports = function (io,socket) {
    // Token verifier, check if socket id in token exists, if it does, verify that current socket/user matches it
    validator.extend("isValidToken",function(token){
        var decoded = null;
        try {
            decoded = jwt.verify(token, secret);
        } catch(err) {
            decoded = null;
        }
        var thisSocket = socket.id;
        console.log({test:decoded});
        if(decoded === null || typeof decoded.sockets === "undefined"){ // Token error of some sort
            socket.emit("user:signinError", {token: true}); // Run token delete command client-side
            return false;
        } else if(decoded.sockets.indexOf(thisSocket) > -1 ){ // Sockets match, no need to verify further since token passed as valid
            console.log({what:decoded});
            return decoded;
        } else { // Current socket not listed in token, verify by IP for now
            var liveSockets = {};
            // Check if all listed sockets are dead, if they are, consider this socket live. Token should be updated soon enough
            _.forEach(decoded.sockets,function(k,v){ // Grab all the IP addresses for live sockets
                if(typeof io.sockets.connected[v] !== "undefined") {
                    liveSockets[v] = io.sockets.connected[v].conn._remoteAddress;
                } else { // Socket is dead, pull from decoded object incase token is regenerated later
                    _.pull(decoded.sockets,v);
                }
            });
            if(Object.keys(liveSockets).length > 0){ // If any of the existing listed sockets are live, compare their IPs
                if (liveSockets.indexOf(io.sockets.connected[thisSocket].conn._remoteAddress) > -1){
                    console.log({what:decoded});
                    return decoded; // IP address was found in list
                } else { // IP not found in active list, kill new user socket
                    socket.emit("user:signinError", {token: true}); // Run token delete command client-side
                    return false;
                }
            } else { // No living sockets, consider valid token
                console.log({what:decoded});
                return decoded;
            }
        }
    });

    // Token generator/signer, should only be used within the user class
    var tokenGenerator = function(userId,userEmail,userSockets,userDisplayname){
        var allSockets = [];
        if(!validator.isAlphanumeric(userDisplayname)){
            userDisplayname = null;
        }
        console.log({userSockets:userSockets,what:typeof userSockets});
        if(typeof userSockets === "string"){
            allSockets.push(userSockets);
        } else {
            allSockets = userSockets;
        }
        return jwt.sign(
            {id: userId, email: userEmail, displayname: userDisplayname, sockets: allSockets},
            secret,
            {expiresInMinutes: 10080});
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
                        socket.emit("user:setToken", {token: token});
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
                    socket.emit("user:setToken", {token: token});
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
                            socket.emit("user:setToken", {token: token});
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
    });
    socket.on("user:logout",function(msg){
        console.log({action:"logout",msg:msg});
    });
};