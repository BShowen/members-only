const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

/* GET a list of all users */
router.get("/", userController.GET_all_users);

/* GET request. Make a friend request  */
router.get("/friendRequest/:userId", userController.GET_friend_request);

module.exports = router;
