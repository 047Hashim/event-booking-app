if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const port = 8080;
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Booking = require("./models/booking");
const User = require("./models/user");
const Event = require("./models/event");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const wrapFunction = require("./utils/wrapFunction.js");
const ExpressError = require("./utils/ExpressError.js");

const eventRoute = require("./routes/event.js");
const bookingRoute = require("./routes/booking.js");
const userRoute = require("./routes/user.js");
const { isLoggedIn } = require("./middleware.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/test";
const secretValue = process.env.SECRET || "mysecret_value";

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: secretValue,
  },
  touchAfter: 24 * 60 * 60,
  ttl: 7 * 24 * 60 * 60,
});
store.on("error", (err) => {
  console.error("ERROR in Mongo session store:", err);
});

const sessionOption = {
  store,
  secret: secretValue,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.use(session(sessionOption));
app.use(flash());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    User.authenticate()
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.showSubnav = false;
  res.locals.url = req.originalUrl;
  next();
});

app.get("/", async (req, res) => {
  if (!res.locals.currUser) {
    const now = new Date();
    let events = await Event.find({}).sort({ date: 1 });
    // Filter events whose date + time is truly in the future
    const upcomingEvents = events.filter((event) => {
      const eventDate = new Date(event.date);
      const [hours, minutes] = event.time.split(":").map(Number);
      const timezoneOffset = event.timezoneOffset || 0;
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
      return eventDateTime.getTime() > now.getTime();
    });
    return res.render("landing.ejs", {
      upcomingEvents: upcomingEvents.slice(0, 3),
    });
  } else {
    res.redirect("/events");
  }
});

app.use("/events", eventRoute);
app.use("/events/:eventId/bookings", bookingRoute);
app.use("/", userRoute);

app.get(
  "/users/:userId/bookings",
  isLoggedIn,
  wrapFunction(async (req, res) => {
    const { userId } = req.params;
    const booking = await Booking.findOne({ user: userId }).populate("event");
    if (booking?.event?.length) {
      // Sort by event date (earliest first)
      booking.event.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    res.render("booking/myBooking.ejs", { booking });
  })
);

app.get("/organizer-info", (req, res) => {
  res.render("event/organizerInfo");
});

app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});
app.use((err, req, res, next) => {
  let { status = 500, message = "Some Error Occured" } = err;
  res.status(status).render("error.ejs", { message });
});
app.listen(port, (req, res) => {
  console.log(`Server is listening on port: ${port}`);
});
