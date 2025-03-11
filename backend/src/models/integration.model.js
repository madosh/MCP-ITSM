const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  // Type of integration (ServiceNow, Jira, Zendesk, etc.)
  type: {
    type: String,
    required: true,
    enum: ['servicenow', 'jira', 'zendesk', 'custom'],
    index: true
  },
  // Configuration for the integration
  config: {
    // Base URL for the ITSM system
    baseUrl: {
      type: String,
      required: true,
      trim: true
    },
    // Authentication details
    auth: {
      type: {
        type: String,
        enum: ['basic', 'oauth', 'apikey', 'other'],
        default: 'basic'
      },
      // Encrypted credentials (in real application these would be encrypted)
      credentials: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      }
    },
    // Additional configuration
    options: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  // Enabled endpoints for this integration
  endpoints: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    path: {
      type: String,
      required: true,
      trim: true
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      default: 'GET'
    },
    enabled: {
      type: Boolean,
      default: true
    },
    // Mapping for request transformation
    requestMapping: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Mapping for response transformation
    responseMapping: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  // Is this integration active?
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // Health status
  health: {
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'unhealthy', 'unknown'],
      default: 'unknown'
    },
    lastChecked: {
      type: Date
    },
    message: {
      type: String
    }
  },
  // User who created this integration
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Users allowed to manage this integration
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Methods
integrationSchema.methods.checkHealth = async function() {
  // This would implement actual health checking logic
  // For now just update the timestamp
  this.health.lastChecked = new Date();
  return this.save();
};

integrationSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

integrationSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Static methods
integrationSchema.statics.findActiveByType = function(type) {
  return this.find({ type, isActive: true });
};

const Integration = mongoose.model('Integration', integrationSchema);

module.exports = Integration; 