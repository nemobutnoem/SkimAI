import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { mockApi } from '../../services/mockApi'

export function AdminRevenuePage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    mockApi.getAdminRevenue().then(setData)
  }, [])

  return (
    <div className="stack page-wrap">
      <h1>Admin Revenue</h1>

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
