const Joi = require('joi');

/**
 * Validation schemas for integration routes
 */

const createIntegrationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('servicenow', 'jira', 'zendesk', 'custom').required(),
  config: Joi.object({
    baseUrl: Joi.string().uri().required(),
    auth: Joi.object({
      type: Joi.string().valid('basic', 'oauth', 'apikey', 'other').required(),
      credentials: Joi.any().optional()
    }).optional(),
    options: Joi.object().optional()
  }).required(),
  endpoints: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      path: Joi.string().required(),
      method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').required(),
      enabled: Joi.boolean().default(true),
      requestMapping: Joi.any().optional(),
      responseMapping: Joi.any().optional()
    })
  ).optional(),
  managers: Joi.array().items(Joi.string().length(24).hex()).optional()
});

const updateIntegrationSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('servicenow', 'jira', 'zendesk', 'custom').optional(),
  config: Joi.object({
    baseUrl: Joi.string().uri().optional(),
    auth: Joi.object({
      type: Joi.string().valid('basic', 'oauth', 'apikey', 'other').optional(),
      credentials: Joi.any().optional()
    }).optional(),
    options: Joi.object().optional()
  }).optional(),
  endpoints: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      path: Joi.string().required(),
      method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').required(),
      enabled: Joi.boolean().default(true),
      requestMapping: Joi.any().optional(),
      responseMapping: Joi.any().optional()
    })
  ).optional(),
  isActive: Joi.boolean().optional(),
  managers: Joi.array().items(Joi.string().length(24).hex()).optional()
}).min(1);

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid('servicenow', 'jira', 'zendesk', 'custom').optional(),
  isActive: Joi.boolean().optional()
});

module.exports = {
  createIntegrationSchema,
  updateIntegrationSchema,
  paginationSchema
};
