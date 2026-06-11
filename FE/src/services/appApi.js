import { STORAGE_KEYS } from '../constants/storageKeys'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

async function request(path, { method = 'GET', body, headers } = {}) {
  let authHeaders = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (raw) {
      const session = JSON.parse(raw)
      if (session?.token) {
        authHeaders = { Authorization: `Bearer ${session.token}` }
      }
    }
  } catch {
    authHeaders = {}
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const errorData = await response.json()
      message = errorData?.message ?? message
    } catch {
      // Keep fallback message when server does not return JSON.
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}

function toQueryString(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') query.set(key, String(value))
  })
  return query.toString()
}

const realApi = {
  login(payload) {
    return request('/auth/login', { method: 'POST', body: payload })
  },
  loginWithGoogle(payload) {
    return request('/auth/google', { method: 'POST', body: payload })
  },
  getDashboard() {
    return request('/dashboard')
  },
  getHomeTrends() {
    return request('/home/trends')
  },
  getAnalysis(keyword) {
    const query = new URLSearchParams({ keyword: keyword ?? '' }).toString()
    return request(`/analysis?${query}`)
  },
  exportAnalysisReport(keyword) {
    const query = new URLSearchParams({ keyword: keyword ?? '' }).toString()
    return request(`/reports/export?${query}`, { method: 'POST' })
  },
  getAnalysisProject(keyword) {
    const query = new URLSearchParams({ keyword: keyword ?? '' }).toString()
    return request(`/analysis/project?${query}`)
  },
  getAnalysisAlerts(keyword) {
    const query = new URLSearchParams({ keyword: keyword ?? '' }).toString()
    return request(`/analysis/alerts?${query}`)
  },
  getAnalysisCompetitor(keyword) {
    const query = new URLSearchParams({ keyword: keyword ?? '' }).toString()
    return request(`/analysis/competitor?${query}`)
  },
  getAnalysisEvidence(keyword) {
    const query = new URLSearchParams({ keyword: keyword ?? '' }).toString()
    return request(`/analysis/evidence?${query}`)
  },
  getAnalysisCompare(keyword) {
    const query = new URLSearchParams({ keyword: keyword ?? '' }).toString()
    return request(`/analysis/compare?${query}`)
  },
  getAnalysisTimeline(keyword) {
    const query = new URLSearchParams({ keyword: keyword ?? '' }).toString()
    return request(`/analysis/timeline?${query}`)
  },
  streamAnalysis(keyword, onEvent, onError) {
    let tokenParam = {}
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH)
      if (raw) {
        const session = JSON.parse(raw)
        if (session?.token) {
          tokenParam = { token: session.token }
        }
      }
    } catch (_) {}

    const query = new URLSearchParams({
      keyword: keyword ?? '',
      ...tokenParam
    }).toString()
    const url = `${API_BASE_URL}/analysis/stream?${query}`
    
    try {
      const eventSource = new EventSource(url)
      
      eventSource.addEventListener('query-start', (e) => onEvent('query-start', JSON.parse(e.data)))
      eventSource.addEventListener('cache-hit', (e) => onEvent('cache-hit', JSON.parse(e.data)))
      eventSource.addEventListener('sources', (e) => onEvent('sources', JSON.parse(e.data)))
      eventSource.addEventListener('keywords', (e) => onEvent('keywords', JSON.parse(e.data)))
      eventSource.addEventListener('news', (e) => onEvent('news', JSON.parse(e.data)))
      eventSource.addEventListener('insights', (e) => onEvent('insights', JSON.parse(e.data)))
      eventSource.addEventListener('data-quality', (e) => onEvent('data-quality', JSON.parse(e.data)))
      eventSource.addEventListener('complete', (e) => {
        onEvent('complete', JSON.parse(e.data))
        eventSource.close()
      })

      // Native EventSource error events do not include a JSON payload.
      // Use onerror to trigger fallback logic.
      eventSource.onerror = () => {
        const readyState = eventSource.readyState
        if (readyState === EventSource.CLOSED) {
          eventSource.close()
        }
        onError?.({ message: 'Stream connection error', readyState })
      }
      
      return eventSource
    } catch (e) {
      onError?.(e)
      return null
    }
  },
  getDeepInsight(payload) {
    return request('/deep-insight', { method: 'POST', body: payload })
  },
  getPricing() {
    return request('/pricing')
  },
  checkoutPricing(payload) {
    return request('/pricing/checkout', { method: 'POST', body: payload })
  },
  contactSales(payload) {
    return request('/pricing/contact-sales', { method: 'POST', body: payload })
  },
  submitFeedback(payload) {
    return request('/support/feedback', { method: 'POST', body: payload })
  },
  confirmPricing(providerSessionId) {
    return request('/pricing/confirm', {
      method: 'POST',
      body: { providerSessionId },
    })
  },
  getAccountOverview() {
    return request('/account/overview')
  },
  saveNotificationSettings(settings) {
    return request('/account/notifications', { method: 'PUT', body: settings })
  },
  getAdminDashboard() {
    return request('/admin/dashboard')
  },
  getAdminReports(status) {
    const query = new URLSearchParams({ status: status ?? 'all' }).toString()
    return request(`/admin/reports?${query}`)
  },
  moderateReport(reportId, nextStatus) {
    return request(`/admin/reports/${reportId}/moderate`, {
      method: 'POST',
      body: { status: nextStatus },
    })
  },
  getAdminUsers(filters) {
    const params = new URLSearchParams()
    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value != null && value !== '') {
        params.set(key, String(value))
      }
    })
    return request(`/admin/users?${params.toString()}`)
  },
  getAdminRevenue() {
    return request('/admin/revenue')
  },
  getAdminPlans() {
    return request('/admin/plans')
  },
  updateAdminPlan(planId, data) {
    return request(`/admin/plans/${planId}`, {
      method: 'PUT',
      body: data,
    })
  },
  getAdminSettings() {
    return request('/admin/settings')
  },
  updateAdminSettings(payload) {
    return request('/admin/settings', { method: 'PUT', body: payload })
  },
  getAdminFeedbacks() {
    return request('/admin/feedbacks')
  },
  updateFeedbackStatus(feedbackId, status) {
    return request(`/admin/feedbacks/${feedbackId}/status`, {
      method: 'PUT',
      body: { status }
    })
  },
  getAdminUsersMetrics() {
    return request('/admin/users/metrics')
  },

  // DB-aligned helpers for upcoming backend rollout
  getUsers(params) {
    const query = toQueryString(params)
    return request(`/users${query ? `?${query}` : ''}`)
  },
  getUserById(userId) {
    return request(`/users/${userId}`)
  },
  getPlans() {
    return request('/plans')
  },
  getSubscriptions(params) {
    const query = toQueryString(params)
    return request(`/subscriptions${query ? `?${query}` : ''}`)
  },
  getSearchQueries(params) {
    const query = toQueryString(params)
    return request(`/search-queries${query ? `?${query}` : ''}`)
  },
  createSearchQuery(payload) {
    return request('/search-queries', { method: 'POST', body: payload })
  },
  getSnapshotByQueryId(searchQueryId) {
    return request(`/search-queries/${searchQueryId}/snapshot`)
  },
  getSnapshotInsights(snapshotId) {
    return request(`/snapshots/${snapshotId}/insights`)
  },
  getSnapshotKeywords(snapshotId) {
    return request(`/snapshots/${snapshotId}/keywords`)
  },
  getSnapshotCharts(snapshotId) {
    return request(`/snapshots/${snapshotId}/charts`)
  },
  getSourceItems(params) {
    const query = toQueryString(params)
    return request(`/source-items${query ? `?${query}` : ''}`)
  },
  getReports(params) {
    const query = toQueryString(params)
    return request(`/reports${query ? `?${query}` : ''}`)
  },
  getReportById(reportId) {
    return request(`/reports/${reportId}`)
  },
  createReport(payload) {
    return request('/reports', { method: 'POST', body: payload })
  },
  exportReport(reportId, payload) {
    return request(`/reports/${reportId}/exports`, { method: 'POST', body: payload })
  },
  getSavedSearches(params) {
    const query = toQueryString(params)
    return request(`/saved-searches${query ? `?${query}` : ''}`)
  },
  saveSearch(payload) {
    return request('/saved-searches', { method: 'POST', body: payload })
  },
  getAdminActions(params) {
    const query = toQueryString(params)
    return request(`/admin/actions${query ? `?${query}` : ''}`)
  },
}

export const appApi = realApi

export const apiRuntimeConfig = {
  baseUrl: API_BASE_URL,
}
