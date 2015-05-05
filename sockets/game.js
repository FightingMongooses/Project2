"use strict";
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/

module.exports = function (io,socket) {
    var lobby = "lobby";
    // Utility functions
    function findClientsSocket(roomId, namespace) {
        var res = [], ns = io.of(namespace ||"/");    // the default namespace is "/"

        if (ns) {
            for (var id in ns.connected) {
                if(roomId) {
                    var index = ns.connected[id].rooms.indexOf(roomId) ;
                    if(index !== -1) {
                        res.push(ns.connected[id]);
                    }
                } else {
                    res.push(ns.connected[id]);
                }
            }
        }
        return res;
    }
    
    // Game functions
    socket.on("game:",function(msg){
        console.log("Game: "+msg);
    });
    socket.on("game:connect",function(msg){
        var decode = validator.isValidToken(msg.token);
        if(decode){
            // User connected
            socket.emit("chat message", "You are connected");
            io.to(lobby).emit("chat message", usr + " connected");
            // Join game lobby
            socket.join(lobby);
            // When another user joins, leave lobby, both join new room
            var clients = findClientsSocket(lobby);
            if(clients.length === 1){

                // create new room object
                var room = new Room("game" + numRooms, clients[0].username, socket.username, [0,0,0,0,0,0,0,0,0]);
                rooms.push(room);

                // remove first client from lobby and add to new room
                clients[0].leave(lobby);
                clients[0].join(room.name);

                // remove second client from lobby and add to new room
                socket.leave(lobby);
                socket.join(room.name);

                // increase room counter and start turn swapping
                numRooms = numRooms +1;
                clients[0].emit("change turn");
            }
        }
    });
    socket.on("game:placeCard",function(msg){ //Handle placing the card on the board

    });
};