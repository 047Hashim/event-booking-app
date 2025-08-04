const Event = require("../models/event.js");
const { cloudinary } = require("../cloudConfig.js");
module.exports.index = async (req, res) => {
  let events = await Event.find({}).sort({ date: 1 });
  res.render("event/index.ejs", { events, showSubnav: true });
};

module.exports.renderNewForm = (req, res) => {
  res.render("event/new.ejs");
};

module.exports.createEvent = async (req, res) => {
  const event = new Event(req.body.event);
  const now = new Date();
  const eventDate = new Date(event.date);
  const [hours, minutes] = event.time.split(":").map(Number);
  const timezoneOffset = parseInt(event.timezoneOffset) || 0;
  const eventDateTime = new Date(
    Date.UTC(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      hours,
      minutes + timezoneOffset,
      0, // seconds
      0 // milliseconds
    )
  );

  if (now.getTime() > eventDateTime.getTime()) {
    req.flash(
      "error",
      "Please select a valid date and time that is not in the past."
    );
    return res.redirect("/events/new");
  } else {
    const url = req.file?.path || event.image.url;
    const filename = req.file?.filename || "unsplashImage";
    const originalname = req.file?.originalname || "Default Image";
    event.owner = req.user._id;
    event.image = { url, filename, originalname };
    await event.save();
    req.flash("success", "Your event has been created successfully.");
    res.redirect("/events");
  }
};
module.exports.showEvent = async (req, res, next) => {
  const { eventId } = req.params;
  let event = await Event.findById(eventId).populate("attendees");
  const hasbook = event.attendees.some((att) => att._id.equals(req.user._id));

  if (!event) {
    next(new ExpressError(404, "Event not found!"));
  } else {
    res.render("event/show.ejs", { event, hasbook, showSubnav: true });
  }
};

module.exports.renderEditForm = async (req, res) => {
  const { eventId } = req.params;
  let event = await Event.findById(eventId);
  res.render("event/edit.ejs", { event });
};

module.exports.update = async (req, res) => {
  const { eventId } = req.params;
  const now = new Date();
  const eventDate = new Date(req.body.event.date);
  const [hours, minutes] = req.body.event.time.split(":").map(Number);
  const timezoneOffset = parseInt(req.body.event.timezoneOffset) || 0;
  const eventDateTime = new Date(
    Date.UTC(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      hours,
      minutes + timezoneOffset,
      0, // seconds
      0 // milliseconds
    )
  );

  if (now.getTime() > eventDateTime.getTime()) {
    req.flash(
      "error",
      "Please select a valid date and time that is not in the past."
    );
    return res.redirect(`/events/${eventId}/edit`);
  } else {
    let event = await Event.findByIdAndUpdate(eventId, req.body.event, {
      new: true,
    });
    if (req.file) {
      // Delete old image if it's not the default one
      if (event.image.filename && event.image.filename !== "unsplashImage") {
        await cloudinary.uploader.destroy(event.image.filename);
      }
      // Set new image
      event.image.url = req.file.path;
      event.image.filename = req.file.filename;
      event.image.originalname = req.file.originalname;
      await event.save();
    }
    req.flash("success", "Event updated successfully.");
    res.redirect(`/events/${eventId}`);
  }
};

module.exports.destroyEvent = async (req, res) => {
  const { eventId } = req.params;
  const event = await Event.findById(eventId);
  if (event.image.filename && event.image.filename !== "unsplashImage") {
    await cloudinary.uploader.destroy(event.image.filename);
  }
  await Event.findByIdAndDelete(eventId);
  req.flash("success", "The event has been successfully deleted.");
  res.redirect("/events");
};
