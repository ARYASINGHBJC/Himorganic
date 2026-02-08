const User = require('./User')
const Admin = require('./Admin')
const Product = require('./Product')
const Order = require('./Order')
const Analytics = require('./Analytics')
const Session = require('./Session')

module.exports = {
  User,
  Admin,
  Product,
  Order,
  Analytics,
  Session
}
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'
  },
  images: [String], // Additional images
  category: {
    type: String,
    default: 'General'
  },
  tags: [String],
  stock: {
    type: Number,
    default: 100,
    min: 0
  },
  unit: {
    type: String,
    default: 'piece' // kg, g, piece, pack, etc.
  },
  weight: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
})

// Indexes
productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1 })
productSchema.index({ price: 1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ isActive: 1, isFeatured: 1 })

module.exports = mongoose.model('Product', productSchema)