import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

const INSIGHT_TRUNCATE = 120

const INSIGHT_ICONS = {
  'social sentiment': '💬',
  'keyword opportunity': '🔑',
  'market trend': '📈',
  'media pressure': '📰',
  'competitor signal': '🎯',
  'audience behavior': '👥',
  default: '💡',
}

function getInsightIcon(label) {
  const key = (label || '').toLowerCase()
  for (const [k, v] of Object.entries(INSIGHT_ICONS)) {
    if (key.includes(k)) return v
  }
  return INSIGHT_ICONS.default
}

function InsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false)
  const text = insight?.text || ''
  const label = insight?.label || 'Insight'
  const needsTruncate = text.length > INSIGHT_TRUNCATE

  const icon = getInsightIcon(label)
  const confidence = Number.isFinite(insight?.confidence) ? insight.confidence : null
  const evidenceSource = insight?.evidenceSource || 'Cross-source synthesis'
  const evidenceSignal = insight?.evidenceSignal || ''

  return (
    <div className={`insight-item insight-item--${index % 4}`}>
      <div className="insight-header">
        <span className="insight-icon">{icon}</span>
        <span className="insight-label">{label}</span>
        {confidence !== null ? <span className="insight-confidence">{confidence}% confidence</span> : null}
      </div>
      <div className="insight-text">
        {needsTruncate && !expanded ? `${text.slice(0, INSIGHT_TRUNCATE)}...` : text}
      </div>
      <div className="insight-evidence">
        <span>{evidenceSource}</span>
        {evidenceSignal ? <span>{evidenceSignal}</span> : null}
      </div>
      {needsTruncate ? (
        <button className="see-more-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'See more'}
        </button>
      ) : null}
    </div>
  )
}

