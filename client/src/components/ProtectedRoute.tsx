import { Navigate, Outlet } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute() {
  const { stats, loading } = useAuth()

  console.log('[Auth] ProtectedRoute render — loading:', loading, 'user:', stats?.user?.email ?? null)

  if (loading) {
    console.log('[Auth] ProtectedRoute — waiting for auth check...')
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  if (!stats?.user) {
    console.log('[Auth] ProtectedRoute — no user, redirecting to /login')
    return <Navigate to="/login" replace />
  }

  console.log('[Auth] ProtectedRoute — authenticated, rendering child route')
  return <Outlet />
}
