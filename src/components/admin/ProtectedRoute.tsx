import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageLoading } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoading />
  if (!user) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
