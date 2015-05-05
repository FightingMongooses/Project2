"use strict";

module.exports = function(mongoose){

    // Actual Schema
    var Card = new mongoose.Schema({
        name:String,
        player1: String,
        player2: String,
        turn: String,
        board: [Number],
    });

    // Test function
    Card.methods.test = function(){
        return "model1";
    };

    return Card;
};