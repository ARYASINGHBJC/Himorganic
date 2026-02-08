import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingCart, Eye, Leaf } from 'lucide-react'
import { Product } from '../types'
import { useCartStore } from '../store/cartStore'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
  index: number
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    toast.success(`${product.name} added to cart!`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -10 }}
      className="group perspective-1000"
    >
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-primary-100">
        {/* Image */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'
            }}
          />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-primary-700 flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              {product.category}
            </span>
          </div>
          
          {/* Stock Badge */}
          {product.stock < 10 && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white">
                Only {product.stock} left
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-primary-800 mb-2 truncate">
            {product.name}
          </h3>
          <p className="text-primary-600/70 text-sm mb-4 line-clamp-2">
            {product.description || 'Premium organic product'}
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold text-primary-600">
              ₹{product.price.toFixed(2)}
            </div>
            <div className="text-sm text-primary-400">
              In Stock: {product.stock}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link
              to={`/product/${product.id}`}
              className="flex-1 py-2.5 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center gap-2 text-primary-700 font-medium hover:bg-primary-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View
            </Link>
            <button
              onClick={handleAddToCart}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center gap-2 text-white font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
        
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary-300 transition-colors duration-300 pointer-events-none" />
      </div>
    </motion.div>
  )
}