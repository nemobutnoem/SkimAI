import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { MainLayout } from '../layouts/MainLayout'
import { SharedLayout } from '../layouts/SharedLayout'
import { AccountPage } from '../pages/Account/AccountPage'
import { AdminDashboardPage } from '../pages/AdminDashboard/AdminDashboardPage'
import { AdminReportsPage } from '../pages/AdminReports/AdminReportsPage'
import { AdminRevenuePage } from '../pages/AdminRevenue/AdminRevenuePage'
import { AdminUsersPage } from '../pages/AdminUsers/AdminUsersPage'
import { AdminSettingsPage } from '../pages/AdminSettings/AdminSettingsPage'
import { AnalysisPage } from '../pages/Analysis/AnalysisPage'
import { DashboardPage } from '../pages/Dashboard/DashboardPage'
import { DataSourcesPage } from '../pages/DataSources/DataSourcesPage'
import { DeepInsightPage } from '../pages/DeepInsight/DeepInsightPage'
import { HomePage } from '../pages/Home/HomePage'
import { LoginPage } from '../pages/Login/LoginPage'
import { NotFoundPage } from '../pages/NotFound/NotFoundPage'
import { PricingPage } from '../pages/Pricing/PricingPage'
import { ReportsPage } from '../pages/Reports/ReportsPage'
import { SupportPage } from '../pages/Support/SupportPage'
import { AdminFeedbacksPage } from '../pages/AdminFeedbacks/AdminFeedbacksPage'
import { PrivateRoute } from './PrivateRoute'
import { useAuth } from '../hooks/useAuth'

function HomeRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <HomePage />
}

export function AppRouter() {
  return (
    <Routes>
      {/* All pages with sidebar (public) */}
      <Route element={<SharedLayout />}>
        <Route path={ROUTES.HOME} element={<HomeRoute />} />
        <Route path={ROUTES.PRICING} element={<PricingPage />} />
        <Route path={ROUTES.ANALYSIS} element={<AnalysisPage />} />
        <Route path={ROUTES.DEEP_INSIGHT} element={<DeepInsightPage />} />
        <Route path={ROUTES.SUPPORT} element={<SupportPage />} />
      </Route>

      {/* Login (no layout) */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      {/* Private pages — require login */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ACCOUNT} element={<AccountPage />} />
        </Route>
        <Route element={<SharedLayout />}>
          <Route path={ROUTES.DATA_SOURCES} element={<DataSourcesPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Admin pages — require admin role */}
      <Route element={<PrivateRoute allowedRoles={['admin']} />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
          <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReportsPage />} />
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
          <Route path={ROUTES.ADMIN_REVENUE} element={<AdminRevenuePage />} />
          <Route path={ROUTES.ADMIN_FEEDBACKS} element={<AdminFeedbacksPage />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
