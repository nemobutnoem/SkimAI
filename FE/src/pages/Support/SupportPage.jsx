import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { appApi } from '../../services/appApi'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'

export function SupportPage() {
  const { user, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'BUG',
    title: '',
    content: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text: '' }
  const [myFeedbacks, setMyFeedbacks] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadHistory = async () => {
    if (!isAuthenticated) return
    setLoadingHistory(true)
    try {
      const data = await appApi.getMyFeedbacks()
      setMyFeedbacks(data || [])
    } catch (e) {
      console.error('Không thể tải lịch sử hỗ trợ:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || user.fullName || '',
        email: user.email || '',
      }))
    }
  }, [user, isAuthenticated])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      await appApi.submitFeedback(formData)
      setMessage({
        type: 'success',
        text: 'Cảm ơn bạn đã gửi ý kiến phản hồi! Yêu cầu của bạn đã được ghi lại thành công. Chúng tôi sẽ phản hồi qua email sớm nhất có thể.',
      })
      // Clear form except name/email if logged in
      setFormData((prev) => ({
        ...prev,
        title: '',
        content: '',
      }))
      loadHistory()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Gửi phản hồi thất bại. Vui lòng thử lại sau.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="stack page-wrap" style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Hỗ trợ & Phản hồi</h1>
        <p className="hint">Bạn gặp lỗi website, cần hỗ trợ thanh toán hay muốn góp ý tính năng? Hãy gửi yêu cầu cho chúng tôi.</p>
      </div>

      {message && (
        <div 
          className={`inline-notice inline-notice-${message.type === 'success' ? 'success' : 'error'}`}
          style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', fontSize: '14px', lineHeight: '1.5' }}
        >
          {message.text}
        </div>
      )}

      <Card>
        <form className="form form-wide" onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div className="grid grid-2" style={{ gap: '16px' }}>
            <label className="field">
              <span style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Họ và tên</span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
                disabled={isAuthenticated}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: isAuthenticated ? 'var(--gray-100)' : 'var(--white)',
                  cursor: isAuthenticated ? 'not-allowed' : 'text',
                }}
              />
            </label>
            <label className="field">
              <span style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Email liên hệ</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@domain.com"
                required
                disabled={isAuthenticated}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: isAuthenticated ? 'var(--gray-100)' : 'var(--white)',
                  cursor: isAuthenticated ? 'not-allowed' : 'text',
                }}
              />
            </label>
          </div>

          <label className="field">
            <span style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Danh mục hỗ trợ</span>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                width: '100%',
                backgroundColor: 'var(--white)',
              }}
            >
              <option value="BUG">Lỗi website / Kỹ thuật</option>
              <option value="FEATURE">Góp ý tính năng mới</option>
              <option value="BILLING">Hỗ trợ thanh toán / Gói cước</option>
              <option value="OTHER">Vấn đề khác</option>
            </select>
          </label>

          <label className="field">
            <span style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Tiêu đề</span>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề ngắn gọn..."
              required
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            />
          </label>

          <label className="field">
            <span style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Nội dung chi tiết</span>
            <textarea
              name="content"
              rows="6"
              value={formData.content}
              onChange={handleChange}
              placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải hoặc ý kiến đóng góp của bạn..."
              required
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Button type="submit" disabled={isSubmitting} style={{ padding: '12px 30px', fontWeight: '600' }}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </div>
        </form>
      </Card>

      {isAuthenticated && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Lịch sử yêu cầu hỗ trợ của bạn</h2>
          {loadingHistory ? (
            <div className="hint">Đang tải lịch sử...</div>
          ) : myFeedbacks.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
                Bạn chưa gửi yêu cầu hỗ trợ nào.
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
              {myFeedbacks.map((item) => (
                <Card key={item.id} style={{ borderLeft: item.status === 'PENDING' ? '4px solid var(--red)' : '4px solid var(--success)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span className="badge" style={{ 
                          marginRight: '8px',
                          background: 'var(--gray-100)',
                          color: 'var(--text-primary)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {item.category === 'BUG' ? '🐞 Lỗi kỹ thuật' : item.category === 'FEATURE' ? '💡 Góp ý tính năng' : item.category === 'BILLING' ? '💳 Thanh toán' : '💬 Vấn đề khác'}
                        </span>
                        <strong style={{ fontSize: '15px' }}>{item.title}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`badge ${item.status === 'PENDING' ? 'badge-danger' : 'badge-success'}`} style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: item.status === 'PENDING' ? 'rgba(255, 121, 121, 0.12)' : 'rgba(46, 204, 113, 0.12)',
                          color: item.status === 'PENDING' ? '#d63031' : '#2ecc71'
                        }}>
                          {item.status === 'PENDING' ? 'Chưa xử lý' : 'Đã giải quyết'}
                        </span>
                        <span className="hint" style={{ fontSize: '11px' }}>
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                      {item.content}
                    </div>

                    {item.adminReply && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '12px 16px', 
                        background: 'var(--primary-bg)', 
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--primary)',
                        fontSize: '13px'
                      }}>
                        <strong style={{ color: 'var(--primary-dark)', display: 'block', marginBottom: '4px' }}>
                          💬 Phản hồi từ Ban quản trị:
                        </strong>
                        <span style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                          {item.adminReply}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
