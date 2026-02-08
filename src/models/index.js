// Check if mongoose is available (for MongoDB mode)
let mongoose = null
let User = null
let Admin = null
let Product = null
let Order = null
let Analytics = null
let Session = null

try {
  mongoose = require('mongoose')
  User = require('./User')
  Admin = require('./Admin')
  Product = require('./Product')
  Order = require('./Order')
  Analytics = require('./Analytics')
  Session = require('./Session')
} catch (err) {
  // mongoose not installed - using JSON file storage
  console.log('📁 MongoDB models not available - using JSON file storage')
}

module.exports = {
  mongoose,
  User,
  Admin,
  Product,
  Order,
  Analytics,
  Session
}