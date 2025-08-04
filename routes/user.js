const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const wrapFunction = require("../utils/wrapFunction");
const { saveRedirectUrl } = require("../middleware");

const userController = require("../controllers/user.js");

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapFunction(userController.signup));
router.get("/logout", userController.logout);

module.exports = router;
