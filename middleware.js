const eventSchema = require("./eventSchema");
const ExpressError = require("./utils/ExpressError");
const Event = require("./models/event.js");
module.exports.validateEvent = (req, res, next) => {
  const { error } = eventSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    if (req.originalUrl.includes("/events/new")) {
      req.flash("error", "You must be logged in to create a event!");
    } else {
      req.flash("error", "You must be logged in to perform this action!");
    }
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { eventId } = req.params;
  let event = await Event.findById(eventId);
  if (!event.owner._id.equals(res.locals.currUser._id)) {
    req.flash("error", "You are not the owner of this event");
    return res.redirect(`/events/${eventId}`);
  }
  next();
};
