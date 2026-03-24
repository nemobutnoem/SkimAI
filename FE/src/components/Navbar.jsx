import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'
import { Button } from './Button'

/* ─── Route configs for each context ─── */

const PUBLIC_LINKS = [
  { to: ROUTES.HOME, label: 'Overview' },
  { to: ROUTES.ANALYSIS, label: 'Market Research' },
  { to: ROUTES.ASK_EXPERT, label: 'Ask Expert' },
  { to: ROUTES.PRICING, label: 'Pricing' },
]

const USER_LINKS = [
  { to: ROUTES.DASHBOARD, label: 'Workspace' },
  { to: ROUTES.ANALYSIS, label: 'Market Research' },
  { to: ROUTES.DEEP_INSIGHT, label: 'Deep Insight' },
  { to: ROUTES.ASK_EXPERT, label: 'Ask Expert' },
  { to: ROUTES.ACCOUNT, label: 'Billing' },
]

const ADMIN_LINKS = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.ADMIN_REPORTS, label: 'Reports' },
  { to: ROUTES.ADMIN_USERS, label: 'Users' },
  { to: ROUTES.ADMIN_REVENUE, label: 'Revenue' },
]

/* Helper: get initials from user */
function getInitials(user) {
  if (user?.name) {
    return user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  }
  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase()
  }
  return 'AD'
}

/* ─── Navbar Component ─── */

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isAdmin = user?.role === 'admin'
  const isOnAdminPage = location.pathname.startsWith('/admin')

  /* Pick the right link set */
  const links = isOnAdminPage ? ADMIN_LINKS : isAuthenticated ? USER_LINKS : PUBLIC_LINKS

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  /* ── Admin navbar ── */
  if (isOnAdminPage && isAdmin) {
    return (
      <header className="app-header">
        <div className="app-header-inner">
          <div
            className="app-brand"
            role="button"
            tabIndex={0}
            onClick={() => navigate(ROUTES.HOME)}
          >
            AISKIM
          </div>

          <span className="admin-section-badge">Admin</span>

          <nav className="app-nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  ['app-link', isActive ? 'active' : ''].join(' ').trim()
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to={ROUTES.ADMIN_SETTINGS}
              className={({ isActive }) =>
                ['app-link', isActive ? 'active' : ''].join(' ').trim()
              }
            >
              Settings
            </NavLink>
          </nav>

          <div className="app-header-right">
            <NavLink to={ROUTES.DASHBOARD} className="app-back-link">
              ← User View
            </NavLink>
            <button className="icon-btn" title="Search">🔍</button>
            <button className="icon-btn" title="Notifications">🔔</button>
            <div className="avatar">{getInitials(user)}</div>
            <button className="icon-btn" title="Logout" onClick={handleLogout}>🚪</button>
          </div>
        </div>
      </header>
    )
  }

  /* ── Logged-in navbar ── */
  if (isAuthenticated) {
    return (
      <header className="app-header">
        <div className="app-header-inner">
          <div
            className="app-brand"
            role="button"
            tabIndex={0}
            onClick={() => navigate(ROUTES.HOME)}
          >
            AISKIM
          </div>

          <nav className="app-nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  ['app-link', isActive ? 'active' : ''].join(' ').trim()
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to={ROUTES.ADMIN_DASHBOARD}
                className={({ isActive }) =>
                  ['app-link', isActive ? 'active' : ''].join(' ').trim()
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          <div className="app-header-right">
            <button className="icon-btn" title="Notifications">🔔</button>
            <div className="avatar">{getInitials(user)}</div>
            <button className="icon-btn" title="Logout" onClick={handleLogout}>🚪</button>
          </div>
        </div>
      </header>
    )
  }

  /* ── Public navbar (guest) ── */
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to={ROUTES.HOME} className="site-brand">
          AISKIM
        </NavLink>

        <nav className="site-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                ['site-link', isActive ? 'active' : ''].join(' ').trim()
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-actions">
          <NavLink to={ROUTES.LOGIN} className="btn btn-primary">
            Login
          </NavLink>
        </div>
      </div>
    </header>
  )
}
