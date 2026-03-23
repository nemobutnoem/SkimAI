import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

export function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    appApi
      .getDashboard()
      .then((d) => {
        if (alive) setData(d)
      })
      .catch((e) => {
        if (alive) setError(e?.message ?? 'Load dashboard failed')
      })

    return () => {
      alive = false
    }
  }, [])

  const quickActions = [
    { label: 'Run new analysis', hint: 'Start a fresh keyword research flow', to: `${ROUTES.ANALYSIS}?keyword=AI Agent` },
    { label: 'Open pricing', hint: 'Compare plans and upgrade access', to: ROUTES.PRICING },
    { label: 'Manage account', hint: 'Review billing and notifications', to: ROUTES.ACCOUNT },
  ]

  return (
    <div className="stack page-wrap dashboard-shell">
      <section className="dashboard-hero card">
        <div className="dashboard-hero-copy">
          <p className="dashboard-kicker">Workspace overview</p>
          <h1>Dashboard</h1>
          <p className="hint">
            Keep track of your reports, active insights, and the latest research activity in one place.
          </p>
        </div>
        <div className="dashboard-hero-panel">
          <div className="dashboard-hero-pill">User workspace</div>
          <div className="dashboard-hero-meta">
            <strong>{data?.recent?.length ?? 0}</strong>
            <span>recent activity items</span>
          </div>
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid grid-3">
        {(data?.kpis ?? []).map((k) => (
          <Card key={k.label} className="dashboard-kpi-card">
            <div className="dashboard-kpi-label">{k.label}</div>
            <div className="dashboard-kpi-value">{k.value}</div>
            <div className="dashboard-kpi-note">Live summary from your workspace</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-2 dashboard-main-grid">
        <Card title="Quick Actions" className="dashboard-section-card">
          <div className="dashboard-action-list">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.to} className="dashboard-action-item">
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.hint}</p>
                </div>
                <span>Open</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Recent Activity" className="dashboard-section-card">
          <div className="dashboard-recent-list">
            {(data?.recent ?? []).length ? (
              (data?.recent ?? []).map((item) => (
                <div key={item.id} className="dashboard-recent-item">
                  <div>
                    <strong>{item.title}</strong>
                    <p>Tracked inside your market research workspace</p>
                  </div>
                  <time>{new Date(item.createdAt).toLocaleString()}</time>
                </div>
              ))
            ) : (
              <div className="dashboard-empty-state">
                No recent activity yet. Start a new analysis to populate this workspace.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
