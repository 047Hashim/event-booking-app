const express = require("express");
const router = express.Router();
const Event = require("../models/event.js");
const wrapFunction = require("../utils/wrapFunction.js");
const ExpressError = require("../utils/ExpressError.js");
const { validateEvent, isLoggedIn, isOwner } = require("../middleware.js");
const eventController = require("../controllers/event.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(isLoggedIn, wrapFunction(eventController.index))
  .post(
    isLoggedIn,
    validateEvent,
    upload.single("event[image]"),
    wrapFunction(eventController.createEvent)
  );

router.get("/new", isLoggedIn, eventController.renderNewForm);
router.get(
  "/:eventId/edit",
  isLoggedIn,
  isOwner,
  wrapFunction(eventController.renderEditForm)
);

router
  .route("/:eventId")
  .get(isLoggedIn, wrapFunction(eventController.showEvent))
  .put(
    isLoggedIn,
    isOwner,
    validateEvent,
    upload.single("event[image]"),
    wrapFunction(eventController.update)
  )
  .delete(isLoggedIn, isOwner, wrapFunction(eventController.destroyEvent));

module.exports = router;
