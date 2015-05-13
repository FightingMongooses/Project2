"use strict";

module.exports = function (mongoose) {

    // Actual Schema
    var Room = new mongoose.Schema({
        name: {type: String, unique: true, required: true},
        player1: String,
        player2: String,
        turn: String,
        board: {
            card:[{type: mongoose.Schema.Types.ObjectId, ref: "Card"}],
            owner:[String]
        },
        hands: {
            player1:[{type: mongoose.Schema.Types.ObjectId, ref: "Card"}],
            player2:[{type: mongoose.Schema.Types.ObjectId, ref: "Card"}]
        },
        state: String
    });

    return Room;
};