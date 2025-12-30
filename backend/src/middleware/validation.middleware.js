const { logger } = require('../utils/logger');

/**
 * Validation middleware factory
 * Creates middleware for validating request data using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown keys from the validated data
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error:', { errors: errorDetails, path: req.path });

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }

    // Replace request property with validated value (with defaults applied)
    req[property] = value;
    next();
  };
};

module.exports = { validate };
