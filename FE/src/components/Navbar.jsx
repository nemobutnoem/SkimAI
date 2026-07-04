import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

const PUBLIC_LINKS = [
  { to: ROUTES.HOME, label: 'Tổng quan' },
  { to: ROUTES.ANALYSIS, label: 'Nghiên cứu thị trường' },
  { to: ROUTES.PRICING, label: 'Bảng giá' },
  { to: ROUTES.SUPPORT, label: 'Hỗ trợ' },
]

const USER_LINKS = [
  { to: ROUTES.HOME, label: 'Tổng quan' },
  { to: ROUTES.DASHBOARD, label: 'Workspace' },
  { to: ROUTES.ANALYSIS, label: 'Nghiên cứu thị trường' },
  { to: ROUTES.DEEP_INSIGHT, label: 'Deep Insight' },
  { to: ROUTES.PRICING, label: 'Bảng giá' },
  { to: ROUTES.SUPPORT, label: 'Hỗ trợ' },
  { to: ROUTES.ACCOUNT, label: 'Tài khoản' },
]

const ADMIN_LINKS = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Tổng quan' },
  { to: ROUTES.ADMIN_REPORTS, label: 'Báo cáo' },
  { to: ROUTES.ADMIN_USERS, label: 'Người dùng' },
  { to: ROUTES.ADMIN_REVENUE, label: 'Doanh thu' },
  { to: ROUTES.ADMIN_FEEDBACKS, label: 'Phản hồi' },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Cài đặt' },
]

function getInitials(user) {
  if (user?.name) return user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  if (user?.email) return user.email.slice(0, 2).toUpperCase()
  return 'AD'
}

function AvatarDropdown({ user, isAdmin, isOnAdminPage, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="avatar-dropdown" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen(!open)}>
        <div className="avatar">{getInitials(user)}</div>
        <span className="avatar-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <strong>{user?.name || user?.email || 'Người dùng'}</strong>
            {user?.email && <span className="dropdown-email">{user.email}</span>}
          </div>
          <div className="dropdown-divider" />
          {isAdmin && isOnAdminPage && (
            <button className="dropdown-item" onClick={() => { navigate(ROUTES.ADMIN_SETTINGS); setOpen(false) }}>⚙️ Cài đặt</button>
          )}
          {isAdmin && !isOnAdminPage && (
            <button className="dropdown-item" onClick={() => { navigate(ROUTES.ACCOUNT); setOpen(false) }}>👤 Tài khoản</button>
          )}
          {!isAdmin && (
            <button className="dropdown-item" onClick={() => { navigate(ROUTES.ACCOUNT); setOpen(false) }}>👤 Tài khoản</button>
          )}
          <div className="dropdown-divider" />
          <button className="dropdown-item dropdown-item-danger" onClick={() => { onLogout(); setOpen(false) }}>🚪 Đăng xuất</button>
        </div>
      )}
    </div>
  )
}

