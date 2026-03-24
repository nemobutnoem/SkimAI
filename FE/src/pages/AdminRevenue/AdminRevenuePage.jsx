import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

export function AdminRevenuePage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    appApi.getAdminRevenue().then(setData)
  }, [])

  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Admin Revenue</h1>
          <p className="hint">Finance operations view: monitor MRR, payment quality, and subscription events.</p>
        </div>
      </div>

      <div className="grid grid-4">
        {(data?.metrics ?? []).map((item) => (
          <Card key={item.label} title={item.label}>
            <div className="kpi">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-2">
        <Card title="Revenue by Channel">
          <div className="stack">
            {(data?.channels ?? []).map((channel) => (
              <div key={channel.name} className="list-item">
                <span>{channel.name}</span>
                <span>
                  {channel.amount} ({channel.pct}%)
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Subscription Events">
          <div className="hint" style={{ marginBottom: 12 }}>
            Latest transactions from billing flow.
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Event</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.events ?? []).map((event) => (
                <tr key={event.id}>
                  <td>{event.user}</td>
                  <td>{event.event}</td>
                  <td>{event.plan}</td>
                  <td>{event.amount}</td>
                  <td>
                    <span className={['badge', `badge-${event.status}`].join(' ')}>{event.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
