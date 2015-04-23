"use strict";
var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
    var User = mongoose.model("User");
    console.log(User);
  res.render("index", { title: "Express" });
});

module.exports = router;
