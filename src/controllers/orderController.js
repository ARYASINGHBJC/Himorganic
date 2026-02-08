const { v4: uuidv4 } = require('uuid')
const db = require('../utils/dbAdapter')

// Create order
const createOrder = async (req, res) => {
  try {
    const { items, customer, paymentMethod } = req.body
    
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order items are required' })
    }
    
    if (!customer || !customer.name || !customer.email || !customer.address) {
      return res.status(400).json({ error: 'Customer details are required' })
    }
    
    // Calculate total and validate items
    let total = 0
    const orderItems = []
    
    for (const item of items) {
      const product = await db.products.findById(item.productId)
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` })
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` })
      }
      
      const itemTotal = product.price * item.quantity
      total += itemTotal
      
      orderItems.push({
        product: product._id || product.id,
        productId: product._id || product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
        subtotal: itemTotal
      })
      
      // Update stock
      await db.products.updateById(product._id || product.id, { 
        stock: product.stock - item.quantity 
      })
    }
    
    // Calculate shipping
    const shipping = total > 500 ? 0 : 50
    const grandTotal = total + shipping
    
    const newOrder = await db.orders.create({
      id: uuidv4(),
      orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
      user: req.user?.id || null,
      items: orderItems,
      customer,
      paymentMethod: paymentMethod || 'cod',
      subtotal: total,
      shipping,
      total: grandTotal,
      status: 'pending',
      paymentStatus: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed'
      }]
    })
    
    // Track analytics
    trackAnalytics('order_created', {
      orderId: newOrder._id || newOrder.id,
      total: grandTotal,
      itemCount: orderItems.length,
      userId: req.user?.id
    })
    
    // Update user orders if logged in
    if (req.user?.id) {
      const user = await db.users.findById(req.user.id)
      if (user) {
        const userOrders = user.orders || []
        await db.users.updateById(req.user.id, { 
          orders: [...userOrders, newOrder._id || newOrder.id] 
        })
      }
    }
    
    res.status(201).json(newOrder)
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
}

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userOrders = await db.orders.findMany(
      { user: req.user.id },
      { sort: { createdAt: -1 } }
    )
    
    res.json(userOrders)
  } catch (error) {
    console.error('Get user orders error:', error)
    res.status(500).json({ error: 'Failed to get orders' })
  }
}

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params
    const order = await db.orders.findById(id)
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    // Check if user owns the order or is admin
    const orderUserId = order.user?._id || order.user || order.userId
    if (!req.user.isAdmin && orderUserId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Failed to get order' })
  }
}

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const { status, from, to, limit = 50, offset = 0 } = req.query
    
    // Build query
    const query = {}
    
    if (status) {
      query.status = status
    }
    
    if (db.isUsingMongoDB()) {
      if (from || to) {
        query.createdAt = {}
        if (from) query.createdAt.$gte = new Date(from)
        if (to) query.createdAt.$lte = new Date(to)
      }
    }
    
    const options = {
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: parseInt(offset)
    }
    
    let allOrders = await db.orders.findMany(query, options)
    
    // Apply date filters for JSON storage
    if (!db.isUsingMongoDB()) {
      if (from) {
        allOrders = allOrders.filter(o => new Date(o.createdAt) >= new Date(from))
      }
      if (to) {
        allOrders = allOrders.filter(o => new Date(o.createdAt) <= new Date(to))
      }
    }
    
    const total = await db.orders.count(query)
    
    res.json({
      orders: allOrders,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
  } catch (error) {
    console.error('Get all orders error:', error)
    res.status(500).json({ error: 'Failed to get orders' })
  }
}

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, paymentStatus } = req.body
    
    const order = await db.orders.findById(id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded']
    
    const updates = {}
    
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' })
      }
      updates.status = status
      
      // Add to status history
      const statusHistory = order.statusHistory || []
      statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy: req.user.id
      })
      updates.statusHistory = statusHistory
    }
    
    if (paymentStatus) {
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' })
      }
      updates.paymentStatus = paymentStatus
      
      if (paymentStatus === 'paid') {
        updates['paymentDetails.paidAt'] = new Date()
      }
    }
    
    const updatedOrder = await db.orders.updateById(id, updates)
    
    // Track analytics
    trackAnalytics('order_status_updated', {
      orderId: id,
      oldStatus: order.status,
      newStatus: status || order.status,
      adminId: req.user.id
    })
    
    res.json(updatedOrder)
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
}

// Helper function to track analytics
const trackAnalytics = async (event, data = {}) => {
  try {
    await db.analytics.create({
      id: uuidv4(),
      event,
      data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Analytics tracking error:', error)
  }
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus
}