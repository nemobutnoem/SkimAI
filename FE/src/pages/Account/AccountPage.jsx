import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

export function AccountPage() {
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    appApi.getAccountOverview().then(setData)
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
      const notifications = await appApi.saveNotificationSettings(data.notifications)
      setData((prev) => ({ ...prev, notifications }))
    } finally {
      setSaving(false)
    }
  }

  const subscription = data?.subscription
  const billingDate = subscription?.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString() : 'Not scheduled'

  return (
    <div className="stack page-wrap account-shell">
      <section className="account-hero card">
        <div className="account-hero-copy">
          <p className="dashboard-kicker">Account workspace</p>
          <h1>Account & Billing</h1>
          <p className="hint">
            Manage your active plan, workspace usage, billing history, and notification preferences.
          </p>
        </div>
        <div className="account-plan-summary">
          <span className="account-plan-label">Active plan</span>
          <strong>{subscription?.planName ?? 'Free'}</strong>
          <span>{subscription?.billingCycle ?? 'monthly'} billing</span>
          <small>Renews {billingDate}</small>
        </div>
      </section>

      <div className="grid grid-2">
        <Card title="Profile" className="account-profile-card">
          <div className="account-profile-head">
            <div className="account-avatar">
              {(data?.profile?.name ?? 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{data?.profile?.name}</strong>
              <p>{data?.profile?.email}</p>
              <span className="hint">{data?.profile?.company}</span>
            </div>
          </div>

          {subscription ? (
            <div className="account-plan-pill">
              <span className="badge badge-success">{subscription.status}</span>
              <span>
                {subscription.planName} plan • {subscription.billingCycle} • Renews {billingDate}
              </span>
            </div>
          ) : null}
        </Card>

        <Card title="Workspace Usage" className="account-usage-card">
          <div className="stack account-usage-list">
            {(data?.usage ?? []).map((item) => (
              <div key={item.label} className="account-usage-item">
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

      <Card title="Billing History" className="account-billing-card">
        <div className="account-billing-list">
          {(data?.invoices ?? []).length ? (
            (data?.invoices ?? []).map((invoice) => (
              <div key={invoice.id} className="account-billing-item">
                <div>
                  <strong>{invoice.id}</strong>
                  <p>{invoice.date}</p>
                </div>
                <div className="account-billing-meta">
                  <strong>{invoice.amount}</strong>
                  <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="dashboard-empty-state">No billing records yet.</div>
          )}
        </div>
      </Card>

      <Card title="Notifications" className="account-notification-card">
        <div className="stack account-notification-list">
          {[
            ['emailUpdates', 'Email updates'],
            ['weeklyReport', 'Weekly reports'],
            ['usageAlerts', 'Usage alerts'],
          ].map(([key, label]) => (
            <label key={key} className="toggle-row">
              <div>
                <strong>{label}</strong>
                <p className="hint">Control how this workspace sends billing and research updates.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(data?.notifications?.[key])}
                onChange={() => toggle(key)}
              />
            </label>
          ))}

          <Button onClick={saveSettings} disabled={saving} className="account-save-btn">
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
