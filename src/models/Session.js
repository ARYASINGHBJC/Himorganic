const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    enum: ['User', 'Admin'],
    required: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  ip: String,
  userAgent: String,
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
})

// Index for faster lookup
sessionSchema.index({ refreshToken: 1 })
sessionSchema.index({ userId: 1 })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

module.exports = mongoose.model('Session', sessionSchema)