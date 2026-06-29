import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

export function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [trends, setTrends] = useState([])

  const visibleTrends = useMemo(() => {
    const seen = new Set()
    return trends.filter((trend) => {
      const key = trend?.id || `${trend?.name}-${trend?.market}`
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [trends])

  useEffect(() => {
    appApi.getHomeTrends().then(setTrends).catch(() => {})
  }, [])

  const handleSearch = () => {
    const kw = keyword.trim()
    if (kw) navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(kw)}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero search */}
      <div style={{ background: 'var(--dark)', borderRadius: 'var(--radius-xl)', padding: '28px 30px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 10 }}>
          AISKIM · Market Intelligence
        </div>
        <h1 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: '0 0 18px', letterSpacing: '-0.03em' }}>
          Nhận định Thị trường trong vài Giây
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 'var(--radius-md)', padding: '6px 6px 6px 16px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoComplete="off"
            placeholder='Nhập từ khóa thị trường hoặc dán link sản phẩm...'
            style={{ flex: 1, border: 'none', outline: 'none', font: 'inherit', fontSize: 14, color: '#fff', background: 'transparent', padding: '8px 0' }}
          />
          <button
            onClick={handleSearch}
            style={{ padding: '10px 22px', background: '#fff', color: 'var(--dark)', border: 'none', borderRadius: 8, font: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            Phân tích →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {['xe máy điện', 'TikTok Shop', 'skincare nội địa'].map(kw => (
            <button key={kw} onClick={() => { setKeyword(kw) }}
              style={{ border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.07)', cursor: 'pointer', font: 'inherit', fontSize: 12, color: 'rgba(255,255,255,.7)', padding: '4px 12px', borderRadius: 99 }}>
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Trending section */}
      {visibleTrends.length > 0 && (
        <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid var(--bd2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Xu hướng Nổi bật</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Cập nhật mỗi 24h</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 0 }}>
            {visibleTrends.slice(0, 6).map((trend, i) => (
              <button
                key={trend.id ?? i}
                onClick={() => navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(trend.name)}`)}
                style={{ textAlign: 'left', background: 'none', border: 'none', borderRight: '1px solid var(--bd2)', borderBottom: i < visibleTrends.slice(0,6).length - 1 ? '1px solid var(--bd2)' : 'none', padding: '14px 16px', cursor: 'pointer', transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-page)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    Nổi bật
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: trend.sentiment === 'positive' ? 'var(--accent)' : trend.sentiment === 'negative' ? 'var(--red)' : 'var(--text-muted)' }}>
                    {trend.change}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2, color: 'var(--text-primary)' }}>{trend.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trend.market}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
                  <span>{trend.sourceCount} nguồn</span>
                  <span>{trend.updatedAt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA card */}
      <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Bắt đầu nghiên cứu ngay hôm nay</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Tạo tài khoản miễn phí — không cần thẻ tín dụng</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate(ROUTES.LOGIN)} style={{ padding: '9px 20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--sur)', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Đăng nhập
          </button>
          <button onClick={() => navigate(ROUTES.PRICING)} style={{ padding: '9px 20px', border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--dark)', color: '#fff', font: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Xem gói →
          </button>
        </div>
      </div>

    </div>
  )
}
