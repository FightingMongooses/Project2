"use strict";
// REF: http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/

module.exports = function (io, socket) {
    var path = require("path");
    var Room = mongoose.model("Room");
    var Card = mongoose.model("Card");
    var User = mongoose.model("User");

    // Utility functions
    var updateBoard = function (boardName) {
        Room.findOne({name: boardName})
            .populate("hands.player1 hands.player2 board.card")
            .exec(function (err, currentRoom) {
                console.log({currentRoom: currentRoom});
                io.to(currentRoom.name).emit("game:updateBoard", {
                    board: currentRoom.board,
                    hands: currentRoom.hands,
                    players: {player1: currentRoom.player1, player2: currentRoom.player2}
                });
            });
    };

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
            Room.findOne(
                {
                    $and: [
                        {state: {$ne: "complete"}},
                        {
                            $or: [
                                {player1: socket.username},
                                {player2: socket.username}
                            ]
                        }
                    ]
                })
                .populate("hands.player1 hands.player2 board.card").exec(function (err, result) {
                    console.log({result: result});
                    if (!err && !result) {
                        Room.findOne({player2: null})
                            .populate("hands.player1 hands.player2 board.card")
                            .exec(function (err, roomResult) {
                                Card.findOne({title: "Placeholder"}).exec(function (err, placeholderCard) {
                                    Card.findRandom({title: {$nin: ["Placeholder"]}}, {}, {limit: 5}, function (err, cardResult) {
                                        if (roomResult) {
                                            roomResult.player2 = decode.displayname;
                                            roomResult.hands.player2 = cardResult;
                                            roomResult.turn = roomResult.player1;
                                            roomResult.state = "inprogess";
                                            socket.join(roomResult.name);
                                            roomResult.save(function (err) {
                                                if (err) {
                                                    return handleError(err);
                                                }
                                                updateBoard(roomResult.name);
                                            });
                                            socket.emit("chat:receive", {
                                                chat: roomResult.name,
                                                user: "System",
                                                text: "You are connected to " + roomResult.name + " as player 2",
                                                timestamp: Date()
                                            });
                                        } else {
                                            console.log({placeholderCard: placeholderCard, cardResult: cardResult});
                                            var room = new Room({
                                                name: "newGame" + Math.floor(new Date() / 1000), // To ensure the temporary name is unique
                                                player1: decode.displayname,
                                                player2: null,
                                                turn: null,
                                                board: {
//                                                card: placeholderCard.concat(placeholderCard,placeholderCard,placeholderCard,placeholderCard,placeholderCard,placeholderCard,placeholderCard,placeholderCard),
                                                    card: [
                                                        placeholderCard,
                                                        placeholderCard,
                                                        placeholderCard,
                                                        placeholderCard,
                                                        placeholderCard,
                                                        placeholderCard,
                                                        placeholderCard,
                                                        placeholderCard,
                                                        placeholderCard
                                                    ],
                                                    owner: [null, null, null, null, null, null, null, null, null]
                                                },
                                                hands: {
                                                    player1: cardResult
                                                },
                                                state: "pending"
                                            });
//                                room.hands.player1 = cardResult;
                                            room.name = "Game" + room._id;
                                            socket.join(room.name);
                                            room.save(function (err) {
                                                if (err) {
                                                    return handleError(err);
                                                }
                                                updateBoard(room.name);
                                            });
                                            socket.emit("chat:receive", {
                                                chat: room.name,
                                                user: "System",
                                                text: "You are connected to " + room.name + " as player 1",
                                                timestamp: Date()
                                            });
                                        }
                                    });
                                });
                            });
                    } else if (result) {
                        socket.join(result.name);
                        socket.emit("chat:receive", {
                            chat: result.name,
                            user: "System",
                            text: "You are connected to " + result.name,
                            timestamp: Date()
                        });
                        updateBoard(result.name);
                        console.log("player tried to join two games.");
                    }
                });

        } else {
            // warn client they aren"t connected
        }
    });
    socket.on("game:placeCard", function (msg) { //Handle placing the card on the board
        // check position for collision
//              console.log(msg);
//        var row = msg.position.charAt(0);      // can have x field in msg object
//        var col = msg.position.charAt(1);      // can have y field in msg object
        var loc = msg.position;
        // check room validity
        Room.findOne({name: msg.current})
            .populate("hands.player1 hands.player2 board.card")
            .exec(function (err, roomResult) {
                console.log({err: err, roomResult: roomResult, msg: msg});
                if (!err && roomResult) {
                    if (socket.username !== roomResult.turn) {
                        socket.emit("chat:receive", {
                            chat: msg.current,
                            user: "System",
                            text: "Not your turn",
                            timestamp: Date()
                        });
                        //              socket.emit("change turn");
                    } else {
                        if (roomResult.board[loc] === 1) {
                            socket.emit("chat:receive", {
                                chat: msg.current,
                                user: "System",
                                text: "Position taken",
                                timestamp: Date()
                            });
                        } else {
                            // check card validity
                            Card.findOne({title: msg.card.title}, function (err, cardResult) {
                                    if (!err && cardResult) {
                                        // check adjacent positions
                                        //up
                                        var up = loc - 3;
                                        var down = loc + 3;
                                        var left = loc - 1;
                                        var right = loc + 1;
                                        console.log({board: roomResult.board.card, loc: loc});
                                        if (up >= 0 && up <= 8 && roomResult.board.card[up] !== null && roomResult.board.card[up].title !== "Placeholder") {
                                            if (roomResult.board.card[up].down < cardResult.up) {
                                                roomResult.board.owner[up] = socket.username;
                                            }
                                        }
                                        if (down >= 0 && down <= 8 && roomResult.board.card[down] !== null && roomResult.board.card[down].title !== "Placeholder") {
                                            if (roomResult.board.card[down].up < cardResult.down) {
                                                roomResult.board.owner[down] = socket.username;
                                            }
                                        }
                                        if (left >= 0 && left <= 8 && roomResult.board.card[left] !== null && roomResult.board.card[left].title !== "Placeholder") {
                                            if (roomResult.board.card[left].right < cardResult.left) {
                                                roomResult.board.owner[left] = socket.username;
                                            }
                                        }
                                        if (right >= 0 && right <= 8 && roomResult.board.card[right] !== null && roomResult.board.card[right].title !== "Placeholder") {
                                            if (roomResult.board.card[right].left < cardResult.right) {
                                                roomResult.board.owner[right] = socket.username;
                                            }
                                        }

                                        //              io.to(socket.rooms[1]).emit("change turn");
                                        roomResult.board.card[loc] = mongoose.Types.ObjectId(msg.card._id);
//                                        roomResult.board.card[loc] = msg.card._id;
                                        roomResult.board.owner[loc] = roomResult.turn;
                                        if (roomResult.turn === roomResult.player1) {
                                            roomResult.turn = roomResult.player2;
                                            roomResult.hands.player1 = roomResult.hands.player1.filter(function (element) {
                                                return element._id.toString() !== msg.card._id.toString();
                                            });    // remove the card
                                        } else {
                                            roomResult.turn = roomResult.player1;
                                            roomResult.hands.player2 = roomResult.hands.player2.filter(function (element) {
                                                return element._id.toString() !== msg.card._id.toString();
                                            });    // remove the card
                                        }
                                        roomResult.markModified("board");
                                        roomResult.markModified("hands");
                                        roomResult.save(function (err) {
                                            if (err) {
                                                return handleError(err);
                                            }
                                            updateBoard(msg.current);
                                        });
                                    } else {
                                        // invalid card
                                        socket.emit("chat:recieve", {
                                            text: "no such card",
                                            user: "System",
                                            chat: msg.current
                                        });
                                    }
                                }
                            );
                        }
                    }
                }
            });
    });
};

