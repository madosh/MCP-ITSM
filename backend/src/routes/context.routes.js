const express = require('express');
const Context = require('../models/context.model');
const { logger } = require('../utils/logger');
const config = require('../config/config');

// Middleware for authentication (to be implemented)
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/context
 * @desc Get all contexts for authenticated user
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { 
      $or: [
        { owner: req.user.id },
        { 'accessControl.isPublic': true },
        { 'accessControl.allowedUsers': req.user.id },
        { 'accessControl.allowedRoles': req.user.role }
      ]
    };

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Add content type filter if provided
    if (req.query.contentType) {
      filter.contentType = req.query.contentType;
    }
    
    // Add source filter if provided
    if (req.query.source) {
      filter.source = req.query.source;
    }

    const contexts = await Context.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await Context.countDocuments(filter);
    
    res.json({
      success: true,
      data: contexts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching contexts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contexts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/context/:id
 * @desc Get a specific context by ID
 * @access Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const context = await Context.findById(req.params.id);
    
    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'Context not found'
      });
    }
    
    // Check permissions
    const canAccess = 
      context.owner.toString() === req.user.id ||
      context.accessControl.isPublic ||
      context.accessControl.allowedUsers.includes(req.user.id) ||
      context.accessControl.allowedRoles.includes(req.user.role);
    
    if (!canAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    logger.error('Error fetching context:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching context',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/context
 * @desc Create a new context
 * @access Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      description,
      source,
      externalId,
      contentType,
      data,
      metadata,
      ttl,
      accessControl
    } = req.body;
    
    // Calculate size
    const dataSize = Buffer.byteLength(JSON.stringify(data));
    
    if (dataSize > config.context.maxSize) {
      return res.status(400).json({
        success: false,
        message: `Context data exceeds maximum allowed size (${config.context.maxSize} bytes)`
      });
    }
    
    // Create context
    const newContext = new Context({
      name,
      description,
      source,
      externalId,
      contentType,
      data,
      metadata,
      ttl: ttl || config.context.defaultTTL,
      size: dataSize,
      owner: req.user.id,
      accessControl: accessControl || {
        isPublic: false,
        allowedUsers: [],
        allowedRoles: []
      }
    });
    
    await newContext.save();
    
    res.status(201).json({
      success: true,
      message: 'Context created successfully',
      data: newContext
    });
  } catch (error) {
    logger.error('Error creating context:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating context',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route PUT /api/context/:id
 * @desc Update a context
 * @access Private
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const context = await Context.findById(req.params.id);
    
    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'Context not found'
      });
    }
    
    // Check ownership
    if (context.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const {
      name,
      description,
      data,
      metadata,
      ttl,
      accessControl,
      status
    } = req.body;
    
    // Update fields if provided
    if (name) context.name = name;
    if (description) context.description = description;
    if (data) {
      context.data = data;
      context.size = Buffer.byteLength(JSON.stringify(data));
      
      // Check size
      if (context.size > config.context.maxSize) {
        return res.status(400).json({
          success: false,
          message: `Context data exceeds maximum allowed size (${config.context.maxSize} bytes)`
        });
      }
      
      // Increment version
      context.version += 1;
    }
    if (metadata) context.metadata = metadata;
    if (ttl !== undefined) {
      context.ttl = ttl;
      context.expiresAt = ttl === 0 ? null : new Date(Date.now() + ttl * 1000);
    }
    if (accessControl) context.accessControl = accessControl;
    if (status && ['active', 'archived', 'pending'].includes(status)) {
      context.status = status;
    }
    
    await context.save();
    
    res.json({
      success: true,
      message: 'Context updated successfully',
      data: context
    });
  } catch (error) {
    logger.error('Error updating context:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating context',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route DELETE /api/context/:id
 * @desc Delete a context
 * @access Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const context = await Context.findById(req.params.id);
    
    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'Context not found'
      });
    }
    
    // Check ownership or admin access
    if (context.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await context.remove();
    
    res.json({
      success: true,
      message: 'Context deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting context:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting context',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/context/source/:source/external/:externalId
 * @desc Get context by source and external ID
 * @access Private
 */
router.get('/source/:source/external/:externalId', authenticate, async (req, res) => {
  try {
    const { source, externalId } = req.params;
    
    const context = await Context.findOne({ 
      source, 
      externalId,
      status: 'active'
    });
    
    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'Context not found'
      });
    }
    
    // Check permissions
    const canAccess = 
      context.owner.toString() === req.user.id ||
      context.accessControl.isPublic ||
      context.accessControl.allowedUsers.includes(req.user.id) ||
      context.accessControl.allowedRoles.includes(req.user.role);
    
    if (!canAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    logger.error('Error fetching context by external ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching context',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 