import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, ArrowLeft, Minus, Plus, Package, Check, Leaf, Heart, Share2, Star, Truck, Shield, RotateCcw } from 'lucide-react'
import { api } from '../lib/api'
import { Product } from '../types'
import { useCartStore } from '../store/cartStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    if (!isWishlisted) {
      toast.success('Added to wishlist!')
    } else {
      toast('Removed from wishlist', { icon: '💔' })
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: product?.name || 'Check out this product',
      text: product?.description || 'Amazing organic product from Himorganic',
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      // User cancelled or share failed, copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      } catch {
        toast.error('Failed to share')
      }
    }
  }

  useEffect(() => {
    if (id) {
      loadProduct(id)
    }
  }, [id])

  const loadProduct = async (productId: string) => {
    try {
      const data = await api.getProduct(productId)
      setProduct(data)
    } catch (error) {
      console.error('Failed to load product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity)
      setAdded(true)
      toast.success(`${product.name} (x${quantity}) added to cart!`)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 bg-gradient-to-b from-primary-50 to-white">
        <LoadingSpinner />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 shadow-xl flex items-center justify-center"
          >
            <Package className="w-16 h-16 text-primary-500" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Product Not Found</h1>
          <p className="text-gray-500 mb-8">
            The product you're looking for doesn't exist.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-primary-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-2xl border border-white/50">
              <motion.img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
                }}
              />
              
              {/* Category badge */}
              <div className="absolute top-6 left-6">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white flex items-center gap-2 shadow-lg">
                  <Leaf className="w-4 h-4" />
                  {product.category}
                </span>
              </div>

              {/* Action buttons */}
              <div className="absolute top-6 right-6 flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleWishlist}
                  className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-colors shadow-lg ${isWishlisted ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-primary-500 transition-colors shadow-lg"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-gray-500 text-sm">(4.0) · 128 reviews</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">{product.name}</h1>
            
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-primary-600">₹{product.price.toFixed(2)}</span>
              <span className="text-xl text-gray-400 line-through">₹{(product.price * 1.2).toFixed(2)}</span>
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-lg">20% OFF</span>
            </div>

            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {product.description || 'Premium quality organic product sourced directly from nature. Experience the pure essence of organic living with our carefully selected products.'}
            </p>

            {/* Stock status */}
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-primary-500 animate-pulse' : 'bg-orange-500'}`} />
              <span className={product.stock > 0 ? 'text-primary-600 font-medium' : 'text-orange-500 font-medium'}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-6 mb-8">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center gap-3 bg-white rounded-xl p-2 border-2 border-primary-100 shadow-sm">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors text-primary-600"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <span className="w-12 text-center text-xl font-bold text-gray-800">{quantity}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors text-primary-600"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Add to cart button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                added
                  ? 'bg-primary-600 text-white shadow-primary-500/30'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl hover:shadow-primary-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {added ? (
                <>
                  <Check className="w-6 h-6" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-6 h-6" />
                  Add to Cart - ₹{(product.price * quantity).toFixed(2)}
                </>
              )}
            </motion.button>

            {/* Features */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: Leaf, text: '100% Organic', color: 'text-green-600 bg-green-50' },
                { icon: Truck, text: 'Free Shipping', color: 'text-blue-600 bg-blue-50' },
                { icon: RotateCcw, text: 'Easy Returns', color: 'text-orange-600 bg-orange-50' },
                { icon: Shield, text: 'Secure Payment', color: 'text-purple-600 bg-purple-50' },
              ].map((feature) => (
                <motion.div
                  key={feature.text}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-primary-100 shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}