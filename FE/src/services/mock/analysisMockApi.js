import { sleep } from '../../utils/sleep'
import { DB, findQueryByKeyword, getSnapshotByQueryId } from './core'

export const analysisMockApi = {
  async getDashboard() {
    await sleep(220)

    return {
      kpis: [
        { label: 'Documents', value: DB.reports.length },
        { label: 'Insights', value: DB.snapshot_insights.length },
        { label: 'Reports', value: DB.report_exports.length },
      ],
      recent: DB.search_queries
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3)
        .map((q) => ({ id: q.id, title: q.keyword, createdAt: q.created_at })),
    }
  },

  async getHomeTrends() {
    await sleep(220)

    return DB.search_queries.slice(0, 5).map((query, index) => {
      const snapshot = getSnapshotByQueryId(query.id)
      const total = Math.max(snapshot?.total_sources ?? 40, 1)
      const positiveRatio = ((snapshot?.positive_count ?? 10) / total) * 100
      const signed = positiveRatio - 25
      return {
        id: query.id,
        name: query.keyword,
        change: `${signed >= 0 ? '+' : ''}${signed.toFixed(1)}%`,
        sentiment: signed >= 0 ? 'up' : 'down',
        rank: index + 1,
      }
    })
  },

  async getAnalysis(keyword = 'AI Agent') {
    await sleep(280)

    const query = findQueryByKeyword(keyword)
    const snapshot = getSnapshotByQueryId(query.id)

    const insights = DB.snapshot_insights
      .filter((item) => item.snapshot_id === snapshot?.id)
      .slice(0, 4)
      .map((item) => item.content)

    const relatedKeywords = DB.snapshot_keywords
      .filter((item) => item.snapshot_id === snapshot?.id)
      .sort((a, b) => b.mention_count - a.mention_count)
      .slice(0, 4)
      .map((item) => item.keyword)

    const news = DB.source_items
      .filter((item) => item.search_query_id === query.id)
      .slice(0, 3)
      .map((item) => item.title)

    return {
      keyword: query.keyword,
      searchQueryId: query.id,
      snapshotId: snapshot?.id ?? null,
      insights: insights.length
        ? insights
        : [
            'Search volume tăng mạnh vào khung 8-10h sáng.',
            'Nhu cầu cao nhất đến từ nhóm SME và e-commerce.',
            'Sentiment tích cực ở chủ đề tăng năng suất nội bộ.',
            'Tần suất so sánh giá sản phẩm tăng 14% tuần qua.',
          ],
      relatedKeywords: relatedKeywords.length
        ? relatedKeywords
        : ['agent workflow', 'marketing automation', 'insight dashboard', 'keyword trend'],
      news: news.length
        ? news
        : [
            'Doanh nghiệp vừa tăng đầu tư AI trong quý 1.',
            'Công cụ phân tích người dùng theo thời gian thực đang phổ biến.',
          ],
      suggestedActions: ['So sánh với đối thủ', 'Dự báo nhu cầu', 'Phân tích top keywords', 'Audience insights'],
    }
  },

  async getAnalysisProject(keyword = '') { await sleep(200); return [] },
  async getAnalysisAlerts(keyword = '') { await sleep(200); return [] },
  async getAnalysisCompetitor(keyword = '') { await sleep(200); return [] },
  async getAnalysisEvidence(keyword = '') { await sleep(200); return [] },
  async getAnalysisCompare(keyword = '') { await sleep(200); return [] },
  async getAnalysisTimeline(keyword = '') { await sleep(200); return [] },

  async getDeepInsight({ keyword, source }) {
    await sleep(260)

    const query = findQueryByKeyword(keyword)
    const snapshot = getSnapshotByQueryId(query.id)

    const dbKeywords = DB.snapshot_keywords
      .filter((item) => item.snapshot_id === snapshot?.id)
      .sort((a, b) => b.mention_count - a.mention_count)
      .slice(0, 4)

    return {
      keyword: query.keyword,
      source,
      keyFinding:
        snapshot?.summary_text ??
        `Search interest for "${query.keyword}" increased by 47% over the last 30 days, with a significant spike coinciding with industry announcements.`,
      stats: [
        { value: '+47%', label: 'Monthly Growth' },
        { value: '89%', label: 'Peak Day Spike' },
        { value: '8.2k', label: 'Daily Searches' },
      ],
      mediaSignals: [
        { title: 'Government Policy Support', desc: 'Recent coverage highlights $2B federal investment in electric transportation infrastructure, with specific focus on urban mobility solutions.' },
        { title: 'Industry Expansion', desc: 'Major retailers announced new partnerships, indicating mainstream market acceptance.' },
        { title: 'Technology Advancement', desc: 'Battery technology breakthroughs featured in 10+ tech publications, emphasizing improved range and faster charging.' },
      ],
      sentiment: {
        bars: [
          { label: 'Positive', pct: 69, color: 'var(--green)', cls: 'text-green' },
          { label: 'Neutral', pct: 24, color: 'var(--gray-500)', cls: '' },
          { label: 'Negative', pct: 8, color: 'var(--red)', cls: 'text-red' },
        ],
        topics: [
          { name: 'Affordability', change: '+34%' },
          { name: 'Battery Life', change: '+28%' },
          { name: 'Urban Commuting', change: '+22%' },
          { name: 'Environmental Impact', change: '+19%' },
        ],
      },
      opportunityCards: dbKeywords.length
        ? dbKeywords.map((kw, i) => ({
            title: kw.keyword,
            desc: `Keyword "${kw.keyword}" has ${kw.mention_count} mentions — consider targeted content.`,
            theme: ['green', 'blue', 'orange', 'purple'][i % 4],
          }))
        : [
            { title: 'Budget Segment Growth', desc: 'Rising keywords: "cheap electric bike" (+185%), "affordable e-bike" (+160%) suggest strong demand.', theme: 'green' },
            { title: 'Subscription Models', desc: '"Electric bike rental" (+152%) and "e-bike subscription" (+118%) show interest in alternative models.', theme: 'blue' },
            { title: 'Urban Commuter Focus', desc: '"Electric bike commuting" (+147%) indicate opportunity in metropolitan markets.', theme: 'orange' },
            { title: 'Cargo & Family Bikes', desc: '"Electric cargo bike" (+134%) and "family e-bike" (+86%) represent growing niche segments.', theme: 'purple' },
          ],
      strategicRecommendation: {
        title: 'Focus on Entry-Level Urban Market',
        desc: 'Based on the analysis, brands should prioritize developing affordable models specifically designed for urban commuters. The convergence of policy support, positive sentiment, and rising budget-focused keywords creates a significant market opportunity.',
        stats: [
          { value: '$1.2B', label: 'Estimated Market Size' },
          { value: '18 Months', label: 'Optimal Entry Window' },
          { value: '156%', label: 'Budget Keyword Growth', highlight: true },
        ],
      },
      // Keep backward-compatible fields
      marketInsight:
        snapshot?.summary_text ??
        'Thị trường đang tăng trưởng ổn định, nhu cầu tập trung vào tính năng tự động hóa và báo cáo nhanh.',
      opportunities: dbKeywords.length
        ? dbKeywords.map((item) => `Đẩy mạnh nội dung cho keyword "${item.keyword}" (${item.mention_count} mentions).`)
        : [
            'Tạo gói dùng thử chuyên biệt cho team marketing.',
            'Đẩy mạnh tích hợp với nguồn dữ liệu social.',
            'Tối ưu onboarding cho nhóm user non-technical.',
            'Phát triển dashboard theo vai trò.',
          ],
      recommendation:
        'Ưu tiên release luồng báo cáo tự động + cảnh báo trend bất thường trong 2 sprint tới.',
    }
  },
}
