import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appApi } from '../../services/appApi'
import { ROUTES } from '../../constants/routes'

const STATUS_MAP = {
  PENDING:    { label: 'Đang xử lý', bg: '#DBEAFE', color: '#2563EB' },
  PROCESSING: { label: 'Đang xử lý', bg: '#DBEAFE', color: '#2563EB' },
  COMPLETED:  { label: 'Hoàn thành',  bg: '#F0FDFA', color: '#0D9488' },
  FAILED:     { label: 'Thất bại',    bg: '#FEE2E2', color: '#DC2626' },
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return iso }
}

export function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    appApi.getReports()
      .then(setReports)
      .catch(err => setError(err?.message ?? 'Không tải được danh sách báo cáo'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>


      {/* Stats derived from loaded data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Tổng báo cáo', value: loading ? '—' : reports.length },
          { label: 'Hoàn thành',   value: loading ? '—' : reports.filter(r => r.status === 'COMPLETED').length },
          { label: 'Từ khóa khác nhau', value: loading ? '—' : new Set(reports.map(r => r.keyword).filter(Boolean)).size },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Danh sách báo cáo</span>
          {!loading && (
            <span style={{ fontSize: 12, background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
              {reports.length} báo cáo
            </span>
          )}
        </div>

        {loading && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Đang tải báo cáo...
          </div>
        )}

        {error && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--red)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Chưa có báo cáo nào</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Tạo phân tích đầu tiên để sinh báo cáo</div>
            <button
              onClick={() => navigate(ROUTES.ANALYSIS)}
              style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Phân tích ngay →
            </button>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bd2)' }}>
                {['Tiêu đề', 'Từ khóa', 'Trạng thái', 'Ngày tạo', ''].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-page)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => {
                const st = STATUS_MAP[r.status] ?? { label: r.status, bg: '#F3F4F6', color: '#374151' }
                return (
                  <tr key={r.id ?? i} style={{ borderBottom: i < reports.length - 1 ? '1px solid var(--bd2)' : 'none' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 13.5, maxWidth: 280 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{r.keyword ?? '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 99 }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 12.5, color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (r.status === 'DEEP_INSIGHT') {
                            const source = r.title ? r.title.replace(" Deep Insight", "") : 'Cross-source synthesis';
                            navigate(`${ROUTES.DEEP_INSIGHT}?keyword=${encodeURIComponent(r.keyword ?? '')}&source=${encodeURIComponent(source)}`);
                          } else if (r.status === 'EXPORTED') {
                            navigate(`${ROUTES.ANALYSIS}?reportId=${r.id}&keyword=${encodeURIComponent(r.keyword ?? '')}`);
                          } else {
                            navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(r.keyword ?? '')}`);
                          }
                        }}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        Xem phân tích
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
