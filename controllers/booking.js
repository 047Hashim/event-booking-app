const Booking = require("../models/booking.js");
const Event = require("../models/event.js");

module.exports.booking = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;
  let booking = await Booking.findOne({ user: userId });
  let event = await Event.findById(eventId);
  if (!event) {
    req.flash("error", "Event not found.");
    return res.redirect("/events");
  }

  const now = new Date();

  if (event.date < now) {
    req.flash("error", "Booking failed. This event has already expired.");
    return res.redirect("/events");
  }

  if (!event.owner.equals(userId)) {
    if (booking) {
      if (!booking.event.some((eid) => eid.equals(eventId))) {
        booking.event.push(eventId);
        await booking.save();
        event.attendees.push(userId);
        await event.save();
      } else {
        req.flash("success", "You already booked this event!");
        return res.redirect("/events");
      }
    } else {
      booking = new Booking({ user: userId, event: [eventId] });
      await booking.save();
      event.attendees.push(userId);
      await event.save();
    }
    req.flash("success", "You have successfully booked this event!");
    return res.redirect(`/events/${eventId}`);
  } else {
    req.flash("error", "You cannot book your own event.");
    return res.redirect("/events");
  }
};

module.exports.unBooking = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;
  let booking = await Booking.findOne({ user: userId });
  let event = await Event.findById(eventId);
  if (!event) {
    req.flash("error", "Event not found.");
    return res.redirect("/events");
  }
  if (!booking || !booking.event.some((eid) => eid.equals(eventId))) {
    req.flash("error", "You have not booked this event.");
    return res.redirect("/events");
  }

  if (booking.event.length > 1) {
    await Booking.findByIdAndUpdate(booking._id, {
      $pull: { event: eventId },
    });
    await Event.findByIdAndUpdate(eventId, { $pull: { attendees: userId } });
    req.flash("success", "Event unbooked successfully!");
  } else {
    await Booking.findOneAndDelete(booking._id);
    await Event.findByIdAndUpdate(eventId, {
      $pull: { attendees: userId },
    });
    req.flash("success", "Event unbooked successfully!");
  }
  let unbookingSource = req.query.source === "mybookingPage";
  if (unbookingSource) {
    return res.redirect(`/users/${req.user._id}/bookings`);
  } else {
    res.redirect(`/events/${eventId}`);
  }
};
