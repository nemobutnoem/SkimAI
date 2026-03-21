import { sleep } from '../utils/sleep'

const MOCK_USERS = [
  {
    id: 'u_1',
    name: 'Demo User',
    email: 'demo@skimai.local',
    password: '123456',
    role: 'user',
  },
  {
    id: 'admin_1',
    name: 'Admin',
    email: 'admin@skimai.local',
    password: '123456',
    role: 'admin',
  },
]

const REPORTS = [
  {
    id: 'r1',
    title: 'Q2 Market Intelligence Snapshot',
    category: 'Market',
    status: 'pending',
    aiScore: 88,
    author: 'Linh Tran',
    summary: 'Consumer demand is rising in tier-2 cities with stable CAC.',
    updatedAt: '2026-03-18T10:20:00.000Z',
  },
  {
    id: 'r2',
    title: 'Social Sentiment Shift - Retail',
    category: 'Social',
    status: 'draft',
    aiScore: 76,
    author: 'Minh Nguyen',
    summary: 'Positive sentiment softened after price increase announcements.',
    updatedAt: '2026-03-19T08:15:00.000Z',
  },
  {
    id: 'r3',
    title: 'Competitor Promotion Tracker',
    category: 'Competitor',
    status: 'published',
    aiScore: 91,
    author: 'Hai Le',
    summary: 'Competitors shifted discounts from bundles to cashback campaigns.',
    updatedAt: '2026-03-17T15:40:00.000Z',
  },
]

const USERS = [
  {
    id: 'u1',
    name: 'Anh Pham',
    email: 'anh.pham@skimai.local',
    role: 'Analyst',
    type: 'Premium',
    status: 'active',
    usage: '71%',
    lastLogin: '2026-03-20T09:10:00.000Z',
    createdAt: '2025-11-01T12:00:00.000Z',
  },
  {
    id: 'u2',
    name: 'Bao Do',
    email: 'bao.do@skimai.local',
    role: 'Manager',
    type: 'Trial',
    status: 'trial',
    usage: '42%',
    lastLogin: '2026-03-20T07:05:00.000Z',
    createdAt: '2026-02-12T12:00:00.000Z',
  },
  {
    id: 'u3',
    name: 'Chi Vu',
    email: 'chi.vu@skimai.local',
    role: 'Viewer',
    type: 'Standard',
    status: 'suspended',
    usage: '13%',
    lastLogin: '2026-03-15T11:55:00.000Z',
    createdAt: '2025-09-09T12:00:00.000Z',
  },
]

const createToken = (user) => {
  // Mock token (do not use in production)
  return `mock.${btoa(JSON.stringify({ sub: user.id, role: user.role }))}.token`
}

