import { NavLink } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

const ADMIN_LINKS = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.ADMIN_REPORTS, label: 'Reports' },
  { to: ROUTES.ADMIN_USERS, label: 'Users' },
  { to: ROUTES.ADMIN_REVENUE, label: 'Revenue' },
]

export function AdminSectionNav() {
  return (
    <div className="admin-section-nav">
      {ADMIN_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            ['admin-section-link', isActive ? 'active' : ''].join(' ').trim()
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  )
}