function formatNumber(num) {
  if (!num && num !== 0) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

function normalizeSourceName(value) {
  const input = (value || '').trim()
  if (!input) return 'Unknown source'
  const lower = input.toLowerCase()
  const directMatch = lower.match(/https?:\/\/([^/\s]+)/)
  if (directMatch?.[1]) return directMatch[1].replace(/^www\./, '')
  const token = lower.split(/\s+/).find((part) => part.includes('.') && !part.includes('•'))
  if (token) return token.replace(/^www\./, '').replace(/[>,|]+$/g, '')
  return input.length > 48 ? `${input.slice(0, 48)}...` : input
}

export function AnalysisPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword')?.trim() || ''
  const [draftKeyword, setDraftKeyword] = useState('')

  const [data, setData] = useState(null)
  const [projectFlow, setProjectFlow] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [competitorSignals, setCompetitorSignals] = useState([])
  const [evidenceItems, setEvidenceItems] = useState([])
  const [compareItems, setCompareItems] = useState([])
  const [timelinePoints, setTimelinePoints] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [result, project, alertList, competitor, evidence, compare, timeline] = await Promise.all([
        appApi.getAnalysis(keyword),
        appApi.getAnalysisProject(keyword).catch(() => null),
        appApi.getAnalysisAlerts(keyword).catch(() => []),
        appApi.getAnalysisCompetitor(keyword).catch(() => []),
        appApi.getAnalysisEvidence(keyword).catch(() => []),
        appApi.getAnalysisCompare(keyword).catch(() => []),
        appApi.getAnalysisTimeline(keyword).catch(() => []),
      ])
      setData(result)
      setProjectFlow(project)
      setAlerts(alertList)
      setCompetitorSignals(competitor)
      setEvidenceItems(evidence)
      setCompareItems(compare)
      setTimelinePoints(timeline)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!keyword) {
      setData(null)
      setProjectFlow(null)
      setAlerts([])
      setCompetitorSignals([])
      setEvidenceItems([])
      setCompareItems([])
      setTimelinePoints([])
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  if (!keyword) {
    return (
      <div className="analysis-shell page-wrap">
        <section className="analysis-suite-hero card">
          <div>
            <p className="dashboard-kicker">Research suite</p>
            <h1>Start a Market Research Query</h1>
            <p className="hint">
              Enter a keyword, product idea, or market topic to generate your research workspace. We will only build this page after a real search.
            </p>
            <div className="analysis-module-strip">
              <span className="analysis-module-chip">Keyword Overview</span>
              <span className="analysis-module-chip">Market Signals</span>
              <span className="analysis-module-chip">Competitor Snapshot</span>
            </div>
          </div>

          <div className="analysis-suite-meta">
            <div className="analysis-suite-meta-label">Tracked keyword</div>
            <strong>Not selected</strong>
            <span>Search to start analysis</span>
          </div>
        </section>

        <section className="card dashboard-empty-state analysis-empty-state">
          <h2>Research starts with a real keyword</h2>
          <p>
            This workspace is empty because no keyword has been searched yet. Start from here and we will build the overview, market signals, and competitor snapshot from the integrated sources in your system.
          </p>

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

          <div className="analysis-empty-actions">
            <Link to={ROUTES.HOME} className="btn btn-secondary">Go to Overview</Link>
            <Link to={ROUTES.PRICING} className="btn btn-secondary">View plans</Link>
          </div>
        </section>
      </div>
    )
  }

  const summaryStats = useMemo(() => {
    const keywords = data?.relatedKeywords ?? []
    const totalMentions = keywords.reduce((sum, item) => sum + (item.mentionCount || 0), 0)
    const totalViews = keywords.reduce((sum, item) => sum + (item.totalViews || 0), 0)
    const totalComments = keywords.reduce((sum, item) => sum + (item.totalComments || 0), 0)
    const avgEngagement = keywords.length
      ? keywords.reduce((sum, item) => sum + (item.avgEngagement || 0), 0) / keywords.length
      : 0

    return [
      { label: 'Keyword signals', value: formatNumber(totalMentions) },
      { label: 'Observed views', value: formatNumber(totalViews) },
      { label: 'Audience discussion', value: formatNumber(totalComments) },
      { label: 'Avg engagement', value: `${(avgEngagement * 100).toFixed(2)}%` },
    ]
  }, [data])

  const topThemes = (data?.relatedKeywords ?? []).slice(0, 4)
  const marketMomentum = useMemo(() => {
    const keywords = data?.relatedKeywords ?? []
    if (!keywords.length) {
      return [
        {
          title: 'Strongest observed topic',
          value: keyword,
          note: 'Waiting for stronger market momentum signals.',
        },
      ]
    }

    const byViews = [...keywords].sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))[0]
    const byComments = [...keywords].sort((a, b) => (b.totalComments || 0) - (a.totalComments || 0))[0]
    const byEngagement = [...keywords].sort((a, b) => (b.avgEngagement || 0) - (a.avgEngagement || 0))[0]
    const byMentions = [...keywords].sort((a, b) => (b.mentionCount || 0) - (a.mentionCount || 0))[0]

    return [
      {
        title: 'Strongest observed topic',
        value: byViews?.keyword ?? keyword,
        note: `${formatNumber(byViews?.totalViews || 0)} views across current research sources.`,
      },
      {
        title: 'Most discussed theme',
        value: byComments?.keyword ?? keyword,
        note: `${formatNumber(byComments?.totalComments || 0)} comments captured from recent content.`,
      },
      {
        title: 'Highest engagement',
        value: byEngagement?.keyword ?? keyword,
        note: `${((byEngagement?.avgEngagement || 0) * 100).toFixed(2)}% average engagement rate.`,
      },
      {
        title: 'Most repeated cluster',
        value: byMentions?.keyword ?? keyword,
        note: `${byMentions?.mentionCount || 0} repeated mentions across adjacent keyword clusters.`,
      },
    ]
  }, [data, keyword])

  const researchGuard = data?.researchGuard ?? null
  const canRunDeepInsight = researchGuard ? Boolean(researchGuard.deepInsightEnabled) : true

  const sourceMix = useMemo(() => {
    const grouped = new Map()
    ;(evidenceItems ?? []).forEach((item) => {
      const key = normalizeSourceName(item?.source)
      grouped.set(key, (grouped.get(key) || 0) + 1)
    })
    const rows = Array.from(grouped.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    const maxCount = Math.max(...rows.map((item) => item.count), 1)
    const totalCount = rows.reduce((sum, item) => sum + item.count, 0) || 1
    return rows.map((item) => ({
      ...item,
      width: Math.max(12, (item.count / maxCount) * 100),
      sharePct: Math.round((item.count / totalCount) * 100),
    }))
  }, [evidenceItems])

  const competitorSnapshotCards = [
    {
      title: 'Demand concentration',
      desc: topThemes.length
        ? `Interest around "${keyword}" clusters most strongly around ${topThemes
            .slice(0, 3)
            .map((item) => `"${item.keyword}"`)
            .join(', ')}.`
        : `We are still collecting strong adjacent themes for "${keyword}".`,
    },
    {
      title: 'Content pressure',
      desc:
        data?.insights?.find((item) => item.label?.toLowerCase().includes('media'))?.text ??
        `Media competition signals for "${keyword}" are still developing.`,
    },
    {
      title: 'Actionable move',
      desc:
        data?.suggestedActions?.[0]
          ? `Recommended next move: ${data.suggestedActions[0]}.`
          : `Run a deeper source comparison to identify the strongest market angle for "${keyword}".`,
    },
  ]

  return (
    <div className="analysis-shell page-wrap">
      <section className="analysis-suite-hero card">
        <div>
          <p className="dashboard-kicker">Research suite</p>
          <h1>Market Research Workspace</h1>
          <p className="hint">
            Structured like a market research tool: overview the keyword, read market signals, then decide where to compete next.
          </p>
          <div className="analysis-module-strip">
            <span className="analysis-module-chip">Keyword Overview</span>
            <span className="analysis-module-chip">Market Signals</span>
            <span className="analysis-module-chip">Competitor Snapshot</span>
          </div>
        </div>

        <div className="analysis-suite-meta">
          <div className="analysis-suite-meta-label">Tracked keyword</div>
          <strong>{keyword}</strong>
          <span>Updated just now</span>
        </div>
      </section>

      <div className="analysis-header-row">
        <div>
          <h2>Research Overview</h2>
          <p className="hint">A quick read on volume, attention, discussion, and traction around "{keyword}".</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" className="btn-sm">Export</Button>
          <Button onClick={load} disabled={loading} className="btn-sm">
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <div className="grid grid-4">
        {summaryStats.map((stat) => (
          <section key={stat.label} className="card dashboard-kpi-card">
            <div className="dashboard-kpi-label">{stat.label}</div>
            <div className="dashboard-kpi-value">{stat.value}</div>
            <div className="dashboard-kpi-note">Based on current market research signals</div>
          </section>
        ))}
      </div>

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Data Quality</div>
            <p className="hint">Confidence and evidence coverage behind this analysis result.</p>
          </div>
        </div>
        <div className="grid grid-4">
          <div className="opportunity-item">
            <strong>Confidence band</strong>
            <p className="hint">{data?.dataQuality?.confidenceBand ?? 'Unknown'}</p>
          </div>
          <div className="opportunity-item">
            <strong>Evidence coverage</strong>
            <p className="hint">{Number(data?.dataQuality?.evidenceCoveragePct ?? 0)}%</p>
          </div>
          <div className="opportunity-item">
            <strong>Source diversity</strong>
            <p className="hint">{Number(data?.dataQuality?.sourceDiversity ?? 0)} active sources</p>
          </div>
          <div className="opportunity-item">
            <strong>Freshness</strong>
            <p className="hint">Updated within {Number(data?.dataQuality?.freshnessMinutes ?? 0)} min</p>
          </div>
        </div>
      </section>

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
              <strong>Try these market-intent keywords</strong>
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
            <div className="card-title">Keyword Compare</div>
            <p className="hint">Compare tracked keyword and adjacent clusters on core metrics.</p>
          </div>
        </div>
        <div className="keyword-table compare-table">
          <div className="kw-table-head">
            <span className="kw-th kw-th-name">Keyword</span>
            <span className="kw-th kw-th-metric">Views</span>
            <span className="kw-th kw-th-metric">Mentions</span>
            <span className="kw-th kw-th-metric">Comments</span>
            <span className="kw-th kw-th-metric">Avg engagement</span>
          </div>
          {(compareItems ?? []).map((item, idx) => (
            <div className="kw-table-row" key={`${item.keyword}-${idx}`}>
              <span className="kw-name">{item.keyword}</span>
              <span className="kw-metric-val">{formatNumber(item.observedViews)}</span>
              <span className="kw-metric-val">{item.mentions}</span>
              <span className="kw-metric-val">{formatNumber(item.comments)}</span>
              <span className="kw-metric-val">{((item.avgEngagement || 0) * 100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Signal Timeline</div>
            <p className="hint">Weekly progression of market signal volume for this tracked keyword.</p>
          </div>
        </div>
        <div className="stack">
          {(() => {
            const maxValue = Math.max(...(timelinePoints ?? []).map((point) => point.value || 0), 1)
            return (timelinePoints ?? []).map((point, idx) => {
              const width = Math.max(12, ((point.value || 0) / maxValue) * 100)
              return (
                <div key={`${point.label}-${idx}`} className="list-item">
                  <div className="list-select-row">
                    <strong>{point.label}</strong>
                    <span>{formatNumber(point.value)}</span>
                  </div>
                  <div className="kw-bar-wrap">
                    <div className="kw-bar" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </section>

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Source Coverage Chart</div>
            <p className="hint">Distribution of evidence items by source to assess concentration risk.</p>
          </div>
        </div>
        <div className="source-coverage-list">
          {sourceMix.length ? (
            sourceMix.map((row) => (
              <div key={row.source} className="source-coverage-row">
                <div className="source-coverage-top">
                  <strong className="source-coverage-name">{row.source}</strong>
                  <span className="source-coverage-meta">{row.count} items • {row.sharePct}%</span>
                </div>
                <div className="source-coverage-track">
                  <div className="source-coverage-fill" style={{ width: `${row.width}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p className="hint">No source evidence yet. Run refresh to collect data.</p>
          )}
        </div>
      </section>

      <section className="card analysis-market-signals">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Market Signals</div>
            <p className="hint">What the latest trend, sentiment, and public narratives suggest about the market.</p>
          </div>
        </div>

        <div className="analysis-signal-grid">
          <section className="card trend-area">
            <div className="trend-area-label">Market Momentum</div>
            <div className="analysis-momentum-grid">
              {marketMomentum.map((item) => (
                <div className="analysis-momentum-card" key={item.title}>
                  <div className="analysis-momentum-title">{item.title}</div>
                  <div className="analysis-momentum-value">{item.value}</div>
                  <div className="analysis-momentum-note">{item.note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-title">Estimated Audience Sentiment</div>
            </div>
            <div className="sentiment-container">
              <div className="sentiment-donut" />
              <div className="sentiment-legend">
                <span><i className="dot positive" /> Positive</span>
                <span><i className="dot neutral" /> Neutral</span>
                <span><i className="dot negative" /> Negative</span>
              </div>
            </div>
          </section>
        </div>

        <div className="analysis-signal-grid">
          <section className="card">
            <div className="card-header">
              <div className="card-title">Recent News</div>
            </div>
            {(data?.news ?? []).map((news, index) => (
              <div className="news-item" key={news}>
                <span className="news-icon" />
                <div>
                  <div className="news-title">{news}</div>
                  <div className="news-meta">Source {index + 1} • few hours ago</div>
                </div>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-title">Suggested research moves</div>
            </div>
            <div className="tag-wrap">
              {(data?.suggestedActions ?? []).map((action) => (
                <button key={action} className="tag">{action}</button>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="card analysis-competitor-snapshot">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Competitor Snapshot</div>
            <p className="hint">A simplified competitor-style read: where attention is clustering and where to position next.</p>
          </div>
        </div>

        <div className="grid grid-3">
          {competitorSnapshotCards.map((signal) => (
            <div key={signal.title} className="opportunity-item">
              <strong>{signal.title}</strong>
              <p className="hint">{signal.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Project Workflow</div>
            <p className="hint">Track this keyword as a research project, compare adjacent terms, and keep a decision timeline.</p>
          </div>
        </div>
        {projectFlow ? (
          <div className="grid grid-2">
            <div className="opportunity-item">
              <strong>{projectFlow.projectName}</strong>
              <p className="hint">Current keyword: {projectFlow.currentKeyword}</p>
              <p className="hint">Compare set: {(projectFlow.compareKeywords ?? []).join(', ') || 'No compare keywords yet'}</p>
            </div>
            <div className="stack">
              {(projectFlow.timeline ?? []).map((point, idx) => (
                <div key={`${point.label}-${idx}`} className="list-item">
                  <strong>{point.label}</strong>
                  <span>{point.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="hint">Project flow is loading.</p>
        )}
      </section>

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Action Alerts</div>
            <p className="hint">Auto-detected warnings and next actions from current market signals.</p>
          </div>
        </div>
        <div className="stack">
          {(alerts ?? []).map((alert) => (
            <div key={alert.id} className="opportunity-item">
              <strong>{alert.title}</strong>
              <p className="hint">Severity: {alert.severity} • Status: {alert.status}</p>
              <p className="hint">{alert.action}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Competitor Signals</div>
            <p className="hint">Share-of-voice proxy, keyword gap, and engagement edge from current data.</p>
          </div>
        </div>
        <div className="grid grid-3">
          {(competitorSignals ?? []).map((signal, idx) => (
            <div className="opportunity-item" key={`${signal.label}-${idx}`}>
              <strong>{signal.label}: {signal.value}</strong>
              <p className="hint">{signal.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Evidence Drill-down</div>
            <p className="hint">Raw evidence behind the insights: source item, metric, and signal snippet.</p>
          </div>
        </div>
        <div className="stack">
          {(evidenceItems ?? []).map((item, idx) => (
            <div key={`${item.source}-${idx}`} className="list-select">
              <div className="list-select-row">
                <strong>{item.source}</strong>
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
        </div>
      </section>
    </div>
  )
}
