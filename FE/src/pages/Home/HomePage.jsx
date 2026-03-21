import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'
import { Button } from '../../components/Button'

export function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('AI Agent')
  const [trends, setTrends] = useState([])

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
            placeholder="Enter keyword or paste product link..."
          />
          <Button onClick={() => navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(keyword)}`)}>
            Analyze
          </Button>
        </div>

        <p className="hint">Try: Electric bike, TikTok Shop trends, or a Shopee product link</p>
      </section>

      <section className="stack">
        <h2>Live Trends</h2>
        <div className="grid trend-grid">
          {trends.map((trend) => (
            <button
              key={trend.id}
              className="trend-card"
              onClick={() =>
                navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(trend.name)}`)
              }
            >
              <span className="trend-name">{trend.name}</span>
              <strong className={['trend-change', trend.sentiment].join(' ')}>{trend.change}</strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
