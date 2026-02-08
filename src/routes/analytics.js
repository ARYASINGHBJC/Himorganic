const { Router } = require('express')
const router = Router()
const { getDashboardStats, getSalesAnalytics, getCustomerAnalytics, getEventLogs } = require('../controllers/analyticsController')
const { verifyToken, requireAdmin } = require('../middleware/auth')

// All analytics routes require admin
router.use(verifyToken, requireAdmin)

router.get('/dashboard', getDashboardStats)
router.get('/sales', getSalesAnalytics)
router.get('/customers', getCustomerAnalytics)
router.get('/events', getEventLogs)

module.exports = router