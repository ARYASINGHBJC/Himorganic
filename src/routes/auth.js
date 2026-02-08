const { Router } = require('express')
const router = Router()
const { register, login, adminLogin, refreshToken, logout, getProfile, updateProfile } = require('../controllers/authController')
const { verifyToken, rateLimit } = require('../middleware/auth')

// Rate limit for auth routes (prevent brute force)
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })

// Public routes
router.post('/register', authRateLimit, register)
router.post('/login', authRateLimit, login)
router.post('/admin/login', authRateLimit, adminLogin)
router.post('/refresh-token', refreshToken)
router.post('/logout', logout)

// Protected routes
router.get('/profile', verifyToken, getProfile)
router.put('/profile', verifyToken, updateProfile)

module.exports = router