function HamburgerMenu({ links, extraLinks = [], user, isAuthenticated, isAdmin, isOnAdminPage, onLogout, onClose }) {
  const navigate = useNavigate()
  return (
    <>
      <div className="mobile-overlay" onClick={onClose} />
      <div className="mobile-menu">
        <div className="mobile-menu-header">
          <span className="mobile-menu-brand">
            <span className="text-skim">SKIM</span> <span className="text-ai">AI</span>
          </span>
          <button className="mobile-menu-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <nav className="mobile-menu-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              {link.label}
            </NavLink>
          ))}
          {extraLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mobile-menu-footer">
          {isAuthenticated ? (
            <>
              {user && (
                <div className="mobile-menu-user">
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{getInitials(user)}</div>
                  <div>
                    <strong>{user?.name || 'Người dùng'}</strong>
                    {user?.email && <span>{user.email}</span>}
                  </div>
                </div>
              )}
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={() => { onLogout(); onClose() }}>
                Đăng xuất
              </button>
            </>
          ) : (
            <NavLink to={ROUTES.LOGIN} className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={onClose}>
              Đăng nhập
            </NavLink>
          )}
        </div>
      </div>
    </>
  )
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isOnAdminPage = location.pathname.startsWith('/admin')

  const links = isOnAdminPage ? ADMIN_LINKS : isAuthenticated ? USER_LINKS : PUBLIC_LINKS

  const handleLogout = () => { logout(); navigate(ROUTES.HOME) }

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const adminExtraLinks = isAdmin && !isOnAdminPage ? [{ to: ROUTES.ADMIN_DASHBOARD, label: 'Admin' }] : []

  /* ── Admin navbar ── */
  if (isOnAdminPage && isAdmin) {
    return (
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand" role="button" tabIndex={0} onClick={() => navigate(ROUTES.HOME)}>
            <svg className="app-brand-svg" width="28" height="28" viewBox="0 0 64 64" fill="none">
              <circle cx="28" cy="28" r="20" stroke="#5f27cd" strokeWidth="5.5" fill="#f3f0ff" />
              <rect x="18" y="28" width="4.5" height="10" rx="2" fill="#5f27cd" />
              <rect x="25" y="22" width="4.5" height="16" rx="2" fill="#5f27cd" />
              <rect x="32" y="16" width="4.5" height="22" rx="2" fill="#5f27cd" />
              <path d="M38 18c0-2 1-3 3-3c-2 0-3-1-3-3c0 2-1 3-3 3c2 0 3 1 3 3z" fill="#9b5de5" />
              <path d="M43 12c0-1 .5-1.5 1.5-1.5c-1 0-1.5-.5-1.5-1.5c0 1-.5 1.5-1.5 1.5c1 0 1.5.5 1.5 1.5z" fill="#9b5de5" />
              <line x1="42" y1="42" x2="54" y2="54" stroke="#5f27cd" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span className="app-brand-text">
              <span className="text-skim">SKIM</span> <span className="text-ai">AI</span>
            </span>
          </div>
          <span className="admin-section-badge">Admin</span>
          <nav className="app-nav">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => ['app-link', isActive ? 'active' : ''].join(' ').trim()}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="app-header-right">
            <NavLink to={ROUTES.DASHBOARD} className="app-back-link">← Giao diện User</NavLink>
            <AvatarDropdown user={user} isAdmin={isAdmin} isOnAdminPage={isOnAdminPage} onLogout={handleLogout} />
          </div>
          <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
            <span /><span /><span />
          </button>
        </div>
        {mobileOpen && <HamburgerMenu links={links} user={user} isAuthenticated={isAuthenticated} isAdmin={isAdmin} isOnAdminPage={isOnAdminPage} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />}
      </header>
    )
  }

  /* ── Logged-in navbar ── */
  if (isAuthenticated) {
    return (
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand" role="button" tabIndex={0} onClick={() => navigate(ROUTES.HOME)}>
            <svg className="app-brand-svg" width="28" height="28" viewBox="0 0 64 64" fill="none">
              <circle cx="28" cy="28" r="20" stroke="#5f27cd" strokeWidth="5.5" fill="#f3f0ff" />
              <rect x="18" y="28" width="4.5" height="10" rx="2" fill="#5f27cd" />
              <rect x="25" y="22" width="4.5" height="16" rx="2" fill="#5f27cd" />
              <rect x="32" y="16" width="4.5" height="22" rx="2" fill="#5f27cd" />
              <path d="M38 18c0-2 1-3 3-3c-2 0-3-1-3-3c0 2-1 3-3 3c2 0 3 1 3 3z" fill="#9b5de5" />
              <path d="M43 12c0-1 .5-1.5 1.5-1.5c-1 0-1.5-.5-1.5-1.5c0 1-.5 1.5-1.5 1.5c1 0 1.5.5 1.5 1.5z" fill="#9b5de5" />
              <line x1="42" y1="42" x2="54" y2="54" stroke="#5f27cd" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span className="app-brand-text">
              <span className="text-skim">SKIM</span> <span className="text-ai">AI</span>
            </span>
          </div>
          <nav className="app-nav">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => ['app-link', isActive ? 'active' : ''].join(' ').trim()}>
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to={ROUTES.ADMIN_DASHBOARD} className={({ isActive }) => ['app-link', isActive ? 'active' : ''].join(' ').trim()}>
                Admin
              </NavLink>
            )}
          </nav>
          <div className="app-header-right">
            <AvatarDropdown user={user} isAdmin={isAdmin} isOnAdminPage={isOnAdminPage} onLogout={handleLogout} />
          </div>
          <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
            <span /><span /><span />
          </button>
        </div>
        {mobileOpen && <HamburgerMenu links={links} extraLinks={adminExtraLinks} user={user} isAuthenticated={isAuthenticated} isAdmin={isAdmin} isOnAdminPage={isOnAdminPage} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />}
      </header>
    )
  }

  /* ── Public navbar (guest) ── */
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand" role="button" tabIndex={0} onClick={() => navigate(ROUTES.HOME)}>
          <svg className="app-brand-svg" width="28" height="28" viewBox="0 0 64 64" fill="none">
            <circle cx="28" cy="28" r="20" stroke="#5f27cd" strokeWidth="5.5" fill="#f3f0ff" />
            <rect x="18" y="28" width="4.5" height="10" rx="2" fill="#5f27cd" />
            <rect x="25" y="22" width="4.5" height="16" rx="2" fill="#5f27cd" />
            <rect x="32" y="16" width="4.5" height="22" rx="2" fill="#5f27cd" />
            <path d="M38 18c0-2 1-3 3-3c-2 0-3-1-3-3c0 2-1 3-3 3c2 0 3 1 3 3z" fill="#9b5de5" />
            <path d="M43 12c0-1 .5-1.5 1.5-1.5c-1 0-1.5-.5-1.5-1.5c0 1-.5 1.5-1.5 1.5c1 0 1.5.5 1.5 1.5z" fill="#9b5de5" />
            <line x1="42" y1="42" x2="54" y2="54" stroke="#5f27cd" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <span className="app-brand-text">
            <span className="text-skim">SKIM</span> <span className="text-ai">AI</span>
          </span>
        </div>
        <nav className="app-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => ['app-link', isActive ? 'active' : ''].join(' ').trim()}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-header-right">
          <NavLink to={ROUTES.LOGIN} className="btn btn-primary">Đăng nhập</NavLink>
        </div>
        <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
          <span /><span /><span />
        </button>
      </div>
      {mobileOpen && <HamburgerMenu links={links} user={user} isAuthenticated={isAuthenticated} isAdmin={isAdmin} isOnAdminPage={isOnAdminPage} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />}
    </header>
  )
}
