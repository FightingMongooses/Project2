"use strict";

module.exports = function(mongoose){

    // Actual Schema
    var card = new mongoose.Schema({
        title: {type: String, unique: true},
        picture: String,
        up: Number,
        down: Number,
        left: Number,
        right: Number
    });

    // Test function
    card.methods.test = function(){
        return "model1";
    };

    return card;
};