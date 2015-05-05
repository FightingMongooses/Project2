var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var db = require('mongo');

var fs = require('fs');
var path = require('path');
var filePath = path.join(__dirname, "/data/cards.txt");
 
var LineByLineReader = require('line-by-line');
var lr = new LineByLineReader(filePath);

//var board = [0,0,0,0,0,0,0,0,0];
app.use(express.static(__dirname + "/client"));

app.get('/', function(req, res){
        res.sendFile(__dirname + '/client/index.html');
        }
);
var cards = [];

// return array of clients in room/namespace
function findClientsSocket(roomId, namespace) {
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"
    
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

var rooms = [];
var numRooms = 1;
var lobby = 'lobby';

// room "class"
var Room = function(name, player1, player2, board){
    this.name = name;
    this.player1 = player1;
    this.player2 = player2;
    this.turn = player1;
    this.board = board;
    this.index = numRooms -1;
}

// player "class"
var Player = function(name, cards){
    this.name = name;
    this.cards = cards;
}

// get room data from room name
function getRoom(name){
    for(var i = 0; i < rooms.length; i++){
        if(rooms[i].name === name){
            return rooms[i];
        }
    }
}

// get room data from username
function getPlayerRoom(playerName){
    for(var i = 0; i < rooms.length; i++){
        if(rooms[i].player1 === playerName || rooms[i].player2 == playerName){
            return rooms[i];
        }
    }
}

// get number of random cards from array, can convert to mongo query
function getRandomCards(number){
    var cardList = [];
    for(var i = 0; i < number; i++){
        var index = Math.floor(Math.random()*cards.length);
        cardList.push(cards[index]);
    }
        return cardList;
}

var players = [];

// get player data from username (in array, can convert to mongo find query
function getPlayerFromName(name){
    for(var i = 0; i < players.length; i++){
        if(players[i].name === name){
            return players[i];
        }
    }
}
io.on('connection', function(socket){

      // set socket id to user name (called on connect from client)
      socket.on('set id', function(usr){
                socket.username = usr;
                
                // create new player object with 5 random cards and usr as name
                var thisPlayer = new Player(usr, getRandomCards(5));
                players.push(thisPlayer);
//                console.log(players);
                
                // connection messages to clients
                socket.emit('chat message', 'You are connected');
                io.to(lobby).emit('chat message', usr + ' connected');
                
                // join lobby room
                socket.join(lobby);
                
                // initiate turns when 2nd client joins game
                var clients = findClientsSocket(lobby);
                if(clients.length === 1){
                
                    // create new room object
                    var room = new Room('game' + numRooms, clients[0].username, socket.username, [0,0,0,0,0,0,0,0,0]);
                    rooms.push(room);
                
                    // remove first client from lobby and add to new room
                    clients[0].leave(lobby);
                    clients[0].join(room.name);
                
                    // remove second client from lobby and add to new room
                    socket.leave(lobby);
                    socket.join(room.name);
                
                    // increase room counter and start turn swapping
                    numRooms = numRooms +1;
                    clients[0].emit('change turn');
                }
      });
      
      // on disconnect
      socket.on('disconnect', function(){
                var thisRoom = getPlayerRoom(socket.username);
                if(typeof thisRoom !== 'undefined'){
                    io.to(thisRoom.name).emit('chat message', socket.username + ' disconnected.');
                    io.to(thisRoom.name).emit('alone');
                }
                
      });
      socket.on('send chat message', function(msg){
//                socket.emit('chat message', socket.rooms);
                io.to(socket.rooms[1]).emit('chat message', socket.username + ': ' + msg);
      });
      
      // trying to place a card
      socket.on('place card', function(ele, pos){
            // check position for collision
            var row = pos.charAt(0);
            var col = pos.charAt(1);
            var loc = row*3 + col*3;
            var thisRoom = getRoom(socket.rooms[1]);
//                console.log(thisRoom.name + ": " + thisRoom.board);
//                console.log(rooms);
            // check room validity
            if(socket.username !== thisRoom.turn){
                socket.emit('chat message', 'Really not your turn, cheater');
                socket.emit('change turn');
            }else{
                if(thisRoom.board[loc] === 1){
                    socket.emit('chat message', 'Position taken');
                }else{
                    // check card validity
                    var data;
                    var exists = false;
                    cards.forEach(function(card){
                        if(card.name === ele){
                            data = card.data;
                            exists = true;
                        }
                    });
                    if(exists){
                        // place card
                        io.to(socket.rooms[1]).emit('place element', data, pos);
                        io.to(socket.rooms[1]).emit('change turn');
                        if(thisRoom.turn === thisRoom.player1){
                            thisRoom.turn = thisRoom.player2;
                        }else{
                            thisRoom.turn = thisRoom.player1;
                        }
                        thisRoom.board[loc] = 1;
                    }else{
                        // invalid card
                        socket.emit('chat message', 'no such card');
                    }
                }
            }
                
      });
      
      socket.on('back to lobby', function(){
                var thisRoom = getPlayerRoom(socket.username);
                socket.leave(thisRoom.name);
                rooms.splice(thisRoom.index, 1);
//                socket.join(lobby);
//                socket.io.reconnect();
                });
});

http.listen(3000, function(){
    console.log('listening on 3000');
    }
);

lr.on('error', function(err){
      console.log(err);
});

// get base64 string of image file
function base64Image(src){
    return fs.readFileSync(src).toString("base64");
}

// These objects are now stored in a text file: /data/CardsJSON.txt

// get card data from file
lr.on('line', function(line){
      var cardData = line.split(" ");
      var imgPath = __dirname + '/data/Images/TT'+cardData[0]+'.png';
      // encode image
      var codedImg = base64Image(imgPath);
      var card = {
            "name": cardData[0],
            "top": cardData[1],
            "right": cardData[2],
            "bottom": cardData[3],
            "left": cardData[4],
            "data": codedImg
      };
      // add card to database
      cards.push(card);     // array until mongodb is set up
//      console.log(card);
});

// done reading file
lr.on('end', function(){
      console.log("done");
});

