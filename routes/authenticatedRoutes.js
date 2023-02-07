const express = require("express");
const router = express.Router();

const authenticateOrRedirect = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.redirect("/");
};
/* GET home page. */
router.get("/home", authenticateOrRedirect, (req, res) => {
  // If this function is reached, then the user is authenticated.
  res.render("index", { title: "Home", currentUser: req.currentUser });
});

module.exports = router;
