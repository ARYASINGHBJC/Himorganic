import { Product, Order, Customer } from '../types'

// In production, VITE_API_URL points to the deployed backend.
// In development, the Vite proxy forwards /api to localhost:3000.
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

const parseJson = async (res: Response) => {
  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const withCredentials = (init: RequestInit = {}): RequestInit => ({
  ...init,
  credentials: 'include',
})

const withAuthHeader = (headers?: HeadersInit): Headers => {
  const nextHeaders = new Headers(headers || {})
  if (accessToken) {
    nextHeaders.set('Authorization', `Bearer ${accessToken}`)
  }
  return nextHeaders
}

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const res = await fetch(`${API_URL}/auth/refresh-token`, withCredentials({ method: 'POST' }))
    const result = await parseJson(res)

    if (!res.ok || !result?.token) {
      accessToken = null
      return null
    }

    accessToken = result.token
    return accessToken
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

const authFetch = async (path: string, init: RequestInit = {}, retry = true): Promise<Response> => {
  const headers = withAuthHeader(init.headers)
  const res = await fetch(`${API_URL}${path}`, withCredentials({ ...init, headers }))

  if (res.status !== 401 || !retry) {
    return res
  }

  const nextAccessToken = await refreshAccessToken()
  if (!nextAccessToken) {
    return res
  }

  const retryHeaders = withAuthHeader(init.headers)
  return fetch(`${API_URL}${path}`, withCredentials({ ...init, headers: retryHeaders }))
}

export interface AuthResponse {
  message: string
  user: {
    id: string
    name: string
    email?: string
    phone?: string
    role?: string
    isAdmin?: boolean
    isPhoneVerified?: boolean
  }
  /** Primary token field used throughout the app */
  token: string
  accessToken?: string
  isNewUser?: boolean
}

export interface OTPSendResponse {
  message: string
  phone: string
  /** Only present in development */
  devOtp?: string
}

export interface AdminStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  lowStockProducts: number
}

interface OrderListResponse {
  orders: Order[]
  total: number
  limit: number
  offset: number
}

const normalizeProduct = (product: Product & { _id?: string }): Product => ({
  ...product,
  id: product.id || product._id || '',
})

export const api = {
  setAccessToken(token: string | null) {
    accessToken = token
  },

  clearAccessToken() {
    accessToken = null
  },

  // ============== AUTH ==============

  // User Registration
  async register(data: { name: string; email: string; password: string; phone?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/register`, withCredentials({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }))
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Registration failed')
    return result
  },

  // User Login (email + password)
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, withCredentials({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }))
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Login failed')
    return result
  },

  // Admin Login
  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/admin/login`, withCredentials({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }))
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Admin login failed')
    return result
  },

  // Phone OTP – step 1: send OTP
  async sendOTP(phone: string): Promise<OTPSendResponse> {
    const res = await fetch(`${API_URL}/auth/send-otp`, withCredentials({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }))
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Failed to send OTP')
    return result
  },

  // Phone OTP – step 2: verify OTP (registers if new user)
  async verifyOTP(phone: string, otp: string, name?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/verify-otp`, withCredentials({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name }),
    }))
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'OTP verification failed')
    return result
  },

  async refreshSession(): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/refresh-token`, withCredentials({ method: 'POST' }))
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result?.error || 'Session refresh failed')
    if (result?.token) {
      accessToken = result.token
    }
    return result
  },

  async logout(): Promise<void> {
    const res = await fetch(`${API_URL}/auth/logout`, withCredentials({ method: 'POST' }))
    accessToken = null
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result?.error || 'Logout failed')
  },

  // Get current user profile
  async getProfile(): Promise<AuthResponse['user']> {
    const res = await authFetch('/auth/profile')
    if (!res.ok) throw new Error('Failed to fetch profile')
    const data = await parseJson(res)
    return data.user ?? data
  },

  // ============== PRODUCTS ==============

  async getProducts(params?: { category?: string; search?: string; sort?: string }): Promise<Product[]> {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    const res = await fetch(`${API_URL}/products${qs}`)
    if (!res.ok) throw new Error('Failed to fetch products')
    const result = await res.json()
    return Array.isArray(result) ? result.map(normalizeProduct) : []
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_URL}/products/${id}`)
    if (!res.ok) throw new Error('Product not found')
    const result = await res.json()
    return normalizeProduct(result)
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const res = await authFetch('/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    })
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Failed to create product')
    return normalizeProduct(result)
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await authFetch(`/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    })
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Failed to update product')
    return normalizeProduct(result)
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await authFetch(`/products/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const result = await parseJson(res)
      throw new Error(result.error || 'Failed to delete product')
    }
  },

  /** Upload a product image file and receive its URL */
  async uploadProductImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)
    const res = await authFetch('/upload/product-image', {
      method: 'POST',
      body: formData,
    })
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Image upload failed')
    return result.url as string
  },

  // ============== ORDERS ==============

  async getOrders(): Promise<Order[]> {
    const res = await authFetch('/orders')
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Failed to fetch orders')
    return Array.isArray(result) ? result : (result as OrderListResponse).orders || []
  },

  async getMyOrders(): Promise<Order[]> {
    const res = await authFetch('/orders/my-orders')
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Failed to fetch orders')
    return Array.isArray(result) ? result : (result as OrderListResponse).orders || []
  },

  async createOrder(data: {
    items: { productId: string; quantity: number; variantLabel?: string; variantPrice?: number }[]
    customer: Customer
    paymentMethod: 'upi' | 'card'
  }): Promise<Order> {
    const res = await authFetch('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Failed to create order')
    return result
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const res = await authFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    const result = await parseJson(res)
    if (!res.ok) throw new Error(result.error || 'Failed to update order')
    return result
  },

  // ============== ADMIN STATS ==============

  async getAdminStats(): Promise<AdminStats> {
    const res = await authFetch('/admin/stats')
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
  },
}