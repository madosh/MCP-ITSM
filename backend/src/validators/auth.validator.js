const Joi = require('joi');

/**
 * Validation schemas for authentication routes
 */

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional()
});

const loginSchema = Joi.object({
  username: Joi.string().required(), // Can be email or username
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema
};
