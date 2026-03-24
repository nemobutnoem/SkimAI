import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'
import { Button } from '../../components/Button'

export function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [trends, setTrends] = useState([])

  const visibleTrends = useMemo(() => {
    const seen = new Set()
    return trends.filter((trend) => {
      const key = trend?.id || `${trend?.name}-${trend?.market}`
      if (!key || seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }, [trends])

  useEffect(() => {
    appApi.getHomeTrends().then(setTrends)
  }, [])

  return (
    <div className="stack page-wrap">
      <section className="hero card">
        <h1 className="hero-title">
          Market Insights in <span className="highlight">Seconds</span>, Not Weeks
        </h1>
        <p className="hero-subtitle">
          AI-powered analysis and real-time trend detection to help you make smarter business decisions instantly.
        </p>

        <div className="input-row">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a market keyword or paste a product link..."
          />
          <Button onClick={() => navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(keyword)}`)}>
            Analyze
          </Button>
        </div>

        <p className="hint">Try: Electric bike, TikTok Shop trends, or a Shopee product link</p>
      </section>

      <section className="stack">
        <h2>Hot Trends</h2>
        <div className="grid trend-grid">
          {visibleTrends.map((trend) => (
            <button
              key={trend.id}
              className="trend-card"
              onClick={() =>
                navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(trend.name)}`)
              }
            >
              <div className="trend-card-top">
                <span className="trend-badge">Hot trend</span>
                <strong className={['trend-change', trend.sentiment].join(' ')}>{trend.change}</strong>
              </div>
              <span className="trend-name">{trend.name}</span>
              <p className="trend-signal">{trend.market}</p>
              <div className="trend-meta">
                <span>{trend.sourceCount} sources</span>
                <span>{trend.updatedAt}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="card usp-showcase">
        <div className="usp-head">
          <p className="dashboard-kicker">USP Snapshot</p>
          <h2>Why teams choose AISKIM</h2>
          <p className="hint">Use this block directly for your presentation slide.</p>
        </div>
        <div className="grid grid-3 usp-grid">
          <article className="usp-card">
            <span className="usp-tag">Signal + AI</span>
            <h3>Evidence-backed insights</h3>
            <p>AI summaries are tied to source evidence, confidence score, and data-quality checks.</p>
          </article>
          <article className="usp-card">
            <span className="usp-tag">Research Flow</span>
            <h3>From keyword to decision</h3>
            <p>Compare keywords, monitor timeline, read market signals, then run deep insight.</p>
          </article>
          <article className="usp-card">
            <span className="usp-tag">Monetization-ready</span>
            <h3>Tiered plans + AI quota</h3>
            <p>Free trial quota, paid plan limits, and upgrade path when users need more capacity.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
