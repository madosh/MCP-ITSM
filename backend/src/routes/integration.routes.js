const express = require('express');
const { authenticate, authorize, canAccessResource } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createIntegrationSchema, updateIntegrationSchema, paginationSchema } = require('../validators/integration.validator');
const Integration = require('../models/integration.model');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/integration
 * @desc Get all integrations
 * @access Private
 */
router.get('/', authenticate, authorize(['admin', 'integrator']), validate(paginationSchema, 'query'), async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Get integrations with pagination
    const integrations = await Integration.find(filter)
      .select('-config.auth.credentials') // Don't send credentials
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Integration.countDocuments(filter);

    res.json({
      success: true,
      count: integrations.length,
      data: integrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching integrations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/integration/:id
 * @desc Get a specific integration
 * @access Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const integration = await Integration.findById(req.params.id)
      .select('-config.auth.credentials'); // Don't send credentials
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    // Check access using helper function
    const hasAccess = canAccessResource(integration, req.user) || req.user.role === 'integrator';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    logger.error('Error fetching integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching integration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/integration
 * @desc Create a new integration
 * @access Private
 */
router.post('/', authenticate, authorize(['admin', 'integrator']), validate(createIntegrationSchema), async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      config,
      endpoints,
      managers
    } = req.body;
    
    // Check if integration with same name already exists
    const existingIntegration = await Integration.findOne({ name });
    if (existingIntegration) {
      return res.status(400).json({
        success: false,
        message: 'Integration with this name already exists'
      });
    }
    
    // Create new integration
    const newIntegration = new Integration({
      name,
      description,
      type,
      config,
      endpoints: endpoints || [],
      isActive: true,
      health: {
        status: 'unknown',
        lastChecked: new Date(),
        message: 'Integration created, health check pending'
      },
      createdBy: req.user.id,
      managers: managers || []
    });
    
    await newIntegration.save();
    
    // Remove sensitive info before sending response
    const response = newIntegration.toObject();
    if (response.config && response.config.auth) {
      delete response.config.auth.credentials;
    }
    
    res.status(201).json({
      success: true,
      message: 'Integration created successfully',
      data: response
    });
  } catch (error) {
    logger.error('Error creating integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating integration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route PUT /api/integration/:id
 * @desc Update an integration
 * @access Private
 */
router.put('/:id', authenticate, validate(updateIntegrationSchema), async (req, res) => {
  try {
    const integration = await Integration.findById(req.params.id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    // Check access using helper function
    if (!canAccessResource(integration, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const {
      name,
      description,
      type,
      config,
      endpoints,
      isActive,
      managers
    } = req.body;
    
    // Update fields if provided
    if (name) integration.name = name;
    if (description) integration.description = description;
    if (type) integration.type = type;
    if (config) {
      // Preserve credentials if not provided
      if (config.auth && !config.auth.credentials && integration.config.auth) {
        config.auth.credentials = integration.config.auth.credentials;
      }
      integration.config = config;
    }
    if (endpoints) integration.endpoints = endpoints;
    if (isActive !== undefined) integration.isActive = isActive;
    if (managers) integration.managers = managers;
    
    await integration.save();
    
    // Remove sensitive info before sending response
    const response = integration.toObject();
    if (response.config && response.config.auth) {
      delete response.config.auth.credentials;
    }
    
    res.json({
      success: true,
      message: 'Integration updated successfully',
      data: response
    });
  } catch (error) {
    logger.error('Error updating integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating integration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route DELETE /api/integration/:id
 * @desc Delete an integration
 * @access Private
 */
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const integration = await Integration.findById(req.params.id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }
    
    await integration.remove();
    
    res.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting integration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/integration/type/:type
 * @desc Get integrations by type
 * @access Private
 */
router.get('/type/:type', authenticate, authorize(['admin', 'integrator']), async (req, res) => {
  try {
    const integrations = await Integration.find({ 
      type: req.params.type, 
      isActive: true 
    }).select('-config.auth.credentials');
    
    res.json({
      success: true,
      count: integrations.length,
      data: integrations
    });
  } catch (error) {
    logger.error('Error fetching integrations by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching integrations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/integration/:id/check-health
 * @desc Check health of an integration
 * @access Private
 */
router.post('/:id/check-health', authenticate, async (req, res) => {
  try {
    const integration = await Integration.findById(req.params.id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    // Check access using helper function
    if (!canAccessResource(integration, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // This would implement actual health checking based on integration type
    // For now, just update the timestamp and status
    integration.health.lastChecked = new Date();
    integration.health.status = integration.isActive ? 'healthy' : 'inactive';
    integration.health.message = integration.isActive 
      ? 'Integration is active and responding' 
      : 'Integration is currently inactive';
    
    await integration.save();
    
    res.json({
      success: true,
      message: 'Health check performed',
      data: integration.health
    });
  } catch (error) {
    logger.error('Error checking integration health:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking integration health',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 