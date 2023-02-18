const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");

/* GET list posts. */
router.get("/", (req, res, next) => {
  if (req.auth.isAuthenticated()) {
    Post.find({})
      .populate("author", "username -_id")
      .exec((err, listPosts) => {
        if (err) return next(err);
        res.render("postList", {
          isAuthenticated: true,
          postList: listPosts,
        });
      });
  } else {
    Post.find({}, "-_id body").exec((err, listPosts) => {
      if (err) return next(err);

      res.render("postList", {
        isAuthenticated: false,
        postList: listPosts,
      });
    });
  }
});

/* GET form to create a new post */
router.get("/create", (req, res) => {
  // Allow authenticated users only.
  req.auth.authenticateOrRedirect({ redirect: "/" }, () => {
    return res.render("postForm");
  });
});

/* POST create a new posts from submitted form */
router.post("/create", (req, res, next) => {
  req.auth.authenticateOrRedirect({ redirect: "/" }, () => {
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
