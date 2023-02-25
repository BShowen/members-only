const mongoose = require("mongoose");
const Post = require("../models/Post");

module.exports = (req, res, next, { redirect }) => {
  // Verify that this user is the creator of this post.
  // Get the post from the DB and populate the author field.
  const postId = mongoose.Types.ObjectId(req.params.postId);
  const userId = mongoose.Types.ObjectId(req.session.userId);
  Post.findById(postId)
    .populate("author")
    .exec((err, post) => {
      if (err) return next(err);
      if (!post) {
        // No post was found
        // res.cookie(
        //   "messages",
        //   JSON.stringify(["Sorry, we couldn't find that post."])
        // );
        req.flash.set("Sorry, we couldn't find that post.");
        res.redirect(redirect);
      } else if (post.author._id.toString() === userId.toString()) {
        // Make sure current user owns this post.
        req.currentPost = post;
        next();
      } else {
        // User doesn't own this post. Redirect home with message.
        // res.cookie("messages", JSON.stringify(["You cannot edit that post."]));
        req.flash.set("You cannot edit that post.");
        res.redirect(redirect);
      }
    });
};
