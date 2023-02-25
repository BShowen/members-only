const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  body: { type: String, required: true },
  date: { type: String, required: true },
});

postSchema.virtual("validateAuthorName").get((userId) => {
  this.postBelongsToAuthor = this.author._id.toString() === userId.toString();
});

postSchema.virtual("editLink").get(function () {
  return `/posts/update/${this._id}`;
});

module.exports = mongoose.model("Post", postSchema);
