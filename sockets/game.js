"use strict";
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/

module.exports = function (io, socket) {
//    var fs = require('fs');
    var path = require('path');
//    var filePath = path.join(__dirname, "../public/cards.txt");

//    var LineByLineReader = require('line-by-line');
//    var lr = new LineByLineReader(filePath);
//    var lobby = "lobby";
//    var rooms = [];
    var Room = mongoose.model("Room");
    var numRooms = 1;
    // get base64 string of image file
    /*    function base64Image(src){
     return fs.readFileSync(src).toString("base64");
     }
     */
    var Card = mongoose.model("Card");
    var User = mongoose.model("User");
    // get card data from file
    /*    lr.on('line', function(line){

     var cardData = line.split(" ");
     var imgPath = path.join(__dirname, "../public/Images/TT"+cardData[0]+".png");
     // encode image
     var codedImg = base64Image(imgPath);
     var insert = new Card({
     "title": cardData[0],
     "picture": codedImg,
     "up": cardData[1],
     "down": cardData[3],
     "left": cardData[4],
     "right": cardData[2]
     });
     // add card to database
     insert.save();
     //                console.log(insert);
     });

     // done reading file
     lr.on('end', function(){
     console.log("done");
     });
     */
    // room "class"
    /*var Room = function(name, player1, player2, board){
     this.name = name;
     this.player1 = player1;
     this.player2 = player2;
     this.turn = player1;
     this.board = board;
     this.index = numRooms -1;
     }*/

    // Utility functions
    // Get sockets in room
    function findClientsSocket(roomId, namespace) {
        var res = [], ns = io.of(namespace || "/");    // the default namespace is "/"

        if (ns) {
            for (var id in ns.connected) {
                if (roomId) {
                    var index = ns.connected[id].rooms.indexOf(roomId);
                    if (index !== -1) {
                        res.push(ns.connected[id]);
                    }
                } else {
                    res.push(ns.connected[id]);
                }
            }
        }
        return res;
    }

    // get room data from room name
    function getRoom(name) {
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].name === name) {
                return rooms[i];
            }
        }
    }

    // get room data from username
    function getPlayerRoom(playerName) {
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i].player1 === playerName || rooms[i].player2 == playerName) {
                return rooms[i];
            }
        }
    }

    // get number of random cards from array, can convert to mongo query
    function getRandomCards(number) {
        var cardList = [];
        for (var i = 0; i < number; i++) {
            var index = Math.floor(Math.random() * cards.length);
            cardList.push(cards[index]);
        }
        return cardList;
    }

    // get player data from username (in array, can convert to mongo find query
    function getPlayerFromName(name) {
        for (var i = 0; i < players.length; i++) {
            if (players[i].name === name) {
                return players[i];
            }
        }
    }

    // Game functions
    socket.on("game:", function (msg) {
        console.log("Game: " + msg);
    });
    socket.on("game:connect", function (msg) {
        var decode = validator.isValidToken(msg.token);
        if (decode) {
            socket.username = decode.displayname;
            // User connected
            //socket.emit("chat:receive", {chat:socket.rooms[1], user:"System", text: "You are connected", timestamp:Date()});

            Room.findOne({player2: null}, function (err, result) {
                if (result) {
                    result.player2 = decode.displayname;
                    result.turn = result.player1;
                    socket.join(result.name);
                    result.save();
                    socket.emit("chat:receive", {
                        chat: result.name,
                        user: "System",
                        text: "You are connected to " + result.name + " as player 2",
                        timestamp: Date()
                    });
                } else {
                    var room = new Room({
                        name: "newGame" + Math.floor(new Date() / 1000),
                        player1: decode.displayname,
                        player2: null,
                        turn: null,
                        board: [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    });
                    room.name = "Game" + room._id;
//                    numRooms= numRooms+1;
                    socket.join(room.name);
                    room.save();
                    socket.emit("chat:receive", {
                        chat: room.name,
                        user: "System",
                        text: "You are connected to " + room.name + " as player 1",
                        timestamp: Date()
                    });
                }

            });
            /*
             io.to(lobby).emit("chat:receive", {chat:socket.rooms[1], user:"System", text: decode.displayname + " connected", timestamp:Date()});
             // Join game lobby
             socket.join(lobby);
             // When another user joins, leave lobby, both join new room
             var clients = findClientsSocket(lobby);
             console.log(clients);
             if(clients.length === 1){
             // create new room object
             var room = new Room({
             name:"game" + numRooms,
             player1:clients[0].username,
             player2:socket.username,
             turn: clients[0].username,
             board:[0,0,0,0,0,0,0,0,0]});
             room.save();
             console.log({"new room: " : room});
             // remove first client from lobby and add to new room
             clients[0].leave(lobby);
             clients[0].join(room.name);

             // remove second client from lobby and add to new room
             socket.leave(lobby);
             socket.join(room.name);

             // increase room counter and start turn swapping
             numRooms = numRooms +1;
             clients[0].emit("change turn");
             }*/
        } else {
            // warn client they aren't connected
        }
    });
    socket.on("game:placeCard", function (msg) { //Handle placing the card on the board
        // check position for collision
//              console.log(msg);
        var row = msg.position.charAt(0);      // can have x field in msg object
        var col = msg.position.charAt(1);      // can have y field in msg object
        var loc = row * 3 + col * 3;
//              var thisRoom = getRoom(socket.rooms[1]);
        //                console.log(thisRoom.name + ": " + thisRoom.board);
        //                console.log(rooms);
        // check room validity
        var thisRoom;
        Room.findOne({name: msg.current}, function (err, roomResult) {
            if (!err) {
                thisRoom = roomResult;
//                           console.log("socket room: " + socket.rooms);
//                           console.log({"thisRoom: " : thisRoom});
//                           console.log({"all rooms: ": rooms});
                if (socket.username !== thisRoom.turn) {
                    socket.emit('chat:receive', {
                        chat: msg.current,
                        user: "System",
                        text: "Not your turn",
                        timestamp: Date()
                    });
                    //              socket.emit('change turn');
                } else {
                    if (thisRoom.board[loc] === 1) {
                        socket.emit('chat:receive', {
                            chat: msg.current,
                            user: "System",
                            text: "Position taken",
                            timestamp: Date()
                        });
                    } else {
                        // check card validity
                        var data;
                        var exists = true;
                        console.log(msg.card);



                        // until then...
                        Card.findOne({title: msg.card}, function (err, cardResult) {
                                if (!err && cardResult) {
                                    var imgPath = path.join(__dirname, "../public" + cardResult.picture);
                                    io.to(msg.current).emit('game:updateBoard', cardResult.picture, msg.position);
                                    //              io.to(socket.rooms[1]).emit('change turn');
                                    if (thisRoom.turn === thisRoom.player1) {
                                        thisRoom.turn = thisRoom.player2;
                                    } else {
                                        thisRoom.turn = thisRoom.player1;
                                    }
                                    thisRoom.board[loc] = 1;
                                } else {
                                    // invalid card
                                    socket.emit('chat:recieve', {text:'no such card',user:"System",chat:msg.current});
                                }
                            }
                        );
                    }
                }
            }
        });


    });
};

