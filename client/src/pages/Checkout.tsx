import { useState, useEffect } from 'react'
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
  MapPin,
  Truck,
  Sparkles,
  ExternalLink,
  AlertCircle,
  XCircle,
  Leaf
} from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

// ── Set your merchant UPI VPA here ──────────────────────────────
const MERCHANT_UPI = import.meta.env.VITE_MERCHANT_UPI || 'himorganic@upi'
const MERCHANT_NAME = import.meta.env.VITE_MERCHANT_NAME || 'Himorganic'
// ────────────────────────────────────────────────────────────────

const UPI_APPS = [
  {
    name: 'Google Pay',
    id: 'gpay',
    color: '#4285F4',
    scheme: (pa: string, am: string, tn: string) =>
      `tez://upi/pay?pa=${pa}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`,
    fallback: (pa: string, am: string, tn: string) =>
      `upi://pay?pa=${pa}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png',
  },
  {
    name: 'Paytm',
    id: 'paytm',
    color: '#002970',
    scheme: (pa: string, am: string, tn: string) =>
      `paytmmp://upi/pay?pa=${pa}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`,
    fallback: (pa: string, am: string, tn: string) =>
      `upi://pay?pa=${pa}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png',
  },
  {
    name: 'PhonePe',
    id: 'phonepe',
    color: '#5f259f',
    scheme: (pa: string, am: string, tn: string) =>
      `phonepe://pay?pa=${pa}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`,
    fallback: (pa: string, am: string, tn: string) =>
      `upi://pay?pa=${pa}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png',
  },
  {
    name: 'BHIM',
    id: 'bhim',
    color: '#004C8F',
    scheme: (pa: string, am: string, tn: string) =>
      `upi://pay?pa=${pa}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`,
    fallback: (pa: string, am: string, tn: string) =>
      `upi://pay?pa=${pa}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/BHIM_SVG_Logo.svg/512px-BHIM_SVG_Logo.svg.png',
  },
]

type PaymentMethod = 'upi' | 'card'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(1)
  const [hydrated, setHydrated] = useState(false)

  // Wait for Zustand persist to rehydrate before checking empty cart
  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && items.length === 0) navigate('/cart')
  }, [hydrated, items.length])

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

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeCity, setPincodeCity] = useState('')   // city detected from pincode

  const setError = (field: string, msg: string) =>
    setErrors((prev) => ({ ...prev, [field]: msg }))
  const clearError = (field: string) =>
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })

  const validateEmail = (v: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      setError('email', 'Enter a valid email address (e.g. name@gmail.com)')
      return false
    }
    clearError('email')
    return true
  }

  const validatePhone = (v: string) => {
    const digits = v.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError('phone', 'Mobile number must be exactly 10 digits')
      return false
    }
    clearError('phone')
    return true
  }

  const lookupPincode = async (pin: string) => {
    if (!/^\d{6}$/.test(pin)) {
      setError('pincode', 'Pincode must be 6 digits')
      setPincodeCity('')
      return
    }
    clearError('pincode')
    clearError('city')
    setPincodeLoading(true)
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
      const data = await res.json()
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length) {
        const po = data[0].PostOffice[0]
        const detected = po.District || po.Block || po.Name
        setPincodeCity(detected)
        clearError('pincode')
        // auto-fill city if empty
        setCustomer((prev) => ({ ...prev, city: prev.city || detected }))
        // validate city if already entered
        if (customer.city && customer.city.toLowerCase() !== detected.toLowerCase()) {
          setError('city', `Pincode ${pin} belongs to ${detected}, not "${customer.city}"`)
        } else {
          clearError('city')
        }
      } else {
        setError('pincode', 'Invalid pincode — not found in India Post database')
        setPincodeCity('')
      }
    } catch {
      setError('pincode', 'Could not verify pincode. Check your connection.')
    } finally {
      setPincodeLoading(false)
    }
  }

  const validateCity = (cityVal: string) => {
    if (!pincodeCity) return true   // pincode not looked up yet, skip
    if (cityVal.toLowerCase() !== pincodeCity.toLowerCase()) {
      setError('city', `City doesn't match pincode — expected "${pincodeCity}"`)
      return false
    }
    clearError('city')
    return true
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-4 transition-all outline-none ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
        : 'border-gray-100 focus:border-primary-500 focus:ring-primary-100'
    }`

  const subtotal = getTotal()
  const shipping = subtotal > 500 ? 0 : 50
  const total = subtotal + shipping

  const buildUPILink = (app: typeof UPI_APPS[0]) => {
    const tn = `Himorganic Order`
    return app.scheme(MERCHANT_UPI, total.toFixed(2), tn)
  }

  const handleUPIAppPay = (app: typeof UPI_APPS[0]) => {
    if (!customer.name) {
      toast.error('Please complete shipping details first')
      return
    }
    const link = buildUPILink(app)
    // Try app deep link; on desktop it may fail — that's expected
    window.location.href = link
    // After a short delay, assume payment was initiated and confirm order
    setTimeout(async () => {
      try {
        setProcessing(true)
        const order = await api.createOrder({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          customer,
          paymentMethod: 'upi',
        })
        clearCart()
        navigate('/payment-success', { state: { orderId: order.id } })
      } catch {
        toast.error('Could not confirm order. Please contact support.')
      } finally {
        setProcessing(false)
      }
    }, 3000)
  }

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const emailOk = validateEmail(customer.email)
    const phoneOk = validatePhone(customer.phone)
    const cityOk  = validateCity(customer.city)
    const pinOk   = !/^\d{6}$/.test(customer.pincode)
      ? (setError('pincode', 'Pincode must be 6 digits'), false)
      : true
    if (emailOk && phoneOk && cityOk && pinOk) setStep(2)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    try {
      const order = await api.createOrder({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
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

  if (!hydrated || items.length === 0) return null

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
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className={inputClass('name')}
                        placeholder="Arya Singh"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="text"
                        required
                        value={customer.email}
                        onChange={(e) => { setCustomer({ ...customer, email: e.target.value }); clearError('email') }}
                        onBlur={(e) => validateEmail(e.target.value)}
                        className={inputClass('email')}
                        placeholder="name@gmail.com"
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />{errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={customer.phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setCustomer({ ...customer, phone: digits })
                          if (digits.length === 10) clearError('phone')
                        }}
                        onBlur={(e) => validatePhone(e.target.value)}
                        className={inputClass('phone')}
                        placeholder="9876543210"
                        maxLength={10}
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />{errors.phone}
                        </p>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={customer.city}
                        onChange={(e) => {
                          setCustomer({ ...customer, city: e.target.value })
                          clearError('city')
                        }}
                        onBlur={(e) => validateCity(e.target.value)}
                        className={inputClass('city')}
                        placeholder={pincodeCity || 'Mumbai'}
                      />
                      {pincodeCity && !errors.city && (
                        <p className="mt-1.5 text-xs text-primary-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />Detected: {pincodeCity}
                        </p>
                      )}
                      {errors.city && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />{errors.city}
                        </p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                      <textarea
                        required
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        className={`${inputClass('address')} min-h-[100px] resize-none`}
                        placeholder="Street address, apartment, etc."
                      />
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={customer.pincode}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setCustomer({ ...customer, pincode: v })
                            if (v.length < 6) { clearError('pincode'); setPincodeCity('') }
                          }}
                          onBlur={(e) => { if (e.target.value.length === 6) lookupPincode(e.target.value) }}
                          className={inputClass('pincode')}
                          placeholder="400001"
                          maxLength={6}
                        />
                        {pincodeLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
                        )}
                        {!pincodeLoading && pincodeCity && !errors.pincode && (
                          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                        )}
                        {!pincodeLoading && errors.pincode && (
                          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                        )}
                      </div>
                      {errors.pincode && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />{errors.pincode}
                        </p>
                      )}
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
                          <p className="text-sm font-medium text-gray-700 mb-4">Pay instantly with your UPI app</p>

                          {/* UPI App Buttons */}
                          <div className="grid grid-cols-2 gap-3 mb-5">
                            {UPI_APPS.map((app) => (
                              <motion.button
                                key={app.id}
                                type="button"
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleUPIAppPay(app)}
                                disabled={processing}
                                className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:shadow-md transition-all disabled:opacity-50"
                              >
                                <img
                                  src={app.logo}
                                  alt={app.name}
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <span className="font-semibold text-gray-700 text-sm">{app.name}</span>
                                <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                              </motion.button>
                            ))}
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium">or enter UPI ID manually</span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="flex-1 px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none text-sm"
                              placeholder="yourname@paytm / @ybl / @okicici"
                            />
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              disabled={!upiId || processing}
                              onClick={() => {
                                if (!upiId) return
                                const link = `upi://pay?pa=${MERCHANT_UPI}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Himorganic Order')}`
                                window.location.href = link
                              }}
                              className="px-4 py-3 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-40"
                            >
                              Pay
                            </motion.button>
                          </div>
                          <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                            Opens your UPI app directly. Works on mobile with GPay, Paytm, PhonePe installed.
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