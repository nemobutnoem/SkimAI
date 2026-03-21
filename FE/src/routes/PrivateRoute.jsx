import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

export function PrivateRoute() {
  const { isAuthenticated, isHydrated } = useAuth()

  if (!isHydrated) return null
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />

  return <Outlet />
}
