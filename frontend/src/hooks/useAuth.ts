import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createElement } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'
import { storeToken, storeUser, getToken, getStoredUser, removeToken, isTokenExpired } from '../lib/auth'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isSubscriber: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    full_name: string
    charity_id?: string
    charity_percentage?: number
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token || isTokenExpired(token)) {
      removeToken()
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await authApi.me()
      setUser(response.data)
      storeUser(response.data)
    } catch {
      removeToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    const { access_token, user: userData } = response.data
    storeToken(access_token)
    storeUser(userData)
    setUser(userData)
  }, [])

  const register = useCallback(async (data: {
    email: string
    password: string
    full_name: string
    charity_id?: string
    charity_percentage?: number
  }) => {
    const response = await authApi.register(data)
    const { access_token, user: userData } = response.data
    storeToken(access_token)
    storeUser(userData)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    removeToken()
    setUser(null)
    toast.success('Logged out successfully')
    window.location.href = '/'
  }, [])

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSubscriber: user?.subscription_status === 'active',
        login,
        register,
        logout,
        refreshUser,
      },
    },
    children
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
