import { mockApi } from './mockApi'

const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API ?? 'true') === 'true'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

async function request(path, { method = 'GET', body, headers } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
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

const realApi = {
  login(payload) {
    return request('/auth/login', { method: 'POST', body: payload })
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
  getDeepInsight(payload) {
    return request('/deep-insight', { method: 'POST', body: payload })
  },
  getExperts() {
    return request('/experts')
  },
  submitExpertQuestion(payload) {
    return request('/experts/questions', { method: 'POST', body: payload })
  },
  getPricing() {
    return request('/pricing')
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
}

export const appApi = USE_MOCK_API ? mockApi : realApi

export const apiRuntimeConfig = {
  useMockApi: USE_MOCK_API,
  baseUrl: API_BASE_URL,
}
