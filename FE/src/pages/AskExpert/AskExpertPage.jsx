import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { mockApi } from '../../services/mockApi'

export function AskExpertPage() {
  const [experts, setExperts] = useState([])
  const [payload, setPayload] = useState({
    topic: 'Market Entry',
    expertId: '',
    question: '',
  })
  const [result, setResult] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    mockApi.getExperts().then((items) => {
      setExperts(items)
      setPayload((prev) => ({ ...prev, expertId: items[0]?.id ?? '' }))
    })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await mockApi.submitExpertQuestion(payload)
      setResult(res)
      setPayload((prev) => ({ ...prev, question: '' }))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="stack page-wrap">
      <h1>Ask Expert</h1>

      <div className="grid grid-3">
        {experts.map((expert) => (
          <Card key={expert.id} title={expert.name}>
            <div className="stack">
              <span className="hint">{expert.domain}</span>
              <span>Rating: {expert.rating}/5</span>
              <strong>${expert.price}/question</strong>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Submit Question">
        <form className="form form-wide" onSubmit={submit}>
          <div className="grid grid-2">
            <label className="field">
              <span>Topic</span>
              <input
                value={payload.topic}
                onChange={(e) => setPayload((prev) => ({ ...prev, topic: e.target.value }))}
              />
            </label>

            <label className="field">
              <span>Expert</span>
              <select
                value={payload.expertId}
                onChange={(e) => setPayload((prev) => ({ ...prev, expertId: e.target.value }))}
              >
                {experts.map((expert) => (
                  <option key={expert.id} value={expert.id}>
                    {expert.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Question</span>
            <textarea
              rows={5}
              value={payload.question}
              onChange={(e) => setPayload((prev) => ({ ...prev, question: e.target.value }))}
              placeholder="Nhap boi canh va cau hoi ban can duoc tu van"
              required
            />
          </label>

          <Button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Submit'}
          </Button>

          {result ? (
            <div className="hint">Request {result.id} da duoc tiep nhan, ETA {result.etaHours}h.</div>
          ) : null}
        </form>
      </Card>
    </div>
  )
}
