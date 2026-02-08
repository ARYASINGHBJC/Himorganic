import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Smartphone, 
  Lock, 
  Shield, 
  CheckCircle,
  ArrowLeft,
  Loader2,
  Leaf,
  MapPin,
  Truck,
  Sparkles
} from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

type PaymentMethod = 'upi' | 'card'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(1)

  // Form states
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  })

  const [upiId, setUpiId] = useState('')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  })

  const subtotal = getTotal()
  const shipping = subtotal > 500 ? 0 : 50
  const total = subtotal + shipping

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      const order = await api.createOrder({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customer,
        paymentMethod,
      })

      clearCart()
      navigate('/payment-success', { state: { orderId: order.id } })
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim()
      .slice(0, 19)
  }

  const formatExpiry = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .slice(0, 5)
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100/50" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-primary-200/30 to-transparent rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-primary-300/20 to-transparent rounded-full blur-3xl"
        />
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => (step === 1 ? navigate('/cart') : setStep(1))}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {step === 1 ? 'Back to Cart' : 'Back to Details'}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Checkout</h1>
              <p className="text-gray-500">Complete your purchase</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-white/50">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: 'Shipping Details', icon: MapPin },
              { num: 2, label: 'Payment', icon: CreditCard },
            ].map((s, index) => (
              <div key={s.num} className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: step >= s.num ? 1 : 0.9 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-semibold transition-all ${
                    step >= s.num
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                </motion.div>
                <div className="hidden sm:block">
                  <span className={`block font-medium ${step >= s.num ? 'text-primary-700' : 'text-gray-400'}`}>
                    Step {s.num}
                  </span>
                  <span className={`text-sm ${step >= s.num ? 'text-primary-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {index < 1 && (
                  <div className="w-16 sm:w-24 h-1 rounded-full bg-gray-100 overflow-hidden mx-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: step > s.num ? '100%' : '0%' }}
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleCustomerSubmit}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Shipping Details</h2>
                      <p className="text-gray-500 text-sm">Where should we deliver your order?</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.city}
                        onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div className="md:col-span-2 group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <textarea
                        required
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none min-h-[100px] resize-none"
                        placeholder="Street address, apartment, etc."
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={customer.pincode}
                        onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                        placeholder="400001"
                      />
                    </div>
                  </div>

                  <motion.button 
                    type="submit" 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full mt-8 py-4 text-lg flex items-center justify-center gap-2"
                  >
                    Continue to Payment
                    <CreditCard className="w-5 h-5" />
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handlePayment}
                  className="space-y-6"
                >
                  {/* Payment Method Selection */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Payment Method</h2>
                        <p className="text-gray-500 text-sm">Choose how you'd like to pay</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                          paymentMethod === 'upi'
                            ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-500 shadow-lg shadow-primary-100'
                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${paymentMethod === 'upi' ? 'bg-primary-500' : 'bg-gray-200'}`}>
                          <Smartphone className={`w-7 h-7 ${paymentMethod === 'upi' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <span className={`font-semibold ${paymentMethod === 'upi' ? 'text-primary-700' : 'text-gray-600'}`}>UPI</span>
                        <span className="text-xs text-gray-400">GPay, PhonePe, etc.</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod('card')}
                        className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                          paymentMethod === 'card'
                            ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-500 shadow-lg shadow-primary-100'
                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${paymentMethod === 'card' ? 'bg-primary-500' : 'bg-gray-200'}`}>
                          <CreditCard className={`w-7 h-7 ${paymentMethod === 'card' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <span className={`font-semibold ${paymentMethod === 'card' ? 'text-primary-700' : 'text-gray-600'}`}>Card</span>
                        <span className="text-xs text-gray-400">Visa, Mastercard, etc.</span>
                      </motion.button>
                    </div>

                    {/* Payment Details */}
                    <AnimatePresence mode="wait">
                      {paymentMethod === 'upi' ? (
                        <motion.div
                          key="upi"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gray-50 rounded-2xl p-6"
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            UPI ID *
                          </label>
                          <input
                            type="text"
                            required
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                            placeholder="yourname@upi"
                          />
                          <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary-500" />
                            Enter your UPI ID (e.g., name@paytm, name@ybl)
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="card"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gray-50 rounded-2xl p-6 space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Card Number *
                            </label>
                            <input
                              type="text"
                              required
                              value={cardDetails.number}
                              onChange={(e) =>
                                setCardDetails({
                                  ...cardDetails,
                                  number: formatCardNumber(e.target.value),
                                })
                              }
                              className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                              placeholder="1234 5678 9012 3456"
                              maxLength={19}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cardholder Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={cardDetails.name}
                              onChange={(e) =>
                                setCardDetails({ ...cardDetails, name: e.target.value })
                              }
                              className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                              placeholder="JOHN DOE"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date *
                              </label>
                              <input
                                type="text"
                                required
                                value={cardDetails.expiry}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    expiry: formatExpiry(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                                placeholder="MM/YY"
                                maxLength={5}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                CVV *
                              </label>
                              <input
                                type="password"
                                required
                                value={cardDetails.cvv}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    cvv: e.target.value.slice(0, 4),
                                  })
                                }
                                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                                placeholder="•••"
                                maxLength={4}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Security Badge */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-center gap-8 text-gray-500 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-primary-600" />
                      </div>
                      <span>256-bit encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-primary-600" />
                      </div>
                      <span>Secure payment</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={processing}
                    whileHover={{ scale: processing ? 1 : 1.02 }}
                    whileTap={{ scale: processing ? 1 : 0.98 }}
                    className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-primary-200"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Pay ₹{total.toFixed(2)}
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 sticky top-28 shadow-xl border border-white/50">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <motion.div 
                    key={item.productId} 
                    className="flex gap-4 bg-gray-50 p-3 rounded-xl"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'
                        }}
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-800">{item.name}</h4>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-primary-600">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Shipping</span>
                  </div>
                  <span className={shipping === 0 ? 'text-primary-500 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping === 0 && (
                  <div className="text-xs text-primary-600 bg-primary-50 rounded-lg p-2 text-center">
                    🎉 You qualify for free shipping!
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-4 border-t border-gray-100">
                  <span className="text-gray-800">Total</span>
                  <span className="text-primary-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-500" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary-500" />
                    <span>Fast Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}