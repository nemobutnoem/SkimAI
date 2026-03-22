import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

const DATA_SOURCES = ['Search Trends', 'News Coverage', 'Social Sentiment', 'Testing Keywords']

export function DeepInsightPage() {
  const [searchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') || 'Electric Bikes'

  const [keyword, setKeyword] = useState(initialKeyword)
  const [period, setPeriod] = useState('Last 30 Days')
  const [activeSource, setActiveSource] = useState('Search Trends')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await appApi.getDeepInsight({ keyword, source: activeSource })
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="di-shell page-wrap">
      {/* Page Top */}
      <div className="di-page-top">
        <div>
          <h1>AI Deep Insight Analysis</h1>
          <p className="hint">Advanced market intelligence powered by AI Analysis</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" className="btn-sm">📤 Export Report</Button>
          <Button className="btn-sm" onClick={() => window.location.href = '/'}>+ New Analysis</Button>
        </div>
      </div>

      {/* Data Input */}
      <div className="di-data-input-card">
        <h4>Data Input for Analysis</h4>
        <div className="di-input-row">
          <div>
            <div className="di-input-label">Keyword</div>
            <input
              className="di-input-field"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div>
            <div className="di-input-label">Analysis Period</div>
            <select
              className="di-input-field"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
        </div>
        <div className="di-input-label">Data Sources</div>
        <div className="di-data-source-tabs">
          {DATA_SOURCES.map((src) => (
            <button
              key={src}
              className={`di-data-source-tab${activeSource === src ? ' active' : ''}`}
              onClick={() => setActiveSource(src)}
            >
              {src}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={load} disabled={loading} className="btn-sm">
            {loading ? 'Analyzing...' : '🔍 Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Market Insight */}
      <div className="di-section-card">
        <div className="di-section-title"><span className="di-section-icon">📊</span> Market Insight</div>
        <div className="di-key-finding">
          <div className="di-kf-label">Key Finding</div>
          <p>{data?.keyFinding ?? 'Search interest for "Electric Bikes" increased by 47% over the last 30 days, with a significant spike on March 15th (+89% daily increase) coinciding with government sustainability announcements.'}</p>
        </div>
        <div className="di-stat-grid">
          {(data?.stats ?? [
            { value: '+47%', label: 'Monthly Growth' },
            { value: '89%', label: 'Peak Day Spike' },
            { value: '8.2k', label: 'Daily Searches' },
          ]).map((s) => (
            <div className="di-stat-box" key={s.label}>
              <div className="di-stat-num">{s.value}</div>
              <div className="di-stat-desc">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Trend Analysis */}
      <div className="di-section-card">
        <div className="di-section-title"><span className="di-section-icon">📈</span> Search Trend Analysis</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'right' }}>Search Interest Over Time</div>
        <div className="chart-placeholder chart-lg" />
      </div>

      {/* Media & Industry Signals */}
      <div className="di-section-card">
        <div className="di-section-title"><span className="di-section-icon">📰</span> Media & Industry Signals</div>
        {(data?.mediaSignals ?? [
          { title: 'Government Policy Support', desc: 'Recent coverage highlights $2B federal investment in electric transportation infrastructure, with specific focus on urban mobility solutions.' },
          { title: 'Industry Expansion', desc: 'Major retailers like Walmart and Target announced electric bike partnerships, indicating mainstream market acceptance.' },
          { title: 'Technology Advancement', desc: 'Battery technology breakthroughs featured in 10+ tech publications, emphasizing improved range and faster charging.' },
        ]).map((sig) => (
          <div className="di-signal-item" key={sig.title}>
            <h5>{sig.title}</h5>
            <p>{sig.desc}</p>
          </div>
        ))}
      </div>

      {/* Social Sentiment */}
      <div className="di-section-card">
        <div className="di-section-title"><span className="di-section-icon">💜</span> Social Sentiment</div>
        <div className="di-sentiment-two-col">
          <div className="di-sentiment-bars">
            {(data?.sentiment?.bars ?? [
              { label: 'Positive', pct: 69, color: 'var(--green)', cls: 'text-green' },
              { label: 'Neutral', pct: 24, color: 'var(--gray-500)', cls: '' },
              { label: 'Negative', pct: 8, color: 'var(--red)', cls: 'text-red' },
            ]).map((bar) => (
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
            <h5 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Key Discussion Topics</h5>
            {(data?.sentiment?.topics ?? [
              { name: 'Affordability', change: '+34%' },
              { name: 'Battery Life', change: '+28%' },
              { name: 'Urban Commuting', change: '+22%' },
              { name: 'Environmental Impact', change: '+19%' },
            ]).map((t) => (
              <div className="di-discussion-topic" key={t.name}>
                <span className="di-topic-name">{t.name}</span>
                <span className="di-topic-change">{t.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Opportunities */}
      <div className="di-section-card">
        <div className="di-section-title"><span className="di-section-icon">🎯</span> Market Opportunities</div>
        <div className="di-opportunity-grid">
          {(data?.opportunityCards ?? [
            { title: 'Budget Segment Growth', desc: 'Rising keywords: "cheap electric bike" (+185%), "affordable e-bike" (+160%) suggest strong demand in entry-level market.', theme: 'green' },
            { title: 'Subscription Models', desc: '"Electric bike rental" (+152%) and "e-bike subscription" (+118%) show interest in alternative ownership models.', theme: 'blue' },
            { title: 'Urban Commuter Focus', desc: '"Electric bike commuting" (+147%) and "e-bike city" (+85%) indicate opportunity in metropolitan markets.', theme: 'orange' },
            { title: 'Cargo & Family Bikes', desc: '"Electric cargo bike" (+134%) and "family e-bike" (+86%) represent growing niche segments.', theme: 'purple' },
          ]).map((opp) => (
            <div className={`di-opportunity-card di-opp-${opp.theme}`} key={opp.title}>
              <h5>{opp.title}</h5>
              <p>{opp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Recommendation */}
      <div className="di-strategic-card">
        <h4>🏆 Strategic Recommendation</h4>
        <h5>{data?.strategicRecommendation?.title ?? 'Focus on Entry-Level Urban Market'}</h5>
        <p>{data?.strategicRecommendation?.desc ?? 'Based on the analysis, brands should prioritize developing affordable electric bike models ($800-$1,500) specifically designed for urban commuters. The convergence of government support, positive sentiment around affordability, and rising budget-focused keywords creates a significant market opportunity.'}</p>
        <div className="di-strategic-stats">
          {(data?.strategicRecommendation?.stats ?? [
            { value: '$1.2B', label: 'Estimated Market Size' },
            { value: '18 Months', label: 'Optimal Entry Window' },
            { value: '156%', label: 'Budget Keyword Growth', highlight: true },
          ]).map((s) => (
            <div key={s.label}>
              <div className={`di-s-value${s.highlight ? ' green' : ''}`}>{s.value}</div>
              <div className="di-s-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Ask Expert */}
      <Link to={ROUTES.ASK_EXPERT} className="di-ask-expert-float">
        <span className="di-expert-icon">👨‍💼</span>
        Ask an expert
      </Link>
    </div>
  )
}
