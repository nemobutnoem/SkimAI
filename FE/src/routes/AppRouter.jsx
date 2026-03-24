import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { MainLayout } from '../layouts/MainLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { SharedLayout } from '../layouts/SharedLayout'
import { AccountPage } from '../pages/Account/AccountPage'
import { AdminDashboardPage } from '../pages/AdminDashboard/AdminDashboardPage'
import { AdminReportsPage } from '../pages/AdminReports/AdminReportsPage'
import { AdminRevenuePage } from '../pages/AdminRevenue/AdminRevenuePage'
import { AdminUsersPage } from '../pages/AdminUsers/AdminUsersPage'
import { AdminSettingsPage } from '../pages/AdminSettings/AdminSettingsPage'
import { AnalysisPage } from '../pages/Analysis/AnalysisPage'
import { DashboardPage } from '../pages/Dashboard/DashboardPage'
import { DeepInsightPage } from '../pages/DeepInsight/DeepInsightPage'
import { HomePage } from '../pages/Home/HomePage'
import { AskExpertPage } from '../pages/AskExpert/AskExpertPage'
import { LoginPage } from '../pages/Login/LoginPage'
import { NotFoundPage } from '../pages/NotFound/NotFoundPage'
import { PricingPage } from '../pages/Pricing/PricingPage'
import { PrivateRoute } from './PrivateRoute'
import { useAuth } from '../hooks/useAuth'

/* When admin visits /, send them to admin dashboard instead */
function AdminHomeRedirect() {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />
  }
  return <HomePage />
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public-only pages (guest navbar) */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<AdminHomeRedirect />} />
        <Route path={ROUTES.PRICING} element={<PricingPage />} />
      </Route>

      {/* Shared pages — accessible by both guest & logged-in users */}
      {/* Navbar auto-detects auth state */}
      <Route element={<SharedLayout />}>
        <Route path={ROUTES.ANALYSIS} element={<AnalysisPage />} />
        <Route path={ROUTES.DEEP_INSIGHT} element={<DeepInsightPage />} />
        <Route path={ROUTES.ASK_EXPERT} element={<AskExpertPage />} />
      </Route>

      {/* Login (no layout) */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      {/* Private pages — require login */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ACCOUNT} element={<AccountPage />} />
        </Route>
      </Route>

      {/* Admin pages — require admin role */}
      <Route element={<PrivateRoute allowedRoles={['admin']} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
          <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReportsPage />} />
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
          <Route path={ROUTES.ADMIN_REVENUE} element={<AdminRevenuePage />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
