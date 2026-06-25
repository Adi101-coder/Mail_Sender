import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'
import type { DashboardStats } from '@/types'

interface AuthContextValue {
  stats: DashboardStats | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const AUTH_CHECK_TIMEOUT_MS = 10_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    console.log('[Auth] refresh() started — checking session via /auth/me')
    try {
      const data = await Promise.race([
        api.getMe(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('Auth check timed out')), AUTH_CHECK_TIMEOUT_MS)
        }),
      ])
      console.log('[Auth] refresh() success — user:', data.user?.email ?? '(not logged in)')
      setStats(data)
    } catch (error) {
      console.error('[Auth] refresh() failed:', error)
      setStats(null)
    } finally {
      console.log('[Auth] refresh() done — loading=false')
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setStats(null)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ stats, loading, refresh, logout }),
    [stats, loading, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
