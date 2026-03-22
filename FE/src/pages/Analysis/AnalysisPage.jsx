import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
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
        {needsTruncate && !expanded ? text.slice(0, INSIGHT_TRUNCATE) + '...' : text}
      </div>
      {needsTruncate && (
        <button className="see-more-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'See more'}
        </button>
      )}
    </div>
  )
}

function formatNumber(num) {
  if (!num && num !== 0) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return String(num)
}

export function AnalysisPage() {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || 'AI Agent'

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
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  return (
    <div className="analysis-shell page-wrap">
      <div className="analysis-header-row">
        <div>
          <h1>Market Analysis</h1>
          <p className="hint">Keyword: "{keyword}" • Last updated just now</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" className="btn-sm">Export</Button>
          <Button onClick={load} disabled={loading} className="btn-sm">
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <section className="card ai-summary">
        <h2 className="card-title">AI Summary</h2>
        <div className="insight-grid">
          {(data?.insights ?? []).map((item, i) => (
            <InsightCard key={i} insight={item} />
          ))}
        </div>
        <div className="ask-more">
          <Link to={ROUTES.DEEP_INSIGHT} className="ask-more-cta">
            <span className="ask-more-icon">AI</span>
            <span>Ask AI More {'->'}</span>
          </Link>
        </div>
      </section>

      <section className="card trend-area">
        <div className="trend-area-label">7-Day Trend Analysis</div>
        <div className="chart-placeholder chart-lg" />
      </section>

      <section className="ai-actions">
        <div className="ai-actions-label">Suggested AI Actions:</div>
        <div className="tag-wrap">
          {(data?.suggestedActions ?? []).map((a) => (
            <button key={a} className="tag">{a}</button>
          ))}
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <div className="card-header">
            <div className="card-title">Search Trend</div>
            <select className="mini-select">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="chart-placeholder chart-md" />
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-title">Related Keywords</div>
          </div>
          <div className="keyword-list">
            {(data?.relatedKeywords ?? []).map((km, index) => {
              const maxMentions = Math.max(...(data?.relatedKeywords ?? []).map(k => k.mentionCount || 1));
              const barWidth = Math.max(15, ((km.mentionCount || 1) / maxMentions) * 100);
              return (
                <div className="keyword-row" key={km.keyword || index}>
                  <span className="kw-name">{km.keyword}</span>
                  <div className="kw-bar-wrap">
                    <div className="kw-bar" style={{ width: `${barWidth}%` }} />
                    <span className="kw-metrics">
                      <span title="Views">👁 {formatNumber(km.totalViews)}</span>
                      <span title="Likes">❤ {formatNumber(km.totalLikes)}</span>
                      <span title="Comments">💬 {formatNumber(km.totalComments)}</span>
                      <span title="Mentions">📊 {km.mentionCount}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-header">
            <div className="card-title">Social Sentiment</div>
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
      </div>
    </div>
  )
}
