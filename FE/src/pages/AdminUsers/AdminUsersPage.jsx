import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

export function AdminUsersPage() {
  const [filters, setFilters] = useState({ q: '', type: 'all', status: 'all' })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    appApi.getAdminUsersMetrics().then(setMetrics)
  }, [])

  useEffect(() => {
    setLoading(true)
    appApi.getAdminUsers(filters)
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Quản trị Người dùng</h1>
          <p className="hint">Theo dõi phân khúc khách hàng, cơ cấu gói dịch vụ và chất lượng sử dụng trên cùng một bảng.</p>
        </div>
      </div>

      <div className="grid grid-4">
        {(metrics?.metrics ?? []).map((item) => (
          <Card key={item.label} title={item.label === 'Total users' ? 'Tổng người dùng' : item.label === 'Premium users' ? 'Tài khoản Premium' : item.label === 'Active users' ? 'Đang hoạt động' : item.label === 'Churn rate' ? 'Tỷ lệ rời bỏ' : item.label}>
            <div className="kpi">{item.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="grid grid-3">
          <input
            placeholder="Tìm kiếm tên hoặc email"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          />
          <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}>
            <option value="all">Tất cả loại</option>
            <option value="paid">Trả phí</option>
            <option value="free">Miễn phí</option>
            <option value="starter">Starter</option>
            <option value="team">Team</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Bị khóa</option>
          </select>
        </div>
      </Card>

      <Card title={`Người dùng (${users.length})`}>
        {loading ? <div className="hint">Đang tải danh sách người dùng...</div> : null}
        <table className="table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Loại tài khoản</th>
              <th>Trạng thái</th>
              <th>Mức sử dụng</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role === 'admin' || user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'user' || user.role === 'USER' || user.role === 'Member' || user.role === 'Thành viên' ? 'Thành viên' : user.role}</td>
                <td>{user.type?.toUpperCase() === 'FREE' ? 'Miễn phí' : user.type?.toUpperCase() === 'STARTER' ? 'Gói Starter' : user.type?.toUpperCase() === 'TEAM' ? 'Gói Team' : user.type?.toUpperCase() === 'ENTERPRISE' ? 'Gói Enterprise' : user.type}</td>
                <td>
                  <span className={['badge', `badge-${user.status}`].join(' ')}>{user.status === 'active' ? 'Đang hoạt động' : user.status === 'suspended' ? 'Bị khóa' : user.status}</span>
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
