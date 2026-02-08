const jwt = require('jsonwebtoken')
const config = require('../config')
const db = require('../utils/dbAdapter')

// Verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  const token = authHeader.split(' ')[1]
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' })
    }
    return res.status(401).json({ error: 'Invalid token.' })
  }
}

// Check if user is admin
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' })
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required.' })
  }
  
  // Verify admin still exists
  const admin = await db.admins.findById(req.user.id)
  if (!admin) {
    return res.status(403).json({ error: 'Admin account not found.' })
  }
  
  next()
}

// Optional auth - doesn't fail if no token, just sets req.user if valid
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, config.jwtSecret)
      req.user = decoded
    } catch (error) {
      // Token invalid, but that's okay for optional auth
      req.user = null
    }
  }
  
  next()
}

// Rate limiting middleware (simple in-memory)
const rateLimitStore = new Map()

const rateLimit = (options = {}) => {
  const { windowMs = 60000, max = 100 } = options
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress
    const now = Date.now()
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      return next()
    }
    
    const record = rateLimitStore.get(key)
    
    if (now > record.resetTime) {
      record.count = 1
      record.resetTime = now + windowMs
      return next()
    }
    
    if (record.count >= max) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      })
    }
    
    record.count++
    next()
  }
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`)
  })
  
  next()
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)
  
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message })
  }
  
  if (err.type === 'notfound') {
    return res.status(404).json({ error: err.message })
  }
  
  res.status(500).json({ error: 'Internal server error' })
}

module.exports = {
  verifyToken,
  requireAdmin,
  optionalAuth,
  rateLimit,
  requestLogger,
  errorHandler
}