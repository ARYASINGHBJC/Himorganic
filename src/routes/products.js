const { Router } = require('express')
const router = Router()
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController')
const { verifyToken, requireAdmin } = require('../middleware/auth')

// Public routes
router.get('/', getProducts)
router.get('/:id', getProduct)

// Admin routes
router.post('/', verifyToken, requireAdmin, createProduct)
router.put('/:id', verifyToken, requireAdmin, updateProduct)
router.delete('/:id', verifyToken, requireAdmin, deleteProduct)

module.exports = router