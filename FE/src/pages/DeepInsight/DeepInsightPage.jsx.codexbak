import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { appApi } from '../../services/appApi'

export function DeepInsightPage() {
  const [keyword, setKeyword] = useState('AI Marketing')
  const [source, setSource] = useState('search')
  const [data, setData] = useState(null)

  const load = async () => {
    const result = await appApi.getDeepInsight({ keyword, source })
    setData(result)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="stack page-wrap">
      <Card title="Data Input">
        <div className="grid grid-3">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Keyword" />
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="search">Search Trends</option>
            <option value="news">News</option>
            <option value="social">Social</option>
          </select>
          <Button onClick={load}>Generate Insight</Button>
        </div>
      </Card>

      <Card title="Market Insight">
        <p>{data?.marketInsight}</p>
      </Card>

      <Card title="Market Opportunities">
        <div className="grid grid-2">
          {(data?.opportunities ?? []).map((item) => (
            <div key={item} className="opportunity-item">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Strategic Recommendation">
        <p>{data?.recommendation}</p>
      </Card>
    </div>
  )
}
