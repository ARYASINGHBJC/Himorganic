/**
 * HimOrganic E-Commerce Server
 * 
 * A robust, maintainable Express.js server for the HimOrganic D2C platform.
 * 
 * Structure:
 * - src/config/       - Configuration settings
 * - src/middleware/   - Express middleware (auth, logging, etc.)
 * - src/controllers/  - Business logic handlers
 * - src/routes/       - API route definitions
 * - src/utils/        - Utilities (database, helpers)
 * - data/             - JSON file storage
 * - uploads/          - User uploaded images
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// Import configuration
const config = require('./src/config')

// Import routes
const { 
  authRoutes, 
  productRoutes, 
  orderRoutes, 
  analyticsRoutes 
} = require('./src/routes')

// Import middleware
const { requestLogger, errorHandler } = require('./src/middleware/auth')

// Initialize Express app
const app = express()

// ===========================================
// MIDDLEWARE SETUP
// ===========================================

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }))

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use(requestLogger)

// ===========================================
// STATIC FILE SERVING WITH CACHING
// ===========================================

// Ensure directories exist
const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

ensureDirectory(config.dataDir)
ensureDirectory(config.uploadsDir)

// Serve uploaded images with aggressive caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: config.staticCacheMaxAge * 1000, // 1 year cache
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set cache headers for images
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      res.setHeader('Cache-Control', `public, max-age=${config.staticCacheMaxAge}, immutable`)
    }
  }
}))

// NOTE: Legacy public folder disabled - use React frontend instead
// To use old UI, uncomment the line below:
// app.use(express.static(path.join(__dirname, 'public')))

// ===========================================
// API ROUTES
// ===========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  })
})

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/analytics', analyticsRoutes)

// ===========================================
// LEGACY ROUTE COMPATIBILITY
// ===========================================
// These maintain backwards compatibility with the old API

// Legacy product routes
app.get('/api/products', (req, res, next) => {
  req.url = '/'
  productRoutes(req, res, next)
})

// ===========================================
// CLIENT APP SERVING (SPA)
// ===========================================

// Serve React app in production
const clientBuildPath = path.join(__dirname, 'client', 'dist')
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath))
  
  // Handle SPA routing - return index.html for all non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next()
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'))
  })
} else {
  // Development mode - show helpful message
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HimOrganic - Development</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; background: #f0fdf4; }
            h1 { color: #16a34a; }
            a { color: #22c55e; }
            code { background: #dcfce7; padding: 2px 8px; border-radius: 4px; }
            .box { background: white; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>🌿 HimOrganic API Server</h1>
          <div class="box">
            <p><strong>API is running!</strong></p>
            <p>For the React frontend, run:</p>
            <code>cd client && npm run dev</code>
            <p style="margin-top: 15px;">Then visit: <a href="http://localhost:5173">http://localhost:5173</a></p>
          </div>
          <div class="box">
            <p><strong>Or build for production:</strong></p>
            <code>cd client && npm run build</code>
            <p style="margin-top: 15px;">Then restart the server to serve the built app.</p>
          </div>
          <p>API Health: <a href="/api/health">/api/health</a></p>
        </body>
      </html>
    `)
  })
}

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler for API routes (must be after all API routes)
app.all('/api/:rest', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// Global error handler
app.use(errorHandler)

// ===========================================
// SERVER STARTUP
// ===========================================

const startServer = async () => {
  try {
    // Connect to MongoDB if configured
    if (config.database.type === 'mongodb') {
      const { connectMongoDB } = require('./src/utils/mongoConnection')
      await connectMongoDB()
    } else {
      console.log('📁 Using JSON file storage (set DB_TYPE=mongodb for MongoDB)')
    }
    
    // Initialize default admin if needed
    await initializeDefaultAdmin()
    
    // Start listening
    app.listen(config.port, () => {
      console.log('')
      console.log('🌿 ═══════════════════════════════════════════')
      console.log('🌿   HimOrganic Server v2.0.0')
      console.log('🌿 ═══════════════════════════════════════════')
      console.log(`🌿   Server:     http://localhost:${config.port}`)
      console.log(`🌿   API:        http://localhost:${config.port}/api`)
      console.log(`🌿   Health:     http://localhost:${config.port}/api/health`)
      console.log(`🌿   Database:   ${config.database.type.toUpperCase()}`)
      console.log('🌿 ═══════════════════════════════════════════')
      console.log('')
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Initialize default admin account
const initializeDefaultAdmin = async () => {
  const bcrypt = require('bcryptjs')
  const { v4: uuidv4 } = require('uuid')
  const db = require('./src/utils/dbAdapter')
  
  const existingAdmins = await db.admins.findMany()
  
  if (existingAdmins.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', config.bcryptRounds)
    
    await db.admins.create({
      id: uuidv4(),
      name: 'Admin',
      email: 'admin@himorganic.com',
      password: hashedPassword,
      role: 'super_admin',
      permissions: ['products', 'orders', 'users', 'analytics', 'settings']
    })
    
    console.log('📋 Default admin created: admin@himorganic.com / admin123')
  }
}

// Start the server
startServer()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  if (config.database.type === 'mongodb') {
    const { disconnectMongoDB } = require('./src/utils/mongoConnection')
    await disconnectMongoDB()
  }
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...')
  if (config.database.type === 'mongodb') {
    const { disconnectMongoDB } = require('./src/utils/mongoConnection')
    await disconnectMongoDB()
  }
  process.exit(0)
})

module.exports = app