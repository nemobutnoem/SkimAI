import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

function UsageBar({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg-page)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.6s' }} />
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--bd2)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  )
}

export function AccountPage() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    appApi.getAccountOverview().then(setData).catch(() => {})
  }, [])

  const subscription = data?.subscription
  const billingDate = subscription?.renewsAt
    ? new Date(subscription.renewsAt).toLocaleDateString('vi-VN')
    : 'Chưa lập lịch'

  const initials = (data?.profile?.name ?? 'U').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>



      {/* Profile + Plan row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Profile card */}
        <SectionCard title="Thông tin cá nhân">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--dark)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{data?.profile?.name ?? '—'}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{data?.profile?.email ?? ''}</div>
              {data?.profile?.company && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.profile.company}</div>}
            </div>
          </div>
          {subscription && (
            <div style={{ background: 'var(--accent-bg)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>Gói hiện tại</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{subscription.planName}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: subscription.status === 'active' ? 'var(--accent)' : 'var(--orange-light)', color: subscription.status === 'active' ? '#fff' : 'var(--orange)' }}>
                {subscription.status === 'active' ? 'Hoạt động' : subscription.status}
              </span>
            </div>
          )}
        </SectionCard>

        {/* Subscription card */}
        <SectionCard
          title="Gói dịch vụ"
          subtitle={subscription ? `Gia hạn ngày ${billingDate}` : 'Chưa đăng ký gói'}
          action={
            <button
              onClick={() => navigate(ROUTES.PRICING)}
              style={{ border: 'none', background: 'var(--dark)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 'var(--radius-md)' }}
            >
              Nâng cấp →
            </button>
          }
        >
          {subscription ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Gói</span>
                <span style={{ fontWeight: 600 }}>{subscription.planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Chu kỳ</span>
                <span style={{ fontWeight: 600 }}>
                  {subscription.billingCycle === 'monthly' ? 'Hàng tháng' : subscription.billingCycle === 'yearly' ? 'Hàng năm' : subscription.billingCycle}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Gia hạn</span>
                <span style={{ fontWeight: 600 }}>{billingDate}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Bạn đang dùng gói miễn phí</div>
              <button
                onClick={() => navigate(ROUTES.PRICING)}
                className="btn btn-primary"
                style={{ fontSize: 13 }}
              >
                Xem các gói →
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Usage */}
      {(data?.usage ?? []).length > 0 && (
        <SectionCard title="Mức sử dụng tài nguyên" subtitle="Cập nhật theo thời gian thực">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(data?.usage ?? []).map(item => (
              <UsageBar key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Invoice history */}
      <SectionCard title="Lịch sử Hóa đơn" subtitle="GET /api/account/overview">
        {(data?.invoices ?? []).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.invoices.map((inv, i) => (
              <div key={inv.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < data.invoices.length - 1 ? '1px solid var(--bd2)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.id}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(inv.date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{inv.amount}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: inv.status === 'paid' ? 'var(--accent-bg)' : 'var(--orange-light)', color: inv.status === 'paid' ? 'var(--accent)' : 'var(--orange)' }}>
                    {inv.status === 'paid' ? 'Đã thanh toán' : inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Chưa có lịch sử giao dịch.
          </div>
        )}
      </SectionCard>

    </div>
  )
}
