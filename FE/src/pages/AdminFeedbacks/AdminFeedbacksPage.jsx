import { useState, useEffect } from 'react'
import { appApi } from '../../services/appApi'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'

export function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const loadFeedbacks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await appApi.getAdminFeedbacks()
      setFeedbacks(data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách phản hồi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const handleToggleStatus = async (feedback) => {
    const nextStatus = feedback.status === 'PENDING' ? 'RESOLVED' : 'PENDING'
    try {
      await appApi.updateFeedbackStatus(feedback.id, nextStatus)
      // Optimistically update or just reload
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedback.id ? { ...f, status: nextStatus } : f))
      )
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái.')
    }
  }

  const getMailtoLink = (feedback) => {
    const subject = encodeURIComponent(`Re: [AISKIM Support] ${feedback.title}`)
    const body = encodeURIComponent(
      `Chào ${feedback.name},\n\nChúng tôi đã nhận được yêu cầu hỗ trợ của bạn về việc: "${feedback.title}"\n\nNội dung chi tiết bạn đã gửi:\n"${feedback.content}"\n\n[Nhập nội dung phản hồi của bạn vào đây]\n\nTrân trọng,\nĐội ngũ hỗ trợ khách hàng AISKIM`
    )
    return `mailto:${feedback.email}?subject=${subject}&body=${body}`
  }

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'BUG':
        return '🐞 Lỗi kỹ thuật'
      case 'FEATURE':
        return '💡 Góp ý tính năng'
      case 'BILLING':
        return '💳 Thanh toán'
      default:
        return '💬 Vấn đề khác'
    }
  }

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (statusFilter === 'ALL') return true
    return f.status === statusFilter
  })

  return (
    <div className="stack page-wrap">
      <div className="admin-content-wrap">
        <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700' }}>Quản lý Phản hồi & Hỗ trợ</h1>
            <p className="hint">Xem danh sách các thắc mắc, phản hồi lỗi từ người dùng và phản hồi lại qua Email.</p>
          </div>
          <div className="segmented">
            <button className={statusFilter === 'ALL' ? 'on' : ''} onClick={() => setStatusFilter('ALL')}>
              Tất cả
            </button>
            <button className={statusFilter === 'PENDING' ? 'on' : ''} onClick={() => setStatusFilter('PENDING')}>
              Chưa xử lý
            </button>
            <button className={statusFilter === 'RESOLVED' ? 'on' : ''} onClick={() => setStatusFilter('RESOLVED')}>
              Đã giải quyết
            </button>
          </div>
        </div>

        {error && (
          <div className="inline-notice inline-notice-error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <span className="hint">Đang tải danh sách phản hồi...</span>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              Không tìm thấy phản hồi nào.
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredFeedbacks.map((f) => (
              <Card key={f.id} style={{ borderLeft: f.status === 'PENDING' ? '4px solid var(--red)' : '4px solid var(--success)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span className="badge" style={{ 
                        marginRight: '8px',
                        background: 'var(--gray-100)',
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {getCategoryLabel(f.category)}
                      </span>
                      <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{f.title}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${f.status === 'PENDING' ? 'badge-danger' : 'badge-success'}`} style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: f.status === 'PENDING' ? 'rgba(255, 121, 121, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                        color: f.status === 'PENDING' ? '#d63031' : '#2ecc71'
                      }}>
                        {f.status === 'PENDING' ? 'Chưa xử lý' : 'Đã giải quyết'}
                      </span>
                      <span className="hint" style={{ fontSize: '12px' }}>
                        {new Date(f.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Sender Details */}
                  <div style={{ 
                    background: 'var(--gray-50)', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    fontSize: '13px',
                    display: 'flex',
                    gap: '24px',
                    color: 'var(--text-secondary)'
                  }}>
                    <div>Người gửi: <strong style={{ color: 'var(--text-primary)' }}>{f.name}</strong></div>
                    <div>Email: <strong style={{ color: 'var(--text-primary)' }}>{f.email}</strong></div>
                  </div>

                  {/* Content */}
                  <div style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap', 
                    padding: '8px 4px', 
                    color: 'var(--text-primary)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '12px'
                  }}>
                    {f.content}
                  </div>

                  {/* Actions Row */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '12px', 
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '12px',
                    marginTop: '4px'
                  }}>
                    <Button
                      variant="secondary"
                      onClick={() => handleToggleStatus(f)}
                      style={{ fontSize: '13px', padding: '6px 14px' }}
                    >
                      {f.status === 'PENDING' ? '✓ Đánh dấu đã giải quyết' : '⟲ Đánh dấu chưa xử lý'}
                    </Button>
                    <a href={getMailtoLink(f)} style={{ textDecoration: 'none' }}>
                      <Button
                        variant="primary"
                        style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        ✉️ Phản hồi qua Email
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
