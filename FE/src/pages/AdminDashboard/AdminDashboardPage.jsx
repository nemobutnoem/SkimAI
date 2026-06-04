import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

const LABEL_TRANSLATIONS = {
  Users: 'Người dùng',
  Premium: 'Tài khoản Premium',
  Revenue: 'Doanh thu',
  Reports: 'Báo cáo',
  Churn: 'Tỷ lệ rời bỏ',
  Subscriptions: 'Gói đăng ký',
  Searches: 'Lượt tìm kiếm',
}

/* ─── Stat card config with icons and colors ─── */
const STAT_CONFIG = {
  Users:         { icon: '👥', bg: 'var(--primary-bg, #f0edff)', color: 'var(--primary)' },
  Premium:       { icon: '⭐', bg: 'var(--orange-light, #fef0e6)', color: '#E17055' },
  Revenue:       { icon: '💰', bg: 'var(--green-light, #e8f8e8)', color: 'var(--green)' },
  Reports:       { icon: '📊', bg: 'var(--blue-light, #e8f0ff)', color: 'var(--blue)' },
  Churn:         { icon: '📉', bg: 'var(--red-light, #fde8e8)', color: 'var(--red)' },
  Subscriptions: { icon: '💎', bg: 'var(--primary-bg, #f0edff)', color: 'var(--primary)' },
}

