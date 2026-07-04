import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'
import { appApi } from '../services/appApi'

/* ── Helpers ── */
function getInitials(user) {
  if (user?.name) return user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  if (user?.email) return user.email.slice(0, 2).toUpperCase()
  return 'AI'
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'vừa xong'
  if (h < 24) return `${h}h trước`
  return `${Math.floor(h / 24)}n trước`
}

/* ── Icons (must be defined before NAV arrays) ── */
function HomeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function SearchIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function StarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8z" />
    </svg>
  )
}

function PriceIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function SupportIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ReportIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function DatabaseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}



function UsersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SettingsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

/* ── Navigation arrays (icons must be defined above) ── */
const USER_NAV = [
  { to: ROUTES.DASHBOARD,    label: 'Tổng quan',      icon: HomeIcon },
  { to: ROUTES.ANALYSIS,     label: 'Phân tích',      icon: SearchIcon },
  { to: ROUTES.DATA_SOURCES, label: 'Nguồn dữ liệu', icon: DatabaseIcon },
  { to: ROUTES.DEEP_INSIGHT, label: 'Deep Insight',   icon: StarIcon },
  { to: ROUTES.REPORTS,      label: 'Báo cáo',        icon: ReportIcon },
  { to: ROUTES.PRICING,      label: 'Gói dịch vụ',   icon: PriceIcon, badge: 'FREE' },
  { to: ROUTES.SUPPORT,      label: 'Hỗ trợ',        icon: SupportIcon },
]

const PUBLIC_NAV = [
  { to: ROUTES.HOME,     label: 'Tổng quan',    icon: HomeIcon },
  { to: ROUTES.ANALYSIS, label: 'Phân tích',    icon: SearchIcon },
  { to: ROUTES.PRICING,  label: 'Gói dịch vụ', icon: PriceIcon, badge: 'FREE' },
  { to: ROUTES.SUPPORT,  label: 'Hỗ trợ',      icon: SupportIcon },
]

const ADMIN_NAV = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Tổng quan',  icon: HomeIcon },
  { to: ROUTES.ADMIN_REPORTS,   label: 'Báo cáo',    icon: ReportIcon },
  { to: ROUTES.ADMIN_USERS,     label: 'Người dùng', icon: UsersIcon },
  { to: ROUTES.ADMIN_REVENUE,   label: 'Doanh thu',  icon: PriceIcon },
  { to: ROUTES.ADMIN_FEEDBACKS, label: 'Phản hồi',   icon: SupportIcon },
  { to: ROUTES.ADMIN_SETTINGS,  label: 'Cài đặt',    icon: SettingsIcon },
]

