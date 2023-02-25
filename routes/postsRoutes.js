const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

/* GET list posts. */
router.get("/", postController.index);

/* GET form to create a new post */
router.get("/create", postController.GET_create_new_post);

/* GET form to update post */
router.get("/update/:postId", postController.GET_update_post);

/* POST form to update post */
router.post("/update/:postId", postController.POST_update_post);

/* POST create a new posts from submitted form */
router.post("/create", postController.POST_create_new_post);

module.exports = router;
