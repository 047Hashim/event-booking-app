const User = require("../models/user");
module.exports.renderLoginForm = (req, res) => {
  res.render("user/login.ejs");
};
module.exports.login = async (req, res) => {
  req.flash("success", `Welcome back, ${req.user.username}!`);
  let redirectUrl = res.locals.redirectUrl || "/events";
  res.redirect(redirectUrl);
};

module.exports.renderSignupForm = (req, res) => {
  res.render("user/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({
      username,
      email,
    });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash(
        "success",
        `Welcome, ${newUser.username}! Your account has been successfully created.`
      );

      return res.redirect("/events");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have been successfully logged out.");
    res.redirect("/");
  });
};
