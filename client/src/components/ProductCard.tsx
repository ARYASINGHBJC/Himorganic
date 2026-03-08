import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingCart, Eye } from 'lucide-react'
import { Product } from '../types'
import { useCartStore } from '../store/cartStore'
import toast from 'react-hot-toast'
import { getProductVariants } from '../lib/productVariants'

interface ProductCardProps {
  product: Product
  index: number
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const variants = getProductVariants(product)
  const [selectedVariant, setSelectedVariant] = useState(variants[0])
  const displayPrice = selectedVariant.price.toFixed(2)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1, selectedVariant)
    toast.success(`${product.name} (${selectedVariant.label}) added to cart!`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -10 }}
      className="group perspective-1000 h-full"
    >
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-primary-100 flex flex-col h-full">
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
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-primary-800 mb-2 truncate">
            {product.name}
          </h3>
          <p className="text-primary-600/70 text-sm mb-4 flex-1 line-clamp-2">
            {product.description || 'Premium organic product'}
          </p>
          <div className="text-2xl font-bold text-primary-600 mb-3">
            ₹{displayPrice}
          </div>

          {/* Variant selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {variants.map((variant) => (
              <button
                key={variant.label}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedVariant(variant) }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedVariant.label === variant.label
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-primary-700 border-primary-200 hover:border-primary-400'
                }`}
              >
                {variant.label}
              </button>
            ))}
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