// Auth utilities — Supabase manages session/token storage automatically.
// These are kept for backwards compatibility with any remaining imports.

import type { User } from '../types'

const USER_KEY = 'golf_charity_user'

export function storeUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

export function removeToken(): void {
  localStorage.removeItem(USER_KEY)
}

// Legacy stubs — Supabase handles tokens internally
export function storeToken(_token: string): void {}
export function getToken(): string | null { return null }
export function isTokenExpired(_token: string): boolean { return false }
