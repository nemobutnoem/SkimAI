import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { appApi } from '../../services/appApi'

const CATEGORIES = [
  { value: 'BUG', label: '🐞 Lỗi website / Kỹ thuật' },
  { value: 'FEATURE', label: '💡 Góp ý tính năng mới' },
  { value: 'BILLING', label: '💳 Hỗ trợ thanh toán / Gói cước' },
  { value: 'OTHER', label: '💬 Vấn đề khác' },
]

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

export function SupportPage() {
  const { user, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '', category: 'BUG', title: '', content: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [myFeedbacks, setMyFeedbacks] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadHistory = async () => {
    if (!isAuthenticated) return
    setLoadingHistory(true)
    try { setMyFeedbacks((await appApi.getMyFeedbacks()) || []) }
    catch { /* ignore */ }
    finally { setLoadingHistory(false) }
  }

  useEffect(() => { if (isAuthenticated) loadHistory() }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(p => ({ ...p, name: user.name || user.fullName || '', email: user.email || '' }))
    }
  }, [user, isAuthenticated])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    try {
      await appApi.submitFeedback(formData)
      setMessage({ type: 'success', text: 'Yêu cầu đã được ghi lại! Chúng tôi sẽ phản hồi qua email sớm nhất.' })
      setFormData(p => ({ ...p, title: '', content: '' }))
      loadHistory()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gửi phản hồi thất bại. Vui lòng thử lại sau.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>



      {/* Message banner */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: 13.5,
          background: message.type === 'success' ? 'rgba(13,148,136,.1)' : 'rgba(220,53,69,.08)',
          border: `1px solid ${message.type === 'success' ? 'rgba(13,148,136,.25)' : 'rgba(220,53,69,.2)'}`,
          color: message.type === 'success' ? 'var(--accent)' : '#c0392b',
        }}>
          {message.text}
        </div>
      )}

      {/* Form card */}
      <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd2)' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Gửi yêu cầu hỗ trợ</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Chúng tôi sẽ phản hồi trong vòng 24h</div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Họ và tên</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Nguyễn Văn A" required disabled={isAuthenticated} style={fieldStyle(isAuthenticated)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Email liên hệ</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@domain.com" required disabled={isAuthenticated} style={fieldStyle(isAuthenticated)} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Danh mục</label>
            <select name="category" value={formData.category} onChange={handleChange} style={{ ...fieldStyle(false), cursor: 'pointer' }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tiêu đề</label>
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Nhập tiêu đề ngắn gọn..." required style={fieldStyle(false)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Nội dung chi tiết</label>
            <textarea
              name="content"
              rows={5}
              value={formData.content}
              onChange={handleChange}
              placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
              required
              style={{ ...fieldStyle(false), resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '10px 24px', background: 'var(--dark)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', font: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? .6 : 1 }}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu →'}
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      {isAuthenticated && (
        <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd2)' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Lịch sử yêu cầu</div>
          </div>
          <div style={{ padding: '0 20px' }}>
            {loadingHistory ? (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Đang tải...</div>
            ) : myFeedbacks.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Bạn chưa gửi yêu cầu hỗ trợ nào.</div>
            ) : (
              myFeedbacks.map((item, i) => (
                <div key={item.id ?? i} style={{ padding: '14px 0', borderBottom: i < myFeedbacks.length - 1 ? '1px solid var(--bd2)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                          {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.title}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: item.status === 'PENDING' ? 'rgba(220,53,69,.08)' : 'rgba(13,148,136,.1)', color: item.status === 'PENDING' ? '#c0392b' : 'var(--accent)', flexShrink: 0 }}>
                      {item.status === 'PENDING' ? 'Chờ xử lý' : 'Đã giải quyết'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, whiteSpace: 'pre-wrap' }}>{item.content}</div>
                  {item.adminReply && (
                    <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--accent-bg)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent)', fontSize: 13 }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Phản hồi từ ban quản trị:</div>
                      <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{item.adminReply}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  )
}

