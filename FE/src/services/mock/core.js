export const nowIso = () => new Date().toISOString()

export const DB = {
  users: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      full_name: 'Demo User',
      email: 'demo@skimai.local',
      password_hash: '123456',
      avatar_url: null,
      role: 'USER',
      status: 'ACTIVE',
      created_at: '2025-11-01T12:00:00.000Z',
      updated_at: '2026-03-20T09:10:00.000Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      full_name: 'Admin',
      email: 'admin@skimai.local',
      password_hash: '123456',
      avatar_url: null,
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: '2025-09-09T12:00:00.000Z',
      updated_at: '2026-03-20T11:30:00.000Z',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      full_name: 'Bao Do',
      email: 'bao.do@skimai.local',
      password_hash: 'hashed_demo',
      avatar_url: null,
      role: 'USER',
      status: 'ACTIVE',
      created_at: '2026-02-12T12:00:00.000Z',
      updated_at: '2026-03-20T07:05:00.000Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      full_name: 'Chi Vu',
      email: 'chi.vu@skimai.local',
      password_hash: 'hashed_demo',
      avatar_url: null,
      role: 'USER',
      status: 'SUSPENDED',
      created_at: '2025-09-09T12:00:00.000Z',
      updated_at: '2026-03-15T11:55:00.000Z',
    },
  ],

  plans: [
    {
      id: 'p-free-0000-0000-0000-000000000000',
      name: 'Free',
      price: 0,
      search_limit: 3,
      export_limit: 1,
      description: 'Starter for individual discovery',
      created_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'p-basic-0000-0000-0000-000000000000',
      name: 'Basic',
      price: 19,
      search_limit: 20,
      export_limit: 10,
      description: 'Growing teams with weekly reporting',
      created_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'p-pro-00000-0000-0000-0000000000000',
      name: 'Pro',
      price: 49,
      search_limit: 9999,
      export_limit: 999,
      description: 'Advanced insight workflow for teams',
      created_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'p-ent-00000-0000-0000-0000000000000',
      name: 'Enterprise',
      price: 129,
      search_limit: 99999,
      export_limit: 9999,
      description: 'Enterprise governance and custom integration',
      created_at: '2025-01-01T00:00:00.000Z',
    },
  ],

  user_subscriptions: [
    {
      id: 's-1',
      user_id: '11111111-1111-1111-1111-111111111111',
      plan_id: 'p-pro-00000-0000-0000-0000000000000',
      start_date: '2026-01-01T00:00:00.000Z',
      end_date: null,
      status: 'ACTIVE',
    },
    {
      id: 's-2',
      user_id: '33333333-3333-3333-3333-333333333333',
      plan_id: 'p-basic-0000-0000-0000-000000000000',
      start_date: '2026-02-12T00:00:00.000Z',
      end_date: null,
      status: 'ACTIVE',
    },
    {
      id: 's-3',
      user_id: '44444444-4444-4444-4444-444444444444',
      plan_id: 'p-free-0000-0000-0000-000000000000',
      start_date: '2025-09-09T00:00:00.000Z',
      end_date: null,
      status: 'ACTIVE',
    },
  ],

  search_providers: [
    { id: 'prov-1', provider_code: 'google_trends', provider_name: 'Google Trends', is_active: true },
    { id: 'prov-2', provider_code: 'news', provider_name: 'News Crawler', is_active: true },
    { id: 'prov-3', provider_code: 'social', provider_name: 'Social Listener', is_active: true },
  ],

  search_queries: [
    {
      id: 'q-111',
      user_id: '11111111-1111-1111-1111-111111111111',
      keyword: 'AI Agent',
      country_code: 'VN',
      language_code: 'vi',
      time_range: '30d',
      status: 'DONE',
      created_at: '2026-03-20T09:30:00.000Z',
    },
    {
      id: 'q-222',
      user_id: '33333333-3333-3333-3333-333333333333',
      keyword: 'Electric Bike',
      country_code: 'VN',
      language_code: 'en',
      time_range: '30d',
      status: 'DONE',
      created_at: '2026-03-19T08:20:00.000Z',
    },
    {
      id: 'q-333',
      user_id: '11111111-1111-1111-1111-111111111111',
      keyword: 'Market Demand Forecast',
      country_code: 'VN',
      language_code: 'en',
      time_range: '7d',
      status: 'DONE',
      created_at: '2026-03-18T12:12:00.000Z',
    },
    {
      id: 'q-444',
      user_id: '11111111-1111-1111-1111-111111111111',
      keyword: 'Social Commerce',
      country_code: 'VN',
      language_code: 'en',
      time_range: '7d',
      status: 'DONE',
      created_at: '2026-03-17T12:12:00.000Z',
    },
  ],

  analysis_snapshots: [
    {
      id: 'snap-111',
      search_query_id: 'q-111',
      summary_text: 'Search volume tăng mạnh vào khung 8-10h sáng.',
      total_sources: 128,
      positive_count: 52,
      neutral_count: 55,
      negative_count: 21,
      created_at: '2026-03-20T09:40:00.000Z',
    },
    {
      id: 'snap-222',
      search_query_id: 'q-222',
      summary_text: 'Electric bike market tăng trưởng mạnh ở khu vực đô thị.',
      total_sources: 96,
      positive_count: 44,
      neutral_count: 38,
      negative_count: 14,
      created_at: '2026-03-19T08:30:00.000Z',
    },
    {
      id: 'snap-333',
      search_query_id: 'q-333',
      summary_text: 'Demand forecast signals stable growth in SME segment.',
      total_sources: 81,
      positive_count: 39,
      neutral_count: 34,
      negative_count: 8,
      created_at: '2026-03-18T13:00:00.000Z',
    },
    {
      id: 'snap-444',
      search_query_id: 'q-444',
      summary_text: 'Social commerce sentiment hạ nhẹ sau đợt tăng giá.',
      total_sources: 72,
      positive_count: 24,
      neutral_count: 33,
      negative_count: 15,
      created_at: '2026-03-17T12:40:00.000Z',
    },
  ],

  snapshot_insights: [
    {
      id: 'si-1',
      snapshot_id: 'snap-111',
      title: 'Trend Insight',
      content: 'Search volume tăng mạnh vào khung 8-10h sáng.',
      created_at: '2026-03-20T09:41:00.000Z',
    },
    {
      id: 'si-2',
      snapshot_id: 'snap-111',
      title: 'Media Signal',
      content: 'Nhu cầu cao nhất đến từ nhóm SME và e-commerce.',
      created_at: '2026-03-20T09:41:30.000Z',
    },
    {
      id: 'si-3',
      snapshot_id: 'snap-111',
      title: 'Social Sentiment',
      content: 'Sentiment tích cực ở chủ đề tăng năng suất nội bộ.',
      created_at: '2026-03-20T09:42:00.000Z',
    },
    {
      id: 'si-4',
      snapshot_id: 'snap-111',
      title: 'Keyword Opportunity',
      content: 'Tần suất so sánh giá sản phẩm tăng 14% tuần qua.',
      created_at: '2026-03-20T09:42:30.000Z',
    },
    {
      id: 'si-5',
      snapshot_id: 'snap-222',
      title: 'Trend Insight',
      content: 'Search demand tăng nhanh ở nhóm commuter đô thị.',
      created_at: '2026-03-19T08:31:00.000Z',
    },
  ],

  snapshot_keywords: [
    { id: 'sk-1', snapshot_id: 'snap-111', keyword: 'agent workflow', mention_count: 182 },
    { id: 'sk-2', snapshot_id: 'snap-111', keyword: 'marketing automation', mention_count: 156 },
    { id: 'sk-3', snapshot_id: 'snap-111', keyword: 'insight dashboard', mention_count: 124 },
    { id: 'sk-4', snapshot_id: 'snap-111', keyword: 'keyword trend', mention_count: 92 },
    { id: 'sk-5', snapshot_id: 'snap-333', keyword: 'market demand forecast', mention_count: 201 },
    { id: 'sk-6', snapshot_id: 'snap-444', keyword: 'social commerce', mention_count: 132 },
  ],

  snapshot_charts: [
    {
      id: 'sc-1',
      snapshot_id: 'snap-111',
      chart_type: 'trend_7d',
      chart_data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [40, 55, 45, 70, 90, 75, 85] },
    },
    {
      id: 'sc-2',
      snapshot_id: 'snap-111',
      chart_type: 'search_trend_30d',
      chart_data: { labels: ['Jun 1', 'Jun 5', 'Jun 10', 'Jun 15', 'Jun 20', 'Jun 25', 'Jun 30'], values: [20, 30, 35, 60, 90, 70, 80] },
    },
  ],

  source_items: [
    {
      id: 'src-1',
      search_query_id: 'q-111',
      provider_id: 'prov-2',
      platform: 'web',
      content_type: 'news',
      title: 'Doanh nghiệp vừa tăng đầu tư AI trong quý 1',
      snippet: 'Mức đầu tư công nghệ đang tăng trong nhóm SME.',
      url: 'https://news.local/ai-investment',
      source_name: 'Market News',
      author_name: 'Editor',
      published_at: '2026-03-20T07:00:00.000Z',
      sentiment_label: 'POSITIVE',
      raw_payload: {},
      created_at: '2026-03-20T07:10:00.000Z',
    },
    {
      id: 'src-2',
      search_query_id: 'q-111',
      provider_id: 'prov-3',
      platform: 'social',
      content_type: 'post',
      title: 'Cong cu phan tich theo thoi gian thuc dang pho bien',
      snippet: 'Nguoi dung uu tien dashboard don gian va nhanh.',
      url: 'https://social.local/realtime-analytics',
      source_name: 'Social Pulse',
      author_name: 'User',
      published_at: '2026-03-20T06:00:00.000Z',
      sentiment_label: 'NEUTRAL',
      raw_payload: {},
      created_at: '2026-03-20T06:03:00.000Z',
    },
    {
      id: 'src-3',
      search_query_id: 'q-333',
      provider_id: 'prov-2',
      platform: 'web',
      content_type: 'news',
      title: 'Forecasting tools are now core in retail strategy',
      snippet: 'Teams move to weekly AI-guided planning.',
      url: 'https://news.local/forecast-tools',
      source_name: 'Retail Watch',
      author_name: 'Editor',
      published_at: '2026-03-18T12:00:00.000Z',
      sentiment_label: 'POSITIVE',
      raw_payload: {},
      created_at: '2026-03-18T12:05:00.000Z',
    },
    {
      id: 'src-4',
      search_query_id: 'q-444',
      provider_id: 'prov-3',
      platform: 'social',
      content_type: 'post',
      title: 'Social commerce conversion dipped after price updates',
      snippet: 'Users mention pricing friction in comments.',
      url: 'https://social.local/sc-pricing',
      source_name: 'Social Pulse',
      author_name: 'Analyst',
      published_at: '2026-03-17T11:00:00.000Z',
      sentiment_label: 'NEGATIVE',
      raw_payload: {},
      created_at: '2026-03-17T11:02:00.000Z',
    },
  ],

  reports: [
    {
      id: 'rep-1',
      user_id: '22222222-2222-2222-2222-222222222222',
      search_query_id: 'q-111',
      snapshot_id: 'snap-111',
      title: 'Q2 Market Intelligence Snapshot',
      report_content: {
        category: 'Market',
        aiScore: 88,
        summary: 'Consumer demand is rising in tier-2 cities with stable CAC.',
      },
      status: 'PENDING',
      created_at: '2026-03-18T10:20:00.000Z',
    },
    {
      id: 'rep-2',
      user_id: '22222222-2222-2222-2222-222222222222',
      search_query_id: 'q-444',
      snapshot_id: 'snap-444',
      title: 'Social Sentiment Shift - Retail',
      report_content: {
        category: 'Social',
        aiScore: 76,
        summary: 'Positive sentiment softened after price increase announcements.',
      },
      status: 'DRAFT',
      created_at: '2026-03-19T08:15:00.000Z',
    },
    {
      id: 'rep-3',
      user_id: '22222222-2222-2222-2222-222222222222',
      search_query_id: 'q-333',
      snapshot_id: 'snap-333',
      title: 'Competitor Promotion Tracker',
      report_content: {
        category: 'Competitor',
        aiScore: 91,
        summary: 'Competitors shifted discounts from bundles to cashback campaigns.',
      },
      status: 'PUBLISHED',
      created_at: '2026-03-17T15:40:00.000Z',
    },
  ],

  report_exports: [
    {
      id: 'exp-1',
      report_id: 'rep-1',
      export_type: 'PDF',
      file_url: '/files/reports/rep-1.pdf',
      created_at: '2026-03-18T10:50:00.000Z',
    },
    {
      id: 'exp-2',
      report_id: 'rep-3',
      export_type: 'CSV',
      file_url: '/files/reports/rep-3.csv',
      created_at: '2026-03-17T15:55:00.000Z',
    },
  ],

  saved_searches: [
    {
      id: 'save-1',
      user_id: '11111111-1111-1111-1111-111111111111',
      search_query_id: 'q-111',
      created_at: '2026-03-20T09:45:00.000Z',
    },
    {
      id: 'save-2',
      user_id: '11111111-1111-1111-1111-111111111111',
      search_query_id: 'q-333',
      created_at: '2026-03-18T12:20:00.000Z',
    },
  ],

  admin_actions: [
    {
      id: 'act-1',
      admin_user_id: '22222222-2222-2222-2222-222222222222',
      action_type: 'REPORT_PUBLISH',
      target_id: 'rep-3',
      created_at: '2026-03-17T15:42:00.000Z',
    },
    {
      id: 'act-2',
      admin_user_id: '22222222-2222-2222-2222-222222222222',
      action_type: 'USER_PLAN_UPDATE',
      target_id: '33333333-3333-3333-3333-333333333333',
      created_at: '2026-03-20T08:10:00.000Z',
    },
  ],
}

