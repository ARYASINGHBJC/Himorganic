import { Product, Order, Customer } from '../types'

// In production (Vercel), VITE_API_URL points to the Koyeb backend.
// In development, the Vite proxy forwards /api to localhost:3000.
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

// Get auth token from localStorage
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
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
  /** Alias kept for potential legacy consumers */
  accessToken?: string
  refreshToken?: string
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

export const api = {
  // ============== AUTH ==============

  // User Registration
  async register(data: { name: string; email: string; password: string; phone?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Registration failed')
    return result
  },

  // User Login (email + password)
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Login failed')
    return result
  },

  // Admin Login
  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Admin login failed')
    return result
  },

  // Phone OTP – step 1: send OTP
  async sendOTP(phone: string): Promise<OTPSendResponse> {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to send OTP')
    return result
  },

  // Phone OTP – step 2: verify OTP (registers if new user)
  async verifyOTP(phone: string, otp: string, name?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'OTP verification failed')
    return result
  },

  // Get current user profile
  async getProfile(): Promise<AuthResponse['user']> {
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to fetch profile')
    const data = await res.json()
    return data.user ?? data
  },

  // ============== PRODUCTS ==============

  async getProducts(params?: { category?: string; search?: string; sort?: string }): Promise<Product[]> {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    const res = await fetch(`${API_URL}/products${qs}`)
    if (!res.ok) throw new Error('Failed to fetch products')
    return res.json()
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_URL}/products/${id}`)
    if (!res.ok) throw new Error('Product not found')
    return res.json()
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(product),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to create product')
    return result
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(product),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to update product')
    return result
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) {
      const result = await res.json()
      throw new Error(result.error || 'Failed to delete product')
    }
  },

  /** Upload a product image file and receive its URL */
  async uploadProductImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch(`${API_URL}/upload/product-image`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Image upload failed')
    return result.url as string
  },

  // ============== ORDERS ==============

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { ...getAuthHeader() },
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to fetch orders')
    return Array.isArray(result) ? result : (result as OrderListResponse).orders || []
  },

  async getMyOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders/my-orders`, {
      headers: { ...getAuthHeader() },
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to fetch orders')
    return Array.isArray(result) ? result : (result as OrderListResponse).orders || []
  },

  async createOrder(data: {
    items: { productId: string; quantity: number; variantLabel?: string; variantPrice?: number }[]
    customer: Customer
    paymentMethod: 'upi' | 'card'
  }): Promise<Order> {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to create order')
    return result
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const res = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to update order')
    return result
  },

  // ============== ADMIN STATS ==============

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
  },
}