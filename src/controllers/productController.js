const { v4: uuidv4 } = require('uuid')
const db = require('../utils/dbAdapter')

// Get all products (with optional filters)
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort } = req.query
    
    // Build query
    const query = {}
    
    if (category) {
      query.category = new RegExp(category, 'i') // Case-insensitive
    }
    
    // For MongoDB, we can use more efficient queries
    if (db.isUsingMongoDB()) {
      if (minPrice || maxPrice) {
        query.price = {}
        if (minPrice) query.price.$gte = parseFloat(minPrice)
        if (maxPrice) query.price.$lte = parseFloat(maxPrice)
      }
      
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ]
      }
    }
    
    // Build options
    const options = {}
    if (sort) {
      switch (sort) {
        case 'price_asc':
          options.sort = { price: 1 }
          break
        case 'price_desc':
          options.sort = { price: -1 }
          break
        case 'name_asc':
          options.sort = { name: 1 }
          break
        case 'newest':
          options.sort = { createdAt: -1 }
          break
      }
    }
    
    let allProducts = await db.products.findMany(db.isUsingMongoDB() ? query : {}, options)
    
    // Apply filters for JSON storage (if not using MongoDB)
    if (!db.isUsingMongoDB()) {
      if (category) {
        allProducts = allProducts.filter(p => p.category?.toLowerCase() === category.toLowerCase())
      }
      
      if (minPrice) {
        allProducts = allProducts.filter(p => p.price >= parseFloat(minPrice))
      }
      
      if (maxPrice) {
        allProducts = allProducts.filter(p => p.price <= parseFloat(maxPrice))
      }
      
      if (search) {
        const searchLower = search.toLowerCase()
        allProducts = allProducts.filter(p => 
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        )
      }
    }
    
    res.json(allProducts)
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Failed to get products' })
  }
}

// Get single product by ID
const getProduct = async (req, res) => {
  try {
    const { id } = req.params
    const product = await db.products.findById(id)
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    // Track product view
    trackAnalytics('product_view', { productId: id })
    
    res.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Failed to get product' })
  }
}

// Create product (Admin only)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' })
    }
    
    const newProduct = await db.products.create({
      id: uuidv4(),
      name,
      description: description || '',
      price: parseFloat(price),
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      category: category || 'General',
      stock: parseInt(stock) || 100,
      rating: 0,
      reviewCount: 0,
      createdBy: req.user.id
    })
    
    // Track analytics
    trackAnalytics('product_created', { productId: newProduct._id || newProduct.id, adminId: req.user.id })
    
    res.status(201).json(newProduct)
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
}

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, image, category, stock } = req.body
    
    const product = await db.products.findById(id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    const updates = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (price !== undefined) updates.price = parseFloat(price)
    if (image !== undefined) updates.image = image
    if (category !== undefined) updates.category = category
    if (stock !== undefined) updates.stock = parseInt(stock)
    
    const updatedProduct = await db.products.updateById(id, updates)
    
    res.json(updatedProduct)
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
}

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    
    const product = await db.products.findById(id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    
    await db.products.deleteById(id)
    
    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
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
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
}