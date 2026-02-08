const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: ['products', 'orders', 'users', 'analytics', 'settings']
  }],
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for faster queries
adminSchema.index({ email: 1 })

// Remove password from JSON output
adminSchema.methods.toJSON = function() {
  const admin = this.toObject()
  delete admin.password
  return admin
}

module.exports = mongoose.model('Admin', adminSchema)