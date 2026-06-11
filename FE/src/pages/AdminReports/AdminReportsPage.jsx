import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

const STATUSES = ['all', 'pending', 'draft', 'published', 'archived']

const STATUS_LABELS = {
  all: 'Tất cả',
  pending: 'Chờ duyệt',
  draft: 'Bản nháp',
  published: 'Đã xuất bản',
  archived: 'Lưu trữ',
}

export function AdminReportsPage() {
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState('')

  const loadReports = async (nextStatus = status) => {
    const data = await appApi.getAdminReports(nextStatus)
    setReports(data)
  }

  useEffect(() => {
    loadReports(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return reports
    return reports.filter((report) =>
      report.title?.toLowerCase().includes(normalized) ||
      report.author?.toLowerCase().includes(normalized),
    )
  }, [query, reports])

  useEffect(() => {
    if (!selectedId && filteredReports[0]) {
      setSelectedId(filteredReports[0].id)
      return
    }
    if (selectedId && !filteredReports.some((item) => item.id === selectedId)) {
      setSelectedId(filteredReports[0]?.id ?? '')
    }
  }, [filteredReports, selectedId])

  const selected = useMemo(() => filteredReports.find((item) => item.id === selectedId), [filteredReports, selectedId])

  const moderate = async (nextStatus) => {
    if (!selectedId) return
    await appApi.moderateReport(selectedId, nextStatus)
    await loadReports(status)
  }

  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Quản trị Báo cáo</h1>
          <p className="hint">Hàng đợi kiểm duyệt: lọc, xem trước, phê duyệt hoặc lưu trữ báo cáo.</p>
        </div>
        <div className="tag-wrap">
          {STATUSES.map((item) => (
            <button
              key={item}
              className={['tab-btn', status === item ? 'active' : ''].join(' ')}
              onClick={() => setStatus(item)}
            >
              {STATUS_LABELS[item] || item}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="grid grid-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm tiêu đề hoặc tác giả"
          />
          <div className="hint" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            Đang hiển thị {filteredReports.length} báo cáo
          </div>
        </div>
      </Card>

      <div className="grid admin-columns">
        <Card title="Danh sách Báo cáo">
          <div className="stack" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredReports.map((report) => (
              <button
                key={report.id}
                className={['list-select', selectedId === report.id ? 'active' : ''].join(' ')}
                onClick={() => setSelectedId(report.id)}
              >
                <div className="list-select-row">
                  <strong>{report.title}</strong>
                  <span className={['badge', `badge-${report.status}`].join(' ')}>{STATUS_LABELS[report.status] || report.status}</span>
                </div>
                <span className="hint">
                  {report.category} • Điểm AI {report.aiScore}%
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Xem trước & Kiểm duyệt">
          {selected ? (
            <div className="stack">
              <h3>{selected.title}</h3>
              <p>{selected.summary}</p>
              <span className="hint">Tác giả: {selected.author}</span>
              <span className="hint">Cập nhật: {new Date(selected.updatedAt).toLocaleString('vi-VN')}</span>

              <div className="tag-wrap">
                <Button onClick={() => moderate('published')}>Phê duyệt</Button>
                <Button variant="secondary" onClick={() => moderate('draft')}>
                  Yêu cầu chỉnh sửa
                </Button>
                <Button variant="secondary" onClick={() => moderate('archived')}>
                  Lưu trữ
                </Button>
                <Button variant="secondary" onClick={() => moderate('pending')}>
                  Chuyển về chờ duyệt
                </Button>
              </div>
            </div>
          ) : (
            <div className="hint">Chưa chọn báo cáo nào</div>
          )}
        </Card>
      </div>
    </div>
  )
}
