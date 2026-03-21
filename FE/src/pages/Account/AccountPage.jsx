import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { mockApi } from '../../services/mockApi'

export function AccountPage() {
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    mockApi.getAccountOverview().then(setData)
  }, [])

  const toggle = (key) => {
    setData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }))
  }

  const saveSettings = async () => {
    if (!data) return
    setSaving(true)
    try {
      const notifications = await mockApi.saveNotificationSettings(data.notifications)
      setData((prev) => ({ ...prev, notifications }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack page-wrap">
      <h1>Account & Billing</h1>

      <div className="grid grid-2">
        <Card title="Profile">
          <div className="stack">
            <strong>{data?.profile?.name}</strong>
            <span>{data?.profile?.email}</span>
            <span className="hint">{data?.profile?.company}</span>
          </div>
        </Card>

        <Card title="Usage">
          <div className="stack">
            {(data?.usage ?? []).map((item) => (
              <div key={item.label}>
                <div className="progress-label">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="progress-bar">
                  <span className="progress-fill" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Billing History">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.invoices ?? []).map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.id}</td>
                <td>{invoice.date}</td>
                <td>{invoice.amount}</td>
                <td>
                  <span className="badge badge-success">{invoice.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Notifications">
        <div className="stack">
          {[
            ['emailUpdates', 'Email updates'],
            ['weeklyReport', 'Weekly reports'],
            ['usageAlerts', 'Usage alerts'],
          ].map(([key, label]) => (
            <label key={key} className="toggle-row">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(data?.notifications?.[key])}
                onChange={() => toggle(key)}
              />
            </label>
          ))}

          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
