import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { Product } from '../types'
import { useCartStore } from '../store/cartStore'
import { getProductVariants } from '../lib/productVariants'

export default function Wishlist() {
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    void loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      const data = await api.getWishlist()
      setWishlist(data.products)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId: string) => {
    setRemovingId(productId)
    try {
      const data = await api.removeFromWishlist(productId)
      setWishlist(data.products)
      toast.success('Removed from wishlist')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update wishlist')
    } finally {
      setRemovingId(null)
    }
  }

  const handleAddToCart = (product: Product) => {
    const variants = getProductVariants(product)
    const defaultVariant = variants[0]
    addItem(product, 1, defaultVariant)
    toast.success(`${product.name} added to cart`)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="h-10 w-48 bg-primary-100 rounded-xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl border border-primary-100 p-4 shadow-sm">
                <div className="h-48 w-full rounded-xl bg-primary-100 animate-pulse mb-4" />
                <div className="h-6 w-3/4 bg-primary-100 rounded animate-pulse mb-2" />
                <div className="h-5 w-1/3 bg-primary-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 bg-gradient-to-b from-primary-50 via-white to-primary-100">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 bg-white/70 border border-primary-100 px-4 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Your Wishlist</h1>
            <p className="text-gray-500">{wishlist.length} saved {wishlist.length === 1 ? 'item' : 'items'}</p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white/80 border border-primary-100 rounded-2xl p-10 text-center shadow-sm">
            <Heart className="w-12 h-12 mx-auto text-primary-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save products you love and come back to them anytime.</p>
            <Link
              to="/#products"
              className="inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-3 rounded-xl hover:bg-primary-600 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-primary-100 overflow-hidden shadow-sm"
              >
                <Link to={`/product/${product.id}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-52 w-full object-cover"
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'
                    }}
                  />
                </Link>
                <div className="p-4">
                  <div className="text-sm text-primary-600 font-medium mb-1">{product.category}</div>
                  <Link to={`/product/${product.id}`} className="text-lg font-semibold text-gray-800 hover:text-primary-600 transition-colors">
                    {product.name}
                  </Link>
                  <p className="text-primary-600 font-bold text-xl mt-2">₹{product.price.toFixed(2)}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-3 py-2.5 rounded-xl hover:bg-primary-600 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => { void handleRemove(product.id) }}
                      disabled={removingId === product.id}
                      className="w-11 h-11 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
