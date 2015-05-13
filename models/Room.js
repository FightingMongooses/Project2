"use strict";

module.exports = function (mongoose) {

    // Actual Schema
    var Room = new mongoose.Schema({
        name: {type: String, unique: true, required: true},
        player1: String,
        player2: String,
        turn: String,
        board: [Number],
        state: String
    });

    return Room;
};