"use strict";
// REF:

module.exports = function (io) {
    io.on("connection", function(socket){
//        console.log({socket:socket});
        require("./sockets/user.js")(io,socket);
        require("./sockets/buddy.js")(io,socket);
        require("./sockets/chat.js")(io,socket);
        require("./sockets/game.js")(io,socket);
    });
};