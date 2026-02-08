import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Leaf, Sparkles, Truck, Shield } from 'lucide-react'
import { useCartStore } from '../store/cartStore'

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()
  const subtotal = getTotal()
  const shipping = subtotal > 500 ? 0 : 50
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100" />
        
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 shadow-xl flex items-center justify-center border border-primary-200"
          >
            <ShoppingBag className="w-16 h-16 text-primary-500" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent"
          >
            Your Cart is Empty
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 mb-8 text-lg"
          >
            Discover our organic products and add them to your cart
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg">
              <Leaf className="w-5 h-5" />
              Explore Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
            <p className="text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 flex gap-6 shadow-lg border border-white/50 hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-28 h-28 object-cover rounded-xl shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'
                    }}
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                    {item.quantity}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1 text-gray-800">{item.name}</h3>
                  <p className="text-primary-600 font-semibold mb-4">₹{item.price.toFixed(2)} each</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-1.5 border border-primary-200">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-primary-50 transition-colors text-primary-600 shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <span className="w-10 text-center font-bold text-gray-800">{item.quantity}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-primary-50 transition-colors text-primary-600 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(item.productId)}
                        className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sticky top-28 shadow-xl border border-white/50">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary-500" />
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Shipping
                  </span>
                  <span className={shipping === 0 ? 'text-primary-600 font-bold' : 'font-semibold'}>
                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
                    <p className="text-sm text-primary-700">
                      🎉 Add <span className="font-bold">₹{(500 - subtotal).toFixed(2)}</span> more for free shipping!
                    </p>
                  </div>
                )}
                <div className="border-t-2 border-primary-100 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-800">Total</span>
                    <span className="text-primary-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/checkout"
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              
              <Link
                to="/"
                className="w-full flex items-center justify-center gap-2 mt-4 py-3 px-6 bg-primary-50 text-primary-600 rounded-xl font-semibold hover:bg-primary-100 transition-colors border border-primary-200"
              >
                <Leaf className="w-4 h-4" />
                Continue Shopping
              </Link>

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t border-primary-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                  <Shield className="w-4 h-4 text-primary-500" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}