const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

/* GET a list of all users */
router.get("/", userController.GET_all_users);

/* POSt request to follow a user  */
router.post("/follow", userController.POST_follow_user);

router.post("/unfollow", userController.POST_unfollow_user);

module.exports = router;
