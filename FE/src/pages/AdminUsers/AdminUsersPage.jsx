import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

export function AdminUsersPage() {
  const [filters, setFilters] = useState({ q: '', type: 'all', status: 'all' })
  const [users, setUsers] = useState([])

  useEffect(() => {
    appApi.getAdminUsers(filters).then(setUsers)
  }, [filters])

  return (
    <div className="stack page-wrap">
      <h1>Admin Users</h1>

      <Card>
        <div className="grid grid-3">
          <input
            placeholder="Search name or email"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          />
          <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}>
            <option value="all">All types</option>
            <option value="premium">Premium</option>
            <option value="standard">Standard</option>
            <option value="trial">Trial</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </Card>

      <Card title={`Users (${users.length})`}>
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
