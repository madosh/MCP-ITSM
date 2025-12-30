const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/config');
const { logger } = require('../utils/logger');

/**
 * Middleware to authenticate requests using JWT
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled'
      });
    }
    
    // Attach user to request
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to authorize requests based on user role
 * @param {string[]} roles - Array of allowed roles
 */
exports.authorize = (roles = []) => {
  // Convert string to array if only one role is passed
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Check if user exists and has a role in the allowed roles
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Helper function to check if user can access a resource
 * Useful for checking ownership, managers, or public access
 * @param {Object} resource - The resource to check access for
 * @param {Object} user - The requesting user (from req.user)
 * @param {Object} options - Additional access check options
 * @returns {boolean} - True if user has access
 */
exports.canAccessResource = (resource, user, options = {}) => {
  const {
    ownerField = 'owner',
    managersField = 'managers',
    createdByField = 'createdBy',
    publicField = 'accessControl.isPublic',
    allowedUsersField = 'accessControl.allowedUsers',
    allowedRolesField = 'accessControl.allowedRoles'
  } = options;

  // Admin always has access
  if (user.role === 'admin') {
    return true;
  }

  // Check ownership (owner field)
  const ownerValue = getNestedValue(resource, ownerField);
  if (ownerValue && ownerValue.toString() === user.id) {
    return true;
  }

  // Check createdBy
  const createdByValue = getNestedValue(resource, createdByField);
  if (createdByValue && createdByValue.toString() === user.id) {
    return true;
  }

  // Check managers
  const managers = getNestedValue(resource, managersField);
  if (Array.isArray(managers) && managers.includes(user.id)) {
    return true;
  }

  // Check public access
  const isPublic = getNestedValue(resource, publicField);
  if (isPublic === true) {
    return true;
  }

  // Check allowed users
  const allowedUsers = getNestedValue(resource, allowedUsersField);
  if (Array.isArray(allowedUsers) && allowedUsers.includes(user.id)) {
    return true;
  }

  // Check allowed roles
  const allowedRoles = getNestedValue(resource, allowedRolesField);
  if (Array.isArray(allowedRoles) && allowedRoles.includes(user.role)) {
    return true;
  }

  return false;
};

/**
 * Helper function to get nested object value by string path
 * @param {Object} obj - The object to search
 * @param {string} path - Dot-separated path (e.g., 'accessControl.isPublic')
 * @returns {*} - The value at the path, or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
} 