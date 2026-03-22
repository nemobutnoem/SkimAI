import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

export function AdminDashboardPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    appApi.getAdminDashboard().then(setData)
  }, [])

  return (
    <div className="stack page-wrap">
      <h1>Admin Dashboard</h1>

      <div className="grid grid-5">
        {(data?.stats ?? []).map((item) => (
          <Card key={item.label} title={item.label}>
            <div className="kpi">{item.value}</div>
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
