const config = require('../config')

let mongoose = null
let isConnected = false

// Try to load mongoose (optional for dev)
try {
  mongoose = require('mongoose')
} catch (err) {
  // mongoose not installed
}

/**
 * Connect to MongoDB
 */
const connectMongoDB = async () => {
  if (!mongoose) {
    console.log('📁 Mongoose not installed - using JSON file storage')
    return null
  }
  
  if (isConnected) {
    console.log('📦 Using existing MongoDB connection')
    return
  }

  try {
    const conn = await mongoose.connect(config.database.mongoUri, config.database.mongoOptions)
    
    isConnected = true
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`)
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
      isConnected = false
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected')
      isConnected = true
    })
    
    return conn
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}

/**
 * Disconnect from MongoDB
 */
const disconnectMongoDB = async () => {
  if (!mongoose || !isConnected) return
  
  try {
    await mongoose.disconnect()
    isConnected = false
    console.log('MongoDB disconnected')
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error)
  }
}

/**
 * Check if using MongoDB
 */
const isUsingMongoDB = () => {
  return config.database.type === 'mongodb' && mongoose !== null
}

/**
 * Get connection status
 */
const getConnectionStatus = () => {
  return {
    isConnected,
    type: config.database.type,
    readyState: mongoose ? mongoose.connection.readyState : 0
  }
}

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  isUsingMongoDB,
  getConnectionStatus
}