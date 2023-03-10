const express = require("express");
const router = express.Router();
const authenticationController = require("../controllers/authenticationController");

/* GET login page. */
router.get("/login", authenticationController.GET_login_page);

/* POST login page */
router.post("/login", authenticationController.POST_login_page);

/* GET logout page */
router.get("/logout", authenticationController.logout);

/* GET signup page */
router.get("/signup", authenticationController.GET_signup_page);

/* POST signup page */
router.post("/signup", authenticationController.POST_signup_page);

/* GET home page. */
router.get("/home", authenticationController.GET_home_page);

/* GET Home or Posts page. */
router.get("/", authenticationController.GET_root_page);

router.get(
  "/password-reset-request",
  authenticationController.GET_password_reset_request
);

router.post(
  "/password-reset-request",
  authenticationController.POST_password_reset_request
);

router.get("/password-reset", authenticationController.GET_password_reset);

router.post("/password-reset", authenticationController.POST_password_reset);

module.exports = router;
