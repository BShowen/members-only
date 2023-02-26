const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  body: { type: String, required: true },
  date: { type: Date, required: true },
});

postSchema.virtual("editLink").get(function () {
  return `/posts/update/${this._id}`;
});

postSchema.virtual("deleteLink").get(function () {
  return `/posts/delete/${this._id}`;
});

postSchema.virtual("formattedDate").get(function () {
  return Intl.DateTimeFormat("en-us", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(this.date);
});

postSchema.methods.compare = function (comparePost) {
  if (this.date < comparePost.date) {
    return 1;
  } else if (this.date > comparePost.date) {
    return -1;
  } else {
    return 0;
  }
};

module.exports = mongoose.model("Post", postSchema);
