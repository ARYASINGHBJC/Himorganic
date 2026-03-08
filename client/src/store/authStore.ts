import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'

interface User {
  id: string
  name: string
  email?: string
  phone?: string
  isAdmin?: boolean
  isPhoneVerified?: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  _hasHydrated: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  loginWithOTP: (phone: string, otp: string, name?: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  setHasHydrated: (val: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.login(email, password)
          const token = response.token || response.accessToken || ''
          localStorage.setItem('token', token)
          set({
            user: response.user as User,
            token,
            isAuthenticated: true,
            isAdmin: !!(response.user.isAdmin),
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
          const token = response.token || response.accessToken || ''
          localStorage.setItem('token', token)
          set({
            user: response.user as User,
            token,
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
          const token = response.token || response.accessToken || ''
          localStorage.setItem('token', token)
          set({
            user: response.user as User,
            token,
            isAuthenticated: true,
            isAdmin: false,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      loginWithOTP: async (phone: string, otp: string, name?: string) => {
        set({ isLoading: true })
        try {
          const response = await api.verifyOTP(phone, otp, name)
          const token = response.token || response.accessToken || ''
          localStorage.setItem('token', token)
          set({
            user: response.user as User,
            token,
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
            user: user as User,
            token,
            isAuthenticated: true,
            isAdmin: !!(user as User).isAdmin,
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
)