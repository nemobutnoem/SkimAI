import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

const STATUSES = ['all', 'draft', 'pending', 'published']

export function AdminReportsPage() {
  const [status, setStatus] = useState('all')
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState('')

  const loadReports = async (nextStatus = status) => {
    const data = await appApi.getAdminReports(nextStatus)
    setReports(data)
    if (!selectedId && data[0]) setSelectedId(data[0].id)
    if (selectedId && !data.some((item) => item.id === selectedId)) {
      setSelectedId(data[0]?.id ?? '')
    }
  }

  useEffect(() => {
    loadReports(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const selected = useMemo(() => reports.find((item) => item.id === selectedId), [reports, selectedId])

  const moderate = async (nextStatus) => {
    if (!selectedId) return
    await appApi.moderateReport(selectedId, nextStatus)
    await loadReports(status)
  }

  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <h1>Admin Reports</h1>
        <div className="tag-wrap">
          {STATUSES.map((item) => (
            <button
              key={item}
              className={['tab-btn', status === item ? 'active' : ''].join(' ')}
              onClick={() => setStatus(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid admin-columns">
        <Card title="Report List">
          <div className="stack">
            {reports.map((report) => (
              <button
                key={report.id}
                className={['list-select', selectedId === report.id ? 'active' : ''].join(' ')}
                onClick={() => setSelectedId(report.id)}
              >
                <div className="list-select-row">
                  <strong>{report.title}</strong>
                  <span className={['badge', `badge-${report.status}`].join(' ')}>{report.status}</span>
                </div>
                <span className="hint">
                  {report.category} • AI Score {report.aiScore}%
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Preview & Moderation">
          {selected ? (
            <div className="stack">
              <h3>{selected.title}</h3>
              <p>{selected.summary}</p>
              <span className="hint">Author: {selected.author}</span>
              <span className="hint">Updated: {new Date(selected.updatedAt).toLocaleString()}</span>

              <div className="tag-wrap">
                <Button onClick={() => moderate('published')}>Approve</Button>
                <Button variant="secondary" onClick={() => moderate('draft')}>
                  Request revision
                </Button>
                <Button variant="secondary" onClick={() => moderate('archived')}>
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <div className="hint">No report selected</div>
          )}
        </Card>
      </div>
    </div>
  )
}
