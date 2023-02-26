const mongoose = require("mongoose");
const User = require("../models/User");

exports.GET_all_users = [
  (req, res, next) => {
    req.auth.authenticateOrRedirect(next, { redirect: "/login" });
  },
  (req, res, next) => {
    User.find({}).exec((err, results) => {
      if (err) return next(err);

      res.render("userList", {
        isAuthenticated: req.auth.isAuthenticated(),
        title: "Users",
        userList: results,
      });
    });
  },
];

exports.GET_friend_request = [
  (req, res, next) => {
    req.auth.authenticateOrRedirect(next, { redirect: "/login" });
  },
  (req, res, next) => {
    res.send("Received");
  },
];
