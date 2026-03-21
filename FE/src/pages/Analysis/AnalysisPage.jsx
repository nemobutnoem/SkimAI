import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { appApi } from '../../services/appApi'

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
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Analysis</h1>
          <p className="hint">Keyword: {keyword}</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Card title="AI Summary">
        <div className="grid grid-2">
          {(data?.insights ?? []).map((item) => (
            <div key={item} className="info-chip">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-2">
        <Card title="Related Keywords">
          <div className="tag-wrap">
            {(data?.relatedKeywords ?? []).map((k) => (
              <span key={k} className="tag">
                {k}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Recent News">
          <ul className="list">
            {(data?.news ?? []).map((news) => (
              <li key={news}>{news}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Suggested Actions">
        <div className="tag-wrap">
          {(data?.suggestedActions ?? []).map((a) => (
            <Button key={a} variant="secondary">
              {a}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
