import { sleep } from '../../utils/sleep'
import {
  DB,
  getPlanForUser,
  mapReportToAdminCard,
  nowIso,
  sortByCreatedAtDesc,
  statusToBadge,
} from './core'

export const adminMockApi = {
  async getAdminDashboard() {
    await sleep(220)

    const activeUsers = DB.users.filter((u) => u.status === 'ACTIVE').length
    const premiumUsers = DB.user_subscriptions.filter((sub) => {
      const plan = DB.plans.find((p) => p.id === sub.plan_id)
      return sub.status === 'ACTIVE' && ['Pro', 'Enterprise', 'Basic'].includes(plan?.name)
    }).length

    const revenue = DB.user_subscriptions.reduce((sum, sub) => {
      if (sub.status !== 'ACTIVE') return sum
      const plan = DB.plans.find((p) => p.id === sub.plan_id)
      return sum + Number(plan?.price ?? 0)
    }, 0)

    const churnCount = DB.user_subscriptions.filter((sub) => sub.status !== 'ACTIVE').length
    const churnRate = DB.user_subscriptions.length
      ? `${((churnCount / DB.user_subscriptions.length) * 100).toFixed(1)}%`
      : '0.0%'

    return {
      stats: [
        { label: 'Users', value: activeUsers },
        { label: 'Premium', value: premiumUsers },
        { label: 'Revenue', value: `$${revenue}` },
        { label: 'Reports', value: DB.reports.length },
        { label: 'Churn', value: churnRate },
      ],
      activities: sortByCreatedAtDesc(DB.admin_actions)
        .slice(0, 3)
        .map((action) => `${action.action_type} at ${new Date(action.created_at).toLocaleString()}`),
    }
  },

  async getAdminReports(status = 'all') {
    await sleep(180)

    const normalized = String(status ?? 'all').toUpperCase()
    const filtered = normalized === 'ALL'
      ? DB.reports
      : DB.reports.filter((report) => report.status === normalized)

    return filtered.map(mapReportToAdminCard)
  },

  async moderateReport(reportId, nextStatus) {
    await sleep(170)

    const report = DB.reports.find((r) => r.id === reportId)
    if (!report) {
      throw new Error('Report không tồn tại')
    }

    report.status = String(nextStatus ?? '').toUpperCase()
    DB.admin_actions.push({
      id: `act_${Date.now()}`,
      admin_user_id: '22222222-2222-2222-2222-222222222222',
      action_type: `REPORT_${report.status}`,
      target_id: report.id,
      created_at: nowIso(),
    })

    return mapReportToAdminCard(report)
  },

  async getAdminUsers(filters = {}) {
    await sleep(190)

    const q = String(filters.q ?? '').trim().toLowerCase()

    return DB.users
      .filter((user) => user.role !== 'ADMIN')
      .map((user) => {
        const plan = getPlanForUser(user.id)
        const queries = DB.search_queries.filter((item) => item.user_id === user.id)
        const usage = `${Math.min(95, queries.length * 16 + 10)}%`

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role === 'USER' ? 'Member' : user.role,
          type: plan?.name ?? 'Free',
          status: statusToBadge(user.status),
          usage,
          lastLogin: user.updated_at,
          createdAt: user.created_at,
        }
      })
      .filter((user) => {
        const matchQuery = !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
        const matchType = !filters.type || filters.type === 'all' || user.type.toLowerCase() === filters.type
        const matchStatus = !filters.status || filters.status === 'all' || user.status === filters.status
        return matchQuery && matchType && matchStatus
      })
  },



  async getAdminActions(params = {}) {
    await sleep(100)
    return sortByCreatedAtDesc(DB.admin_actions).filter((item) => {
      const matchAdmin = !params.admin_user_id || item.admin_user_id === params.admin_user_id
      const matchType = !params.action_type || item.action_type === params.action_type
      return matchAdmin && matchType
    })
  },
}
