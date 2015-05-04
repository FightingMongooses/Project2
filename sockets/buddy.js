"use strict";
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/

module.exports = function (io,socket) {
    // Buddy functions
    socket.on("buddy:", function (msg) {
        console.log("Buddy: " + msg);
    });
    socket.on("buddy:add",function(msg){ // Add user by email(Look up by email, store _id in friend subobject)
    });
    socket.on("buddy:remove",function(msg){ // Remove user by user's _id
    });
    socket.on("buddy:requestList",function(msg){ // Send socket a copy of the current user's buddy list
        var decode = validator.isValidToken(msg.token);
        if(decode) {
            // Use decide.id to look up the user's buddy list
            socket.emit("buddy:list", {});
        }
    });
};