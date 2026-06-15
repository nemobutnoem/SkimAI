export function Skeleton({ width, height = '14px', radius = '6px', style }) {
  return (
    <div
      className="skeleton"
      style={{ width: width ?? '100%', height, borderRadius: radius, ...style }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="stack page-wrap dashboard-shell">
      <div className="dashboard-hero card">
        <div style={{ flex: 1, display: 'grid', gap: 12 }}>
          <Skeleton height="11px" width="130px" />
          <Skeleton height="34px" width="260px" />
          <Skeleton height="14px" width="400px" />
        </div>
      </div>
      <div className="grid grid-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="card dashboard-kpi-card">
            <Skeleton height="13px" width="100px" />
            <Skeleton height="42px" width="80px" style={{ marginTop: 10 }} />
            <Skeleton height="12px" width="160px" style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>
      <div className="grid grid-2 dashboard-main-grid">
        {[0, 1].map(i => (
          <div key={i} className="card">
            <Skeleton height="18px" width="140px" style={{ marginBottom: 18 }} />
            {[0, 1, 2].map(j => (
              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gap: 8, flex: 1 }}>
                  <Skeleton height="14px" width="60%" />
                  <Skeleton height="12px" width="85%" />
                </div>
                <Skeleton height="14px" width="30px" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AnalysisSkeleton() {
  return (
    <div className="page-wrap analysis-shell" style={{ display: 'grid', gap: 18 }}>
      <div className="card analysis-suite-hero" style={{ padding: 28 }}>
        <div style={{ flex: 1, display: 'grid', gap: 12 }}>
          <Skeleton height="11px" width="160px" />
          <Skeleton height="40px" width="320px" />
          <Skeleton height="14px" width="480px" />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {[80, 110, 90].map((w, i) => <Skeleton key={i} height="30px" width={w} radius="99px" />)}
          </div>
        </div>
        <Skeleton height="120px" width="220px" radius="14px" />
      </div>
      <div className="grid grid-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="card" style={{ padding: '18px' }}>
            <Skeleton height="11px" width="100px" />
            <Skeleton height="28px" width="70px" style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="grid grid-2">
        {[0, 1].map(i => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <Skeleton height="18px" width="160px" style={{ marginBottom: 16 }} />
            {[100, 85, 90, 75].map((w, j) => (
              <Skeleton key={j} height="13px" width={`${w}%`} style={{ marginBottom: 10 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
