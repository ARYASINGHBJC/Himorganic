import { Product, Order, Customer } from '../types'

const API_URL = '/api'

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
    email: string
    role: string
  }
  token: string
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

  // User Login
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

  // Get current user profile
  async getProfile(): Promise<any> {
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to fetch profile')
    return res.json()
  },

  // ============== PRODUCTS ==============
  
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/products`)
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
        ...getAuthHeader()
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
        ...getAuthHeader()
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

  // ============== ORDERS ==============
  
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to fetch orders')
    return res.json()
  },

  async getMyOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders/my`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) throw new Error('Failed to fetch orders')
    return res.json()
  },

  async createOrder(data: {
    items: { productId: string; quantity: number }[]
    customer: Customer
    paymentMethod: 'upi' | 'card'
  }): Promise<Order> {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Failed to create order')
    return result
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
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