/* ─── Donut chart with animation ─── */
function DonutChart({ premiumPct, loading }) {
  const [animatedPct, setAnimatedPct] = useState(0)

  useEffect(() => {
    if (loading) return
    if (!Number.isFinite(premiumPct)) return

    const durationMs = 650
    const start = performance.now()
    const from = animatedPct

    let rafId = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (premiumPct - from) * eased
      setAnimatedPct(current)
      if (t < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [premiumPct, loading, animatedPct])

  const primaryColor = 'var(--primary, #5f3dc4)'
  const secondaryColor = '#CED4DA'

  return (
    <div className="admin-donut">
      <div
        className="admin-donut-ring"
        style={{
          background: `conic-gradient(${primaryColor} 0% ${animatedPct}%, ${secondaryColor} ${animatedPct}% 100%)`,
        }}
      />
      <div className="admin-donut-center">
        <strong>{Math.round(animatedPct)}%</strong>
        <span>Premium</span>
      </div>
    </div>
  )
}

/* ─── Chart bar helper ─── */
function MiniBarChart({ data, color }) {
  const safe = Array.isArray(data) ? data : []
  const max = Math.max(1, ...safe)
  const signature = safe.join('|')
  const [renderTarget, setRenderTarget] = useState(false)

  useEffect(() => {
    setRenderTarget(false)
    const id = requestAnimationFrame(() => setRenderTarget(true))
    return () => cancelAnimationFrame(id)
  }, [signature])

  return (
    <div className="admin-mini-bars">
      {safe.map((v, i) => (
        <div key={i} className="admin-mini-bar" style={{
          height: renderTarget ? `${(v / max) * 100}%` : '0%',
          background: color || 'var(--primary)',
          transition: 'height 650ms cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      ))}
    </div>
  )
}

export function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const stats = data?.stats ?? []
  const rawActivities = data?.activities ?? []
  const growth = data?.userGrowth ?? null
  const revenue = data?.revenue ?? null
  const pendingRequests = data?.pendingRequests ?? []

  useEffect(() => {
    setLoading(true)
    appApi.getAdminDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const statNumericTargets = useMemo(() => {
    const result = {}
    for (const item of stats) {
      const label = item?.label
      if (!label) continue
      const n = Number.parseFloat(String(item?.value ?? ''))
      if (Number.isFinite(n)) {
        result[label] = n
      }
    }
    return result
  }, [stats])

  const [animatedStatValues, setAnimatedStatValues] = useState({})

  useEffect(() => {
    if (loading) return

    const labels = Object.keys(statNumericTargets)
    if (!labels.length) return

    const durationMs = 650
    const start = performance.now()
    const from = {}
    for (const label of labels) {
      from[label] = Number.isFinite(animatedStatValues[label]) ? animatedStatValues[label] : 0
    }

    let rafId = 0
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = {}
      for (const label of labels) {
        const target = statNumericTargets[label]
        next[label] = from[label] + (target - from[label]) * eased
      }
      setAnimatedStatValues((prev) => ({ ...prev, ...next }))
      if (t < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, statNumericTargets])

  const activityList = rawActivities.map((a, i) => {
    const palette = ['var(--primary)', 'var(--green)', 'var(--orange, #e17055)', 'var(--red)']
    const isLegacy = typeof a === 'string'
    return {
      label: isLegacy ? a : (a?.label ?? ''),
      desc: isLegacy ? '' : (a?.description ?? ''),
      time: !isLegacy && a?.createdAt ? new Date(a.createdAt).toLocaleString() : '',
      color: palette[i % palette.length],
    }
  })

  const getStatValue = (label) => {
    const item = stats.find((s) => s?.label === label)
    const raw = item?.value
    const parsed = Number.parseFloat(String(raw ?? ''))
    return Number.isFinite(parsed) ? parsed : 0
  }

  const computedDistribution = (() => {
    if (loading) {
      return { premiumPct: 0, standardPct: 0 }
    }
    if (data?.distribution && typeof data.distribution.premiumPct === 'number') {
      return data.distribution
    }
    const premium = getStatValue('Premium')
    const subs = getStatValue('Subscriptions')
    const premiumPct = subs <= 0 ? 0 : Math.round((premium * 100) / subs)
    const standardPct = subs <= 0 ? 0 : Math.max(0, 100 - premiumPct)
    return { premiumPct, standardPct }
  })()

  const displayStats = (() => {
    if (!loading || stats.length) return stats
    return [
      { label: 'Users', value: '0', change: '', negative: false },
      { label: 'Searches', value: '0', change: '', negative: false },
      { label: 'Reports', value: '0', change: '', negative: false },
      { label: 'Subscriptions', value: '0', change: '', negative: false },
      { label: 'Premium', value: '0', change: '', negative: false },
    ]
  })()

  const formatAnimatedNumber = (label, rawValue) => {
    const target = Number.parseFloat(String(rawValue ?? ''))
    if (!Number.isFinite(target)) return rawValue
    const current = animatedStatValues[label]
    const value = Number.isFinite(current) ? current : 0
    return Math.round(value).toLocaleString()
  }

  return (
    <div className="admin-dash">
      {/* ── Stats Row ── */}
      <div className="admin-stats-row">
        {displayStats.map((item) => {
          const cfg = STAT_CONFIG[item.label] ?? STAT_CONFIG.Users
          const negative = Boolean(item.negative)
          const change = item.change ?? ''
          return (
            <div key={item.label} className="admin-stat-card card">
              <div className="admin-stat-content">
                <div className="admin-stat-label">{LABEL_TRANSLATIONS[item.label] || item.label}</div>
                <div className="admin-stat-value">{formatAnimatedNumber(item.label, item.value)}</div>
                <div className={`admin-stat-change ${negative ? 'negative' : 'positive'}`}>
                  {loading ? 'Đang tải...' : (change ? `${change} so với tháng trước` : '—')}
                </div>
              </div>
              <div className="admin-stat-icon" style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.icon}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Charts Row (User Growth + Account Distribution) ── */}
      <div className="admin-charts-row">
        <Card title="Tăng trưởng người dùng theo thời gian">
          <div className="admin-chart-area">
            {loading ? (
              <div className="hint">Đang tải...</div>
            ) : growth?.values?.length ? (
              <>
                <MiniBarChart data={growth.values ?? []} color="var(--primary)" />
                <div className="admin-chart-labels">
                  {(growth.labels ?? []).map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="hint">Không có dữ liệu tăng trưởng</div>
            )}
          </div>
        </Card>
        <Card title="Phân bổ tài khoản">
          <div className="admin-donut-wrap">
            <DonutChart premiumPct={computedDistribution.premiumPct ?? 0} loading={loading} />
            <div className="admin-donut-legend">
              {loading ? (
                <span className="hint">Đang tải biểu đồ phân bổ...</span>
              ) : (
                <>
                  <span><i style={{ background: '#CED4DA' }} /> Tiêu chuẩn — {Math.round(100 - (computedDistribution.premiumPct ?? 0))}%</span>
                  <span><i style={{ background: 'var(--primary)' }} /> Premium — {computedDistribution.premiumPct ?? 0}%</span>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Monthly Revenue + Recent Activity ── */}
      <div className="admin-two-equal">
        <Card title="Doanh thu hàng tháng">
          <div className="admin-chart-area">
            {loading ? (
              <div className="hint">Đang tải...</div>
            ) : revenue?.values?.length ? (
              <>
                <MiniBarChart data={revenue.values ?? []} color="var(--primary)" />
                <div className="admin-chart-labels">
                  {(revenue.labels ?? []).map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="hint">Không có dữ liệu doanh thu</div>
            )}
          </div>
        </Card>
        <Card title="Hoạt động gần đây">
          <div className="admin-activity-list">
            {loading ? (
              <div className="hint">Đang tải...</div>
            ) : activityList.length ? activityList.map((item, i) => (
              <div key={i} className="admin-activity-item">
                <span className="admin-activity-dot" style={{ background: item.color }} />
                <div>
                  <div className="admin-activity-text">
                    <strong>{item.label}</strong>{item.desc ? ` — ${item.desc}` : ''}
                  </div>
                  <div className="admin-activity-time">{item.time}</div>
                </div>
              </div>
            )) : <div className="hint">Chưa có hoạt động gần đây</div>}
          </div>
        </Card>
      </div>

      {/* ── Pending Requests + Quick Actions ── */}
      <div className="admin-two-equal">
        <Card title="Yêu cầu xuất báo cáo đang chờ">
          <table className="table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Loại báo cáo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="hint">Đang tải...</td>
                </tr>
              ) : pendingRequests.length ? pendingRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.user}</td>
                  <td>{r.type}</td>
                  <td><span className={['badge', `badge-${r.status}`].join(' ')}>{r.status === 'pending' ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : r.status}</span></td>
                  <td><Link to={ROUTES.ADMIN_REPORTS} className="admin-action-link">Xem xét</Link></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="hint">Không có yêu cầu báo cáo nào đang chờ</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        <Card title="Hành động nhanh">
          <div className="admin-quick-actions">
            <Link to={ROUTES.ADMIN_REPORTS} className="admin-quick-item">
              <span>📊 Duyệt báo cáo</span><span>→</span>
            </Link>
            <Link to={ROUTES.ADMIN_SETTINGS} className="admin-quick-item">
              <span>⚙️ Quản lý gói dịch vụ</span><span>→</span>
            </Link>
            <Link to={ROUTES.ADMIN_REVENUE} className="admin-quick-item danger">
              <span>⚠️ Giao dịch thất bại</span><span>→</span>
            </Link>
          </div>
        </Card>
      </div>

    </div>
  )
}
