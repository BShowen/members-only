const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const async = require("async");
const validatePostAndUser = require("../utils/updatePost");

/* GET list posts. */
router.get("/", (req, res, next) => {
  async.parallel(
    {
      posts: (callback) => {
        Post.find({})
          .populate("author", "username _id")
          .exec((err, listPosts) => {
            if (err) return callback(err);
            return callback(null, listPosts);
          });
      },
      user: (callback) => {
        if (!req.auth.isAuthenticated()) return callback(null, undefined);
        const userId = mongoose.Types.ObjectId(req.session.userId);
        User.findById(userId, "username _id", (err, user) => {
          if (err) return callback(err);
          callback(null, user);
        });
      },
    },
    (err, results) => {
      if (err) return next(err);

      results.posts.forEach((post) => {
        post.belongsToCurrentUser =
          post.author._id.toString() === results.user?._id?.toString();
      });

      res.render("postList", {
        title: "Posts",
        isAuthenticated: req.auth.isAuthenticated(),
        postList: results.posts,
        currentUser: results.user || undefined,
      });
    }
  );
});

/* GET form to create a new post */
router.get("/create", (req, res) => {
  // Allow authenticated users only.
  req.auth.authenticateOrRedirect({ redirect: "/login" }, () => {
    const messages = req.cookies.messages
      ? JSON.parse(req.cookies.messages)
      : [];
    res.clearCookie("messages");
    return res.render("postForm", {
      title: "New post",
      isAuthenticated: true,
      messages,
    });
  });
});

/* GET form to update post */
router.get("/update/:postId", [
  (req, res, next) => {
    return req.auth.authenticateOrRedirect({ redirect: "/" }, next);
  },
  (req, res, next) => {
    return validatePostAndUser(req, res, next, { redirect: "/home" });
  },
  (req, res, next) => {
    // Render the edit form
    return res.render("postForm", {
      title: "Update post",
      isAuthenticated: req.auth.isAuthenticated(),
      post: req.currentPost,
    });
  },
]);

router.post("/update/:postId", [
  (req, res, next) => {
    return req.auth.authenticateOrRedirect({ redirect: "/" }, next);
  },
  (req, res, next) => {
    return validatePostAndUser(req, res, next, { redirect: "/home" });
  },
  (req, res) => {
    // Update the post.
    const postId = mongoose.Types.ObjectId(req.params.postId);
    Post.findById(postId, (err, post) => {
      if (err) return next(err);

      post.body = req.body.body;
      post.save().then(() => {
        const url = req.get("referer");
        // Redirect home for now. In the future, redirect to home or
        // posts page.Which ever was visited last.
        res.redirect("/home");
      });
    });
  },
]);

/* POST create a new posts from submitted form */
router.post("/create", (req, res, next) => {
  req.auth.authenticateOrRedirect({ redirect: "/login" }, () => {
    const dateTimeFormatter = new Intl.DateTimeFormat();
    const post = new Post({
      author: mongoose.Types.ObjectId(req.session.userId),
      body: req.body.body,
      date: dateTimeFormatter.format(Date.now()),
    });

    post.save((err) => {
      if (err) return next(err);

      res.redirect("/posts");
    });
  });
});

module.exports = router;
