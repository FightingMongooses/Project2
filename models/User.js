"use strict";
/**
 * Created by zaephor on 4/15/15.
 */

module.exports = function(mongoose){

    // Actual Schema
    var user = new mongoose.Schema({
        username: String,
        email: String,
        password: String
    });

    // Test function
    user.methods.test = function(){
        return "model1";
    };

    return user;
};