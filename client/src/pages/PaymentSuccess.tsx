import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Leaf, Sparkles, Truck, Mail } from 'lucide-react'
import Confetti from '../components/Confetti'

export default function PaymentSuccess() {
  const location = useLocation()
  const orderId = location.state?.orderId || 'UNKNOWN'

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-primary-50" />
      
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ 
              duration: 4 + i, 
              repeat: Infinity,
              delay: i * 0.5
            }}
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`,
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              background: `radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)`
            }}
          />
        ))}
      </div>
      
      <Confetti />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="max-w-lg w-full text-center relative z-10"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative w-36 h-36 mx-auto mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full animate-pulse opacity-30" />
          <div className="absolute inset-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full" />
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <CheckCircle className="w-20 h-20 text-primary-600" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-2"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-700 font-medium text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Order Confirmed
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Thank You!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-gray-500 mb-8"
        >
          Your order has been placed successfully.
        </motion.p>

        {/* Order Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl border border-white/50"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Order Details</span>
          </div>
          
          <div className="bg-primary-50 rounded-2xl p-4 mb-6">
            <div className="text-sm text-gray-500 mb-1">Order ID</div>
            <div className="text-2xl font-mono font-bold text-primary-600">
              #{orderId.substring(0, 8).toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Confirmation</span>
              </div>
              <p className="text-sm text-gray-700">Sent to your email</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Delivery</span>
              </div>
              <p className="text-sm text-gray-700">3-5 business days</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4">
              <Leaf className="w-5 h-5" />
              Continue Shopping
            </Link>
          </motion.div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          {[
            { label: 'Confirmed', done: true },
            { label: 'Processing', done: false },
            { label: 'Shipped', done: false },
            { label: 'Delivered', done: false },
          ].map((step, index) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${step.done ? 'bg-primary-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${step.done ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
              {index < 3 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}