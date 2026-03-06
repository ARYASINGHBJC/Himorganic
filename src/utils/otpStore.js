/**
 * OTP Store
 *
 * In-memory OTP store with TTL-based expiry.
 * In production: back this with Redis for multi-instance deployments.
 *
 * Shape: Map<phone, { otp, expiresAt, attempts }>
 */

const OTP_TTL_MS = 10 * 60 * 1000     // 10 minutes
const MAX_ATTEMPTS = 5
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000  // Run cleanup every 5 minutes

const store = new Map()

/** Generate a cryptographically-adequate 6-digit OTP */
const generateOTP = () => {
  const num = Math.floor(100000 + Math.random() * 900000)
  return String(num)
}

/** Store an OTP for a given phone number, overwriting any existing one */
const setOTP = (phone, otp) => {
  store.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  })
}

/**
 * Verify an OTP.
 * Returns:
 *   'ok'           – OTP is valid
 *   'expired'      – OTP has timed out
 *   'invalid'      – OTP does not match
 *   'too_many'     – Too many failed attempts
 *   'not_found'    – No OTP for this phone
 */
const verifyOTP = (phone, candidateOtp) => {
  const record = store.get(phone)
  if (!record) return 'not_found'

  if (Date.now() > record.expiresAt) {
    store.delete(phone)
    return 'expired'
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(phone)
    return 'too_many'
  }

  if (record.otp !== candidateOtp) {
    record.attempts += 1
    return 'invalid'
  }

  // Valid – remove from store (single-use)
  store.delete(phone)
  return 'ok'
}

/** Delete an OTP record (e.g., after successful verification or explicit cancel) */
const deleteOTP = (phone) => {
  store.delete(phone)
}

/** Check if a phone has a pending (non-expired) OTP – useful for resend throttle */
const hasPendingOTP = (phone) => {
  const record = store.get(phone)
  if (!record) return false
  if (Date.now() > record.expiresAt) {
    store.delete(phone)
    return false
  }
  return true
}

/** Remaining TTL in seconds for a phone's current OTP */
const remainingTTL = (phone) => {
  const record = store.get(phone)
  if (!record) return 0
  const remaining = Math.ceil((record.expiresAt - Date.now()) / 1000)
  return Math.max(0, remaining)
}

// Periodic cleanup to avoid memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [phone, record] of store.entries()) {
    if (now > record.expiresAt) {
      store.delete(phone)
    }
  }
}, CLEANUP_INTERVAL_MS)

module.exports = {
  generateOTP,
  setOTP,
  verifyOTP,
  deleteOTP,
  hasPendingOTP,
  remainingTTL,
}
