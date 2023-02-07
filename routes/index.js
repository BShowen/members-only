var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  if (req.isAuthenticated()) {
    // return res.render("home", { title: "Home" });
    return res.redirect("/home");
  }
  return res.render("index", { title: "Login" });
});

module.exports = router;
