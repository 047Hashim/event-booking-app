const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Booking = require("./booking");

const eventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: {
    type: String,
    required: true,
    match: /^([01]?\d|2[0-3]):([0-5]\d)$/,
  },
  location: { type: String, required: true },
  maxAttendees: { type: Number, required: true },
  timezoneOffset: { type: Number, default: 0 }, // Store timezone offset in minutes
  attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
  image: {
    url: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1559146820-a75deba24b58?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    filename: String,
    originalname: String,
  },
  owner: { type: Schema.Types.ObjectId, ref: " User" },
});

eventSchema.post("findOneAndDelete", async (deletedEvent) => {
  for (const userId of deletedEvent.attendees) {
    let eventId = deletedEvent._id;
    let booking = await Booking.findOne({ user: userId });

    if (booking && booking.event.length > 1) {
      await Booking.findByIdAndUpdate(booking._id, {
        $pull: { event: eventId },
      });
    } else {
      await Booking.findOneAndDelete(booking._id);
    }
  }
});

module.exports = mongoose.model("Event", eventSchema);
