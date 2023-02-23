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

module.exports = mongoose.model("User", userSchema);
