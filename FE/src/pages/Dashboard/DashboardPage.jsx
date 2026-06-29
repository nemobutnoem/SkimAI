import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'
import { DashboardSkeleton } from '../../components/Skeleton'

const QUICK_KWS = ['TikTok Shop', 'xe máy điện', 'skincare nội địa', 'F&B 2025']

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'vừa xong'
  if (h < 24) return `${h}h trước`
  return `${Math.floor(h / 24)}n trước`
}

export function DashboardPage() {
  const [data, setData] = useState(null)
  const [trends, setTrends] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const searchRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true

    Promise.all([
      appApi.getDashboard()
        .then(d => { if (alive) setData(d) })
        .catch(e => { if (alive) setError(e?.message ?? 'Tải thất bại') }),
      appApi.getHomeTrends()
        .then(t => { if (alive) setTrends(Array.isArray(t) ? t : (t?.trends ?? [])) })
        .catch(() => {}),
    ]).finally(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [])

  const handleSearch = () => {
    const kw = searchInput.trim()
    if (!kw) { searchRef.current?.focus(); return }
    navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(kw)}`)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  if (loading) return <DashboardSkeleton />

  const recent = data?.recent ?? []
  const kpis = data?.kpis ?? []
  const planName = data?.plan?.planName ?? 'Free'
  const usedSearches = data?.plan?.usedSearches ?? 0
  const limitSearches = data?.plan?.totalSearches ?? 0

  const displayKpis = kpis.length > 0 ? kpis : [
    { label: 'Tổng phân tích', value: String(recent.length) },
    { label: 'Từ khóa theo dõi', value: String(new Set(recent.map(r => r.keyword ?? r.title)).size) },
    { label: 'Gói hiện tại', value: planName },
    { label: 'Searches còn lại', value: limitSearches > 0 ? String(limitSearches - usedSearches) : '∞' },
  ]

  return (
    <div className="stack" style={{ gap: 16 }}>

      {/* Hero search */}
      <div className="dash-hero-search">
        <div className="dash-hero-label">Nhập từ khóa nghiên cứu</div>
        <div className="dash-search-box">
          <input
            ref={searchRef}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            placeholder='"xe máy điện", "skincare nội địa", "TikTok Shop"…'
          />
          <button className="dash-search-btn" onClick={handleSearch}>
            Phân tích →
          </button>
        </div>
        <div className="dash-quick-kws">
          {QUICK_KWS.map(kw => (
            <button
              key={kw}
              className="dash-kw-chip"
              onClick={() => { setSearchInput(kw); searchRef.current?.focus() }}
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* KPI grid */}
      <div className="dash-kpi-grid">
        {displayKpis.map(k => (
          <div key={k.label} className="dash-kpi-card">
            <div className="dash-kpi-label">{k.label}</div>
            <div className="dash-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Live trends */}
      {trends.length > 0 && (
        <div className="dash-trends-card">
          <div className="dash-trends-header">
            <div className="dash-trends-title">
              <span className="dash-pulse-dot" />
              Xu hướng trực tiếp
            </div>
            <span className="dash-trends-meta">cập nhật mỗi 24h · SerpApi + YouTube</span>
          </div>
          <div className="dash-trends-grid">
            {trends.slice(0, 5).map((t, i) => {
              const change = t.changePercent ?? t.change ?? 0
              const isUp = change > 0
              const isDown = change < 0
              const changeColor = isUp ? 'var(--green)' : isDown ? 'var(--red)' : 'var(--accent)'
              const changeText = `${isUp ? '+' : ''}${typeof change === 'number' ? change.toFixed(1) : change}%`
              return (
                <button
                  key={t.id ?? t.name ?? i}
                  className="dash-trend-cell"
                  onClick={() => navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(t.keyword ?? t.name ?? '')}`)}
                >
                  <div className="dash-trend-name">{t.keyword ?? t.name}</div>
                  <div className="dash-trend-market">{t.market ?? t.category ?? ''}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span className="dash-trend-change" style={{ color: changeColor }}>
                      {change !== 0 ? changeText : '—'}
                    </span>
                    <span className="dash-trend-sources">{t.sourceCount ?? ''}{t.sourceCount ? ' nguồn' : ''}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent searches */}
      <div className="dash-recent-card">
        <div className="dash-recent-header">Tìm kiếm gần đây</div>
        <div className="dash-recent-list-container">
          {recent.length > 0 ? (
            recent.map((r, i) => {
              const kw = r.keyword ?? r.title ?? r.query ?? ''
              return (
                <div key={r.id ?? i} className="dash-recent-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <span className="dash-recent-kw">{kw}</span>
                  <span
                    className="dash-status-badge"
                    style={{
                      background: r.status === 'DONE' ? 'var(--accent-bg)' : 'var(--orange-light)',
                      color: r.status === 'DONE' ? 'var(--accent)' : 'var(--orange)',
                    }}
                  >
                    {r.status === 'DONE' ? 'Hoàn thành' : (r.status ?? 'Xong')}
                  </span>
                  <span className="dash-recent-age">{timeAgo(r.createdAt ?? r.timestamp)}</span>
                  <button
                    className="dash-recent-btn"
                    onClick={() => navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(kw)}`)}
                  >
                    Xem lại
                  </button>
                </div>
              )
            })
          ) : (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Chưa có tìm kiếm nào</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Nhập từ khóa ở trên để bắt đầu nghiên cứu thị trường.
              </div>
              <button
                className="btn btn-primary"
                style={{ fontSize: 13 }}
                onClick={() => searchRef.current?.focus()}
              >
                Bắt đầu ngay →
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
