import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

/* ─── Stat card config with icons and colors ─── */
const STAT_CONFIG = {
  Users:         { icon: '👥', bg: 'var(--primary-bg, #f0edff)', color: 'var(--primary)', change: '+12.5%' },
  Premium:       { icon: '⭐', bg: 'var(--orange-light, #fef0e6)', color: '#E17055', change: '+8.2%' },
  Revenue:       { icon: '💰', bg: 'var(--green-light, #e8f8e8)', color: 'var(--green)', change: '+5.3%' },
  Reports:       { icon: '📊', bg: 'var(--blue-light, #e8f0ff)', color: 'var(--blue)', change: '+15%' },
  Churn:         { icon: '📉', bg: 'var(--red-light, #fde8e8)', color: 'var(--red)', change: '-0.5%', negative: true },
  Subscriptions: { icon: '💎', bg: 'var(--primary-bg, #f0edff)', color: 'var(--primary)', change: '+6%' },
}

/* ─── Chart bar helper ─── */
function MiniBarChart({ data, color }) {
  const max = Math.max(...data)
  return (
    <div className="admin-mini-bars">
      {data.map((v, i) => (
        <div key={i} className="admin-mini-bar" style={{
          height: `${(v / max) * 100}%`,
          background: color || 'var(--primary)',
        }} />
      ))}
    </div>
  )
}

/* ─── Activity feed ─── */
const ACTIVITY_FEED = [
  { label: 'Premium Upgrade', desc: 'New premium user subscribed', time: '2 minutes ago', color: 'var(--primary)' },
  { label: 'New Signup', desc: '5 new users joined in the last hour', time: '15 minutes ago', color: 'var(--green)' },
  { label: 'Cancellation', desc: 'Premium subscription cancelled', time: '1 hour ago', color: 'var(--orange, #e17055)' },
  { label: 'Payment Failed', desc: 'Billing payment requires attention', time: '3 hours ago', color: 'var(--red)' },
]

/* ─── Pending requests ─── */
const PENDING_REQUESTS = [
  { user: 'Jane Smith', type: 'Market Analysis', status: 'Pending', action: 'Approve', badge: 'badge-pending' },
  { user: 'Lisa Wang', type: 'Competitor Research', status: 'Pending', action: 'Review', badge: 'badge-pending' },
  { user: 'David Kim', type: 'Industry Report', status: 'Processing', action: 'Pending', badge: 'badge-draft' },
]

const REVENUE_DATA = [180, 195, 210, 225, 235, 247]
const GROWTH_DATA = [12, 14, 15.5, 17, 19, 21, 24.5]

export function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const stats = data?.stats ?? []
  const activities = data?.activities ?? []

  useEffect(() => {
    appApi.getAdminDashboard().then(setData)
  }, [])

  /* merge with live activities if available */
  const activityList = activities.length > 0
    ? activities.map((a, i) => ({
        label: a,
        desc: '',
        time: `${i + 1}m ago`,
        color: ['var(--primary)', 'var(--green)', 'var(--orange, #e17055)', 'var(--red)'][i % 4],
      }))
    : ACTIVITY_FEED

  return (
    <div className="admin-dash">
      {/* ── Stats Row ── */}
      <div className="admin-stats-row">
        {stats.map((item) => {
          const cfg = STAT_CONFIG[item.label] ?? STAT_CONFIG.Users
          return (
            <div key={item.label} className="admin-stat-card card">
              <div className="admin-stat-content">
                <div className="admin-stat-label">{item.label}</div>
                <div className="admin-stat-value">{item.value}</div>
                <div className={`admin-stat-change ${cfg.negative ? 'negative' : 'positive'}`}>
                  {cfg.change} vs last month
                </div>
              </div>
              <div className="admin-stat-icon" style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.icon}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Charts Row (User Growth + Account Distribution) ── */}
      <div className="admin-charts-row">
        <Card title="User Growth Over Time">
          <div className="admin-chart-area">
            <MiniBarChart data={GROWTH_DATA} color="var(--primary)" />
            <div className="admin-chart-labels">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Account Distribution">
          <div className="admin-donut-wrap">
            <div className="admin-donut">
              <div className="admin-donut-ring" />
              <div className="admin-donut-center">
                <strong>33%</strong>
                <span>Premium</span>
              </div>
            </div>
            <div className="admin-donut-legend">
              <span><i style={{ background: '#CED4DA' }} /> Standard — 67%</span>
              <span><i style={{ background: 'var(--primary)' }} /> Premium — 33%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Monthly Revenue + Recent Activity ── */}
      <div className="admin-two-equal">
        <Card title="Monthly Revenue">
          <div className="admin-chart-area">
            <MiniBarChart data={REVENUE_DATA} color="var(--primary)" />
            <div className="admin-chart-labels">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Recent Activity">
          <div className="admin-activity-list">
            {activityList.map((item, i) => (
              <div key={i} className="admin-activity-item">
                <span className="admin-activity-dot" style={{ background: item.color }} />
                <div>
                  <div className="admin-activity-text">
                    <strong>{item.label}</strong>{item.desc ? ` — ${item.desc}` : ''}
                  </div>
                  <div className="admin-activity-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Pending Requests + Quick Actions ── */}
      <div className="admin-two-equal">
        <Card title="Pending Report Requests">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Report Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {PENDING_REQUESTS.map((r) => (
                <tr key={r.user}>
                  <td>{r.user}</td>
                  <td>{r.type}</td>
                  <td><span className={`badge ${r.badge}`}>{r.status}</span></td>
                  <td><Link to={ROUTES.ADMIN_REPORTS} className="admin-action-link">{r.action}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Quick Actions">
          <div className="admin-quick-actions">
            <Link to={ROUTES.ADMIN_REPORTS} className="admin-quick-item">
              <span>📊 Approve Reports</span><span>→</span>
            </Link>
            <Link to={ROUTES.ADMIN_SETTINGS} className="admin-quick-item">
              <span>⚙️ Manage Plans</span><span>→</span>
            </Link>
            <Link to={ROUTES.ADMIN_REVENUE} className="admin-quick-item danger">
              <span>⚠️ Failed Payments</span><span>→</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
