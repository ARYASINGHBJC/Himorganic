import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, Leaf, Loader2, Sparkles, Phone, KeyRound, RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

type LoginMode = 'email' | 'phone'
type OTPStep = 'phone' | 'otp'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithOTP, isLoading } = useAuthStore()

  const from = location.state?.from?.pathname || '/'

  // ── Email / password state ──────────────────────────────────────────────
  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ── Phone / OTP state ────────────────────────────────────────────────────
  const [otpStep, setOtpStep] = useState<OTPStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [canonicalPhone, setCanonicalPhone] = useState('')
  const [devOtp, setDevOtp] = useState<string | undefined>()

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Welcome back! 🌿')
      navigate(from, { replace: true })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpSending(true)
    try {
      const res = await api.sendOTP(phone)
      setCanonicalPhone(res.phone)
      if (res.devOtp) {
        setDevOtp(res.devOtp)
        setOtp(res.devOtp)   // auto-fill in dev so testers don't need the console
      }
      setOtpStep('otp')
      toast.success(`OTP sent to ${res.phone}`)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await loginWithOTP(canonicalPhone, otp)
      toast.success('Welcome! 🌿')
      navigate(from, { replace: true })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'OTP verification failed')
    }
  }

  const handleResendOTP = async () => {
    setOtpSending(true)
    try {
      const res = await api.sendOTP(canonicalPhone || phone)
      if (res.devOtp) { setDevOtp(res.devOtp); setOtp(res.devOtp) }
      toast.success('OTP resent!')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend OTP')
    } finally {
      setOtpSending(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-primary-50" />

      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0.3, scale: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 20 + i * 5, repeat: Infinity, delay: i * 2 }}
            style={{ left: `${10 + i * 20}%`, top: `${20 + (i % 3) * 25}%` }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-200/30 to-primary-300/20 blur-2xl" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
          {/* Logo */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30"
            >
              <Leaf className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-500 mt-1">Sign in to continue your organic journey</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-xl overflow-hidden border-2 border-primary-100 mb-6">
            <button
              type="button"
              onClick={() => { setMode('email'); setOtpStep('phone') }}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                mode === 'email'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-500 hover:bg-primary-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                mode === 'phone'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-500 hover:bg-primary-50'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone OTP
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ── EMAIL / PASSWORD FORM ── */}
            {mode === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleEmailLogin}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-primary-100 rounded-xl focus:ring-0 focus:border-primary-400 transition-all text-gray-800 placeholder-gray-400"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-14 py-4 bg-white border-2 border-primary-100 rounded-xl focus:ring-0 focus:border-primary-400 transition-all text-gray-800 placeholder-gray-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Signing in...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" />Sign In</>
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* ── PHONE / OTP FORM ── */}
            {mode === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <AnimatePresence mode="wait">
                  {otpStep === 'phone' && (
                    <motion.form
                      key="step-phone"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSendOTP}
                      className="space-y-5"
                    >
                      <p className="text-sm text-gray-500">
                        Enter your mobile number and we'll send you a one-time password.
                      </p>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-primary-100 rounded-xl focus:ring-0 focus:border-primary-400 transition-all text-gray-800 placeholder-gray-400"
                            placeholder="+91 99999 99999"
                          />
                        </div>
                      </div>
                      <motion.button
                        type="submit"
                        disabled={otpSending}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {otpSending ? (
                          <><Loader2 className="w-5 h-5 animate-spin" />Sending OTP...</>
                        ) : (
                          <><Phone className="w-5 h-5" />Send OTP</>
                        )}
                      </motion.button>
                    </motion.form>
                  )}

                  {otpStep === 'otp' && (
                    <motion.form
                      key="step-otp"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleVerifyOTP}
                      className="space-y-5"
                    >
                      <div className="bg-primary-50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <p className="text-sm text-primary-700 font-medium">
                          OTP sent to <strong>{canonicalPhone}</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => setOtpStep('phone')}
                          className="text-xs text-primary-500 hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      {devOtp && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                          <p className="text-xs text-amber-700 font-mono">
                            [DEV] OTP: <strong>{devOtp}</strong>
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Enter 6-digit OTP
                        </label>
                        <div className="relative">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            required
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-primary-100 rounded-xl focus:ring-0 focus:border-primary-400 transition-all text-gray-800 placeholder-gray-400 tracking-[0.5em] font-mono text-center text-xl"
                            placeholder="------"
                          />
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isLoading || otp.length < 6}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <><Loader2 className="w-5 h-5 animate-spin" />Verifying...</>
                        ) : (
                          <><Sparkles className="w-5 h-5" />Verify & Sign In</>
                        )}
                      </motion.button>

                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={otpSending}
                        className="w-full text-sm text-primary-500 hover:text-primary-700 flex items-center justify-center gap-1 transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${otpSending ? 'animate-spin' : ''}`} />
                        {otpSending ? 'Resending…' : 'Resend OTP'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t-2 border-primary-100" />
              <Leaf className="w-4 h-4 text-primary-400" />
              <div className="flex-1 border-t-2 border-primary-100" />
            </div>

            <p className="text-center text-gray-600">
              New to Himorganic?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                Create an account
              </Link>
            </p>

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Your data is secure with us
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}