const mongoose = require("mongoose");
const User = require("../models/User");
const Follow = require("../models/Follow");
const async = require("async");

exports.GET_all_users = (req, res, next) => {
  async.parallel(
    {
      currentUser: (callback) => {
        const id = mongoose.Types.ObjectId(req.session.userId);
        User.findById(id)
          .populate("following")
          .exec((err, user) => {
            if (err) return next(err);
            return callback(null, user);
          });
      },
      listUsers: (callback) => {
        User.find({ _id: { $ne: req.session.userId } }).exec(
          (err, listUsers) => {
            if (err) return callback(err);
            return callback(null, listUsers);
          }
        );
      },
    },
    (err, results) => {
      if (err) return next(err);
      const { listUsers, currentUser } = results;
      listUsers.forEach((user) => {
        if (currentUser.isFollowing(user)) {
          user.setActionUnfollow();
        } else {
          user.setActionFollow();
        }
      });
      res.render("userList", {
        title: "Users",
        userList: results.listUsers,
        messages: req.flash.get(),
      });
    }
  );
};

exports.POST_follow_user = [
  (req, res, next) => {
    const followerId = mongoose.Types.ObjectId(req.session.userId);
    const following = mongoose.Types.ObjectId(req.body.userId);
    User.findById(followerId)
      .populate("following")
      .exec((err, user) => {
        if (err) return next(err);

        // Make sure the user isn't already following the other user.
        const isFollowing = user.following.some((follow) => {
          return follow.following.toString() === following.toString();
        });
        if (isFollowing) {
          req.flash.set("Already following this user.");
          return res.redirect(req.get("referrer") || "/");
        } else {
          next();
        }
      });
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

      res.redirect(req.get("referrer") || "/");
    });
  },
];

exports.POST_unfollow_user = [
  (req, res) => {
    // Find the follow in the Follow collection.
    const currentUserId = mongoose.Types.ObjectId(req.session.userId);
    Follow.findOneAndDelete({ follower: currentUserId })
      .populate({ path: "following", select: "-password" })
      .exec((err, follow) => {
        if (err) return next(err);

        if (!follow) {
          // If no follow is found then set a flash message and redirect
          req.flash.set("Something went wrong. Try again in a few seconds.");
          res.redirect(req.get("referrer") || "/");
        } else {
          // If a follow is found, delete it, set a flash message and redirect
          req.flash.set(`You have unfollowed ${follow.following.username}`);
          res.redirect(req.get("referrer") || "/");
        }
      });
  },
];
