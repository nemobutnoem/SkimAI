import { Card } from '../../components/Card'

export function AdminSettingsPage() {
  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Admin Settings</h1>
          <p className="hint">System configuration and application preferences.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <Card title="General">
          <div className="stack">
            <div className="list-item">
              <span>App Name</span>
              <span><strong>AISKIM</strong></span>
            </div>
            <div className="list-item">
              <span>Default Language</span>
              <span>English</span>
            </div>
            <div className="list-item">
              <span>Timezone</span>
              <span>UTC+7</span>
            </div>
          </div>
        </Card>

        <Card title="Notifications">
          <div className="stack">
            <div className="list-item">
              <span>Email notifications</span>
              <span className="badge badge-active">Enabled</span>
            </div>
            <div className="list-item">
              <span>Alert on failed payments</span>
              <span className="badge badge-active">Enabled</span>
            </div>
            <div className="list-item">
              <span>Weekly digest</span>
              <span className="badge badge-draft">Disabled</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="API & Integrations">
        <div className="stack">
          <div className="list-item">
            <span>SerpAPI</span>
            <span className="badge badge-active">Connected</span>
          </div>
          <div className="list-item">
            <span>OpenAI</span>
            <span className="badge badge-active">Connected</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
