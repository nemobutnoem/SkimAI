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
        <h1 className="hero-title">AI Trend Intelligence Platform</h1>
        <p className="hero-subtitle">Theo doi xu huong thi truong theo thoi gian thuc va nhan de xuat hanh dong.</p>

        <div className="input-row">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Nhap tu khoa"
          />
          <Button onClick={() => navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(keyword)}`)}>
            Analyze
          </Button>
        </div>
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
