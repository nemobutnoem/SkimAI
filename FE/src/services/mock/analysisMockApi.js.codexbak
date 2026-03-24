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

  async getDeepInsight({ keyword, source }) {
    await sleep(260)

    const query = findQueryByKeyword(keyword)
    const snapshot = getSnapshotByQueryId(query.id)

    const opportunities = DB.snapshot_keywords
      .filter((item) => item.snapshot_id === snapshot?.id)
      .sort((a, b) => b.mention_count - a.mention_count)
      .slice(0, 4)
      .map((item) => `Đẩy mạnh nội dung cho keyword "${item.keyword}" (${item.mention_count} mentions).`)

    return {
      keyword: query.keyword,
      source,
      marketInsight:
        snapshot?.summary_text ??
        'Thị trường đang tăng trưởng ổn định, nhu cầu tập trung vào tính năng tự động hóa và báo cáo nhanh.',
      opportunities: opportunities.length
        ? opportunities
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
