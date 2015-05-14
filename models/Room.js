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
        state: String,
        winner: String
    });
    Room.pre("save",function(next){
        var player1score = 0;
        var player2score = 0;
        var entry = this;
        entry.board.owner.forEach(function(owner){
                if (owner === entry.player1) {
                    player1score += 1;
                } else if (owner === entry.player2) {
                    player2score += 1;
                }
                if (player1score + player2score === 9) {
                    if (player1score > player2score) {
                        entry.winner = entry.player1;
                    } else {
                        entry.winner = entry.player2;
                    }
                    entry.state = "complete";
                    console.log("WINNER: " + entry.winner);
                }
        });
        next();
    });

    return Room;
};