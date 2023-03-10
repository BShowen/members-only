const async = require("async");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const CourierClient = require("@trycourier/courier").CourierClient;

/* Get the Home or Posts page */
exports.GET_root_page = (req, res) => {
  // If user is logged in render the home page, otherwise redirect to posts.
  if (req.auth.isAuthenticated()) return res.redirect("/home");
  return res.redirect("/posts");
};

/* GET the login page */
exports.GET_login_page = (req, res) => {
  if (req.auth.isAuthenticated()) return res.redirect("/home");
  return res.render("index", {
    title: "Login",
    formAction: "/login",
    messages: req.flash.get(),
  });
};

/* Handle login form submission */
exports.POST_login_page = (req, res, next) => {
  req.auth.loginUser((err, response) => {
    if (err) return next(err);
    if (response.isAuthenticated) {
      if (req.body.remember === "on") {
        req.auth.rememberUser();
      }
      return res.redirect("/home");
    } else {
      res.render("index", {
        title: "Login",
        formAction: "/login",
        messages: [response.message],
      });
    }
  });
};

/* Handle logout request */
exports.logout = (req, res, next) => {
  req.auth.logoutUser((err) => {
    if (err) return next(err);

    res.redirect("/login");
  });
};

/* GET signup page */
exports.GET_signup_page = (req, res) => {
  if (req.auth.isAuthenticated()) return res.redirect("/home");
  return res.render("index", { title: "Sign up", formAction: "/signup" });
};

/* Handle signup form submission */
exports.POST_signup_page = (req, res, next) => {
  const { username, password, email } = req.body;

  if (username.length <= 0 || password.length <= 0 || email.length <= 0) {
    return res.render("index", {
      title: "Sign up",
      formAction: "/signup",
      messages: ["Username, password, and email are required."],
    });
  }

  User.findOne({ username: username }, (err, user) => {
    if (err) return next(err);
    if (user) {
      return res.render("index", {
        title: "Sign up",
        formAction: "/signup",
        messages: ["That username has been taken."],
      });
    }

    const newUser = new User({
      username: username.toLowerCase(),
      password: bcrypt.hashSync(password, 10),
      email: email.toLowerCase(),
    });

    newUser.save((err) => {
      if (err) return next(err); //Error saving the user.
      req.auth.loginUser((err, response) => {
        if (err) return next(err); //Error logging in the user.
        if (req.auth.isAuthenticated()) {
          // User successfully logged in.
          return res.redirect("/home");
        } else {
          // User was not able to be logged in due to incorrect password or
          // username. This should never be reached because the user just
          // created their account.
          /**
           * Console log the messages for now. In the future these messages will
           * be displayed to the user.
           */
          console.log(response.message);
          res.redirect("/");
        }
      });
    });
  });
};

/* GET home page */
exports.GET_home_page = (req, res, next) => {
  // User is authenticated, render the home page.
  const id = mongoose.Types.ObjectId(req.auth.currentUser.id);

  async.parallel(
    {
      user: (callback) => {
        return User.findById(id, "username")
          .populate("postCount")
          .populate("followCount")
          .populate("followerCount")
          .exec((err, user) => {
            if (err) return callback(err);
            return callback(null, user);
          });
      },
      followingList: (callback) => {
        if (req.query.view !== "following") {
          return callback(null, []);
        }
        return User.findById(id, "username")
          .populate({
            path: "following",
            populate: {
              path: "following",
              select: "-password",
            },
          })
          .exec((err, user) => {
            if (err) return callback(err);

            // Set the action link and action name for the users that this
            // user follows.
            const followingList = user.following.map((follow) => {
              const followee = follow.following;
              followee.setActionUnfollow();
              return followee;
            });

            // Return only the user objects from the list of follows.
            callback(null, followingList);
          });
      },
      followerList: (callback) => {
        if (req.query.view !== "followers") {
          return callback(null, []);
        }
        return User.findById(id)
          .populate({
            path: "followers",
            populate: {
              path: "follower",
              select: "-password",
            },
          })
          .populate("following")
          .exec((err, user) => {
            if (err) return next(err);

            const followerList = user.followers.map((follow) => {
              const follower = follow.follower;
              if (user.isFollowing(follower)) {
                follower.setActionUnfollow();
              } else {
                follower.setActionFollow();
              }
              return follower;
            });

            return callback(null, followerList);
          });
      },
      posts: (callback) => {
        return Post.find({ author: id })
          .populate("author")
          .exec((err, postList) => {
            if (err) return callback(err);
            return callback(null, postList);
          });
      },
    },
    (err, results) => {
      if (err) return next(err);

      const messages = req.flash.get();
      res.render("home", {
        title: "Home",
        currentUser: results.user,
        postList: results.posts,
        followerList: results.followerList,
        followingList: results.followingList,
        queryParam: req.query.view || "posts",
        messages,
      });
    }
  );
};

