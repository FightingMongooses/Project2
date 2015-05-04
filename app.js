"use strict";
var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
//var mongoose = require("mongoose");
var socket_io = require("socket.io");

// Express
var app = express();
// Socket.io
var io = socket_io();
app.io = io;

// Mongodb connection and a mongoose model autoloader
// https://www.npmjs.com/package/mongoose.models.autoload
if(typeof process.env.MONGODB_URL === "undefined"){
	process.env.MONGODB_URL = "mongodb://localhost/cpsc473"
}
global.mongoose = require("mongoose.models.autoload")(require("mongoose"), require("path").join(__dirname, "models"), true).connect(process.env.MONGODB_URL);
// JsonWebTokens
global.jwt = require("jsonwebtoken");
global.secret = "uncreativesecret";
// Validator module
// https://www.npmjs.com/package/validator
global.validator = require("validator");
// Lodash
global._ = require("lodash");


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require("less-middleware")(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

// HTTP Routes
var routes = require("./routes/index");
//var user = require("./routes/user");

app.use("/", routes);
//app.use("/user", user);

// Socket Events
require("./socket")(app.io);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.locals.pretty = true;
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});


module.exports = app;
