const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const https = require('https')
const twilio = require('twilio')
const { v4: uuidv4 } = require('uuid')
const config = require('../config')
const db = require('../utils/dbAdapter')
const otpStore = require('../utils/otpStore')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise a phone number to E.164-ish format (digits only, leading +91 stripped) */
const normalisePhone = (raw) => {
  const digits = String(raw).replace(/\D/g, '')
  // Accept 10-digit Indian numbers OR numbers that already include country code
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (digits.length === 13 && digits.startsWith('91')) return `+${digits.slice(1)}`
  return `+${digits}` // best-effort
}

/** Deliver an OTP via the configured SMS provider. */
const dispatchOTP = async (phone, otp) => {
  const message = `Your HimOrganic OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`

  if (process.env.NODE_ENV !== 'production') {
    // Development: print to console – visible in server terminal
    console.log(`\n📱 [DEV OTP] Phone: ${phone}  →  OTP: ${otp}  (valid 10 min)\n`)
    return
  }

  const provider = config.sms.provider

  if (provider === 'twilio') {
    const { accountSid, authToken, fromNumber } = config.sms.twilio
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials are not fully configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)')
    }
    const client = twilio(accountSid, authToken)
    await client.messages.create({ to: phone, from: fromNumber, body: message })
    return
  }

  if (provider === 'msg91') {
    const { apiKey, templateId, senderId } = config.sms.msg91
    if (!apiKey || !templateId) {
      throw new Error('MSG91 credentials are not fully configured (MSG91_API_KEY, MSG91_TEMPLATE_ID)')
    }
    const payload = JSON.stringify({
      template_id: templateId,
      short_url: '0',
      mobile: phone.replace(/[^\d]/g, ''),  // MSG91 expects digits only
      authkey: apiKey,
      sender: senderId,
      otp,
    })
    await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'control.msg91.com',
          path: '/api/v5/otp',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        },
        (res) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              if (parsed.type === 'success') return resolve(parsed)
              reject(new Error(`MSG91 error: ${parsed.message || body}`))
            } catch {
              reject(new Error(`MSG91 unexpected response: ${body}`))
            }
          })
        }
      )
      req.on('error', reject)
      req.write(payload)
      req.end()
    })
    return
  }

  // No provider configured – log a warning so it's easy to diagnose
  console.warn(`[OTP] SMS_PROVIDER not configured. OTP for ${phone}: ${otp}`)
}

/**
 * Generate access + refresh tokens and persist the session.
 * FIX: Returns `token` (alias for accessToken) so the frontend AuthResponse type works.
 */
