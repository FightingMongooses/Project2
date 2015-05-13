"use strict";
var random = require('mongoose-simple-random');
module.exports = function (mongoose) {

    // Actual Schema
    var Card = new mongoose.Schema({
        title: {type: String, unique: true},
        picture: String,
        up: Number,
        down: Number,
        left: Number,
        right: Number
    });

    Card.plugin(random);
    return Card;
};