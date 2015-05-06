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
//        console.log({msg:msg});
              console.log("MSG");
              console.log(msg.token)

        var decode = validator.isValidToken(msg.token);
              console.log("Send");
              console.log({decode: decode});        // this is where displayname got lost for client 2
        if(decode){
            if(typeof msg.chat !== "undefined") {
                // Transmit message to chatroom
                msg.chat = socket.rooms[1]; // just for now.
                io.to(msg.chat).emit("chat:receive",{chat:msg.chat,user:msg.name,text:msg.message,timestamp:Date()});
                // Store message in recent message queue for this chat room
            }
        }
    });

};