const generateTokens = async (user, isAdmin = false) => {
  const payload = {
    id: user._id || user.id,
    email: user.email || null,
    phone: user.phone || null,
    name: user.name,
    isAdmin,
  }

  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry })
  const refreshToken = jwt.sign(
    { id: user._id || user.id, isAdmin },
    config.jwtSecret,
    { expiresIn: config.refreshTokenExpiry }
  )

  // Persist session
  await db.sessions.create({
    id: uuidv4(),
    userId: user._id || user.id,
    userType: isAdmin ? 'Admin' : 'User',
    refreshToken,
    isAdmin,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  // `token` is the canonical field the frontend AuthResponse interface expects.
  // `accessToken` is kept for any legacy consumers.
  return { token: accessToken, accessToken, refreshToken }
}

/** Strip sensitive fields from a user/admin object before sending to client */
const sanitiseUser = (user) => {
  const obj = user.toJSON ? user.toJSON() : { ...user }
  delete obj.password
  delete obj.otpCode
  delete obj.otpExpiry
  return obj
}

// ---------------------------------------------------------------------------
// Email / Password Auth
// ---------------------------------------------------------------------------

// User Registration
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Check if user exists
    const existingUser = await db.users.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds)

    const newUser = await db.users.create({
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone ? normalisePhone(phone) : undefined,
      isPhoneVerified: false,
      orders: [],
      wishlist: [],
    })

    const tokens = await generateTokens(newUser, false)

    res.status(201).json({
      message: 'Registration successful',
      user: sanitiseUser(newUser),
      ...tokens,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
}

// User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await db.users.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Constant-time response to prevent user enumeration
      await bcrypt.compare(password, '$2b$10$invalidhashpadding000000000000000000000000000000000000000')
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Update last login
    await db.users.updateById(user._id || user.id, { lastLogin: new Date() })

    const tokens = await generateTokens(user, false)

    res.json({
      message: 'Login successful',
      user: sanitiseUser(user),
      ...tokens,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const admin = await db.admins.findOne({ email: email.toLowerCase() })
    if (!admin) {
      // Constant-time padding – prevents user enumeration
      await bcrypt.compare(password, '$2b$10$invalidhashpadding000000000000000000000000000000000000000')
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Only bcrypt hashes are accepted – plain-text passwords are no longer supported.
    // If the stored hash doesn't start with $2b/$2a, it's an unhashed legacy entry.
    if (!admin.password.startsWith('$2')) {
      console.error(`[SECURITY] Admin ${admin.email} has a plain-text password. Force-reset required.`)
      return res.status(403).json({
        error: 'Account requires a password reset. Contact the super-admin.',
      })
    }

    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    await db.admins.updateById(admin._id || admin.id, { lastLogin: new Date() })

    const tokens = await generateTokens(admin, true)

    res.json({
      message: 'Admin login successful',
      user: { ...sanitiseUser(admin), isAdmin: true },
      ...tokens,
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

// ---------------------------------------------------------------------------
// Phone / OTP Auth
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/send-otp
 * Body: { phone }
 *
 * Sends a 6-digit OTP to the supplied phone number.
 * Creates a stub user record if this is the first time the phone is seen
 * (phone-first registration flow).
 */
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    // Basic digit-count validation
    const digits = String(phone).replace(/\D/g, '')
    if (digits.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }

    const normalisedPhone = normalisePhone(phone)

    // Resend throttle: 60-second cooldown between OTPs
    if (otpStore.hasPendingOTP(normalisedPhone)) {
      const ttl = otpStore.remainingTTL(normalisedPhone)
      if (ttl > (10 * 60 - 60)) {
        return res.status(429).json({
          error: `Please wait before requesting another OTP`,
          retryAfterSeconds: ttl - (10 * 60 - 60),
        })
      }
    }

    const otp = otpStore.generateOTP()
    otpStore.setOTP(normalisedPhone, otp)

    await dispatchOTP(normalisedPhone, otp)

    res.json({
      message: 'OTP sent successfully',
      phone: normalisedPhone,
      // In development, expose the OTP in the response so the UI can fill it automatically
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    res.status(500).json({ error: 'Failed to send OTP' })
  }
}

/**
 * POST /api/auth/verify-otp
 * Body: { phone, otp, name? }
 *
 * Verifies the OTP and returns auth tokens.
 * If the phone is new, a user record is created (name is optional but welcome).
 */
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, name } = req.body

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' })
    }

    const normalisedPhone = normalisePhone(phone)
    const result = otpStore.verifyOTP(normalisedPhone, String(otp).trim())

    switch (result) {
      case 'expired':
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
      case 'invalid':
        return res.status(400).json({ error: 'Invalid OTP. Please try again.' })
      case 'too_many':
        return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' })
      case 'not_found':
        return res.status(400).json({ error: 'No OTP found for this number. Please request one.' })
      case 'ok':
        break
      default:
        return res.status(500).json({ error: 'OTP verification failed' })
    }

    // Look up or create user
    let user = await db.users.findOne({ phone: normalisedPhone })
    let isNewUser = false

    if (!user) {
      isNewUser = true
      user = await db.users.create({
        id: uuidv4(),
        name: (name || '').trim() || `User_${normalisedPhone.slice(-4)}`,
        phone: normalisedPhone,
        isPhoneVerified: true,
        orders: [],
        wishlist: [],
        // No email / password for phone-only accounts
      })
    } else {
      // Mark phone as verified
      await db.users.updateById(user._id || user.id, {
        isPhoneVerified: true,
        lastLogin: new Date(),
      })
    }

    const tokens = await generateTokens(user, false)

    res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      isNewUser,
      user: sanitiseUser(user),
      ...tokens,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ error: 'OTP verification failed' })
  }
}

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body
    
    if (!token) {
      return res.status(400).json({ error: 'Refresh token required' })
    }
    
    // Verify refresh token
    const decoded = jwt.verify(token, config.jwtSecret)
    
    // Check if session exists
    const session = await db.sessions.findOne({ refreshToken: token, userId: decoded.id })
    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }
    
    // Get user
    const user = decoded.isAdmin 
      ? await db.admins.findById(decoded.id)
      : await db.users.findById(decoded.id)
      
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    // Delete old session
    await db.sessions.deleteById(session._id || session.id)
    
    // Generate new tokens
    const tokens = await generateTokens(user, decoded.isAdmin)
    
    res.json(tokens)
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body
    
    if (token) {
      await db.sessions.deleteOne({ refreshToken: token })
    }
    
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
}

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user.isAdmin
      ? await db.admins.findById(req.user.id)
      : await db.users.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: { ...sanitiseUser(user), isAdmin: req.user.isAdmin } })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
}

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body

    const user = req.user.isAdmin
      ? await db.admins.findById(req.user.id)
      : await db.users.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updates = {}

    if (name) updates.name = name.trim()

    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' })
      }
      const dbCollection = req.user.isAdmin ? db.admins : db.users
      const existing = await dbCollection.findOne({ email: email.toLowerCase() })
      if (existing && (existing._id || existing.id) !== (user._id || user.id)) {
        return res.status(400).json({ error: 'Email already in use' })
      }
      updates.email = email.toLowerCase().trim()
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' })
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' })
      }

      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' })
      }

      updates.password = await bcrypt.hash(newPassword, config.bcryptRounds)
    }

    const dbCollection = req.user.isAdmin ? db.admins : db.users
    const updatedUser = await dbCollection.updateById(user._id || user.id, updates)

    res.json({ user: sanitiseUser(updatedUser) })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  sendOTP,
  verifyOTP,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
}