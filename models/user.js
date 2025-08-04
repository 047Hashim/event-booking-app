const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, unique: false, required: true },
  email: { type: String, unique: true, required: true },
});
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  errorMessages: {
    UserExistsError: "This email is already registered!",
  },
});

module.exports = mongoose.model("User", userSchema);