/* GET the request-password-reset page */
exports.GET_password_reset_request = (req, res) => {
  return res.render("passwordResetForm", {
    title: "Forgot password",
  });
};

/* POST process password reset form submission */
exports.POST_password_reset_request = (req, res, next) => {
  // find the user by email address.
  const email = req.body?.email?.toLowerCase();
  User.findOne({ email }).exec((err, user) => {
    if (err) return next(err);
    if (!user) {
      // A user with that email wasn't found
      req.flash.set("A user with that email couldn't be found.");
      return res.redirect("/");
    }

    // A user was found.

    // Generate a password reset key for this user.
    const passwordResetKey = mongoose.Types.ObjectId().toString();
    const passwordResetHash = bcrypt.hashSync(passwordResetKey, 10);
    user.passwordResetKey = passwordResetHash;

    // Save the passwordResetKey to the user document in the DB.
    user.save((err) => {
      if (err) return next(err);
      // Password reset link is saved. Now send a reset link to the user's email
      const courier = CourierClient({
        authorizationToken: process.env.COURIER_AUTH_TOKEN,
      });

      // Create the reset link.
      let resetLink;
      if (process.env.RAILWAY_ENVIRONMENT === "production") {
        resetLink = process.env.RAILWAY_STATIC_URL;
      } else {
        resetLink = `${req.protocol}://${req.hostname}:${process.env.PORT}`;
      }
      resetLink += `/password-reset?id=${user._id}&key=${passwordResetKey}`;

      // Initiate the email.
      courier
        .send({
          message: {
            to: {
              data: {
                name: user.username,
              },
              email: user.email,
            },
            content: {
              title: "Password reset link.",
              body: resetLink,
            },
            routing: {
              method: "single",
              channels: ["email"],
            },
          },
        })
        .then(() => {
          // Email was successfully sent.
          req.flash.set("Please check your email.");
          return res.redirect("/");
        })
        .catch((err) => {
          // There was an error sending the email.
          return next(err);
        });
    });
  });
};

/* GET the create-new-password page */
exports.GET_password_reset = (req, res, next) => {
  // Get the userID & key from the url.
  const userId = mongoose.Types.ObjectId(req.query.id) || "";
  const secret = req.query.key || "";

  User.findById(userId, (err, user) => {
    if (err) return next(err);

    // Validate the user using the key.
    const userSecret = user?.passwordResetKey || "";
    const isAuthentic = bcrypt.compareSync(secret, userSecret);

    if (!user || !isAuthentic) {
      // A user with that email wasn't found or the secret doesn't match.
      req.flash.set("Invalid password reset link.");
      return res.redirect("/");
    }

    // User is valid and allowed to change their password.
    return res.render("newPasswordForm", {
      title: "New password",
      secret: secret,
      id: userId.toString(),
    });
  });
};

exports.POST_password_reset = (req, res) => {
  // get the password, secret, and id from the form.
  const { password: newPassword, secret, id } = req.body;
  const userId = mongoose.Types.ObjectId(id);

  // Retrieve the user from the DB.
  User.findById(userId, (err, user) => {
    if (err) return next(err);

    // Validate the user using the key.
    const userSecret = user?.passwordResetKey || "";
    const isAuthentic = bcrypt.compareSync(secret, userSecret);

    if (!user || !isAuthentic) {
      // A user with that email wasn't found or the secret doesn't match.
      req.flash.set("Something went wrong.");
      return res.redirect("/");
    }

    // User is authenticated. Save their new password.
    user.password = bcrypt.hashSync(newPassword, 10);
    user.passwordResetKey = "";
    user.save((err) => {
      if (err) return next(err);

      req.flash.set("Password saved.");
      res.redirect("/");
    });
  });
};
