import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

export function PrivateRoute({ allowedRoles }) {
  const { isAuthenticated, isHydrated, user } = useAuth()

  if (!isHydrated) return null
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
