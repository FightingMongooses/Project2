"use strict";
var express = require("express");
var router = express.Router();

/* If logged in, redirect to settings, if not redirect to signin */
router.get("/", function(req, res, next) {
    // If user is logged in, redirect to
    res.render("index", { title: "Express" });
});

/* Display signin/register page */
router.get("/signin",function(req,res,next){
    res.render("user/signin",{title: "Signin"});
});

/* Handle signin or register */
router.post("/signin",function(req,res,next){
    console.log(req.body);
    res.json({"hi":"Hi","req.body":req.body});
});

module.exports = router;