export const mockApi = {
  async login({ email, password }) {
    await sleep(450)

    const user = MOCK_USERS.find((u) => u.email === email)
    if (!user || user.password !== password) {
      const error = new Error('Email hoặc mật khẩu không đúng')
      error.status = 401
      throw error
    }

    const { password: _pw, ...safeUser } = user
    return {
      token: createToken(user),
      user: safeUser,
    }
  },

  async getDashboard() {
    await sleep(350)
    return {
      kpis: [
        { label: 'Documents', value: 12 },
        { label: 'Insights', value: 5 },
        { label: 'Reports', value: 2 },
      ],
      recent: [
        { id: 'd1', title: 'Market summary', createdAt: new Date().toISOString() },
        { id: 'd2', title: 'Competitor snapshot', createdAt: new Date().toISOString() },
      ],
    }
  },

  async getHomeTrends() {
    await sleep(280)
    return [
      { id: 't1', name: 'AI Writing Assistant', change: '+18.2%', sentiment: 'up' },
      { id: 't2', name: 'Market Demand Forecast', change: '+12.8%', sentiment: 'up' },
      { id: 't3', name: 'Social Commerce', change: '-2.4%', sentiment: 'down' },
      { id: 't4', name: 'Fintech Search Volume', change: '+8.6%', sentiment: 'up' },
      { id: 't5', name: 'Consumer Pulse', change: '+4.3%', sentiment: 'up' },
    ]
  },

  async getAnalysis(keyword = 'AI Agent') {
    await sleep(320)
    return {
      keyword,
      insights: [
        'Search volume tăng mạnh vào khung 8-10h sáng.',
        'Nhu cầu cao nhất đến từ nhóm SME và e-commerce.',
        'Sentiment tích cực ở chủ đề tăng năng suất nội bộ.',
        'Tần suất so sánh giá sản phẩm tăng 14% tuần qua.',
      ],
      relatedKeywords: ['agent workflow', 'marketing automation', 'insight dashboard', 'keyword trend'],
      news: [
        'Doanh nghiệp vừa tăng đầu tư AI trong quý 1.',
        'Công cụ phân tích người dùng theo thời gian thực đang phổ biến.',
      ],
      suggestedActions: ['Theo dõi keyword biến động cao', 'Tạo report tuần', 'So sánh với đối thủ'],
    }
  },

  async getDeepInsight({ keyword, source }) {
    await sleep(300)
    return {
      keyword,
      source,
      marketInsight:
        'Thị trường đang tăng trưởng ổn định, nhu cầu tập trung vào tính năng tự động hóa và báo cáo nhanh.',
      opportunities: [
        'Tạo gói dùng thử chuyên biệt cho team marketing.',
        'Đẩy mạnh tích hợp với nguồn dữ liệu social.',
        'Tối ưu onboarding cho nhóm user non-technical.',
        'Phát triển dashboard theo vai trò.',
      ],
      recommendation: 'Ưu tiên release luồng báo cáo tự động + cảnh báo trend bất thường trong 2 sprint tới.',
    }
  },

  async getExperts() {
    await sleep(260)
    return [
      { id: 'e1', name: 'Ngoc Bui', domain: 'Market Strategy', rating: 4.9, price: 20 },
      { id: 'e2', name: 'Tuan Ho', domain: 'Consumer Insight', rating: 4.8, price: 18 },
      { id: 'e3', name: 'Trang Le', domain: 'Growth Planning', rating: 4.7, price: 22 },
    ]
  },

  async submitExpertQuestion(payload) {
    await sleep(480)
    return {
      id: `q_${Date.now()}`,
      status: 'queued',
      etaHours: 12,
      ...payload,
    }
  },

  async getPricing() {
    await sleep(200)
    return [
      { id: 'free', name: 'Free', monthly: 0, yearly: 0, features: ['3 reports/thang', '1 user'] },
      {
        id: 'basic',
        name: 'Basic',
        monthly: 19,
        yearly: 190,
        features: ['20 reports/thang', '3 users', 'Export PDF'],
      },
      {
        id: 'pro',
        name: 'Pro',
        monthly: 49,
        yearly: 490,
        features: ['Unlimited reports', '10 users', 'Priority support'],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        monthly: 129,
        yearly: 1290,
        features: ['Dedicated success', 'SSO', 'Custom integrations'],
      },
    ]
  },

  async getAccountOverview() {
    await sleep(250)
    return {
      profile: { name: 'Demo User', email: 'demo@skimai.local', company: 'SkimAI Labs' },
      usage: [
        { label: 'API Calls', value: 72 },
        { label: 'Storage', value: 43 },
        { label: 'Team Seats', value: 60 },
      ],
      invoices: [
        { id: 'inv_031', amount: '$49', status: 'paid', date: '2026-03-01' },
        { id: 'inv_030', amount: '$49', status: 'paid', date: '2026-02-01' },
      ],
      notifications: {
        emailUpdates: true,
        weeklyReport: true,
        usageAlerts: false,
      },
    }
  },

  async saveNotificationSettings(settings) {
    await sleep(180)
    return settings
  },

  async getAdminDashboard() {
    await sleep(250)
    return {
      stats: [
        { label: 'Users', value: 1324 },
        { label: 'Premium', value: 438 },
        { label: 'Revenue', value: '$32,400' },
        { label: 'Reports', value: 854 },
        { label: 'Churn', value: '2.3%' },
      ],
      activities: [
        'New premium upgrade from bao.do@skimai.local',
        'Report #r3 was published by Hai Le',
        'Failed payment event retried for account u44',
      ],
    }
  },

  async getAdminReports(status = 'all') {
    await sleep(230)
    if (status === 'all') return [...REPORTS]
    return REPORTS.filter((r) => r.status === status)
  },

  async moderateReport(reportId, nextStatus) {
    await sleep(220)
    const report = REPORTS.find((r) => r.id === reportId)
    if (!report) {
      throw new Error('Report không tồn tại')
    }
    report.status = nextStatus
    report.updatedAt = new Date().toISOString()
    return { ...report }
  },

  async getAdminUsers(filters = {}) {
    await sleep(240)
    const q = (filters.q ?? '').trim().toLowerCase()

    return USERS.filter((u) => {
      const matchQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchType = !filters.type || filters.type === 'all' || u.type.toLowerCase() === filters.type
      const matchStatus =
        !filters.status || filters.status === 'all' || u.status.toLowerCase() === filters.status
      return matchQuery && matchType && matchStatus
    })
  },

  async getAdminRevenue() {
    await sleep(260)
    return {
      metrics: [
        { label: 'MRR', value: '$42,600' },
        { label: 'ARR', value: '$511,200' },
        { label: 'Upgrade Rate', value: '7.9%' },
        { label: 'Failed Payments', value: '1.8%' },
      ],
      channels: [
        { name: 'Direct', amount: '$16,200', pct: 38 },
        { name: 'Referrals', amount: '$9,700', pct: 22 },
        { name: 'Partner', amount: '$7,900', pct: 19 },
      ],
      events: [
        {
          id: 'ev1',
          user: 'Anh Pham',
          event: 'Upgrade',
          plan: 'Basic -> Pro',
          amount: '$30',
          status: 'success',
        },
        {
          id: 'ev2',
          user: 'Bao Do',
          event: 'Renewal',
          plan: 'Pro',
          amount: '$49',
          status: 'success',
        },
        {
          id: 'ev3',
          user: 'Chi Vu',
          event: 'Payment Failed',
          plan: 'Basic',
          amount: '$19',
          status: 'failed',
        },
      ],
    }
  },
}
