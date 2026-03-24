import { useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('packages')

  // Sample data for packages config
  const [packages, setPackages] = useState([
    {
      id: 'free',
      name: 'Free Tier',
      price: '$0',
      period: 'Forever',
      aiLimit: 5,
      features: 'Basic Market Research\n3 Days History\nStandard Support',
    },
    {
      id: 'standard',
      name: 'Standard (Pro)',
      price: '$20',
      period: '/ month',
      aiLimit: 50,
      features: 'Full Market Research\nDeep Insight Engine\n1 Year History\nPriority Support',
    },
    {
      id: 'premium',
      name: 'Premium / Teams',
      price: '$60',
      period: '/ month',
      aiLimit: 200,
      features: 'Everything in Standard\nAsk Expert (GPT-4o)\nAPI Access\nExport to PDF/CSV\nDedicated Manager',
    },
  ])

  const handlePackageChange = (id, field, value) => {
    setPackages(packages.map(pkg => pkg.id === id ? { ...pkg, [field]: value } : pkg))
  }

  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Admin Settings</h1>
          <p className="hint">Manage system preferences, AI configurations, pricing, and performance rules.</p>
        </div>
        <div className="tag-wrap">
          <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General & Notifications</button>
          <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>Content & AI Quality</button>
          <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>System Performance</button>
          <button className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => setActiveTab('packages')}>⭐ Plans & Subscriptions</button>
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-2">
          <Card title="General Preferences">
            <div className="stack">
              <label className="field">
                <span>App Name</span>
                <input defaultValue="AISKIM" />
              </label>
              <label className="field">
                <span>Primary Language</span>
                <select defaultValue="en">
                  <option value="en">English (US)</option>
                  <option value="vi">Vietnamese (VN)</option>
                </select>
              </label>
              <div className="flex-row">
                <Button>Save Changes</Button>
              </div>
            </div>
          </Card>
          <Card title="Alerts & Notifications">
            <div className="stack">
              <label className="login-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Notify Admin on failed payments</span>
              </label>
              <label className="login-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Notify Admin on new Premium signups</span>
              </label>
              <label className="login-checkbox">
                <input type="checkbox" />
                <span>Send weekly digest emails</span>
              </label>
              <div className="flex-row">
                <Button>Update Settings</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="grid grid-2">
          <Card title="AI Models & Integrations">
            <div className="stack">
              <label className="field">
                <span>OpenAI Model Generation</span>
                <select defaultValue="gpt-4o">
                  <option value="gpt-4o">GPT-4o (High Quality, Expensive)</option>
                  <option value="gpt-4o-mini">GPT-4o-mini (Fast, Cheap)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5-Turbo (Legacy)</option>
                </select>
              </label>
              <label className="field">
                <span>SerpAPI Key (Live Search)</span>
                <input type="password" defaultValue="sk-live-1234567890" />
              </label>
              <div className="list-item">
                <span>OpenAI Connection</span>
                <span className="badge badge-active">Connected ✔️</span>
              </div>
              <div className="list-item">
                <span>SerpAPI Connection</span>
                <span className="badge badge-active">Connected ✔️</span>
              </div>
              <div className="flex-row">
                <Button>Save Settings</Button>
              </div>
            </div>
          </Card>

          <Card title="Report Quality & Formatting">
            <div className="stack">
              <label className="field">
                <span>AI Temperature (0.0 to 1.0)</span>
                <input type="number" step="0.1" defaultValue="0.7" max="1" min="0" />
                <span className="hint">Lower = Strict/Factual, Higher = Creative</span>
              </label>
              <label className="field">
                <span>Analysis Strictness Level</span>
                <select defaultValue="strict">
                  <option value="loose">Loose (More extrapolating)</option>
                  <option value="strict">Strict (Only real data points)</option>
                </select>
              </label>
              <label className="field">
                <span>Default Report Length</span>
                <select defaultValue="standard">
                  <option value="short">Short (Bullet points)</option>
                  <option value="standard">Standard (Pages)</option>
                  <option value="deep">Deep Dive (Comprehensive)</option>
                </select>
              </label>
              <div className="flex-row">
                <Button>Apply Profile</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-2">
          <Card title="Caching & Rate Limits">
            <div className="stack">
              <label className="field">
                <span>Market Data Cache TTL (hours)</span>
                <input type="number" defaultValue="24" />
                <span className="hint">How long to reuse the same scraped results to save API costs.</span>
              </label>
              <label className="field">
                <span>Max API Calls per User (Daily)</span>
                <input type="number" defaultValue="100" />
                <span className="hint">Limit the number of deep insights a standard user can generate.</span>
              </label>
              <div className="flex-row">
                <Button>Update Limits</Button>
                <Button variant="secondary">Clear Cache Now</Button>
              </div>
            </div>
          </Card>

          <Card title="Background Jobs">
            <div className="stack">
              <div className="list-item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Trend Aggregation Worker</span>
                  <span className="hint">Scrapes Google Trends for hot keywords daily</span>
                </div>
                <span className="badge badge-active">Healthy</span>
              </div>
              <div className="list-item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Subscription Renewal Sync</span>
                  <span className="hint">Checks Stripe for payment statuses</span>
                </div>
                <span className="badge badge-active">Active</span>
              </div>
              <div className="list-item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Old Report Archiver</span>
                  <span className="hint">Moves 30-day old draft reports to cold storage</span>
                </div>
                <span className="badge badge-draft">Paused</span>
              </div>
              
              <div className="flex-row" style={{ marginTop: '16px' }}>
                <Button>Force Sync All Workers</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="stack">
          <Card title="Stripe Revenue Integration">
            <div className="grid grid-2">
              <div className="stack">
                <label className="field">
                  <span>Stripe Secret Key</span>
                  <input type="password" defaultValue="sk_live_51NQo9y..." />
                </label>
                <div className="flex-row">
                  <Button>Test Connection</Button>
                </div>
              </div>
              <div style={{ background: 'var(--primary-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--primary)' }}>Monthly Recurring Revenue (MRR)</h4>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>$4,250.00</div>
                <p className="hint" style={{ marginTop: '8px' }}>+12.5% from last month. Auto-synced from Stripe.</p>
              </div>
            </div>
          </Card>

          <h3 style={{ marginTop: '20px' }}>Service Packages Configuration</h3>
          <div className="grid grid-3">
            {packages.map((pkg) => (
              <Card key={pkg.id}>
                <div className="stack">
                  <label className="field">
                    <span>Package Name</span>
                    <input value={pkg.name} onChange={(e) => handlePackageChange(pkg.id, 'name', e.target.value)} />
                  </label>
                  <div className="grid grid-2">
                    <label className="field">
                      <span>Price</span>
                      <input value={pkg.price} onChange={(e) => handlePackageChange(pkg.id, 'price', e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Period</span>
                      <input value={pkg.period} onChange={(e) => handlePackageChange(pkg.id, 'period', e.target.value)} />
                    </label>
                  </div>
                  <label className="field">
                    <span>AI Generation Limit (Monthly)</span>
                    <input type="number" value={pkg.aiLimit} onChange={(e) => handlePackageChange(pkg.id, 'aiLimit', e.target.value)} />
                    <span className="hint">Set to 0 for unlimited.</span>
                  </label>
                  <label className="field">
                    <span>Included Features (1 per line)</span>
                    <textarea 
                      rows={5} 
                      value={pkg.features} 
                      onChange={(e) => handlePackageChange(pkg.id, 'features', e.target.value)} 
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                    />
                  </label>
                  <label className="login-checkbox" style={{ marginTop: '10px' }}>
                    <input type="checkbox" defaultChecked />
                    <span>Visible on Pricing Page</span>
                  </label>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex-row" style={{ marginTop: '16px', justifyContent: 'flex-end' }}>
            <Button variant="secondary">Restore Defaults</Button>
            <Button>Save Package & Pricing Rules</Button>
          </div>
        </div>
      )}

    </div>
  )
}
