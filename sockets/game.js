"use strict";
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/

module.exports = function (io,socket) {
    // Game functions
    socket.on("game:",function(msg){
        console.log("Game: "+msg);
    });
};