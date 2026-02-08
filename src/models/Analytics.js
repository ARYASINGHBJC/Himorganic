const mongoose = require('mongoose')

const analyticsSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  ip: String,
  userAgent: String,
  sessionId: String
}, {
  timestamps: true
})

// Indexes for efficient querying
analyticsSchema.index({ event: 1, createdAt: -1 })
analyticsSchema.index({ createdAt: -1 })
analyticsSchema.index({ userId: 1 })

// TTL index - auto-delete after 90 days (optional)
// analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

module.exports = mongoose.model('Analytics', analyticsSchema)