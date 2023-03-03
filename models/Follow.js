const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const followSchema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  following: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

module.exports = mongoose.model("Follow", followSchema);
