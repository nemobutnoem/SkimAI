import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

export function DashboardPage() {
  const [data, setData] = useState(null)
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    appApi
      .getDashboard()
      .then((d) => {
        if (alive) setData(d)
      })
      .catch((e) => {
        if (alive) setError(e?.message ?? 'Tải thông tin bảng điều khiển thất bại')
      })

    appApi
      .getReports()
      .then((r) => {
        if (alive) setReports(r)
      })
      .catch(console.error)

    return () => {
      alive = false
    }
  }, [])

  const quickActions = [
    { label: 'Chạy phân tích mới', hint: 'Bắt đầu luồng nghiên cứu từ khóa mới', to: ROUTES.ANALYSIS },
    { label: 'Xem bảng giá', hint: 'So sánh các gói và nâng cấp tài khoản', to: ROUTES.PRICING },
    { label: 'Quản lý tài khoản', hint: 'Xem thông tin tài khoản và thanh toán', to: ROUTES.ACCOUNT },
  ]

  return (
    <div className="stack page-wrap dashboard-shell">
      <section className="dashboard-hero card">
        <div className="dashboard-hero-copy">
          <p className="dashboard-kicker">Tổng quan không gian làm việc</p>
          <h1>Bảng điều khiển</h1>
          <p className="hint">
            Theo dõi báo cáo, thông tin phân tích và các hoạt động nghiên cứu mới nhất của bạn tại một nơi duy nhất.
          </p>
        </div>
        <div className="dashboard-hero-panel">
          <div className="dashboard-hero-pill">Không gian cá nhân</div>
          <div className="dashboard-hero-meta">
            <strong>{data?.recent?.length ?? 0}</strong>
            <span>hoạt động gần đây</span>
          </div>
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid grid-3">
        {(data?.kpis ?? []).map((k) => (
          <Card key={k.label} className="dashboard-kpi-card">
            <div className="dashboard-kpi-label">{k.label}</div>
            <div className="dashboard-kpi-value">{k.value}</div>
            <div className="dashboard-kpi-note">Cập nhật trực tiếp từ workspace</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-2 dashboard-main-grid">
        <Card title="Hành động Nhanh" className="dashboard-section-card">
          <div className="dashboard-action-list">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.to} className="dashboard-action-item">
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.hint}</p>
                </div>
                <span>Mở</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Hoạt động Gần đây" className="dashboard-section-card">
          <div className="dashboard-recent-list">
            {(data?.recent ?? []).length ? (
              (data?.recent ?? []).map((item) => (
                <Link 
                  key={item.id} 
                  to={`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(item.title)}`}
                  className="dashboard-recent-item"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <p>Được theo dõi trong workspace nghiên cứu thị trường của bạn</p>
                  </div>
                  <time>{new Date(item.createdAt).toLocaleString()}</time>
                </Link>
              ))
            ) : (
              <div className="dashboard-empty-state">
                Chưa có hoạt động gần đây. Hãy bắt đầu phân tích từ khóa mới để điền dữ liệu.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="Báo cáo & Phân tích Chuyên sâu đã lưu" className="dashboard-section-card">
        <div className="dashboard-recent-list" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
          {reports.length ? (
            reports.map((item) => {
              const isDeepInsight = item.status === 'DEEP_INSIGHT';
              const source = isDeepInsight && item.title ? item.title.replace(" Deep Insight", "") : '';
              const linkTo = isDeepInsight 
                ? `${ROUTES.DEEP_INSIGHT}?keyword=${encodeURIComponent(item.keyword)}${source ? `&source=${encodeURIComponent(source)}` : ''}`
                : `${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(item.keyword)}`;
              
              return (
                <Link
                  key={item.id}
                  to={linkTo}
                  className="dashboard-recent-item"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
                >
                  <div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isDeepInsight ? '⚡ Phân tích chuyên sâu:' : '📊 Báo cáo thị trường:'} {item.keyword}
                      <span className={`badge ${isDeepInsight ? 'badge-published' : 'badge-draft'}`} style={{ fontSize: '11px', padding: '2px 6px' }}>
                        {isDeepInsight ? 'AI Deep Insight' : 'Báo cáo'}
                      </span>
                    </strong>
                    <p>{isDeepInsight ? `Nguồn phân tích: ${source || 'Đa nguồn'}` : 'Báo cáo nghiên cứu thị trường chi tiết'}</p>
                  </div>
                  <time>{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
                </Link>
              );
            })
          ) : (
            <div className="dashboard-empty-state">
              Chưa có báo cáo hoặc phân tích chuyên sâu nào được lưu.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
