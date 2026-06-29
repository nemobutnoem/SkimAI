const PLANNED_SOURCES = [
  { name: 'Google Trends',       category: 'Xu hướng',           coverage: 'Toàn cầu' },
  { name: 'Facebook Ads Library',category: 'Quảng cáo',          coverage: 'Việt Nam' },
  { name: 'Shopee Product Feed', category: 'Thương mại điện tử', coverage: 'Đông Nam Á' },
  { name: 'Lazada Marketplace',  category: 'Thương mại điện tử', coverage: 'Đông Nam Á' },
  { name: 'TikTok Trending',     category: 'Mạng xã hội',        coverage: 'Toàn cầu' },
  { name: 'YouTube Search Data', category: 'Video',               coverage: 'Toàn cầu' },
  { name: 'News Aggregator VN',  category: 'Tin tức',             coverage: 'Việt Nam' },
]

export function DataSourcesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Nguồn dữ liệu</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Các nguồn dữ liệu thị trường được tích hợp trong hệ thống</div>
        </div>
      </div>

      {/* Coming soon notice */}
      <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-20)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>Tính năng đang phát triển — </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Trang quản lý nguồn dữ liệu sẽ sớm ra mắt. Dưới đây là danh sách các nguồn hiện đang được tích hợp vào hệ thống phân tích.
          </span>
        </div>
      </div>

      {/* Source list (read-only, no live status) */}
      <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Nguồn tích hợp</span>
          <span style={{ fontSize: 12, background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
            {PLANNED_SOURCES.length} nguồn
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bd2)' }}>
              {['Tên nguồn', 'Danh mục', 'Phạm vi phủ sóng'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-page)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLANNED_SOURCES.map((s, i) => (
              <tr key={i} style={{ borderBottom: i < PLANNED_SOURCES.length - 1 ? '1px solid var(--bd2)' : 'none' }}>
                <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 13.5 }}>{s.name}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.category}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{s.coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
