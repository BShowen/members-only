const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const postsRouter = require("./routes/postsRoutes");
const userRouter = require("./routes/userRoutes");

const session = require("express-session");

const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongodb-session")(session);
const Authenticator = require("./utils/authenticator");
const User = require("./models/User");

const flashMessage = require("./utils/flashMessage");

const app = express();

require("dotenv").config();

mongoose
  .connect(process.env.MONGO_DB_STRING, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .catch((error) => console.log("Mongoose connection error:", error.message));

const sessionStore = new MongoDBStore({
  uri: process.env.MONGO_DB_STRING,
  collection: "sessions",
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    name: "session",
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, //24 hours
    store: sessionStore,
  })
);

/* Use Bootstrap */
app.use(
  "/bootstrap-css",
  express.static(
    path.join(__dirname, "node_modules/bootstrap/dist/css/bootstrap.min.css")
  )
);
app.use(
  "/bootstrap-js",
  express.static(
    path.join(__dirname, "node_modules/bootstrap/dist/js/bootstrap.min.js")
  )
);
app.use(
  "/bootstrap-icons",
  express.static(path.join(__dirname, "node_modules/bootstrap-icons/font/"))
);

/**
 * new Authenticator returns an array of middleware functions.
 * This middleware must be applied before any routes that
 * require authentication.
 */
app.use(
  new Authenticator({
    model: User,
  })
);

app.use(flashMessage);

app.use("/", indexRouter);
app.use("/posts", postsRouter);
app.use("/users", userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
