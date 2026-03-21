import { Outlet, useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/Button'

export function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const commonLinks = [
    { to: ROUTES.DASHBOARD, label: 'Dashboard' },
    { to: ROUTES.ACCOUNT, label: 'Account' },
  ]

  const adminLinks = [
    { to: ROUTES.ADMIN_DASHBOARD, label: 'Admin Dashboard' },
    { to: ROUTES.ADMIN_REPORTS, label: 'Reports' },
    { to: ROUTES.ADMIN_USERS, label: 'Users' },
    { to: ROUTES.ADMIN_REVENUE, label: 'Revenue' },
  ]

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand" role="button" tabIndex={0} onClick={() => navigate(ROUTES.HOME)}>
          AISKIM
        </div>
        <nav className="app-nav">
          {commonLinks.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) => ['app-link', isActive ? 'active' : ''].join(' ').trim()}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin
            ? adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  className={({ isActive }) => ['app-link', isActive ? 'active' : ''].join(' ').trim()}
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ))
            : null}
        </nav>
        <div className="app-header-right">
          <span className="app-user">{user?.email}</span>
          <Button
            variant="secondary"
            onClick={() => {
              logout()
              navigate(ROUTES.HOME)
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
