import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'
import { AnimatedNumber, TypewriterText } from '../../components/Effects'

const NO_DATA = 'không có dữ liệu để đánh giá'

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function formatNumber(num) {
  if (!num && num !== 0) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

function pct(value) {
  return `${((value || 0) * 100).toFixed(2)}%`
}

function normalizeSourceName(value) {
  const input = (value || '').trim()
  if (!input) return 'Nguồn khác'
  const lower = input.toLowerCase()
  const directMatch = lower.match(/https?:\/\/([^/\s]+)/)
  if (directMatch?.[1]) return directMatch[1].replace(/^www\./, '')
  const token = lower.split(/\s+/).find((part) => part.includes('.') && !part.includes('•'))
  if (token) return token.replace(/^www\./, '').replace(/[>,|]+$/g, '')
  return input.length > 42 ? `${input.slice(0, 42)}...` : input
}

function canonicalSource(value) {
  const lower = (value || '').toLowerCase()
  if (lower.includes('youtube')) return 'YouTube'
  if (lower.includes('trend')) return 'Google Trends'
  if (lower.includes('google')) return 'Google Search'
  if (lower.includes('facebook')) return 'Facebook'
  if (lower.includes('tiktok')) return 'TikTok'
  if (lower.includes('news')) return 'Google News'
  return normalizeSourceName(value)
}

function inferDirection(text = '', count = 0) {
  const lower = text.toLowerCase()
  if (/(decrease|decline|drop|down|fall|giam|giảm|negative|weak)/.test(lower)) return 'giảm'
  if (/(increase|growth|rise|up|spike|positive|strong|tang|tăng|\+)/.test(lower)) return 'tăng'
  if (count >= 3) return 'ổn định'
  return 'chưa rõ'
}

function directionLabel(direction) {
  return {
    tăng: 'tăng',
    giảm: 'giảm',
    'ổn định': 'ổn định',
  }[direction] || 'chưa rõ'
}

function directionClass(direction) {
  if (direction === 'tăng') return 'up'
  if (direction === 'giảm') return 'down'
  if (direction === 'ổn định') return 'stable'
  return 'unknown'
}

function noDataFor(section) {
  return `${NO_DATA} ${section}`
}

function buildSourceTrendRows(data, evidenceItems) {
  const grouped = new Map()

    ; (evidenceItems ?? []).forEach((item) => {
      const source = canonicalSource(item?.source)
      const current = grouped.get(source) ?? {
        source,
        count: 0,
        titles: [],
        signalText: '',
        direction: 'chưa rõ',
      }
      current.count += 1
      if (item?.title) current.titles.push(item.title)
      current.signalText = [current.signalText, item?.metric, item?.signal, item?.title].filter(Boolean).join(' ')
      current.direction = inferDirection(current.signalText, current.count)
      grouped.set(source, current)
    })

    ; (data?.dataSources ?? []).forEach((sourceName) => {
      const source = canonicalSource(sourceName)
      if (!grouped.has(source)) {
        grouped.set(source, {
          source,
          count: 0,
          titles: [],
          signalText: '',
          direction: 'chưa rõ',
        })
      }
    })

  return Array.from(grouped.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((row) => ({
      ...row,
      summary: row.count
        ? `${row.count} tín hiệu được ghi nhận. ${row.titles[0] || 'Có bằng chứng nguồn nhưng chưa có tiêu đề nổi bật.'}`
        : noDataFor(`xu hướng từ ${row.source}`),
    }))
}

function buildOverallRead(data, sourceRows, timelinePoints) {
  const keywords = data?.relatedKeywords ?? []
  const totalMentions = keywords.reduce((sum, item) => sum + (item.mentionCount || 0), 0)
  const totalViews = keywords.reduce((sum, item) => sum + (item.totalViews || 0), 0)
  const totalComments = keywords.reduce((sum, item) => sum + (item.totalComments || 0), 0)
  const sourceCount = sourceRows.filter((row) => row.count > 0).length
  const evidenceCoverage = Number(data?.dataQuality?.evidenceCoveragePct ?? 0)
  const avgEngagement = keywords.length
    ? keywords.reduce((sum, item) => sum + (item.avgEngagement || 0), 0) / keywords.length
    : 0

  const firstTimeline = timelinePoints?.[0]?.value ?? null
  const lastTimeline = timelinePoints?.[timelinePoints.length - 1]?.value ?? null
  let marketState = 'ổn định'
  if (firstTimeline != null && lastTimeline != null) {
    if (lastTimeline > firstTimeline) marketState = 'tăng trưởng'
    if (lastTimeline < firstTimeline) marketState = 'giảm sút'
  } else if (sourceRows.some((row) => row.direction === 'tăng')) {
    marketState = 'tăng trưởng'
  } else if (sourceRows.some((row) => row.direction === 'giảm')) {
    marketState = 'giảm sút'
  }

  const viewScore = clamp(Math.round(Math.log10(Math.max(1, totalViews)) * 8), 0, 30)
  const discussionScore = clamp(Math.round(Math.log10(Math.max(1, totalComments + 1)) * 10), 0, 20)
  const keywordScore = clamp(Math.round(totalMentions * 1.2), 0, 16)
  const engagementScore = clamp(Math.round(avgEngagement * 250), 0, 14)
  const diversityScore = clamp(sourceCount * 4, 0, 16)
  const growthScore = marketState === 'tăng trưởng' ? 8 : marketState === 'giảm sút' ? -6 : 3
  const rawMarketScore = clamp(Math.round(viewScore + discussionScore + keywordScore + engagementScore + diversityScore + growthScore), 0, 100)
  const marketScore = totalViews < 1000 && totalComments < 30
    ? Math.min(rawMarketScore, 58)
    : totalViews < 5000 && totalComments < 50
      ? Math.min(rawMarketScore, 68)
      : rawMarketScore
  const interestLevel = marketScore >= 70 ? 'cao' : marketScore >= 40 ? 'trung bình' : 'thấp'
  const confidenceScore = clamp(Math.round((evidenceCoverage * 0.45) + (diversityScore * 1.4) + (keywords.length * 6) + (totalComments > 0 ? 8 : 0)), 0, 100)
  const confidenceBand = confidenceScore >= 75 ? 'cao' : confidenceScore >= 45 ? 'vừa' : 'thấp'
  const hasData = keywords.length || sourceRows.some((row) => row.count > 0)
  const evidenceReasons = [
    `${formatNumber(totalViews)} views quan sát được`,
    `${formatNumber(totalComments)} bình luận từ dữ liệu hiện có`,
    `${formatNumber(totalMentions)} tín hiệu keyword`,
    `${sourceCount} nguồn có bằng chứng trực tiếp`,
  ]
  const missingData = [
    totalComments < 30 ? 'Thảo luận còn mỏng nên khó kết luận nhu cầu mua thật.' : null,
    sourceCount < 4 ? 'Độ đa dạng nguồn còn thấp, dễ bị lệch bởi một vài website.' : null,
    evidenceCoverage < 60 ? 'Evidence coverage chưa đủ mạnh để chấm confidence cao.' : null,
    keywords.length < 3 ? 'Cụm keyword liên quan còn ít, cần mở rộng truy vấn.' : null,
  ].filter(Boolean)

  return {
    hasData,
    marketState,
    interestLevel,
    marketScore,
    confidenceScore,
    confidenceBand,
    totalMentions,
    totalViews,
    totalComments,
    avgEngagement,
    sourceCount,
    evidenceReasons,
    missingData,
    coverage: evidenceCoverage,
  }
}

function buildOpportunityRead(data, overall, sourceRows) {
  const keywords = data?.relatedKeywords ?? []
  if (!overall.hasData) {
    return {
      title: noDataFor('tiềm năng thị trường'),
      score: 0,
      band: 'chưa đủ dữ liệu',
      why: [noDataFor('cơ hội phát triển')],
      risk: 'Thiếu tín hiệu nguồn và cụm keyword để xác định cơ hội.',
      nextMove: 'Mở rộng nguồn dữ liệu hoặc thử keyword có intent rõ hơn.',
      strongest: null,
    }
  }
  const strongest = [...keywords].sort((a, b) => (b.mentionCount || 0) - (a.mentionCount || 0))[0]
  const bestSource = sourceRows.find((row) => row.count > 0)
  if (!strongest) {
    return {
      title: `Từ khóa có tín hiệu ${overall.interestLevel}, nhưng chưa thấy cụm cơ hội rõ.`,
      score: clamp(Math.round(overall.marketScore * 0.45), 0, 100),
      band: 'thấp',
      why: ['Có dữ liệu thị trường tổng quan nhưng thiếu keyword cluster nổi bật.'],
      risk: 'Chưa đủ dữ liệu cụm intent để xác định hướng tăng trưởng.',
      nextMove: 'Thu thêm dữ liệu theo các intent: giá, so sánh, mua, review, đối thủ.',
      strongest: null,
    }
  }
  const mentionScore = clamp((strongest.mentionCount || 0) * 10, 0, 35)
  const engagementSignal = clamp(Math.round((strongest.avgEngagement || overall.avgEngagement) * 300), 0, 20)
  const sourceSignal = clamp(overall.sourceCount * 6, 0, 20)
  const marketSignal = clamp(Math.round(overall.marketScore * 0.25), 0, 25)
  const rawScore = clamp(mentionScore + engagementSignal + sourceSignal + marketSignal, 0, 100)
  const score = (strongest.mentionCount || 0) < 5 && overall.totalComments < 30
    ? Math.min(rawScore, 48)
    : rawScore
  const band = score >= 70 ? 'mạnh' : score >= 40 ? 'vừa' : 'yếu'
  const why = [
    `"${strongest.keyword}" là cụm lặp lại nhiều nhất (${strongest.mentionCount || 0} lần).`,
    `${bestSource ? `${bestSource.source} là nguồn có tín hiệu nổi bật nhất (${bestSource.count}).` : 'Chưa có nguồn nổi bật rõ ràng.'}`,
    `Market score hiện tại là ${overall.marketScore}/100, mức quan tâm ${overall.interestLevel}.`,
  ]
  const risk = score < 50
    ? 'Tín hiệu cơ hội còn sớm; chưa nên xem đây là nhu cầu thị trường lớn.'
    : 'Cơ hội có tín hiệu đáng chú ý nhưng vẫn cần kiểm chứng bằng dữ liệu theo intent mua/so sánh.'
  const nextMove = `Kiểm chứng thêm các truy vấn liên quan đến "${strongest.keyword}" như giá, review, so sánh, mua ở đâu và đối thủ trực tiếp.`
  return {
    title: `Cơ hội chính nằm ở cụm "${strongest.keyword}".`,
    score,
    band,
    why,
    risk,
    nextMove,
    strongest,
  }
}

function pickChannelRecommendation(sourceRows, overall) {
  const positiveRows = sourceRows.filter((row) => row.count > 0 && row.direction !== 'giảm')
  const best = positiveRows[0] ?? sourceRows.find((row) => row.count > 0)
  if (!overall.hasData || !best) return noDataFor('kênh tiếp cận đề xuất')
  return `Ưu tiên ${best.source} vì đây là nguồn có nhiều tín hiệu nhất (${best.count}). Nếu cần ngân sách thấp, dùng nội dung kiểm chứng thêm trước khi chạy paid media.`
}

function InsightSection({ title, badge, children }) {
  return (
    <section className="card prompt-insight-card">
      <div className="prompt-insight-head">
        <div>
          <span className="prompt-insight-badge">{badge}</span>
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  )
}

export function AnalysisPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword')?.trim() || ''
  const [draftKeyword, setDraftKeyword] = useState('')

  const [data, setData] = useState(null)
  const [evidenceItems, setEvidenceItems] = useState([])
  const [timelinePoints, setTimelinePoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [streamProgress, setStreamProgress] = useState(0)
  const [cacheInfo, setCacheInfo] = useState(null)

  const loadTraditional = async () => {
    setLoading(true)
    try {
      const [result, evidence, timeline] = await Promise.all([
        appApi.getAnalysis(keyword),
        appApi.getAnalysisEvidence(keyword).catch(() => []),
        appApi.getAnalysisTimeline(keyword).catch(() => []),
      ])
      setData(result)
      setEvidenceItems(evidence)
      setTimelinePoints(timeline)
      setStreamProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setStreamProgress(0)
    setCacheInfo(null)
    setData(null)
    setEvidenceItems([])
    setTimelinePoints([])

    let gotKeywords = false
    let gotNews = false
    let gotInsights = false

    try {
      const eventSource = appApi.streamAnalysis(
        keyword,
        (eventName, eventData) => {
          if (eventName === 'query-start') {
            setStreamProgress(1)
          } else if (eventName === 'cache-hit') {
            setCacheInfo({
              message: eventData.message,
              cached: eventData.cached,
            })
          } else if (eventName === 'sources') {
            setData((prev) => ({
              ...prev,
              dataSources: eventData.sources,
            }))
            setStreamProgress(2)
          } else if (eventName === 'keywords') {
            const nextKeywords = eventData.keywords || []
            if (Array.isArray(nextKeywords) && nextKeywords.length) {
              gotKeywords = true
            }
            setData((prev) => ({
              ...prev,
              relatedKeywords: nextKeywords,
            }))
            setStreamProgress(3)
          } else if (eventName === 'news') {
            const nextNews = eventData.news || []
            if (Array.isArray(nextNews) && nextNews.length) {
              gotNews = true
            }
            setData((prev) => ({
              ...prev,
              news: nextNews,
            }))
            setStreamProgress(4)
          } else if (eventName === 'insights') {
            const nextInsights = eventData.insights || []
            if (Array.isArray(nextInsights) && nextInsights.length) {
              gotInsights = true
            }
            setData((prev) => ({
              ...prev,
              insights: nextInsights,
            }))
            setStreamProgress(5)
          } else if (eventName === 'data-quality') {
            setData((prev) => ({
              ...prev,
              dataQuality: {
                freshnessMinutes: eventData.freshnessMinutes,
                sourceDiversity: eventData.sourceDiversity,
                evidenceCoveragePct: eventData.evidenceCoveragePct,
                confidenceBand: eventData.confidenceBand,
              },
            }))
            setStreamProgress(6)
          } else if (eventName === 'complete') {
            setStreamProgress(7)

            // Stream endpoint may return only placeholders when there's no snapshot yet.
            // In that case, fetch the full analysis from the traditional endpoint.
            const hasMeaningfulData = gotKeywords || gotNews || gotInsights
            if (!hasMeaningfulData) {
              loadTraditional()
              return
            }

            // Fetch timeline data asynchronously since streaming doesn't provide it
            appApi.getAnalysisTimeline(keyword)
              .then(setTimelinePoints)
              .catch(() => setTimelinePoints([]))
              .finally(() => setTimeout(() => setLoading(false), 300))
          }
        },
        (error) => {
          console.error('Stream error:', error)
          loadTraditional()
        }
      )

      if (!eventSource) {
        loadTraditional()
      }
    } catch (error) {
      console.error('Stream initialization error:', error)
      loadTraditional()
    }
  }

  useEffect(() => {
    if (!keyword) {
      setData(null)
      setEvidenceItems([])
      setTimelinePoints([])
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  const sourceRows = useMemo(() => buildSourceTrendRows(data, evidenceItems), [data, evidenceItems])
  const overall = useMemo(() => buildOverallRead(data, sourceRows, timelinePoints), [data, sourceRows, timelinePoints])
  const opportunityRead = useMemo(() => buildOpportunityRead(data, overall, sourceRows), [data, overall, sourceRows])
  const channelRecommendation = useMemo(() => pickChannelRecommendation(sourceRows, overall), [sourceRows, overall])
  const topKeywords = (data?.relatedKeywords ?? []).slice(0, 5)
  const researchGuard = data?.researchGuard ?? null
  const canRunDeepInsight = researchGuard ? Boolean(researchGuard.deepInsightEnabled) : true

  const handleExport = async () => {
    if (!keyword || !overall.hasData) {
      alert("Không có dữ liệu để xuất báo cáo!");
      return;
    }
    
    setIsExporting(true);
    try {
      const response = await appApi.exportAnalysisReport(keyword);
      if (response && response.success === false) {
          alert("Lỗi Backend: " + response.error + " (Chi tiết: " + response.cause + ")");
          return;
      }
      
      const mdContent = `
# Báo Cáo Phân Tích Thị Trường: ${keyword}
**Ngày tạo:** ${new Date().toLocaleDateString('vi-VN')}

## Tóm Tắt Nhanh
- **Trạng thái thị trường:** ${overall.marketState}
- **Mức quan tâm:** ${overall.interestLevel}
- **Độ tin cậy (Coverage):** ${Number(overall.coverage)}%
- **Tương tác trung bình:** ${pct(overall.avgEngagement)}
- **Market Score:** ${overall.marketScore}/100
- **Market Verdict:** Thị trường đang ${overall.marketState}. Confidence ở mức ${overall.confidenceBand} (${overall.confidenceScore}/100), dựa trên coverage ${Number(overall.coverage)}%, ${overall.sourceCount} nguồn và ${formatNumber(overall.totalComments)} bình luận.

## Tổng Quan Xu Hướng
${sourceRows.map(row => `- **${row.source}:** ${row.count} tín hiệu. ${row.summary} (Xu hướng: ${directionLabel(row.direction)})`).join('\n')}

## Top Keywords Liên Quan
${(data?.relatedKeywords ?? []).slice(0, 10).map(k => `- **${k.keyword}**: ${k.mentionCount} mentions, ${formatNumber(k.totalViews)} views, Sentiment: ${k.sentimentScore}/100`).join('\n')}

## Bằng Chứng Báo Chí
${evidenceItems.map(ev => `- [${ev.source}] ${ev.title}\n  Link: ${ev.url}`).join('\n\n')}
      `.trim();
      
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${keyword}_Market_Report.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("Xuất báo cáo thành công! File .md đã được tải về và báo cáo đã được lưu vào Dashboard.");
    } catch (e) {
      alert("Lỗi khi xuất báo cáo: " + e.message);
    } finally {
      setIsExporting(false);
    }
  }

  if (!keyword) {
    return (
      <div className="analysis-shell page-wrap">
        <section className="analysis-suite-hero card">
          <div>
            <p className="dashboard-kicker">Research suite</p>
            <h1>Start a Market Research Query</h1>
            <p className="hint">
              Nhập một từ khóa để hệ thống tổng hợp insight thị trường theo đúng prompt: xu hướng, đánh giá tổng thể, tiềm năng và kênh tiếp cận.
            </p>
            <div className="analysis-module-strip">
              <span className="analysis-module-chip">Source trend</span>
              <span className="analysis-module-chip">Overall interest</span>
              <span className="analysis-module-chip">Channel fit</span>
            </div>
          </div>

          <div className="analysis-suite-meta">
            <div className="analysis-suite-meta-label">Tracked keyword</div>
            <strong>Not selected</strong>
            <span>Search to start analysis</span>
          </div>
        </section>

        <section className="card dashboard-empty-state analysis-empty-state">
          <h2>Research starts with a keyword</h2>
          <p>Trang sẽ chỉ đưa ra nhận định dựa trên dữ liệu thu thập được. Nếu thiếu dữ liệu, hệ thống sẽ ghi rõ mục không thể đánh giá.</p>

          <div className="input-row analysis-empty-input">
            <input
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              placeholder="Try: phở, electric bike, AI agent, TikTok Shop trends..."
            />
            <Button
              onClick={() => {
                const nextKeyword = draftKeyword.trim()
                if (!nextKeyword) return
                navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(nextKeyword)}`)
              }}
            >
              Start Research
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="analysis-shell page-wrap">
      <section className="analysis-suite-hero card">
        <div>
          <p className="dashboard-kicker">Market insight prompt</p>
          <h1>Phân tích thị trường theo từ khóa</h1>
          <p className="hint">
            Dựa hoàn toàn trên dữ liệu về "{keyword}", không thêm kiến thức bên ngoài và không vẽ dữ liệu.
          </p>
          <div className="analysis-module-strip">
            <span className="analysis-module-chip">Tổng quan xu hướng</span>
            <span className="analysis-module-chip">Đánh giá tổng thể</span>
            <span className="analysis-module-chip">Tiềm năng</span>
            <span className="analysis-module-chip">Kênh đề xuất</span>
          </div>
        </div>

        <div className="analysis-suite-meta">
          <div className="analysis-suite-meta-label">Tracked keyword</div>
          <strong>{keyword}</strong>
          <span>{loading ? 'Đang phân tích...' : 'Updated just now'}</span>
        </div>
      </section>

      <div className="analysis-header-row">
        <div>
          <h2>Kết quả phân tích</h2>
          <p className="hint">Tối đa hóa insight ngắn gọn, có bằng chứng nguồn và trạng thái thiếu dữ liệu.</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" className="btn-sm" onClick={handleExport} disabled={isExporting || loading}>
            {isExporting ? 'Đang xuất...' : 'Export'}
          </Button>
          <Button onClick={load} disabled={loading} className="btn-sm">
            {loading ? 'Đang phân tích...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {loading && streamProgress > 0 && (
        <div className="streaming-progress-bar" style={{
          background: '#f3f4f6',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '16px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ fontSize: '13px', marginBottom: '8px', color: '#666' }}>
            Phân tích đang diễn ra... ({['Khởi tạo', 'Nguồn', 'Từ khóa', 'Tin tức', 'Insight', 'Chất lượng', 'Hoàn tất'][streamProgress - 1]})
          </div>
          <div style={{
            background: '#e5e7eb',
            height: '4px',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#3b82f6',
              height: '100%',
              width: `${(streamProgress / 7) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {cacheInfo && cacheInfo.cached && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #86efac',
          borderLeft: '4px solid #22c55e',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#166534'
        }}>
          💾 <strong>Data từ cache:</strong> {cacheInfo.message} (Tiết kiệm token ✨)
        </div>
      )}

      <div className="prompt-summary-grid">
        <section className="card prompt-summary-card">
          <span>Trạng thái thị trường</span>
          <strong>{overall.hasData ? <TypewriterText text={overall.marketState} speed={40} /> : 'chưa đủ dữ liệu'}</strong>
        </section>
        <section className="card prompt-summary-card">
          <span>Mức quan tâm</span>
          <strong>{overall.hasData ? <TypewriterText text={overall.interestLevel} speed={40} /> : 'chưa đủ dữ liệu'}</strong>
        </section>
        <section className="card prompt-summary-card">
          <span>Bằng chứng</span>
          <strong><AnimatedNumber value={Number(overall.coverage)} />%</strong>
        </section>
        <section className="card prompt-summary-card">
          <span>Tương tác TB</span>
          <strong><AnimatedNumber value={overall.avgEngagement * 100} format={(v) => v.toFixed(2)} />%</strong>
        </section>
      </div>

      <InsightSection title="Tổng quan xu hướng" badge="01">
        <div className="source-trend-list">
          {sourceRows.length ? sourceRows.map((row) => (
            <div className="source-trend-row" key={row.source}>
              <div>
                <strong>{row.source}</strong>
                <p><TypewriterText text={row.summary} speed={20} /></p>
              </div>
              <span className={`direction-pill direction-${directionClass(row.direction)}`}>
                {directionLabel(row.direction)}
              </span>
            </div>
          )) : (
            <p className="hint">{noDataFor('tổng quan xu hướng')}</p>
          )}
        </div>
      </InsightSection>

      <InsightSection title="Đánh giá tổng thể" badge="02">
        <div className="decision-grid">
          <div className="decision-score-card">
            <span className="decision-label">Market score</span>
            <strong>{overall.hasData ? <><AnimatedNumber value={overall.marketScore} />/100</> : 'N/A'}</strong>
            <div className="score-track">
              <div className="score-fill" style={{ width: `${overall.hasData ? overall.marketScore : 0}%` }} />
            </div>
            <p>{overall.hasData ? <TypewriterText text={`Mức quan tâm: ${overall.interestLevel}`} speed={30} /> : noDataFor('mức độ quan tâm hiện tại')}</p>
          </div>
          <div className="decision-verdict">
            <span className="decision-label">Market verdict</span>
            <h4>{overall.hasData ? <TypewriterText text={`Thị trường đang ${overall.marketState}`} speed={30} /> : noDataFor('đánh giá tổng thể')}</h4>
            <p>
              {overall.hasData
                ? <TypewriterText text={`Confidence ở mức ${overall.confidenceBand} (${overall.confidenceScore}/100), dựa trên coverage ${Number(overall.coverage)}%, ${overall.sourceCount} nguồn và ${formatNumber(overall.totalComments)} bình luận.`} speed={20} />
                : noDataFor('độ tin cậy')}
            </p>
          </div>
        </div>
        <div className="decision-detail-grid">
          <div>
            <div className="analysis-subsection-title">Vì sao hệ thống kết luận như vậy</div>
            <ul className="prompt-bullet-list">
              {(overall.hasData ? overall.evidenceReasons : [noDataFor('bằng chứng đánh giá tổng thể')]).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="analysis-subsection-title">Caveat / dữ liệu còn thiếu</div>
            <ul className="prompt-bullet-list">
              {(overall.missingData.length ? overall.missingData : ['Dữ liệu hiện đủ cho kết luận sơ bộ, vẫn nên kiểm chứng thêm trước quyết định lớn.']).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </InsightSection>

      <InsightSection title="Tiềm năng thị trường" badge="03">
        <div className="decision-grid">
          <div className="decision-score-card opportunity-score">
            <span className="decision-label">Opportunity score</span>
            <strong>{opportunityRead.score}/100</strong>
            <div className="score-track">
              <div className="score-fill" style={{ width: `${opportunityRead.score}%` }} />
            </div>
            <p>Độ mạnh tín hiệu: {opportunityRead.band}</p>
          </div>
          <div className="decision-verdict">
            <span className="decision-label">Top opportunity</span>
            <h4>{opportunityRead.title}</h4>
            <p>{opportunityRead.risk}</p>
          </div>
        </div>
        <div className="decision-detail-grid">
          <div>
            <div className="analysis-subsection-title">Why it matters</div>
            <ul className="prompt-bullet-list">
              {opportunityRead.why.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="analysis-subsection-title">Recommended next move</div>
            <p className="prompt-main-text">{opportunityRead.nextMove}</p>
          </div>
        </div>
        {topKeywords.length ? (
          <div className="compact-keyword-list">
            {topKeywords.map((item) => (
              <span key={item.keyword}>{item.keyword} ({item.mentionCount})</span>
            ))}
          </div>
        ) : null}
      </InsightSection>

      <InsightSection title="Kênh tiếp cận đề xuất" badge="04">
        <p className="prompt-main-text">{channelRecommendation}</p>
        <div className="tag-wrap">
          {(data?.suggestedActions ?? []).slice(0, 4).map((action) => (
            <button key={action} className="tag" type="button">{action}</button>
          ))}
        </div>
      </InsightSection>

      {researchGuard ? (
        <section className={`card research-guard-card ${canRunDeepInsight ? 'guard-ok' : 'guard-low'}`}>
          <div className="analysis-section-heading">
            <div>
              <div className="card-title">Keyword Validation</div>
              <p className="hint">{researchGuard.message}</p>
            </div>
            <div className="guard-score">{researchGuard.intentScore}/100</div>
          </div>
          <div className="grid grid-2">
            <div className="opportunity-item">
              <strong>Status: {researchGuard.status}</strong>
              <p className="hint">
                {canRunDeepInsight
                  ? 'This keyword is valid for market analysis and deep insight.'
                  : 'Deep insight is temporarily blocked until keyword intent improves.'}
              </p>
            </div>
            <div className="opportunity-item">
              <strong>Suggested keywords</strong>
              <p className="hint">{(researchGuard.suggestedKeywords ?? []).slice(0, 5).join(' | ')}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="card">
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Bằng chứng đầu vào</div>
            <p className="hint">Chỉ hiển thị để kiểm tra nguồn; các nhận định trên không bổ sung kiến thức ngoài dữ liệu này.</p>
          </div>
        </div>
        <div className="stack">
          {(evidenceItems ?? []).slice(0, 6).map((item, idx) => (
            <div key={`${item.source}-${idx}`} className="list-select">
              <div className="list-select-row">
                <strong>{canonicalSource(item.source)}</strong>
                <span className="hint">{item.metric}</span>
              </div>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer noopener" className="evidence-link">
                  {item.title}
                </a>
              ) : (
                <div>{item.title}</div>
              )}
              <span className="hint">{item.signal}</span>
            </div>
          ))}
          {!evidenceItems.length ? <p className="hint">{noDataFor('bằng chứng đầu vào')}</p> : null}
        </div>
      </section>

      <div className="ask-more">
        {canRunDeepInsight ? (
          <Link to={`${ROUTES.DEEP_INSIGHT}?keyword=${encodeURIComponent(keyword)}`} className="ask-more-cta">
            <span className="ask-more-icon">AI</span>
            <span>Run Deep Insight</span>
          </Link>
        ) : (
          <button type="button" className="ask-more-cta ask-more-cta-disabled" disabled>
            <span className="ask-more-icon">AI</span>
            <span>Refine keyword to unlock deep insight</span>
          </button>
        )}
      </div>
    </div>
  )
}
