import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

export function AccountPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    appApi.getAccountOverview().then(setData)
  }, [])

  const subscription = data?.subscription
  const billingDate = subscription?.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString('vi-VN') : 'Chưa lập lịch'

  return (
    <div className="stack page-wrap account-shell">
      <section className="account-hero card">
        <div className="account-hero-copy">
          <p className="dashboard-kicker">Quản lý tài khoản</p>
          <h1>Tài khoản & Thanh toán</h1>
          <p className="hint">
            Quản lý gói dịch vụ đang hoạt động, mức sử dụng workspace và lịch sử hóa đơn thanh toán của bạn.
          </p>
        </div>
        <div className="account-plan-summary">
          <span className="account-plan-label">Gói đang hoạt động</span>
          <strong>{subscription?.planName?.toUpperCase() === 'FREE' ? 'Miễn phí' : subscription?.planName?.toUpperCase() === 'STARTER' ? 'Starter' : subscription?.planName?.toUpperCase() === 'TEAM' ? 'Team' : subscription?.planName ?? 'Miễn phí'}</strong>
          <span>Thanh toán {subscription?.billingCycle === 'monthly' ? 'hàng tháng' : subscription?.billingCycle === 'yearly' ? 'hàng năm' : subscription?.billingCycle ?? 'hàng tháng'}</span>
          <small>Gia hạn ngày {billingDate}</small>
        </div>
      </section>

      <div className="grid grid-2">
        <Card title="Thông tin cá nhân" className="account-profile-card">
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
              <span className="badge badge-success">{subscription.status === 'active' ? 'Đang hoạt động' : subscription.status}</span>
              <span>
                Gói {subscription.planName?.toUpperCase() === 'FREE' ? 'Miễn phí' : subscription.planName?.toUpperCase() === 'STARTER' ? 'Starter' : subscription.planName?.toUpperCase() === 'TEAM' ? 'Team' : subscription.planName} • {subscription.billingCycle === 'monthly' ? 'hàng tháng' : subscription.billingCycle === 'yearly' ? 'hàng năm' : subscription.billingCycle} • Gia hạn ngày {billingDate}
              </span>
            </div>
          ) : null}
        </Card>

        <Card title="Mức sử dụng Workspace" className="account-usage-card">
          <div className="stack account-usage-list">
            {(data?.usage ?? []).map((item) => (
              <div key={item.label} className="account-usage-item">
                <div className="progress-label">
                  <span>{item.label === 'API Calls' ? 'Yêu cầu API' : item.label === 'Storage' ? 'Lưu trữ' : item.label === 'Team Seats' ? 'Thành viên' : item.label}</span>
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

      <Card title="Lịch sử Hóa đơn" className="account-billing-card">
        <div className="account-billing-list">
          {(data?.invoices ?? []).length ? (
            (data?.invoices ?? []).map((invoice) => (
              <div key={invoice.id} className="account-billing-item">
                <div>
                  <strong>{invoice.id}</strong>
                  <p>{new Date(invoice.date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="account-billing-meta">
                  <strong>{invoice.amount}</strong>
                  <span className={`badge badge-${invoice.status}`}>{invoice.status === 'paid' ? 'Đã thanh toán' : invoice.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="dashboard-empty-state">Chưa có lịch sử giao dịch.</div>
          )}
        </div>
      </Card>
    </div>
  )
}
