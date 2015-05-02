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
        if(decoded === null){ // Token error of some sort
            return false;
        } else if(decoded.socket === thisSocket){ // Sockets match, no need to verify further since token passed as valid
            return decoded;
        } else if (decoded.socket !== thisSocket) { // Sockets don't match, check if token's socket still exists.
            if(typeof io.sockets.connected[decoded.socket] === "undefined"){
                // Token's socket is dead, token should be refreshed shortly. Consider this valid.
                return decoded;
            } else { // Token's socket is live, is this an intrusion attempt?
                //Check user IP, if IPs don't match, consider intrusion
                if(io.sockets.connected[decoded.socket].conn._remoteAddress === io.sockets.connected[thisSocket].conn._remoteAddress){
                    // Looks like duplicate socket from same IP, consider valid.
                    return decoded;
                } else {
                    // IPs don't match, invalid the newer session
                    socket.emit("user:signinError", {token: true}); // Run token delete command client-side
                    return false;
                }
            }
        } else { // All else is bad... so false
            return false;
        }
    });

    // Token generator/signer, should only be used within the user class
    var tokenGenerator = function(userId,userEmail,userSocket,userDisplayname){
        if(!validator.isAlphanumeric(userDisplayname)){
            userDisplayname = null;
        }
        return jwt.sign(
            {id: userId, email: userEmail, displayname: userDisplayname, socket: userSocket},
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
                        var token = tokenGenerator(result._id,result.email,socket.id,result.displayname);
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