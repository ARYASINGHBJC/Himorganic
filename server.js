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
const helmet = require('helmet')
const path = require('path')
const fs = require('fs')

// ---------------------------------------------------------------------------
// Startup Env Guard – fail fast on missing critical config
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  const required = ['JWT_SECRET', 'MONGODB_URI']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }

  // Warn if SMS is not configured (OTP login will fall back to console-only logging)
  if (!process.env.SMS_PROVIDER) {
    console.warn('[WARN] SMS_PROVIDER is not set. Phone/OTP login will not send real SMS messages.')
    console.warn('[WARN] Set SMS_PROVIDER=twilio or SMS_PROVIDER=msg91 and provide credentials.')
  }
}

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
const { requestLogger, errorHandler, verifyToken, requireAdmin } = require('./src/middleware/auth')

// Initialize Express app
const app = express()

// ===========================================
// MIDDLEWARE SETUP
// ===========================================

// Security headers (Helmet must come first)
app.use(
  helmet({
    // Allow inline styles/scripts needed by the React SPA
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for Three.js
  })
)

// Enable CORS – restrict origins explicitly
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests and configured origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin '${origin}' not permitted`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// ===========================================
// FILE UPLOAD (Product Images)
// ===========================================

const multer = require('multer')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true)
    cb(new Error('Only image files are allowed'))
  },
})

// POST /api/upload/product-image  – admin-only image upload
app.post(
  '/api/upload/product-image',
  verifyToken,
  requireAdmin,
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }
    const imageUrl = `/uploads/${req.file.filename}`
    res.json({ url: imageUrl, filename: req.file.filename })
  }
)

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