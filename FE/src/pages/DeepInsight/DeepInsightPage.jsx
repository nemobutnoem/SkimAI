import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

function buildOpportunityCards(data, keyword) {
  if (data?.opportunityCards?.length) {
    return data.opportunityCards
  }

  if (data?.opportunities?.length) {
    return data.opportunities.map((opportunity, index) => ({
      title: `AI Opportunity ${index + 1}`,
      desc: opportunity,
      theme: ['green', 'blue', 'orange', 'purple'][index % 4],
    }))
  }

  return [
    {
      title: 'Awaiting AI output',
      desc: `Press Run Analysis to generate actionable opportunities for "${keyword}".`,
      theme: 'green',
    },
  ]
}

function hasAiError(data) {
  return Boolean(data?.marketInsight?.toLowerCase().startsWith('unable to generate ai insight'))
}

const OPP_ICONS = ['🚀', '💡', '📊', '🎯']
const SIGNAL_ICONS = ['📡', '💬', '⚔️']

export function DeepInsightPage() {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || 'AI Agent'
  const [analysisContext, setAnalysisContext] = useState(null)
  const [activeSource, setActiveSource] = useState('Cross-source synthesis')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  const availableSources = analysisContext?.dataSources?.length
    ? analysisContext.dataSources
    : ['Google Search', 'Google News', 'YouTube Signals', 'Cross-source synthesis']

  useEffect(() => {
    if (activeSource === 'Cross-source synthesis') {
      return
    }
    if (!availableSources.includes(activeSource)) {
      setActiveSource(availableSources[0] ?? 'Cross-source synthesis')
    }
  }, [activeSource, availableSources])

  useEffect(() => {
    appApi.getAnalysis(keyword)
      .then((result) => {
        setAnalysisContext(result)
        if (result?.dataSources?.length && !result.dataSources.includes(activeSource)) {
          setActiveSource(result.dataSources[0])
        }
      })
      .catch(() => {
        setAnalysisContext(null)
      })
  }, [keyword])

  const load = async () => {
    setLoading(true)
    try {
      const result = await appApi.getDeepInsight({ keyword, source: activeSource })
      setData(result)
    } catch (error) {
      if (error?.status === 403) {
        setUpgradeMessage(
          error?.message ||
            'AI quota reached. Upgrade plan or buy additional AI capacity to continue.'
        )
        setShowUpgradeModal(true)
        return
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const opportunityCards = buildOpportunityCards(data, keyword)
  const aiFailed = hasAiError(data)
  const aiStatus = !data ? 'Waiting' : aiFailed ? 'Needs key fix' : 'Generated'
  const trendMessage = !data
    ? 'Run AI to generate insight'
    : aiFailed
      ? 'AI could not generate insight with the current key'
      : `AI generated from ${activeSource}`
  const signalSummary = !data
    ? `No AI result yet for "${keyword}".`
    : data.marketInsight
  const recommendationSummary = !data
    ? 'Press Run Analysis to generate the strategic recommendation.'
    : data.recommendation
  const stats = data?.stats ?? [
    { value: keyword, label: 'Current Keyword' },
    { value: activeSource, label: 'AI Source' },
    { value: aiStatus, label: 'AI Status' },
  ]
  const mediaSignals = data?.mediaSignals ?? [
    {
      title: 'AI summary state',
      desc: signalSummary,
    },
    {
      title: 'Selected source',
      desc: `Current analysis source: ${activeSource}.`,
    },
    {
      title: 'Recommendation status',
      desc: recommendationSummary,
    },
  ]
  const trendPoints = data?.trendPoints ?? [
    { label: keyword, value: 52, note: 'Baseline trend signal' },
  ]
  const sentimentBars = data?.sentiment?.bars ?? [
    { label: 'Positive', pct: data ? 70 : 0, color: 'var(--green)', cls: 'text-green' },
    { label: 'Neutral', pct: data ? 20 : 0, color: 'var(--gray-500)', cls: '' },
    { label: 'Negative', pct: data ? 10 : 0, color: 'var(--red)', cls: 'text-red' },
  ]
  const discussionTopics = data?.sentiment?.topics ?? [
    { name: keyword, change: data ? 'active' : 'waiting' },
    { name: activeSource, change: 'selected' },
    { name: 'Market insight', change: data ? 'ready' : 'pending' },
    { name: 'Recommendation', change: data ? 'ready' : 'pending' },
  ]
  const strategicRecommendation = data?.strategicRecommendation ?? {
    title: data ? (aiFailed ? 'AI generation needs attention' : 'AI-generated direction') : 'Ready to generate recommendation',
    desc: recommendationSummary,
    stats: [
      { value: keyword, label: 'Current Keyword' },
      { value: activeSource, label: 'Current Source' },
      { value: aiStatus, label: 'AI Status', highlight: Boolean(data) && !aiFailed },
    ],
  }

  return (
    <div className="di-shell page-wrap">
      {/* Page Header */}
      <div className="di-page-top">
        <div>
          <p className="dashboard-kicker">Deep Analysis</p>
          <h1>AI Deep Insight</h1>
          <p className="hint">AI-powered recommendations from your collected market research data.</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" className="btn-sm">Export Report</Button>
          <Link to={`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(keyword)}`} className="btn btn-primary btn-sm">← Back to Analysis</Link>
        </div>
      </div>

      {/* AI Input Card */}
      <div className="di-data-input-card">
        <div className="di-card-header-row">
          <h4>⚡ AI Input Configuration</h4>
          <Button onClick={load} disabled={loading} className="btn-sm">
            {loading ? '⏳ Analyzing...' : '🚀 Run Analysis'}
          </Button>
        </div>
        <div className="di-keyword-box">
          <div className="di-input-label">Research keyword</div>
          <div className="di-keyword-value">{keyword}</div>
          <div className="hint">Carried from the analysis page. Select a source and press Run Analysis.</div>
        </div>

        <div className="di-input-label">Data Sources</div>
        <div className="di-data-source-tabs">
          {availableSources.map((src) => (
            <button
              key={src}
              className={`di-data-source-tab${activeSource === src ? ' active' : ''}`}
              onClick={() => setActiveSource(src)}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Market Insight */}
      <div className="di-section-card">
        <div className="di-section-title">📊 Market Insight</div>
        <div className="di-key-finding">
          <div className="di-kf-label">Key Finding</div>
          <p>{signalSummary ?? `Press "Run Analysis" to generate AI insight for "${keyword}".`}</p>
        </div>
        <div className="di-stat-grid">
          {stats.map((s) => (
            <div className="di-stat-box" key={s.label}>
              <div className="di-stat-num di-stat-num-text">{s.value}</div>
              <div className="di-stat-desc">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Trend Analysis */}
      <div className="di-section-card">
        <div className="di-section-title">📈 Search Trend Analysis</div>
        <div className="di-trend-status">{trendMessage}</div>
        <div className="di-trend-table">
          <div className="di-trend-table-head">
            <span className="di-tth di-tth-rank">#</span>
            <span className="di-tth di-tth-name">Keyword</span>
            <span className="di-tth di-tth-note">Metrics</span>
            <span className="di-tth di-tth-bar">Momentum</span>
          </div>
          {trendPoints.map((point, idx) => (
            <div className="di-trend-table-row" key={point.label}>
              <span className="di-trend-rank">{idx + 1}</span>
              <span className="di-trend-kw">{point.label}</span>
              <span className="di-trend-note">{point.note}</span>
              <span className="di-trend-bar-cell">
                <div className="di-trend-bar-track">
                  <div className="di-trend-bar-fill" style={{ width: `${point.value}%` }} />
                </div>
                <span className="di-trend-pct">{point.value}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Media & Industry Signals */}
      <div className="di-section-card">
        <div className="di-section-title">📡 Media & Industry Signals</div>
        <div className="di-signal-grid">
          {mediaSignals.map((sig, idx) => (
            <div className="di-signal-card" key={sig.title}>
              <div className="di-signal-icon">{SIGNAL_ICONS[idx % SIGNAL_ICONS.length]}</div>
              <div>
                <h5>{sig.title}</h5>
                <p>{sig.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Audience Sentiment */}
      <div className="di-section-card">
        <div className="di-section-title">💬 Estimated Audience Sentiment</div>
        <div className="di-sentiment-two-col">
          <div className="di-sentiment-bars">
            {sentimentBars.map((bar) => (
              <div className="di-sentiment-bar-row" key={bar.label}>
                <span className={`di-sentiment-bar-label ${bar.cls || ''}`}>{bar.label}</span>
                <div className="di-sentiment-bar-track">
                  <div className="di-sentiment-bar-fill" style={{ width: `${bar.pct}%`, background: bar.color }} />
                </div>
                <span className="di-sentiment-bar-value">{bar.pct}%</span>
              </div>
            ))}
          </div>

          <div>
            <h5 className="di-topics-title">Key Discussion Topics</h5>
            <div className="hint" style={{ marginBottom: 10 }}>Estimated from engagement and keyword overlap.</div>
            <div className="di-topics-list">
              {discussionTopics.map((t) => (
                <div className="di-discussion-topic" key={t.name}>
                  <span className="di-topic-name">{t.name}</span>
                  <span className="di-topic-change">{t.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Market Opportunities */}
      <div className="di-section-card">
        <div className="di-section-title">🎯 Market Opportunities</div>
        <div className="di-opportunity-grid">
          {opportunityCards.map((opp, idx) => (
            <div className={`di-opportunity-card di-opp-${opp.theme}`} key={opp.title}>
              <div className="di-opp-icon">{OPP_ICONS[idx % OPP_ICONS.length]}</div>
              <h5>{opp.title}</h5>
              <p>{opp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Recommendation */}
      <div className="di-strategic-card">
        <h4>✨ Strategic Recommendation</h4>
        <h5>{strategicRecommendation.title}</h5>
        <p>{strategicRecommendation.desc ?? recommendationSummary ?? `The AI model will generate a strategic recommendation for "${keyword}" after you press Run Analysis.`}</p>
        <div className="di-strategic-stats">
          {strategicRecommendation.stats.map((s) => (
            <div key={s.label}>
              <div className={`di-s-value${s.highlight ? ' green' : ''}`}>{s.value}</div>
              <div className="di-s-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Link to={ROUTES.ASK_EXPERT} className="di-ask-expert-float">
        <span className="di-expert-icon">🧑‍🔬</span>
        Ask an expert
      </Link>

      {showUpgradeModal ? (
        <div className="upgrade-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <h3>AI Usage Limit Reached</h3>
            <p>{upgradeMessage || 'You have reached your AI usage limit for this period.'}</p>
            <div className="upgrade-modal-actions">
              <Link to={ROUTES.PRICING} className="btn btn-primary" onClick={() => setShowUpgradeModal(false)}>
                Upgrade or Buy Capacity
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUpgradeModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
