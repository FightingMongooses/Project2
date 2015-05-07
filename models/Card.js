"use strict";

module.exports = function(mongoose){

    // Actual Schema
    var Card = new mongoose.Schema({
        title: {type: String, unique: true},
        picture: String,
        up: Number,
        down: Number,
        left: Number,
        right: Number
    });

    return Card;
};