"use strict";
var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
    var User = mongoose.model("User"); // https://www.npmjs.com/package/mongoose.models.autoload
//    console.log(User);
    res.render("index", { title: "Fighting Mongooses" });
});

module.exports = router;
