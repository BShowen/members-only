const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Post = require("../models/Post");
const async = require("async");

/* GET home page. */
router.get("/", (req, res) => {
  // If user is logged in render the home page, otherwise redirect to posts.
  if (req.auth.isAuthenticated()) return res.redirect("/home");
  return res.redirect("/posts");
});

/* GET login page. */
router.get("/login", (req, res) => {
  if (req.auth.isAuthenticated()) return res.redirect("/home");
  return res.render("index", { title: "Login", formAction: "/login" });
});

/* GET signup page */
router.get("/signup", (req, res) => {
  if (req.auth.isAuthenticated()) return res.redirect("/home");
  return res.render("index", { title: "Sign up", formAction: "/signup" });
});

/* GET home page. */
router.get("/home", (req, res, next) => {
  req.auth.authenticateOrRedirect({ redirect: "/login" }, () => {
    // User is authenticated, render the home page.
    const id = mongoose.Types.ObjectId(req.auth.currentUser.id);

    async.parallel(
      {
        user: (callback) => {
          return User.findById(id, "username", (err, user) => {
            if (err) return callback(err);
            return callback(null, user);
          });
        },
        posts: (callback) => {
          return Post.find({ author: id })
            .populate("author")
            .exec((err, postList) => {
              if (err) return callback(err);
              return callback(null, postList);
            });
        },
      },
      (err, results) => {
        if (err) return next(err);
        console.log("results--->", results);
        res.render("home", {
          title: "Home",
          currentUser: results.user,
          isAuthenticated: true,
          postList: results.posts,
        });
      }
    );
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
      res.render("index", {
        title: "Login",
        formAction: "/login",
        messages: [response.message],
      });
    }
  });
});

/* POST signup page */
router.post("/signup", (req, res, next) => {
  const { username, password } = req.body;

  if (username.length <= 0 || password.length <= 0) {
    return res.render("index", {
      title: "Sign up",
      formAction: "/signup",
      messages: ["Username and password are required."],
    });
  }

  User.findOne({ username: username }, (err, user) => {
    if (err) return next(err);
    if (user) {
      return res.render("index", {
        title: "Sign up",
        formAction: "/signup",
        messages: ["That username has been taken."],
      });
    }

    const newUser = new User({
      username,
      password: bcrypt.hashSync(password, 10),
    });

    newUser.save((err) => {
      if (err) return next(err); //Error saving the user.
      req.auth.loginUser((err, response) => {
        if (err) return next(err); //Error logging in the user.
        if (req.auth.isAuthenticated()) {
          // User successfully logged in.
          return res.redirect("/home");
        } else {
          // User was not able to be logged in due to incorrect password or
          // username. This should never be reached because the user just
          // created their account.
          /**
           * Console log the messages for now. In the future these messages will
           * be displayed to the user.
           */
          console.log(response.message);
          res.redirect("/");
        }
      });
    });
  });
});

router.get("/logout", (req, res, next) => {
  req.auth.logoutUser((err) => {
    if (err) return next(err);

    res.redirect("/login");
  });
});

module.exports = router;
