import { sleep } from '../../utils/sleep'
import { DB, nowIso, sortByCreatedAtDesc } from './core'

export const dbMockApi = {
  async getUsers(params = {}) {
    await sleep(120)
    const q = String(params.q ?? '').trim().toLowerCase()
    const role = String(params.role ?? '').toUpperCase()
    const status = String(params.status ?? '').toUpperCase()

    return DB.users.filter((u) => {
      const matchQ = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchRole = !role || u.role === role
      const matchStatus = !status || u.status === status
      return matchQ && matchRole && matchStatus
    })
  },

  async getUserById(userId) {
    await sleep(80)
    return DB.users.find((u) => u.id === userId) ?? null
  },

  async getPlans() {
    await sleep(90)
    return DB.plans.slice()
  },

  async getSubscriptions(params = {}) {
    await sleep(100)
    return DB.user_subscriptions.filter((s) => !params.user_id || s.user_id === params.user_id)
  },

  async getSearchQueries(params = {}) {
    await sleep(120)
    const q = String(params.q ?? '').trim().toLowerCase()
    return sortByCreatedAtDesc(DB.search_queries).filter((item) => {
      const matchQ = !q || item.keyword.toLowerCase().includes(q)
      const matchUser = !params.user_id || item.user_id === params.user_id
      const matchStatus = !params.status || item.status === params.status
      return matchQ && matchUser && matchStatus
    })
  },

  async createSearchQuery(payload) {
    await sleep(140)
    const row = {
      id: `q-${Date.now()}`,
      user_id: payload.user_id ?? '11111111-1111-1111-1111-111111111111',
      keyword: payload.keyword ?? 'Untitled keyword',
      country_code: payload.country_code ?? 'VN',
      language_code: payload.language_code ?? 'vi',
      time_range: payload.time_range ?? '30d',
      status: payload.status ?? 'PENDING',
      created_at: nowIso(),
    }
    DB.search_queries.unshift(row)
    return row
  },

  async getSnapshotByQueryId(searchQueryId) {
    await sleep(100)
    return DB.analysis_snapshots.find((s) => s.search_query_id === searchQueryId) ?? null
  },

  async getSnapshotInsights(snapshotId) {
    await sleep(100)
    return DB.snapshot_insights.filter((item) => item.snapshot_id === snapshotId)
  },

  async getSnapshotKeywords(snapshotId) {
    await sleep(100)
    return DB.snapshot_keywords
      .filter((item) => item.snapshot_id === snapshotId)
      .sort((a, b) => b.mention_count - a.mention_count)
  },

  async getSnapshotCharts(snapshotId) {
    await sleep(100)
    return DB.snapshot_charts.filter((item) => item.snapshot_id === snapshotId)
  },

  async getSourceItems(params = {}) {
    await sleep(120)
    return sortByCreatedAtDesc(DB.source_items).filter((item) => {
      const matchQuery = !params.search_query_id || item.search_query_id === params.search_query_id
      const matchProvider = !params.provider_id || item.provider_id === params.provider_id
      const matchSentiment = !params.sentiment_label || item.sentiment_label === params.sentiment_label
      return matchQuery && matchProvider && matchSentiment
    })
  },

  async getReports(params = {}) {
    await sleep(120)
    return sortByCreatedAtDesc(DB.reports).filter((r) => {
      const matchStatus = !params.status || r.status === params.status
      const matchUser = !params.user_id || r.user_id === params.user_id
      const matchQuery = !params.search_query_id || r.search_query_id === params.search_query_id
      return matchStatus && matchUser && matchQuery
    })
  },

  async getReportById(reportId) {
    await sleep(90)
    return DB.reports.find((r) => r.id === reportId) ?? null
  },

  async createReport(payload) {
    await sleep(160)
    const row = {
      id: `rep-${Date.now()}`,
      user_id: payload.user_id ?? '11111111-1111-1111-1111-111111111111',
      search_query_id: payload.search_query_id ?? 'q-111',
      snapshot_id: payload.snapshot_id ?? 'snap-111',
      title: payload.title ?? 'New report',
      report_content: payload.report_content ?? {},
      status: payload.status ?? 'DRAFT',
      created_at: nowIso(),
    }
    DB.reports.unshift(row)
    return row
  },

  async exportReport(reportId, payload = {}) {
    await sleep(140)
    const row = {
      id: `exp-${Date.now()}`,
      report_id: reportId,
      export_type: payload.export_type ?? 'PDF',
      file_url: `/files/reports/${reportId}.${String(payload.export_type ?? 'pdf').toLowerCase()}`,
      created_at: nowIso(),
    }
    DB.report_exports.unshift(row)
    return row
  },

  async getSavedSearches(params = {}) {
    await sleep(100)
    return DB.saved_searches.filter((item) => !params.user_id || item.user_id === params.user_id)
  },

  async saveSearch(payload) {
    await sleep(120)
    const row = {
      id: `save-${Date.now()}`,
      user_id: payload.user_id ?? '11111111-1111-1111-1111-111111111111',
      search_query_id: payload.search_query_id,
      created_at: nowIso(),
    }
    DB.saved_searches.unshift(row)
    return row
  },
}
