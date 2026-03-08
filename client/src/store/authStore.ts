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
  hasCheckedAuth: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>
  loginWithOTP: (phone: string, otp: string, name?: string) => Promise<void>
  logout: () => Promise<void>
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
      hasCheckedAuth: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.login(email, password)
          const token = response.token || response.accessToken || ''
          api.setAccessToken(token)
          set({
            user: response.user as User,
            token,
            isAuthenticated: true,
            isAdmin: !!(response.user.isAdmin),
            isLoading: false,
            hasCheckedAuth: true,
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
          api.setAccessToken(token)
          set({
            user: response.user as User,
            token,
            isAuthenticated: true,
            isAdmin: true,
            isLoading: false,
            hasCheckedAuth: true,
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
          api.setAccessToken(token)
          set({
            user: response.user as User,
            token,
            isAuthenticated: true,
            isAdmin: false,
            isLoading: false,
            hasCheckedAuth: true,
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
          api.setAccessToken(token)
          set({
            user: response.user as User,
            token,
            isAuthenticated: true,
            isAdmin: false,
            isLoading: false,
            hasCheckedAuth: true,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await api.logout()
        } catch {
          // Clear local auth state even if the server-side logout request fails.
        }
        localStorage.removeItem('token')
        api.clearAccessToken()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          hasCheckedAuth: true,
        })
      },

      checkAuth: async () => {
        localStorage.removeItem('token')
        set({ isLoading: true })

        try {
          const user = await api.getProfile()
          set({
            user: user as User,
            token: null,
            isAuthenticated: true,
            isAdmin: !!(user as User).isAdmin,
            isLoading: false,
            hasCheckedAuth: true,
          })
        } catch {
          api.clearAccessToken()
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
            hasCheckedAuth: true,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
)