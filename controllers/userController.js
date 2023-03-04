const mongoose = require("mongoose");
const User = require("../models/User");
const Follow = require("../models/Follow");

exports.GET_all_users = (req, res, next) => {
  User.find({ _id: { $ne: req.session.userId } }).exec((err, results) => {
    if (err) return next(err);

    res.render("userList", {
      title: "Users",
      userList: results,
      messages: req.flash.get(),
    });
  });
};

exports.POST_follow_user = [
  (req, res, next) => {
    // ToDo: Make sure user isn't already following the user.
    next();
  },
  (req, res, next) => {
    const follower = mongoose.Types.ObjectId(req.session.userId);
    const following = mongoose.Types.ObjectId(req.body.userId);
    new Follow({
      follower,
      following,
    }).save((err, results) => {
      if (err) return next(err);

      req.flash.set("Following.");

      res.redirect("/users");
    });
  },
];

exports.GET_all_friend_requests = (req, res) => {
  // Get the list of users who have requested to be friends.
  const currentUserId = mongoose.Types.ObjectId(req.session.userId);
  FriendRequest.find({
    $and: [{ receiver: currentUserId }, { isDenied: false }],
  })
    .populate("requester", "username")
    .exec((err, results) => {
      if (err) return next(err);
      res.render("userList", {
        title: "Friend Requests",
        messages: req.flash.get(),
        userList: results.map((reqDoc) => reqDoc.requester),
      });
    });
};
