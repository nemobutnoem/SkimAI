import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'
import { AdminSectionNav } from '../../components/AdminSectionNav'

export function AdminUsersPage() {
  const [filters, setFilters] = useState({ q: '', type: 'all', status: 'all' })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    appApi.getAdminUsers(filters)
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="stack page-wrap">
      <AdminSectionNav />

      <div className="page-header">
        <div>
          <h1>Admin Users</h1>
          <p className="hint">Track customer segments, plan mix, and usage quality in one table.</p>
        </div>
      </div>

      <Card>
        <div className="grid grid-3">
          <input
            placeholder="Search name or email"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          />
          <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}>
            <option value="all">All types</option>
            <option value="paid">Paid</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="team">Team</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </Card>

      <Card title={`Users (${users.length})`}>
        {loading ? <div className="hint">Loading users...</div> : null}
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Type</th>
              <th>Status</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.type}</td>
                <td>
                  <span className={['badge', `badge-${user.status}`].join(' ')}>{user.status}</span>
                </td>
                <td>{user.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
