const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  passwordResetKey: {
    type: String,
  },
});

userSchema.virtual("name").get(function () {
  // Return the capitalized username
  const capLetter = this.username.split("")[0].toUpperCase();
  const letters = this.username.substring(1);
  return capLetter + letters;
});

userSchema.virtual("postCount", {
  ref: "Post", // The model to use
  localField: "_id", // Find people where `localField`
  foreignField: "author", // is equal to foreignField
  count: true, // And only get the number of docs
});

userSchema.virtual("followCount", {
  ref: "Follow",
  localField: "_id",
  foreignField: "follower",
  count: true,
});

userSchema.virtual("followerCount", {
  ref: "Follow",
  localField: "_id",
  foreignField: "following",
  count: true,
});

userSchema.virtual("following", {
  ref: "Follow",
  localField: "_id",
  foreignField: "follower",
});

userSchema.virtual("followers", {
  ref: "Follow",
  localField: "_id",
  foreignField: "following",
});

userSchema.methods.isFollowing = function (user) {
  // Returns true if logged in user is following user
  // Otherwise returns false.
  // For this method to work, the controller must populate("following")
  return this.following.some((follow) => {
    return follow.following.toString() === user._id.toString();
  });
};

/**
 * When this user is rendered into a view, we need to allow other users to
 * either follow or unfollow this user. setActionFollow and setActionUnfollow
 * will tell this instance to render a "Follow" button or an "unFollow" button.
 * These methods are called from the appropriate controller when rendering the
 * user.
 */
userSchema.methods.setActionUnfollow = function () {
  this.actionLink = "/users/unfollow";
  this.actionName = "Unfollow";
};

userSchema.methods.setActionFollow = function () {
  this.actionLink = "/users/follow";
  this.actionName = "Follow";
};

module.exports = mongoose.model("User", userSchema);
