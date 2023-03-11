const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

/**
 * This module returns an array of middleware functions that can be used
 * for session based authentication. Apply these middleware functions to your
 * app before any of your routes.
 * Once thats done, req.auth will be an object with some authentication methods.
 *
 * req.auth = {
 *  loginUser(credentials, callback) : callback(error, {
 *    Boolean: isAuthenticated,
 *    String: message
 *  })
 *  logoutUser(callback) : callback()
 *  isAuthenticated() : Boolean
 *  authenticateOrRedirect({ String: redirect }) : Undefined
 * }
 */
module.exports = class Authenticator {
  #auth = {};

  #model;
  constructor({ model }) {
    this.#model = model;
    this.middleware = [
      this.#authenticateUser.bind(this),
      this.#setRequestAuthObject.bind(this),
    ];
    return this.middleware;
  }
  #authenticateUser(req, res, next) {
    if (req.session.userId) {
      // The user is authenticated from their session.
      return next();
    }

    if (!req.signedCookies.remember) {
      // Nothing to do.
      // The user doesn't have a remember me cookie
      // or the cookie is no longer signed
      return next();
    }

    // The user has a remember cookie.
    // Find the user in the DB and create a session.
    const cookie = req.signedCookies.remember;
    const userId = mongoose.Types.ObjectId(cookie);
    this.#model.findById(userId, (err, user) => {
      if (err) return next(err);
      this.#createSession(req, user._id.toString());
      next();
    });
  }

  #setRequestAuthObject(req, res, next) {
    this.#auth.loginUser = this.#login.bind(this, req);
    this.#auth.logoutUser = this.#logout.bind(this, req, res);
    this.#auth.isAuthenticated = this.#isAuthenticated.bind(this, req);
    this.#auth.authenticateOrRedirect = this.#authenticateOrRedirect.bind(
      this,
      req,
      res
    );
    this.#auth.rememberUser = this.#rememberUser.bind(this, req, res);
    this.#auth.currentUser = {
      id: req.session?.userId || req.signedCookies?.remember,
    };
    req.auth = this.#auth;
    next();
  }

  #isAuthenticated(req) {
    return !!(req.session?.userId || req.signedCookies?.remember);
  }

  #createSession(req, userId) {
    req.session.userId = userId;
  }

  #login(req, credentials, cb) {
    const returnObject = {
      isAuthenticated: false,
      user: undefined,
      message: "",
    };

    // credentials = {
    //   identifier: { email: "foo@bar.com" },
    //   credential: { password: "BarBaz" },
    // };

    // identifierKey = "email",
    // credentialKey = "password"
    const [identifierKey, credentialKey] = Object.keys(credentials).map(
      (key) => Object.keys(credentials[key])[0]
    );

    // credentialValue = "BarBaz"
    const credentialValue = credentials.credential[credentialKey];

    // query = {email: "foo@bar.com"}
    const query = {
      [identifierKey]: credentials.identifier[identifierKey],
    };

    this.#model.findOne(query, (err, user) => {
      if (err) return cb(err);
      if (!user) {
        // Didn't find that user in the db.
        returnObject.message = `Invalid ${identifierKey}.`;
        return cb(null, returnObject);
      } else {
        // Found the user. Validate password.
        bcrypt.compare(credentialValue, user[credentialKey], (err, isValid) => {
          if (err) return cb(err);
          if (isValid) {
            // Password is valid
            // Don't store password in session
            // delete user._doc[credentialValue];
            this.#createSession(req, user._id.toString());
            returnObject.isAuthenticated = true;
            returnObject.user = user;
            return cb(null, returnObject);
          } else {
            // Passwords don't match.
            returnObject.message = `Invalid ${credentialKey}.`;
            return cb(null, returnObject);
          }
        });
      }
    });
  }

  #logout(req, res, cb) {
    // Clear any remember-me cookies
    res.clearCookie("remember", {
      maxAge: 1000 * 60 * 60 * 24 * 7, //save user for one 7 days.
      httpOnly: true,
      signed: true,
    });

    // Clear the session
    req.session.destroy((err) => {
      if (err) return cb(err);
      return cb();
    });
  }

  /**
   * @param {Number} maxAge Milliseconds for length of cookie
   */
  #rememberUser(req, res) {
    // Save a cookie on the client for 7 days
    res.cookie("remember", req.session.userId.toString(), {
      maxAge: 1000 * 60 * 60 * 24 * 7, //Seven days.
      httpOnly: true,
      signed: true,
    });
  }

  #authenticateOrRedirect(req, res, next, { redirect }) {
    if (typeof redirect !== "string") {
      throw new Error("redirect should be a string, received:", redirect);
    }
    if (this.#isAuthenticated(req)) {
      next();
    } else {
      res.redirect(redirect);
    }
  }
};
