"use strict";
// REF:

module.exports = function (io) {
    io.on("connection", function(socket){
//        console.log({socket:socket});
        require("./sockets/user.js")(socket);
        require("./sockets/game.js")(socket);
    });
};