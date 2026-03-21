import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
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

  return (
    <div className="stack">
      <h1>Dashboard</h1>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid">
        {(data?.kpis ?? []).map((k) => (
          <Card key={k.label} title={k.label}>
            <div className="kpi">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card title="Recent">
        <ul className="list">
          {(data?.recent ?? []).map((item) => (
            <li key={item.id} className="list-item">
              <span>{item.title}</span>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
