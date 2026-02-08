const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const config = require('../config')
const db = require('../utils/dbAdapter')

// Generate tokens
const generateTokens = async (user, isAdmin = false) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    name: user.name,
    isAdmin
  }
  
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry })
  const refreshToken = jwt.sign({ id: user._id || user.id, isAdmin }, config.jwtSecret, { expiresIn: config.refreshTokenExpiry })
  
  // Store refresh token
  await db.sessions.create({
    id: uuidv4(),
    userId: user._id || user.id,
    userType: isAdmin ? 'Admin' : 'User',
    refreshToken,
    isAdmin,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  })
  
  return { accessToken, refreshToken }
}

// User Registration
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    
    // Check if user exists
    const existingUser = await db.users.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds)
    
    const newUser = await db.users.create({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      orders: [],
      wishlist: []
    })
    
    const tokens = await generateTokens(newUser, false)
    
    // Prepare user response (remove password)
    const userResponse = { ...newUser.toJSON ? newUser.toJSON() : newUser }
    delete userResponse.password
    
    res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
      ...tokens
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
    
    const user = await db.users.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    
    // Update last login
    await db.users.updateById(user._id || user.id, { lastLogin: new Date() })
    
    const tokens = await generateTokens(user, false)
    
    // Prepare user response (remove password)
    const userResponse = { ...user.toJSON ? user.toJSON() : user }
    delete userResponse.password
    
    res.json({
      message: 'Login successful',
      user: userResponse,
      ...tokens
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
    
    const admin = await db.admins.findOne({ email })
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Check if password is hashed or plain text (for migration)
    let isValidPassword = false
    if (admin.password.startsWith('$2')) {
      isValidPassword = await bcrypt.compare(password, admin.password)
    } else {
      // Plain text password - hash it for next time
      isValidPassword = admin.password === password
      if (isValidPassword) {
        const hashedPassword = await bcrypt.hash(password, config.bcryptRounds)
        await db.admins.updateById(admin._id || admin.id, { password: hashedPassword })
      }
    }
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    await db.admins.updateById(admin._id || admin.id, { lastLogin: new Date() })
    
    const tokens = await generateTokens(admin, true)
    
    // Prepare admin response (remove password)
    const adminResponse = { ...admin.toJSON ? admin.toJSON() : admin }
    delete adminResponse.password
    
    res.json({
      message: 'Admin login successful',
      user: { ...adminResponse, isAdmin: true },
      ...tokens
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ error: 'Login failed' })
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
    
    // Prepare response (remove password)
    const userResponse = { ...user.toJSON ? user.toJSON() : user }
    delete userResponse.password
    
    res.json({ user: { ...userResponse, isAdmin: req.user.isAdmin } })
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
    
    if (name) updates.name = name
    
    if (email && email !== user.email) {
      const dbCollection = req.user.isAdmin ? db.admins : db.users
      const existing = await dbCollection.findOne({ email })
      if (existing && (existing._id || existing.id) !== (user._id || user.id)) {
        return res.status(400).json({ error: 'Email already in use' })
      }
      updates.email = email
    }
    
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' })
      }
      
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' })
      }
      
      updates.password = await bcrypt.hash(newPassword, config.bcryptRounds)
    }
    
    const dbCollection = req.user.isAdmin ? db.admins : db.users
    const updatedUser = await dbCollection.updateById(user._id || user.id, updates)
    
    // Prepare response (remove password)
    const userResponse = { ...updatedUser.toJSON ? updatedUser.toJSON() : updatedUser }
    delete userResponse.password
    
    res.json({ user: userResponse })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  refreshToken,
  logout,
  getProfile,
  updateProfile
}