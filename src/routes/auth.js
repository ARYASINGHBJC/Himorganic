const { Router } = require('express')
const router = Router()
const {
  register,
  login,
  adminLogin,
  sendOTP,
  verifyOTP,
  refreshToken,
  logout,
  getProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateProfile,
} = require('../controllers/authController')
const { verifyToken, rateLimit } = require('../middleware/auth')

// Strict rate limiter for auth endpoints (brute-force protection)
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })

// More permissive limit for OTP sends (1 per 60 s is enforced at controller level)
const otpRateLimit = rateLimit({ windowMs: 60 * 1000, max: 5 })

// Public routes – Email / Password
router.post('/register', authRateLimit, register)
router.post('/login', authRateLimit, login)
router.post('/admin/login', authRateLimit, adminLogin)
router.post('/refresh-token', refreshToken)
router.post('/logout', logout)

// Public routes – Phone / OTP
router.post('/send-otp', otpRateLimit, sendOTP)
router.post('/verify-otp', authRateLimit, verifyOTP)

// Protected routes
router.get('/profile', verifyToken, getProfile)
router.put('/profile', verifyToken, updateProfile)
router.get('/wishlist', verifyToken, getWishlist)
router.post('/wishlist/:productId', verifyToken, addToWishlist)
router.delete('/wishlist/:productId', verifyToken, removeFromWishlist)

module.exports = router