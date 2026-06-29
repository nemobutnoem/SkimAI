import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'
import { useToast } from '../../context/ToastContext'

function fieldStyle(disabled) {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    font: 'inherit',
    fontSize: 13.5,
    background: disabled ? 'var(--bg-page)' : 'var(--sur)',
    color: 'var(--text-primary)',
    cursor: disabled ? 'not-allowed' : 'text',
    outline: 'none',
    boxSizing: 'border-box',
  }
}

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

function SectionCard({ title, children, action }) {
  return (
    <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--bd2)' }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        {action}
      </div>
      <div style={{ padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  )
}

function Switch({ checked, onChange, label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--bd2)' }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {description && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      <label style={{
        position: 'relative',
        display: 'inline-block',
        width: 44,
        height: 24,
        cursor: 'pointer'
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? 'var(--accent)' : 'var(--bd2)',
          transition: '0.3s',
          borderRadius: 24,
        }}>
          <span style={{
            position: 'absolute',
            height: 18,
            width: 18,
            left: checked ? 22 : 4,
            bottom: 3,
            backgroundColor: 'white',
            transition: '0.3s',
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }} />
        </span>
      </label>
    </div>
  )
}

export function AccountPage() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  // Profile Form State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Notifications State
  const [notifications, setNotifications] = useState({
    emailUpdates: false,
    weeklyReport: false,
    usageAlerts: false
  })

  const loadData = () => {
    appApi.getAccountOverview()
      .then(res => {
        setData(res)
        setFullName(res?.profile?.name ?? '')
        setCompany(res?.profile?.company ?? '')
        if (res?.notifications) {
          setNotifications(res.notifications)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống')
      return
    }
    setIsSavingProfile(true)
    try {
      await appApi.updateProfile({ name: fullName.trim(), company: company.trim() })
      toast.success('Cập nhật thông tin cá nhân thành công!')
      setIsEditingProfile(false)
      loadData()
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật thông tin cá nhân.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp')
      return
    }
    setIsChangingPassword(true)
    try {
      await appApi.changePassword({ currentPassword, newPassword })
      toast.success('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.message || 'Không thể đổi mật khẩu.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleToggleNotification = async (key) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key]
    }
    setNotifications(updated)
    try {
      await appApi.saveNotificationSettings(updated)
      toast.success('Cài đặt thông báo đã được cập nhật!')
    } catch (err) {
      toast.error(err.message || 'Không thể lưu cài đặt thông báo.')
      // Revert state
      setNotifications(notifications)
    }
  }

  const subscription = data?.subscription
  const billingDate = subscription?.renewsAt
    ? new Date(subscription.renewsAt).toLocaleDateString('vi-VN')
    : 'Chưa lập lịch'

  const initials = (data?.profile?.name ?? 'U').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Row 1: Profile & Subscription */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        
        {/* Profile Card */}
        <SectionCard 
          title="Thông tin cá nhân"
          action={
            !isEditingProfile && (
              <button 
                onClick={() => setIsEditingProfile(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Chỉnh sửa
              </button>
            )
          }
        >
          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Họ và tên</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  required
                  style={fieldStyle(false)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Tên công ty</label>
                <input 
                  type="text" 
                  value={company} 
                  onChange={e => setCompany(e.target.value)} 
                  placeholder="Ví dụ: SkimAI Labs"
                  style={fieldStyle(false)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Email (Không thể thay đổi)</label>
                <input 
                  type="email" 
                  value={data?.profile?.email ?? ''} 
                  disabled
                  style={fieldStyle(true)}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                <button 
                  type="button" 
                  onClick={() => { setIsEditingProfile(false); setFullName(data?.profile?.name ?? ''); setCompany(data?.profile?.company ?? '') }}
                  style={{ padding: '6px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'none', color: 'var(--text-primary)', font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingProfile}
                  style={{ padding: '6px 14px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: isSavingProfile ? 'not-allowed' : 'pointer', opacity: isSavingProfile ? 0.7 : 1 }}
                >
                  {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--dark)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{data?.profile?.name ?? '—'}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{data?.profile?.email ?? ''}</div>
                  {data?.profile?.company && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>🏢 {data.profile.company}</div>}
                </div>
              </div>
              {subscription && (
                <div style={{ background: 'var(--accent-bg)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>Gói hiện tại</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{subscription.planName}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: subscription.status === 'active' ? 'var(--accent)' : 'var(--orange-light)', color: subscription.status === 'active' ? '#fff' : 'var(--orange)' }}>
                    {subscription.status === 'active' ? 'Hoạt động' : subscription.status}
                  </span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Subscription Card */}
        <SectionCard 
          title="Gói dịch vụ"
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
                <span style={{ color: 'var(--text-muted)' }}>Gói hiện tại</span>
                <span style={{ fontWeight: 600 }}>{subscription.planName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Chu kỳ thanh toán</span>
                <span style={{ fontWeight: 600 }}>
                  {subscription.billingCycle === 'monthly' ? 'Hàng tháng' : subscription.billingCycle === 'yearly' ? 'Hàng năm' : subscription.billingCycle}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngày hết hạn/Gia hạn</span>
                <span style={{ fontWeight: 600 }}>{billingDate}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Bạn đang dùng gói miễn phí</div>
              <button
                onClick={() => navigate(ROUTES.PRICING)}
                className="btn btn-primary btn-sm"
              >
                Xem các gói →
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Row 2: Notifications & Change Password */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        
        {/* Notifications Card */}
        <SectionCard title="Tùy chọn thông báo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Switch 
              checked={notifications.emailUpdates} 
              onChange={() => handleToggleNotification('emailUpdates')} 
              label="Cập nhật hệ thống" 
              description="Nhận thông báo về tính năng mới và nâng cấp từ SkimAI."
            />
            <Switch 
              checked={notifications.weeklyReport} 
              onChange={() => handleToggleNotification('weeklyReport')} 
              label="Báo cáo tuần" 
              description="Tóm tắt hoạt động nghiên cứu thị trường hàng tuần của bạn."
            />
            <Switch 
              checked={notifications.usageAlerts} 
              onChange={() => handleToggleNotification('usageAlerts')} 
              label="Cảnh báo tài nguyên" 
              description="Nhận thư cảnh báo khi tài khoản sắp sử dụng hết lượt API/AI."
            />
          </div>
        </SectionCard>

        {/* Change Password Card */}
        <SectionCard title="Đổi mật khẩu bảo mật">
          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Mật khẩu hiện tại</label>
              <input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                required
                placeholder="••••••••"
                style={fieldStyle(false)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Mật khẩu mới</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required
                placeholder="Tối thiểu 6 ký tự"
                style={fieldStyle(false)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Xác nhận mật khẩu mới</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required
                placeholder="Nhập lại mật khẩu mới"
                style={fieldStyle(false)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button 
                type="submit" 
                disabled={isChangingPassword}
                style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--dark)', color: '#fff', font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: isChangingPassword ? 'not-allowed' : 'pointer', opacity: isChangingPassword ? 0.7 : 1 }}
              >
                {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      {/* Row 3: Resource Usage */}
      {(data?.usage ?? []).length > 0 && (
        <SectionCard title="Mức sử dụng tài nguyên" subtitle="Cập nhật theo thời gian thực">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(data?.usage ?? []).map(item => (
              <UsageBar key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Row 4: Invoice History */}
      <SectionCard title="Lịch sử Hóa đơn">
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
