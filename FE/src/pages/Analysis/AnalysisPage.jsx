import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

const INSIGHT_TRUNCATE = 120

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false)
  const text = insight?.text || ''
  const label = insight?.label || 'Insight'
  const needsTruncate = text.length > INSIGHT_TRUNCATE

  return (
    <div className="insight-item">
      <div className="insight-label">
        <span className="dot-indicator" /> {label}
      </div>
      <div className="insight-text">
        {needsTruncate && !expanded ? `${text.slice(0, INSIGHT_TRUNCATE)}...` : text}
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

export function AnalysisPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword')?.trim() || ''
  const [draftKeyword, setDraftKeyword] = useState('')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await appApi.getAnalysis(keyword)
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!keyword) {
      setData(null)
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

  const competitorSignals = [
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

      <section className="card ai-summary">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Keyword Overview</div>
            <p className="hint">Core insights and adjacent keyword opportunities for this topic.</p>
          </div>
        </div>

        <div className="insight-grid">
          {(data?.insights ?? []).map((item, i) => (
            <InsightCard key={i} insight={item} />
          ))}
        </div>

        <div className="analysis-keyword-shelf">
          <div className="analysis-subsection-title">Related keyword clusters</div>
          <div className="keyword-list">
            {(data?.relatedKeywords ?? []).map((km, index) => {
              const maxMentions = Math.max(...(data?.relatedKeywords ?? []).map((k) => k.mentionCount || 1), 1)
              const barWidth = Math.max(15, ((km.mentionCount || 1) / maxMentions) * 100)
              return (
                <div className="keyword-row" key={km.keyword || index}>
                  <span className="kw-name">{km.keyword}</span>
                  <div className="kw-bar-wrap">
                    <div className="kw-bar" style={{ width: `${barWidth}%` }} />
                    <span className="kw-metrics">
                      <span title="Views">Views {formatNumber(km.totalViews)}</span>
                      <span title="Likes">Likes {formatNumber(km.totalLikes)}</span>
                      <span title="Comments">Comments {formatNumber(km.totalComments)}</span>
                      <span title="Mentions">Mentions {km.mentionCount}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ask-more">
          <Link to={`${ROUTES.DEEP_INSIGHT}?keyword=${encodeURIComponent(keyword)}`} className="ask-more-cta">
            <span className="ask-more-icon">AI</span>
            <span>Ask AI More {'->'}</span>
          </Link>
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
          {competitorSignals.map((signal) => (
            <div key={signal.title} className="opportunity-item">
              <strong>{signal.title}</strong>
              <p className="hint">{signal.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
