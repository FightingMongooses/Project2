// REF: http://mongoosejs.com/docs/populate.html <-- For external object references and populations
"use strict";
var bcrypt = require("bcrypt"),
    SALT_WORK_FACTOR = 10;

module.exports = function (mongoose) {
    // Actual Schema
    var User = new mongoose.Schema({
        displayname: String,
        email: {type: String, unique: true, required: true},
        password: {type: String, required: true},
        wins: {type: Number, default: 0},
        losses: {type: Number, default: 0},
//        deck: [{type: mongoose.Schema.Types.ObjectId, ref: "Card"}],
        friends: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
        created_on: {type: Date},
        updated_on: {type: Date}
    });

    User.pre("save", function (next) {
        // Set timestamps
        var now = new Date();
        this.updated_on = now;
        if (!this.created_on) {
            this.created_on = now;
        }

        // Password hashing
        // REF: http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
        var entry = this;
        // only hash the password if it has been modified (or is new)
        if (!entry.isModified("password")) {
            return next();
        }
        // generate a salt
        bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (err) {
                return next(err);
            }

            // hash the password along with our new salt
            bcrypt.hash(entry.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                // override the cleartext password with the hashed one
                entry.password = hash;
                next();
            });
        });
    });

    // Password comparison
    User.methods.comparePassword = function (candidatePassword, cb) {
        bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
            if (err) {
                return cb(err);
            }
            cb(null, isMatch);
        });
    };

    return User;
};