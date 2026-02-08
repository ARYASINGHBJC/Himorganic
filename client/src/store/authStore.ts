import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  phone?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.login(email, password)
          localStorage.setItem('token', response.token)
          set({
            user: response.user as User,
            token: response.token,
            isAuthenticated: true,
            isAdmin: response.user.role === 'admin',
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      adminLogin: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.adminLogin(email, password)
          localStorage.setItem('token', response.token)
          set({
            user: response.user as User,
            token: response.token,
            isAuthenticated: true,
            isAdmin: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (name: string, email: string, password: string, phone?: string) => {
        set({ isLoading: true })
        try {
          const response = await api.register({ name, email, password, phone })
          localStorage.setItem('token', response.token)
          set({
            user: response.user as User,
            token: response.token,
            isAuthenticated: true,
            isAdmin: false,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
        })
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          set({ isAuthenticated: false, user: null, isAdmin: false })
          return
        }

        try {
          const user = await api.getProfile()
          set({
            user,
            token,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
          })
        } catch {
          localStorage.removeItem('token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
)