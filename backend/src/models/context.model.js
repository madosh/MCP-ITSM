const mongoose = require('mongoose');
const config = require('../config/config');

const contextSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  // Source system that created this context (ITSM tool, etc)
  source: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // External ID (e.g., ITSM ticket ID, conversation ID)
  externalId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  // Content type (e.g., 'ticket', 'conversation', 'knowledge_article')
  contentType: {
    type: String,
    required: true,
    enum: ['ticket', 'conversation', 'knowledge_article', 'process', 'other'],
    default: 'other',
    index: true
  },
  // The actual context data
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Metadata for the context
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // TTL for this context in seconds (0 means no expiration)
  ttl: {
    type: Number,
    default: config.context.defaultTTL,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: props => `${props.value} is not a valid TTL!`
    }
  },
  // When this context expires
  expiresAt: {
    type: Date,
    default: function() {
      if (this.ttl === 0) return null;
      return new Date(Date.now() + this.ttl * 1000);
    },
    index: true
  },
  // Size of the context data in bytes
  size: {
    type: Number,
    default: function() {
      // Approximate size calculation based on JSON stringification
      return Buffer.byteLength(JSON.stringify(this.data));
    },
    validate: {
      validator: function(v) {
        return v <= config.context.maxSize;
      },
      message: props => `Context size (${props.value} bytes) exceeds maximum allowed size (${config.context.maxSize} bytes)!`
    }
  },
  // Owner user ID
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Access control
  accessControl: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowedRoles: [{
      type: String,
      enum: ['admin', 'user', 'integrator']
    }]
  },
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  // Status (active, archived, etc)
  status: {
    type: String,
    enum: ['active', 'archived', 'pending'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
contextSchema.index({ source: 1, externalId: 1 });
contextSchema.index({ owner: 1, status: 1 });
contextSchema.index({ contentType: 1, status: 1 });

// Add TTL index for auto-expiration if MongoDB supports it
contextSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true, $ne: null } } });

// Methods
contextSchema.methods.updateVersion = function() {
  this.version += 1;
  return this.save();
};

contextSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

contextSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

// Static methods
contextSchema.statics.findByExternalId = function(source, externalId) {
  return this.findOne({ source, externalId, status: 'active' });
};

contextSchema.statics.findActiveByOwner = function(ownerId) {
  return this.find({ owner: ownerId, status: 'active' });
};

const Context = mongoose.model('Context', contextSchema);

module.exports = Context; 