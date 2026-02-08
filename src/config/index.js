// Configuration settings
const config = {
  port: process.env.PORT || 3000,
  
  // Database
  database: {
    // Set to 'mongodb' to use MongoDB, 'json' for JSON files (dev)
    type: process.env.DB_TYPE || 'json',
    
    // MongoDB connection string
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/himorganic',
    
    // MongoDB options
    mongoOptions: {
      // useNewUrlParser and useUnifiedTopology are deprecated in newer mongoose
    }
  },
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'himorganic-secret-key-change-in-production',
  jwtExpiry: '7d',
  refreshTokenExpiry: '30d',
  
  // Security
  bcryptRounds: 10,
  
  // File paths (for JSON storage fallback)
  dataDir: './data',
  uploadsDir: './uploads',
  
  // Cache settings (in seconds)
  staticCacheMaxAge: 31536000, // 1 year for images
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  }
}

module.exports = config