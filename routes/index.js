const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");

/* GET home page. */
router.get("/", (req, res) => {
  // If user is logged in render the home page, otherwise redirect to login.
  if (req.auth.isAuthenticated()) return res.redirect("/home");
  return res.redirect("/login");
});

/* GET login page. */
router.get("/login", (req, res) => {
  if (req.auth.isAuthenticated()) return res.redirect("/home");
  return res.render("index", { title: "Login" });
});

/* GET home page. */
router.get("/home", (req, res, next) => {
  req.auth.authenticateOrRedirect({ redirect: "/login" }, () => {
    // User is authenticated, render the home page.
    const id = mongoose.Types.ObjectId(req.auth.currentUser.id);
    User.findById(id, "username", (err, user) => {
      if (err) return next(err);
      res.render("home", { title: "Home", currentUser: user });
    });
  });
});

router.post("/login", (req, res, next) => {
  req.auth.loginUser((err, response) => {
    if (err) return next(err);
    if (response.isAuthenticated) {
      if (req.body.remember === "on") {
        req.auth.rememberUser();
      }
      return res.redirect("/home");
    } else {
      /**
       * Console log the messages for now. In the future these messages will
       * be displayed to the user.
       */
      console.log(response.message);
      res.redirect("/");
    }
  });
});

router.get("/logout", (req, res, next) => {
  req.auth.logoutUser((err) => {
    if (err) return next(err);

    res.redirect("/");
  });
});

module.exports = router;
