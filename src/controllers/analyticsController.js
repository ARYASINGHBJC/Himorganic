const db = require('../utils/dbAdapter')

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const allOrders = await db.orders.findMany()
    const allProducts = await db.products.findMany()
    const allUsers = await db.users.findMany()
    
    // Calculate revenue
    const totalRevenue = allOrders
      .filter(o => o.paymentStatus === 'paid' || o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0)
    
    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today)
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    
    // This week's stats
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - 7)
    
    const weekOrders = allOrders.filter(o => new Date(o.createdAt) >= weekStart)
    const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    
    // This month's stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart)
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    
    // Order status breakdown
    const ordersByStatus = {
      pending: allOrders.filter(o => o.status === 'pending').length,
      confirmed: allOrders.filter(o => o.status === 'confirmed').length,
      processing: allOrders.filter(o => o.status === 'processing').length,
      shipped: allOrders.filter(o => o.status === 'shipped').length,
      delivered: allOrders.filter(o => o.status === 'delivered').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length
    }
    
    // Low stock products
    const lowStockProducts = allProducts.filter(p => p.stock < 10)
    
    // Top selling products
    const productSales = {}
    allOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const productId = item.product || item.productId
        productSales[productId] = (productSales[productId] || 0) + item.quantity
      })
    })
    
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const product = allProducts.find(p => (p._id || p.id) == productId)
        return {
          id: productId,
          name: product?.name || 'Unknown',
          image: product?.image,
          sold: quantity
        }
      })
    
    res.json({
      overview: {
        totalOrders: allOrders.length,
        totalProducts: allProducts.length,
        totalCustomers: allUsers.length,
        totalRevenue
      },
      today: {
        orders: todayOrders.length,
        revenue: todayRevenue
      },
      week: {
        orders: weekOrders.length,
        revenue: weekRevenue
      },
      month: {
        orders: monthOrders.length,
        revenue: monthRevenue
      },
      ordersByStatus,
      lowStockProducts: lowStockProducts.slice(0, 5),
      topProducts,
      recentOrders: allOrders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to get dashboard stats' })
  }
}

// Get sales analytics
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query
    
    const allOrders = await db.orders.findMany()
    const allProducts = await db.products.findMany()
    
    // Determine date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 30)
    }
    
    // Filter orders in date range
    const periodOrders = allOrders.filter(o => {
      const orderDate = new Date(o.createdAt)
      return orderDate >= startDate && orderDate <= endDate
    })
    
    // Group by date
    const salesByDate = {}
    periodOrders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      if (!salesByDate[date]) {
        salesByDate[date] = { orders: 0, revenue: 0 }
      }
      salesByDate[date].orders++
      salesByDate[date].revenue += order.total || 0
    })
    
    // Convert to array and sort
    const chartData = Object.entries(salesByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    
    // Category breakdown
    const categoryRevenue = {}
    periodOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const productId = item.product || item.productId
        const product = allProducts.find(p => (p._id || p.id) == productId)
        const category = product?.category || 'Other'
        categoryRevenue[category] = (categoryRevenue[category] || 0) + item.subtotal
      })
    })
    
    res.json({
      period,
      summary: {
        totalOrders: periodOrders.length,
        totalRevenue: periodOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        averageOrderValue: periodOrders.length > 0 
          ? periodOrders.reduce((sum, o) => sum + (o.total || 0), 0) / periodOrders.length 
          : 0
      },
      chartData,
      categoryBreakdown: Object.entries(categoryRevenue)
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
    })
  } catch (error) {
    console.error('Get sales analytics error:', error)
    res.status(500).json({ error: 'Failed to get sales analytics' })
  }
}

// Get customer analytics
const getCustomerAnalytics = async (req, res) => {
  try {
    const allUsers = await db.users.findMany()
    const allOrders = await db.orders.findMany()
    
    // New customers this month
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const newCustomers = allUsers.filter(u => new Date(u.createdAt) >= monthStart)
    
    // Customer with most orders
    const customerOrders = {}
    allOrders.forEach(order => {
      const userId = order.user || order.userId
      if (userId) {
        customerOrders[userId] = (customerOrders[userId] || 0) + 1
      }
    })
    
    const topCustomers = Object.entries(customerOrders)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, orderCount]) => {
        const user = allUsers.find(u => (u._id || u.id) == userId)
        const userOrders = allOrders.filter(o => (o.user || o.userId) == userId)
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0)
        return {
          id: userId,
          name: user?.name || 'Unknown',
          email: user?.email,
          orders: orderCount,
          totalSpent
        }
      })
    
    res.json({
      totalCustomers: allUsers.length,
      newCustomersThisMonth: newCustomers.length,
      topCustomers,
      registrationsByMonth: getMonthlyRegistrations(allUsers)
    })
  } catch (error) {
    console.error('Get customer analytics error:', error)
    res.status(500).json({ error: 'Failed to get customer analytics' })
  }
}

// Helper to get monthly registrations
const getMonthlyRegistrations = (users) => {
  const months = {}
  users.forEach(user => {
    if (user.createdAt) {
      const date = new Date(user.createdAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months[month] = (months[month] || 0) + 1
    }
  })
  return Object.entries(months)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
}

// Get event logs (from analytics)
const getEventLogs = async (req, res) => {
  try {
    const { event, limit = 100 } = req.query
    
    const query = event ? { event } : {}
    const options = {
      sort: { createdAt: -1 },
      limit: parseInt(limit)
    }
    
    const logs = await db.analytics.findMany(query, options)
    
    res.json(logs)
  } catch (error) {
    console.error('Get event logs error:', error)
    res.status(500).json({ error: 'Failed to get event logs' })
  }
}

module.exports = {
  getDashboardStats,
  getSalesAnalytics,
  getCustomerAnalytics,
  getEventLogs
}