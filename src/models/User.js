const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,   // Allows null/undefined for phone-only accounts
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,   // Allows null/undefined for email-only accounts
    trim: true,
    index: true,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  addresses: [{
    label: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: Boolean,
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

// Indexes (sparse unique fields already have implicit indexes via the schema)
userSchema.index({ createdAt: -1 })

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  return user
}

module.exports = mongoose.model('User', userSchema)