export const mockState = {
  expertTickets: [],
  notificationSettings: {
  emailUpdates: true,
  weeklyReport: true,
  usageAlerts: false,
}
}

export const toViewRole = (role) => String(role ?? '').toLowerCase()

export const createToken = (user) =>
  `mock.${btoa(JSON.stringify({ sub: user.id, role: toViewRole(user.role) }))}.token`

export function findQueryByKeyword(keyword) {
  if (!keyword) return DB.search_queries.find((q) => q.id === 'q-111')
  const lowered = keyword.toLowerCase()
  return (
    DB.search_queries.find((q) => q.keyword.toLowerCase() === lowered) ||
    DB.search_queries.find((q) => q.keyword.toLowerCase().includes(lowered)) ||
    DB.search_queries.find((q) => lowered.includes(q.keyword.toLowerCase())) ||
    DB.search_queries.find((q) => q.id === 'q-111')
  )
}

export function getSnapshotByQueryId(queryId) {
  return DB.analysis_snapshots.find((s) => s.search_query_id === queryId)
}

export function getPlanForUser(userId) {
  const sub = DB.user_subscriptions.find((item) => item.user_id === userId && item.status === 'ACTIVE')
  if (!sub) return null
  return DB.plans.find((plan) => plan.id === sub.plan_id) ?? null
}

export function mapReportToAdminCard(report) {
  const author = DB.users.find((u) => u.id === report.user_id)
  return {
    id: report.id,
    title: report.title,
    category: report.report_content?.category ?? 'General',
    status: String(report.status).toLowerCase(),
    aiScore: report.report_content?.aiScore ?? 80,
    author: author?.full_name ?? 'Unknown',
    summary: report.report_content?.summary ?? '',
    updatedAt: report.created_at,
  }
}

export function statusToBadge(status) {
  const s = String(status ?? '').toUpperCase()
  if (s === 'ACTIVE') return 'active'
  if (s === 'SUSPENDED') return 'suspended'
  return 'trial'
}

export function sortByCreatedAtDesc(items, key = 'created_at') {
  return items.slice().sort((a, b) => new Date(b[key] ?? 0) - new Date(a[key] ?? 0))
}


