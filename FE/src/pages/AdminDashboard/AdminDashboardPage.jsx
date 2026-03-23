import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { AdminSectionNav } from '../../components/AdminSectionNav'

export function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const stats = data?.stats ?? []

  const statMap = useMemo(
    () =>
      stats.reduce((acc, item) => {
        acc[item.label] = Number(item.value) || 0
        return acc
      }, {}),
    [stats],
  )

  const workflowCards = [
    {
      label: 'Moderation queue',
      value: statMap.Reports ?? 0,
      note: 'Review pending or draft reports before publishing.',
      to: ROUTES.ADMIN_REPORTS,
    },
    {
      label: 'User health',
      value: statMap.Users ?? 0,
      note: 'Monitor usage and subscription mix across user segments.',
      to: ROUTES.ADMIN_USERS,
    },
    {
      label: 'Revenue watch',
      value: statMap.Subscriptions ?? 0,
      note: 'Track active subscriptions and payment quality.',
      to: ROUTES.ADMIN_REVENUE,
    },
  ]

  useEffect(() => {
    appApi.getAdminDashboard().then(setData)
  }, [])

  return (
    <div className="stack page-wrap">
      <AdminSectionNav />

      <section className="dashboard-hero card">
        <div className="dashboard-hero-copy">
          <p className="dashboard-kicker">Admin command center</p>
          <h1>Admin Dashboard</h1>
          <p className="hint">Operate moderation, user quality, and revenue signals in one flow.</p>
        </div>
        <div className="dashboard-hero-panel">
          <div className="dashboard-hero-pill">Admin workspace</div>
          <div className="dashboard-hero-meta">
            <strong>{(data?.activities ?? []).length}</strong>
            <span>recent operational events</span>
          </div>
        </div>
      </section>

      <div className="grid grid-5">
        {stats.map((item) => (
          <Card key={item.label} title={item.label}>
            <div className="kpi">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-3">
        {workflowCards.map((card) => (
          <Card key={card.label} title={card.label}>
            <div className="stack">
              <div className="kpi">{card.value}</div>
              <p className="hint">{card.note}</p>
              <Link className="btn btn-secondary btn-sm" to={card.to}>
                Open
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Recent Activity">
        <ul className="list">
          {(data?.activities ?? []).map((activity) => (
            <li key={activity}>{activity}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
