const Joi = require("joi");
const eventSchema = Joi.object({
  event: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    date: Joi.date().required(),
    time: Joi.string().required(),
    location: Joi.string().required(),
    maxAttendees: Joi.string().required(),
    imageUrl: Joi.string().allow("", null),
  }).required(),
});
module.exports = eventSchema;
