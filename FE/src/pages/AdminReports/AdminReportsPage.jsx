import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'
import { AdminSectionNav } from '../../components/AdminSectionNav'

const STATUSES = ['all', 'pending', 'draft', 'published', 'archived']

export function AdminReportsPage() {
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState('')

  const loadReports = async (nextStatus = status) => {
    const data = await appApi.getAdminReports(nextStatus)
    setReports(data)
  }

  useEffect(() => {
    loadReports(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return reports
    return reports.filter((report) =>
      report.title?.toLowerCase().includes(normalized) ||
      report.author?.toLowerCase().includes(normalized),
    )
  }, [query, reports])

  useEffect(() => {
    if (!selectedId && filteredReports[0]) {
      setSelectedId(filteredReports[0].id)
      return
    }
    if (selectedId && !filteredReports.some((item) => item.id === selectedId)) {
      setSelectedId(filteredReports[0]?.id ?? '')
    }
  }, [filteredReports, selectedId])

  const selected = useMemo(() => filteredReports.find((item) => item.id === selectedId), [filteredReports, selectedId])

  const moderate = async (nextStatus) => {
    if (!selectedId) return
    await appApi.moderateReport(selectedId, nextStatus)
    await loadReports(status)
  }

  return (
    <div className="stack page-wrap">
      <AdminSectionNav />

      <div className="page-header">
        <div>
          <h1>Admin Reports</h1>
          <p className="hint">Moderation queue: filter, preview, approve, or archive report output.</p>
        </div>
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

      <Card>
        <div className="grid grid-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search report title or author"
          />
          <div className="hint" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            Showing {filteredReports.length} report(s)
          </div>
        </div>
      </Card>

      <div className="grid admin-columns">
        <Card title="Report List">
          <div className="stack">
            {filteredReports.map((report) => (
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
                  Archive
                </Button>
                <Button variant="secondary" onClick={() => moderate('pending')}>
                  Move to pending
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
