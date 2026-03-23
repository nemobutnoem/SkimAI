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
    </div>
  )
}
