import { NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

export function PublicLayout() {
  const { isAuthenticated, user } = useAuth()

  const navLinks = [
    { to: ROUTES.HOME, label: 'Home' },
    { to: ROUTES.ANALYSIS, label: 'Analysis' },
    { to: ROUTES.DEEP_INSIGHT, label: 'Deep Insight' },
    { to: ROUTES.ASK_EXPERT, label: 'Ask Expert' },
    { to: ROUTES.PRICING, label: 'Pricing' },
  ]

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to={ROUTES.HOME} className="site-brand">
            SkimAI
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
                  App
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