/* ── Sidebar component ── */
export function Sidebar({ isOpen, onClose }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [planInfo, setPlanInfo] = useState(null)

  const isAdmin = user?.role === 'admin'
  const isOnAdminPage = location.pathname.startsWith('/admin')
  const nav = isOnAdminPage && isAdmin ? ADMIN_NAV : isAuthenticated ? USER_NAV : PUBLIC_NAV

  useEffect(() => {
    if (!isAuthenticated) return
    appApi.getDashboard()
      .then(d => {
        if (d?.plan) setPlanInfo(d.plan)
      })
      .catch(() => {})
  }, [isAuthenticated])



  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
    onClose?.()
  }

  const usedSearches = planInfo?.usedSearches ?? 0
  const limitSearches = planInfo?.totalSearches ?? 0
  const usagePct = limitSearches > 0 ? Math.min(100, Math.round((usedSearches / limitSearches) * 100)) : 0

  return (
    <aside className={`app-sidebar${isOpen ? ' open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <svg
          className="sidebar-brand-svg"
          width="28"
          height="28"
          viewBox="0 0 64 64"
          fill="none"
          onClick={() => { navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME); onClose?.() }}
          style={{ cursor: 'pointer' }}
        >
          <circle cx="28" cy="28" r="20" stroke="#a29bfe" strokeWidth="5.5" fill="rgba(255,255,255,0.08)" />
          <rect x="18" y="28" width="4.5" height="10" rx="2" fill="#a29bfe" />
          <rect x="25" y="22" width="4.5" height="16" rx="2" fill="#a29bfe" />
          <rect x="32" y="16" width="4.5" height="22" rx="2" fill="#a29bfe" />
          <path d="M38 18c0-2 1-3 3-3c-2 0-3-1-3-3c0 2-1 3-3 3c2 0 3 1 3 3z" fill="#a29bfe" />
          <path d="M43 12c0-1 .5-1.5 1.5-1.5c-1 0-1.5-.5-1.5-1.5c0 1-.5 1.5-1.5 1.5c1 0 1.5.5 1.5 1.5z" fill="#a29bfe" />
          <line x1="42" y1="42" x2="54" y2="54" stroke="#a29bfe" strokeWidth="6" strokeLinecap="round" />
        </svg>
        <span className="sidebar-brand-name" style={{ marginLeft: 8 }}>
          <span style={{ color: '#fff' }}>SKIM</span> <span style={{ color: '#a29bfe' }}>AI</span>
        </span>
        {isOnAdminPage && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 7px', borderRadius: 99 }}>
            Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label" style={{ paddingTop: 4 }}>Workspace</div>
        {isAdmin && (
          <button
            onClick={() => { navigate(isOnAdminPage ? ROUTES.DASHBOARD : ROUTES.ADMIN_DASHBOARD); onClose?.() }}
            className="sidebar-nav-item"
            style={{
              color: 'var(--accent)',
              background: 'var(--accent-bg)',
              marginBottom: 8,
              border: '1px dashed rgba(13, 148, 136, 0.25)',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <SettingsIcon size={16} />
            <span style={{ flex: 1, fontWeight: 700 }}>
              {isOnAdminPage ? 'Giao diện User' : 'Trang quản trị Admin'}
            </span>
          </button>
        )}
        {nav.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            onClick={() => onClose?.()}
          >
            <Icon size={16} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: 99 }}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}


        {!isAuthenticated && (
          <div style={{ marginTop: 16, padding: '0 11px' }}>
            <NavLink
              to={ROUTES.LOGIN}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
              onClick={() => onClose?.()}
            >
              Đăng nhập
            </NavLink>
          </div>
        )}
      </nav>

      {/* Plan usage */}
      {isAuthenticated && (
        <div className="sidebar-plan-card">
          <div className="sidebar-plan-header">
            <span>{planInfo?.planName ?? 'Free'} · Searches</span>
            <span>{usedSearches}/{limitSearches > 0 ? limitSearches : '∞'}</span>
          </div>
          {limitSearches > 0 && (
            <div className="sidebar-plan-bar">
              <div className="sidebar-plan-bar-fill" style={{ width: `${usagePct}%` }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: limitSearches > 0 ? 0 : 8 }}>
            <button
              className="sidebar-plan-upgrade"
              onClick={() => { navigate(ROUTES.PRICING); onClose?.() }}
            >
              Nâng cấp →
            </button>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,.5)', fontFamily: 'inherit' }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export function SidebarLayout({ children, pageTitle, pageSubtitle, actions }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const getHeaderInfo = () => {
    if (pageTitle) return { title: pageTitle, subtitle: pageSubtitle }
    
    const path = location.pathname
    if (path.startsWith('/admin/dashboard')) return { title: 'Tổng quan hệ thống', subtitle: 'Báo cáo thông số và dữ liệu admin' }
    if (path.startsWith('/admin/reports')) return { title: 'Quản lý báo cáo', subtitle: 'Danh sách và kiểm duyệt báo cáo' }
    if (path.startsWith('/admin/users')) return { title: 'Quản lý người dùng', subtitle: 'Danh sách tài khoản và phân quyền' }
    if (path.startsWith('/admin/revenue')) return { title: 'Quản lý doanh thu', subtitle: 'Doanh số và giao dịch gói cước' }
    if (path.startsWith('/admin/feedbacks')) return { title: 'Xử lý phản hồi', subtitle: 'Danh sách yêu cầu hỗ trợ và giải đáp' }
    if (path.startsWith('/admin/settings')) return { title: 'Cài đặt hệ thống', subtitle: 'Cấu hình tham số và kết nối' }

    if (path.startsWith('/dashboard')) return { title: 'Tổng quan', subtitle: 'Theo dõi hoạt động và chỉ số nghiên cứu của bạn' }
    if (path.startsWith('/analysis')) return { title: 'Phân tích thị trường', subtitle: 'Quét xu hướng, tổng hợp tin tức và lập báo cáo tự động' }
    if (path.startsWith('/data-sources')) return { title: 'Nguồn dữ liệu', subtitle: 'Quản lý các nguồn dữ liệu cấp thông tin nghiên cứu' }
    if (path.startsWith('/deep-insight')) return { title: 'Deep Insight', subtitle: 'Phân tích đa chiều nâng cao (SWOT, Persona, APA)' }
    if (path.startsWith('/reports')) return { title: 'Báo cáo của tôi', subtitle: 'Danh sách các báo cáo đã tạo và tùy chọn tải về' }
    if (path.startsWith('/pricing')) return { title: 'Gói dịch vụ', subtitle: 'Nâng cấp gói tài khoản để mở rộng hạn ngạch tìm kiếm' }
    if (path.startsWith('/support')) return { title: 'Hỗ trợ kỹ thuật', subtitle: 'Gửi yêu cầu hỗ trợ hoặc đóng góp ý kiến nâng cấp' }
    if (path.startsWith('/account')) return { title: 'Cài đặt tài khoản', subtitle: 'Quản lý thông tin hồ sơ và bảo mật cá nhân' }
    
    return { title: null, subtitle: null }
  }
  
  const { title: resolvedTitle, subtitle: resolvedSubtitle } = getHeaderInfo()

  return (
    <div className="sidebar-shell">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="sidebar-main">
        <header className="sidebar-topbar">
          <div style={{ flex: 1, minWidth: 0 }}>
            {resolvedTitle && <div className="sidebar-topbar-title">{resolvedTitle}</div>}
            {resolvedSubtitle && <div className="sidebar-topbar-sub">{resolvedSubtitle}</div>}
          </div>
          <div className="sidebar-topbar-actions">
            {actions}
            <button
              onClick={() => navigate(ROUTES.ANALYSIS)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--dark)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              Tìm kiếm mới
            </button>

            {isAuthenticated && (
              <div
                className="sidebar-avatar"
                onClick={() => navigate(ROUTES.ACCOUNT)}
                title="Tài khoản"
              >
                {getInitials(user)}
              </div>
            )}
          </div>
        </header>

        <div className="sidebar-content">
          {children}
        </div>
      </div>

      <button
        className="sidebar-mobile-toggle"
        onClick={() => setSidebarOpen(true)}
        aria-label="Mở menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  )
}
