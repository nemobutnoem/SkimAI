import { useState, useEffect } from 'react'
import { appApi } from '../../services/appApi'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'

export function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [expandedId, setExpandedId] = useState(null)

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
          <div style={{ 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredFeedbacks.map((f) => {
                const isExpanded = expandedId === f.id
                return (
                  <div 
                    key={f.id} 
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s',
                      borderLeft: f.status === 'PENDING' ? '4px solid var(--red)' : '4px solid var(--success)',
                      background: isExpanded ? 'var(--gray-50, #fcfcfd)' : 'white'
                    }}
                  >
                    {/* Collapsed Row (Gmail style) */}
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : f.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        cursor: 'pointer',
                        gap: '16px',
                        userSelect: 'none'
                      }}
                      className="feedback-inbox-row"
                    >
                      {/* Left: Status & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px', width: '240px', flexShrink: 0 }}>
                        <span className={`badge ${f.status === 'PENDING' ? 'badge-danger' : 'badge-success'}`} style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: f.status === 'PENDING' ? 'rgba(255, 121, 121, 0.12)' : 'rgba(46, 204, 113, 0.12)',
                          color: f.status === 'PENDING' ? '#d63031' : '#2ecc71',
                          whiteSpace: 'nowrap'
                        }}>
                          {f.status === 'PENDING' ? 'Chưa xử lý' : 'Đã giải quyết'}
                        </span>
                        <strong style={{ 
                          fontSize: '14px', 
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {f.name}
                        </strong>
                      </div>

                      {/* Middle: Tag & Title & Content Snippet */}
                      <div style={{ 
                        flexGrow: 1, 
                        fontSize: '14px', 
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap', 
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <span className="badge" style={{ 
                          background: 'var(--gray-100)',
                          color: 'var(--text-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {getCategoryLabel(f.category)}
                        </span>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                          {f.title}
                        </span>
                        <span style={{ color: 'var(--text-muted, #94a3b8)' }}>—</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {f.content}
                        </span>
                      </div>

                      {/* Right: Date */}
                      <div style={{ 
                        flexShrink: 0, 
                        fontSize: '12px', 
                        color: 'var(--text-muted, #94a3b8)',
                        textAlign: 'right'
                      }}>
                        {new Date(f.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    {/* Expanded Content Panel */}
                    {isExpanded && (
                      <div style={{
                        padding: '20px 24px',
                        borderTop: '1px solid var(--border-color)',
                        background: 'var(--gray-50, #fafafa)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}>
                        {/* Sender info */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Người gửi: <strong style={{ color: 'var(--text-primary)' }}>{f.name}</strong> 
                            <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span> 
                            Email: <a href={`mailto:${f.email}`} style={{ color: 'var(--primary)', fontWeight: '600' }}>{f.email}</a>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span className="badge" style={{ 
                              background: 'var(--gray-100)',
                              color: 'var(--text-primary)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {getCategoryLabel(f.category)}
                            </span>
                          </div>
                        </div>

                        {/* Title & Body */}
                        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px 20px' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{f.title}</h4>
                          <div style={{ 
                            fontSize: '14px', 
                            lineHeight: '1.6', 
                            whiteSpace: 'pre-wrap', 
                            color: 'var(--text-primary)'
                          }}>
                            {f.content}
                          </div>
                        </div>

                        {/* Actions block */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          gap: '12px',
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
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
