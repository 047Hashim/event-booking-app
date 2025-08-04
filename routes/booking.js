const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapFunction = require("../utils/wrapFunction.js");
const Booking = require("../models/booking.js");
const Event = require("../models/event.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");
router
  .route("/")
  .post(isLoggedIn, wrapFunction(bookingController.booking))
  .delete(isLoggedIn, wrapFunction(bookingController.unBooking));

module.exports = router;
