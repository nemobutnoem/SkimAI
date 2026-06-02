import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

const NO_DATA = 'không có dữ liệu để đánh giá'

function formatNumber(num) {
  if (!num && num !== 0) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

function pct(value) {
  return `${((value || 0) * 100).toFixed(2)}%`
}

function normalizeSourceName(value) {
  const input = (value || '').trim()
  if (!input) return 'Nguồn khác'
  const lower = input.toLowerCase()
  const directMatch = lower.match(/https?:\/\/([^/\s]+)/)
  if (directMatch?.[1]) return directMatch[1].replace(/^www\./, '')
  const token = lower.split(/\s+/).find((part) => part.includes('.') && !part.includes('•'))
  if (token) return token.replace(/^www\./, '').replace(/[>,|]+$/g, '')
  return input.length > 42 ? `${input.slice(0, 42)}...` : input
}

function canonicalSource(value) {
  const lower = (value || '').toLowerCase()
  if (lower.includes('youtube')) return 'YouTube'
  if (lower.includes('trend')) return 'Google Trends'
  if (lower.includes('google')) return 'Google Search'
  if (lower.includes('facebook')) return 'Facebook'
  if (lower.includes('tiktok')) return 'TikTok'
  if (lower.includes('news')) return 'Google News'
  return normalizeSourceName(value)
}

function inferDirection(text = '', count = 0) {
  const lower = text.toLowerCase()
  if (/(decrease|decline|drop|down|fall|giam|giảm|negative|weak)/.test(lower)) return 'giảm'
  if (/(increase|growth|rise|up|spike|positive|strong|tang|tăng|\+)/.test(lower)) return 'tăng'
  if (count >= 3) return 'ổn định'
  return 'chưa rõ'
}

function directionLabel(direction) {
  return {
    tăng: 'tăng',
    giảm: 'giảm',
    'ổn định': 'ổn định',
  }[direction] || 'chưa rõ'
}

function directionClass(direction) {
  if (direction === 'tăng') return 'up'
  if (direction === 'giảm') return 'down'
  if (direction === 'ổn định') return 'stable'
  return 'unknown'
}

function noDataFor(section) {
  return `${NO_DATA} ${section}`
}

function buildSourceTrendRows(data, evidenceItems) {
  const grouped = new Map()

  ;(evidenceItems ?? []).forEach((item) => {
    const source = canonicalSource(item?.source)
    const current = grouped.get(source) ?? {
      source,
      count: 0,
      titles: [],
      signalText: '',
      direction: 'chưa rõ',
    }
    current.count += 1
    if (item?.title) current.titles.push(item.title)
    current.signalText = [current.signalText, item?.metric, item?.signal, item?.title].filter(Boolean).join(' ')
    current.direction = inferDirection(current.signalText, current.count)
    grouped.set(source, current)
  })

  ;(data?.dataSources ?? []).forEach((sourceName) => {
    const source = canonicalSource(sourceName)
    if (!grouped.has(source)) {
      grouped.set(source, {
        source,
        count: 0,
        titles: [],
        signalText: '',
        direction: 'chưa rõ',
      })
    }
  })

  return Array.from(grouped.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((row) => ({
      ...row,
      summary: row.count
        ? `${row.count} tín hiệu được ghi nhận. ${row.titles[0] || 'Có bằng chứng nguồn nhưng chưa có tiêu đề nổi bật.'}`
        : noDataFor(`xu hướng từ ${row.source}`),
    }))
}

function buildOverallRead(data, sourceRows, timelinePoints) {
  const keywords = data?.relatedKeywords ?? []
  const totalMentions = keywords.reduce((sum, item) => sum + (item.mentionCount || 0), 0)
  const totalViews = keywords.reduce((sum, item) => sum + (item.totalViews || 0), 0)
  const totalComments = keywords.reduce((sum, item) => sum + (item.totalComments || 0), 0)
  const avgEngagement = keywords.length
    ? keywords.reduce((sum, item) => sum + (item.avgEngagement || 0), 0) / keywords.length
    : 0

  const firstTimeline = timelinePoints?.[0]?.value ?? null
  const lastTimeline = timelinePoints?.[timelinePoints.length - 1]?.value ?? null
  let marketState = 'ổn định'
  if (firstTimeline != null && lastTimeline != null) {
    if (lastTimeline > firstTimeline) marketState = 'tăng trưởng'
    if (lastTimeline < firstTimeline) marketState = 'giảm sút'
  } else if (sourceRows.some((row) => row.direction === 'tăng')) {
    marketState = 'tăng trưởng'
  } else if (sourceRows.some((row) => row.direction === 'giảm')) {
    marketState = 'giảm sút'
  }

  const signalScore = totalMentions + totalComments + Math.round(avgEngagement * 1000) + sourceRows.filter((row) => row.count > 0).length * 5
  const interestLevel = signalScore >= 80 || totalViews >= 100000 ? 'cao' : signalScore >= 25 || totalViews >= 1000 ? 'trung bình' : 'thấp'
  const hasData = keywords.length || sourceRows.some((row) => row.count > 0)

  return {
    hasData,
    marketState,
    interestLevel,
    totalMentions,
    totalViews,
    totalComments,
    avgEngagement,
    coverage: data?.dataQuality?.evidenceCoveragePct ?? 0,
  }
}

function pickMarketPotential(data, overall) {
  const keywords = data?.relatedKeywords ?? []
  if (!overall.hasData) return noDataFor('tiềm năng thị trường')
  const strongest = [...keywords].sort((a, b) => (b.mentionCount || 0) - (a.mentionCount || 0))[0]
  if (!strongest) {
    return `Từ khóa có tín hiệu ${overall.interestLevel}, nhưng cụm cơ hội liên quan còn thiếu dữ liệu cụ thể.`
  }
  return `Cơ hội nằm ở cụm "${strongest.keyword}" với ${strongest.mentionCount || 0} lần lặp lại; nên ưu tiên kiểm chứng thêm trước khi mở rộng.`
}

function pickChannelRecommendation(sourceRows, overall) {
  const positiveRows = sourceRows.filter((row) => row.count > 0 && row.direction !== 'giảm')
  const best = positiveRows[0] ?? sourceRows.find((row) => row.count > 0)
  if (!overall.hasData || !best) return noDataFor('kênh tiếp cận đề xuất')
  return `Ưu tiên ${best.source} vì đây là nguồn có nhiều tín hiệu nhất (${best.count}). Nếu cần ngân sách thấp, dùng nội dung kiểm chứng thêm trước khi chạy paid media.`
}

function InsightSection({ title, badge, children }) {
  return (
    <section className="card prompt-insight-card">
      <div className="prompt-insight-head">
        <div>
          <span className="prompt-insight-badge">{badge}</span>
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  )
}

export function AnalysisPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword')?.trim() || ''
  const [draftKeyword, setDraftKeyword] = useState('')

  const [data, setData] = useState(null)
  const [evidenceItems, setEvidenceItems] = useState([])
  const [timelinePoints, setTimelinePoints] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [result, evidence, timeline] = await Promise.all([
        appApi.getAnalysis(keyword),
        appApi.getAnalysisEvidence(keyword).catch(() => []),
        appApi.getAnalysisTimeline(keyword).catch(() => []),
      ])
      setData(result)
      setEvidenceItems(evidence)
      setTimelinePoints(timeline)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!keyword) {
      setData(null)
      setEvidenceItems([])
      setTimelinePoints([])
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  const sourceRows = useMemo(() => buildSourceTrendRows(data, evidenceItems), [data, evidenceItems])
  const overall = useMemo(() => buildOverallRead(data, sourceRows, timelinePoints), [data, sourceRows, timelinePoints])
  const marketPotential = useMemo(() => pickMarketPotential(data, overall), [data, overall])
  const channelRecommendation = useMemo(() => pickChannelRecommendation(sourceRows, overall), [sourceRows, overall])
  const topKeywords = (data?.relatedKeywords ?? []).slice(0, 5)
  const researchGuard = data?.researchGuard ?? null
  const canRunDeepInsight = researchGuard ? Boolean(researchGuard.deepInsightEnabled) : true

  if (!keyword) {
    return (
      <div className="analysis-shell page-wrap">
        <section className="analysis-suite-hero card">
          <div>
            <p className="dashboard-kicker">Research suite</p>
            <h1>Start a Market Research Query</h1>
            <p className="hint">
              Nhập một từ khóa để hệ thống tổng hợp insight thị trường theo đúng prompt: xu hướng, đánh giá tổng thể, tiềm năng và kênh tiếp cận.
            </p>
            <div className="analysis-module-strip">
              <span className="analysis-module-chip">Source trend</span>
              <span className="analysis-module-chip">Overall interest</span>
              <span className="analysis-module-chip">Channel fit</span>
            </div>
          </div>

          <div className="analysis-suite-meta">
            <div className="analysis-suite-meta-label">Tracked keyword</div>
            <strong>Not selected</strong>
            <span>Search to start analysis</span>
          </div>
        </section>

        <section className="card dashboard-empty-state analysis-empty-state">
          <h2>Research starts with a keyword</h2>
          <p>Trang sẽ chỉ đưa ra nhận định dựa trên dữ liệu thu thập được. Nếu thiếu dữ liệu, hệ thống sẽ ghi rõ mục không thể đánh giá.</p>

          <div className="input-row analysis-empty-input">
            <input
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              placeholder="Try: phở, electric bike, AI agent, TikTok Shop trends..."
            />
            <Button
              onClick={() => {
                const nextKeyword = draftKeyword.trim()
                if (!nextKeyword) return
                navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(nextKeyword)}`)
              }}
            >
              Start Research
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="analysis-shell page-wrap">
      <section className="analysis-suite-hero card">
        <div>
          <p className="dashboard-kicker">Market insight prompt</p>
          <h1>Phân tích thị trường theo từ khóa</h1>
          <p className="hint">
            Dựa hoàn toàn trên dữ liệu về "{keyword}", không thêm kiến thức bên ngoài và không vẽ dữ liệu.
          </p>
          <div className="analysis-module-strip">
            <span className="analysis-module-chip">Tổng quan xu hướng</span>
            <span className="analysis-module-chip">Đánh giá tổng thể</span>
            <span className="analysis-module-chip">Tiềm năng</span>
            <span className="analysis-module-chip">Kênh đề xuất</span>
          </div>
        </div>

        <div className="analysis-suite-meta">
          <div className="analysis-suite-meta-label">Tracked keyword</div>
          <strong>{keyword}</strong>
          <span>{loading ? 'Refreshing...' : 'Updated just now'}</span>
        </div>
      </section>

      <div className="analysis-header-row">
        <div>
          <h2>Kết quả phân tích</h2>
          <p className="hint">Tối đa hóa insight ngắn gọn, có bằng chứng nguồn và trạng thái thiếu dữ liệu.</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" className="btn-sm">Export</Button>
          <Button onClick={load} disabled={loading} className="btn-sm">
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <div className="prompt-summary-grid">
        <section className="card prompt-summary-card">
          <span>Trạng thái thị trường</span>
          <strong>{overall.hasData ? overall.marketState : 'chưa đủ dữ liệu'}</strong>
        </section>
        <section className="card prompt-summary-card">
          <span>Mức quan tâm</span>
          <strong>{overall.hasData ? overall.interestLevel : 'chưa đủ dữ liệu'}</strong>
        </section>
        <section className="card prompt-summary-card">
          <span>Bằng chứng</span>
          <strong>{Number(overall.coverage)}%</strong>
        </section>
        <section className="card prompt-summary-card">
          <span>Tương tác TB</span>
          <strong>{pct(overall.avgEngagement)}</strong>
        </section>
      </div>

      <InsightSection title="Tổng quan xu hướng" badge="01">
        <div className="source-trend-list">
          {sourceRows.length ? sourceRows.map((row) => (
            <div className="source-trend-row" key={row.source}>
              <div>
                <strong>{row.source}</strong>
                <p>{row.summary}</p>
              </div>
              <span className={`direction-pill direction-${directionClass(row.direction)}`}>
                {directionLabel(row.direction)}
              </span>
            </div>
          )) : (
            <p className="hint">{noDataFor('tổng quan xu hướng')}</p>
          )}
        </div>
      </InsightSection>

      <InsightSection title="Đánh giá tổng thể" badge="02">
        <ul className="prompt-bullet-list">
          <li>
            {overall.hasData
              ? `Thị trường đang ${overall.marketState}; mức quan tâm hiện tại ${overall.interestLevel}.`
              : noDataFor('đánh giá tổng thể')}
          </li>
          <li>
            {overall.hasData
              ? `Dữ liệu ghi nhận ${formatNumber(overall.totalViews)} views, ${formatNumber(overall.totalComments)} bình luận và ${formatNumber(overall.totalMentions)} tín hiệu keyword.`
              : noDataFor('mức độ quan tâm hiện tại')}
          </li>
        </ul>
      </InsightSection>

      <InsightSection title="Tiềm năng thị trường" badge="03">
        <p className="prompt-main-text">{marketPotential}</p>
        {topKeywords.length ? (
          <div className="compact-keyword-list">
            {topKeywords.map((item) => (
              <span key={item.keyword}>{item.keyword} ({item.mentionCount})</span>
            ))}
          </div>
        ) : null}
      </InsightSection>

      <InsightSection title="Kênh tiếp cận đề xuất" badge="04">
        <p className="prompt-main-text">{channelRecommendation}</p>
        <div className="tag-wrap">
          {(data?.suggestedActions ?? []).slice(0, 4).map((action) => (
            <button key={action} className="tag" type="button">{action}</button>
          ))}
        </div>
      </InsightSection>

      {researchGuard ? (
        <section className={`card research-guard-card ${canRunDeepInsight ? 'guard-ok' : 'guard-low'}`}>
          <div className="analysis-section-heading">
            <div>
              <div className="card-title">Keyword Validation</div>
              <p className="hint">{researchGuard.message}</p>
            </div>
            <div className="guard-score">{researchGuard.intentScore}/100</div>
          </div>
          <div className="grid grid-2">
            <div className="opportunity-item">
              <strong>Status: {researchGuard.status}</strong>
              <p className="hint">
                {canRunDeepInsight
                  ? 'This keyword is valid for market analysis and deep insight.'
                  : 'Deep insight is temporarily blocked until keyword intent improves.'}
              </p>
            </div>
            <div className="opportunity-item">
              <strong>Suggested keywords</strong>
              <p className="hint">{(researchGuard.suggestedKeywords ?? []).slice(0, 5).join(' | ')}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="card ai-summary">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Keyword Overview</div>
            <p className="hint">Core insights and adjacent keyword opportunities for this topic.</p>
          </div>
        </div>

        <div className="insight-grid">
          {(data?.insights ?? []).map((item, i) => (
            <InsightCard key={i} insight={item} index={i} />
          ))}
        </div>

        <div className="analysis-keyword-shelf">
          <div className="kw-shelf-header">
            <div>
              <div className="analysis-subsection-title">Related keyword clusters</div>
              <p className="hint" style={{ margin: '4px 0 0' }}>Adjacent topics detected from market signals</p>
            </div>
            <span className="kw-count-badge">{(data?.relatedKeywords ?? []).length} keywords</span>
          </div>
          <div className="keyword-table">
            <div className="kw-table-head">
              <span className="kw-th kw-th-rank">#</span>
              <span className="kw-th kw-th-name">Keyword</span>
              <span className="kw-th kw-th-metric">Views</span>
              <span className="kw-th kw-th-metric">Likes</span>
              <span className="kw-th kw-th-metric">Comments</span>
              <span className="kw-th kw-th-metric">Mentions</span>
              <span className="kw-th kw-th-bar">Strength</span>
            </div>
            {(data?.relatedKeywords ?? []).map((km, index) => {
              const score = (km.mentionCount || 0) * 100 + Math.log10(Math.max(1, (km.totalViews || 0) + ((km.totalLikes || 0) * 2) + ((km.totalComments || 0) * 3))) * 100
              const maxScore = Math.max(...(data?.relatedKeywords ?? []).map((k) => (k.mentionCount || 0) * 100 + Math.log10(Math.max(1, (k.totalViews || 0) + ((k.totalLikes || 0) * 2) + ((k.totalComments || 0) * 3))) * 100), 1)
              const barWidth = Math.max(15, (score / maxScore) * 100)
              return (
                <div className="kw-table-row" key={km.keyword || index}>
                  <span className="kw-rank">{index + 1}</span>
                  <span className="kw-name">{km.keyword}</span>
                  <span className="kw-metric-val">{formatNumber(km.totalViews)}</span>
                  <span className="kw-metric-val">{formatNumber(km.totalLikes)}</span>
                  <span className="kw-metric-val">{formatNumber(km.totalComments)}</span>
                  <span className="kw-metric-val kw-metric-mentions">{km.mentionCount}</span>
                  <span className="kw-bar-cell">
                    <div className="kw-bar" style={{ width: `${barWidth}%` }} />
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ask-more">
          {canRunDeepInsight ? (
            <Link to={`${ROUTES.DEEP_INSIGHT}?keyword=${encodeURIComponent(keyword)}`} className="ask-more-cta">
              <span className="ask-more-icon">AI</span>
              <span>Ask AI for deeper insights {'->'}</span>
            </Link>
          ) : (
            <button type="button" className="ask-more-cta ask-more-cta-disabled" disabled>
              <span className="ask-more-icon">AI</span>
              <span>Refine keyword to unlock deep insight</span>
            </button>
          )}
        </div>
      </section>

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Bằng chứng đầu vào</div>
            <p className="hint">Chỉ hiển thị để kiểm tra nguồn; các nhận định trên không bổ sung kiến thức ngoài dữ liệu này.</p>
          </div>
        </div>
        <div className="stack">
          {(evidenceItems ?? []).slice(0, 6).map((item, idx) => (
            <div key={`${item.source}-${idx}`} className="list-select">
              <div className="list-select-row">
                <strong>{canonicalSource(item.source)}</strong>
                <span className="hint">{item.metric}</span>
              </div>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer noopener" className="evidence-link">
                  {item.title}
                </a>
              ) : (
                <div>{item.title}</div>
              )}
              <span className="hint">{item.signal}</span>
            </div>
          ))}
          {!evidenceItems.length ? <p className="hint">{noDataFor('bằng chứng đầu vào')}</p> : null}
        </div>
      </section>

      <div className="ask-more">
        {canRunDeepInsight ? (
          <Link to={`${ROUTES.DEEP_INSIGHT}?keyword=${encodeURIComponent(keyword)}`} className="ask-more-cta">
            <span className="ask-more-icon">AI</span>
            <span>Run Deep Insight</span>
          </Link>
        ) : (
          <button type="button" className="ask-more-cta ask-more-cta-disabled" disabled>
            <span className="ask-more-icon">AI</span>
            <span>Refine keyword to unlock deep insight</span>
          </button>
        )}
      </div>
    </div>
  )
}
