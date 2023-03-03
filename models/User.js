const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String,
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

userSchema.virtual("addLink").get(function () {
  return `users/friendRequest/${this._id.toString()}`;
});

module.exports = mongoose.model("User", userSchema);
