"use strict";

module.exports = function(mongoose){

    // Actual Schema
    var Room = new mongoose.Schema({
        name:String,
        player1: String,
        player2: String,
        turn: String,
        board: [Number],
    });
    
    return Room;
};