"use strict";
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/

module.exports = function (io,socket) {
    // Chat functions
    socket.on("chat:",function(msg){
        console.log("Chat: "+msg);
    });
    socket.on("chat:join",function(msg){
        if(validator.isValidToken(msg.token)) {
            socket.join(msg.room.toLowerCase());
        }
    });
    socket.on("chat:leave",function(msg){
        if(validator.isValidToken(msg.token)) {
            socket.leave(msg.room.toLowerCase());
        }
    });
    socket.on("chat:send",function(msg){
        console.log({msg:msg});
        var decode = validator.isValidToken(msg.token);
        if(decode){
            if(typeof msg.chat !== "undefined") {
                // Transmit message to chatroom
                io.to(msg.chat).emit("chat:receive",{chat:msg.chat,user:decode.displayname,text:msg.message,timestamp:Date()});
                // Store message in recent message queue for this chat room
            }
        }
    });

};