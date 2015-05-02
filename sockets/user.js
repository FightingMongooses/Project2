"use strict";
// REF: http://www.codedevlog.com/blog/2014/10/23/socket-dot-io-user-sessions-with-redis-and-json-web-tokens
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/
// REF: https://github.com/auth0/node-jsonwebtoken

module.exports = function (socket) {
    // User functions
    socket.on("user:",function(msg){
        console.log("User: "+msg);
    });
    socket.on("user:checkToken",function(msg){
        if(msg.token !== null){
            jwt.verify(msg.token,secret,function(err,decode){
                console.log({decode:decode});
                if (err) {
                    throw err;
                } else if(decode){ // Valid token and signature
                    var User = mongoose.model("User");
                    User.findOne({email: decode.email}, function (err, result) {
                        if(result) { // If user was found
                            var token = jwt.sign({id: result._id, email: result.email, socket: socket.id}, secret);
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
            });
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
                    var token = jwt.sign({id: create._id, email: create.email, socket:socket.id}, secret);
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
                            var token = jwt.sign({id: result._id, email: result.email, socket:socket.id}, secret);
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