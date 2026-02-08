const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/auth')

// Create order (optional auth - guests can order too)
router.post('/', optionalAuth, orderController.createOrder)

// User routes (requires auth)
router.get('/my-orders', verifyToken, orderController.getUserOrders)
router.get('/:id', verifyToken, orderController.getOrder)

// Admin routes
router.get('/', verifyToken, requireAdmin, orderController.getAllOrders)
router.patch('/:id/status', verifyToken, requireAdmin, orderController.updateOrderStatus)

module.exports = router