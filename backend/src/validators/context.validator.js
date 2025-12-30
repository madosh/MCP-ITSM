const Joi = require('joi');

/**
 * Validation schemas for context routes
 */

const createContextSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  source: Joi.string().min(1).max(100).required(),
  externalId: Joi.string().max(200).optional(),
  contentType: Joi.string().valid('ticket', 'conversation', 'knowledge_article', 'process', 'other').required(),
  data: Joi.any().required(),
  metadata: Joi.object().optional(),
  ttl: Joi.number().integer().min(0).optional(),
  accessControl: Joi.object({
    isPublic: Joi.boolean().default(false),
    allowedUsers: Joi.array().items(Joi.string().length(24).hex()).optional(),
    allowedRoles: Joi.array().items(Joi.string().valid('admin', 'user', 'integrator')).optional()
  }).optional()
});

const updateContextSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  data: Joi.any().optional(),
  metadata: Joi.object().optional(),
  ttl: Joi.number().integer().min(0).optional(),
  accessControl: Joi.object({
    isPublic: Joi.boolean().optional(),
    allowedUsers: Joi.array().items(Joi.string().length(24).hex()).optional(),
    allowedRoles: Joi.array().items(Joi.string().valid('admin', 'user', 'integrator')).optional()
  }).optional(),
  status: Joi.string().valid('active', 'archived', 'pending').optional()
}).min(1);

const contextQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('active', 'archived', 'pending').optional(),
  contentType: Joi.string().valid('ticket', 'conversation', 'knowledge_article', 'process', 'other').optional(),
  source: Joi.string().max(100).optional()
});

module.exports = {
  createContextSchema,
  updateContextSchema,
  contextQuerySchema
};
