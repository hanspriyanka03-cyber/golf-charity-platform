import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createElement } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { authApi } from '../lib/api'
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

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const profile = await fetchProfile(authUser.id)
      setUser(profile)
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    // Initial session check — non-blocking, resolve quietly in background
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setIsLoading(true)
        const profile = await fetchProfile(session.user.id)
        setUser(profile)
        setIsLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setUser(profile)
      } else {
        setUser(null)
      }
      if (event === 'SIGNED_OUT') {
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password)
    // onAuthStateChange will update user state
  }, [])

  const register = useCallback(async (data: {
    email: string
    password: string
    full_name: string
    charity_id?: string
    charity_percentage?: number
  }) => {
    await authApi.register(data)
    // onAuthStateChange will update user state
  }, [])

  const logout = useCallback(() => {
    supabase.auth.signOut()
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
