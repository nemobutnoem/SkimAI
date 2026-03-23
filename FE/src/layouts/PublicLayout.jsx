import { NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

export function PublicLayout() {
  const { isAuthenticated, user } = useAuth()

  const navLinks = [
    { to: ROUTES.HOME, label: 'Overview' },
    { to: ROUTES.ANALYSIS, label: 'Market Research' },
    { to: ROUTES.ASK_EXPERT, label: 'Ask Expert' },
    { to: ROUTES.PRICING, label: 'Pricing' },
  ]

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to={ROUTES.HOME} className="site-brand">
            AISKIM
          </NavLink>

          <nav className="site-nav">
            {navLinks.map((link) => (
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
            {isAuthenticated ? (
              <>
                <span className="site-user-pill">{user?.name ?? user?.email}</span>
                <NavLink to={ROUTES.DASHBOARD} className="btn btn-secondary">
                  Workspace
                </NavLink>
              </>
            ) : (
              <NavLink to={ROUTES.LOGIN} className="btn btn-primary">
                Login
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
