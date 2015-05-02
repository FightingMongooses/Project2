"use strict";
var bcrypt = require("bcrypt"),
    SALT_WORK_FACTOR = 10;

module.exports = function(mongoose){
    // Child schemas
    var Card = mongoose.model("Card");

    // Actual Schema
    var user = new mongoose.Schema({
        displayname: String,
        email: {type: String, unique: true, required: true},
        password: {type: String, required: true},
        wins: {type: Number, default: 0 },
        losses: {type: Number, default: 0 },
        deck: [Card],
        created_on: {type: Date},
        updated_on: {type: Date}
    });

    user.pre("save", function(next) {
        // Set timestamps
        var now = new Date();
        this.updated_on = now;
        if ( !this.created_on ) {
            this.created_on = now;
        }

        // Password hashing
        // REF: http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
        var entry = this;

        // only hash the password if it has been modified (or is new)
        if (!entry.isModified("password")){
            return next();
        }

        // generate a salt
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if (err){
                return next(err);
            }

            // hash the password along with our new salt
            bcrypt.hash(entry.password, salt, function(err, hash) {
                if (err){
                    return next(err);
                }

                // override the cleartext password with the hashed one
                entry.password = hash;
                next();
            });
        });
    });

    // Password comparison
    user.methods.comparePassword = function(candidatePassword, cb) {
        bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
            if (err){
                return cb(err);
            }
            cb(null, isMatch);
        });
    };

    // Test function
    user.methods.test = function(){
        return "model1";
    };

    return user;
};