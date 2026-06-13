import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'

function buildOpportunityCards(data, keyword) {
  if (data?.opportunityCards?.length) {
    return data.opportunityCards
  }

  if (data?.opportunities?.length) {
    return data.opportunities.map((opportunity, index) => ({
      title: `Cơ hội AI ${index + 1}`,
      desc: opportunity,
      theme: ['green', 'blue', 'orange', 'purple'][index % 4],
    }))
  }

  return [
    {
      title: 'Đang đợi kết quả từ AI',
      desc: `Hãy chạy phân tích để tạo danh sách cơ hội từ AI cho "${keyword}".`,
      theme: 'green',
    },
  ]
}

function hasAiError(data) {
  return Boolean(data?.marketInsight?.toLowerCase().startsWith('unable to generate ai insight'))
}

function canonicalSource(value) {
  const lower = (value || '').toLowerCase()
  if (lower.includes('youtube')) return 'YouTube'
  if (lower.includes('trend')) return 'Google Trends'
  if (lower.includes('google')) return 'Google Search'
  if (lower.includes('facebook')) return 'Facebook'
  if (lower.includes('tiktok')) return 'TikTok'
  if (lower.includes('news')) return 'Google News'
  if (lower.includes('reddit')) return 'Reddit'
  if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter/X'
  if (lower.includes('github')) return 'GitHub'
  return value
}

const OPP_ICONS = ['🚀', '💡', '📊', '🎯']
const SIGNAL_ICONS = ['📡', '💬', '⚔️']

export function DeepInsightPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''
  const urlSource = searchParams.get('source') || ''
  const [analysisContext, setAnalysisContext] = useState(null)
  const [activeSource, setActiveSource] = useState(urlSource || 'Cross-source synthesis')
  const [historyReports, setHistoryReports] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [evidenceItems, setEvidenceItems] = useState([])
  const [activeReportTab, setActiveReportTab] = useState('overview')

  useEffect(() => {
    setActiveReportTab('overview')
  }, [keyword, activeSource])

  const availableSources = analysisContext?.dataSources?.length
    ? analysisContext.dataSources
    : ['Google Search', 'Google News', 'YouTube Signals', 'Cross-source synthesis']

  useEffect(() => {
    if (!keyword) {
      setEvidenceItems([])
      return
    }
    appApi.getAnalysisEvidence(keyword)
      .then(setEvidenceItems)
      .catch((err) => {
        console.error("Failed to fetch evidence items:", err)
        setEvidenceItems([])
      })
  }, [keyword])

  const filteredEvidence = useMemo(() => {
    if (!evidenceItems?.length) return []
    const normSource = activeSource.toLowerCase()
    if (normSource.includes('cross-source') || normSource.includes('tổng hợp')) {
      return evidenceItems
    }
    return evidenceItems.filter(item => {
      const platform = (item.platform || '').toLowerCase()
      if (normSource.includes('youtube')) {
        return platform.includes('youtube')
      }
      if (normSource.includes('news')) {
        return platform.includes('news')
      }
      if (normSource.includes('google')) {
        return platform.includes('google')
      }
      return false
    })
  }, [evidenceItems, activeSource])

  useEffect(() => {
    if (urlSource && urlSource !== activeSource) {
      setActiveSource(urlSource)
    }
  }, [urlSource])

  useEffect(() => {
    appApi.getReports({ status: 'DEEP_INSIGHT' })
      .then(setHistoryReports)
      .catch(console.error)
  }, [keyword])

  const handleSourceChange = (src) => {
    setActiveSource(src)
    const nextParams = { keyword }
    if (src) nextParams.source = src
    setSearchParams(nextParams)
  }

  useEffect(() => {
    if (activeSource === 'Cross-source synthesis') {
      return
    }
    if (!availableSources.includes(activeSource)) {
      setActiveSource(availableSources[0] ?? 'Cross-source synthesis')
    }
  }, [activeSource, availableSources])

  useEffect(() => {
    appApi.getAnalysis(keyword)
      .then((result) => {
        setAnalysisContext(result)
        if (result?.dataSources?.length && !result.dataSources.includes(activeSource)) {
          setActiveSource(result.dataSources[0])
        }
      })
      .catch(() => {
        setAnalysisContext(null)
      })
  }, [keyword])



  // Auto-run Deep Insight when keyword or source changes
  useEffect(() => {
    if (!keyword) return

    let active = true
    const runLoad = async () => {
      setLoading(true)
      try {
        const result = await appApi.getDeepInsight({ keyword, source: activeSource })
        if (active) {
          setData(result)
        }
      } catch (error) {
        if (active) {
          if (error?.status === 403) {
            setUpgradeMessage(
              error?.message ||
                'Đã đạt giới hạn lượt sử dụng AI. Vui lòng nâng cấp tài khoản hoặc mua thêm lượt để tiếp tục.'
            )
            setShowUpgradeModal(true)
            return
          }
          console.error(error)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    runLoad()

    return () => {
      active = false
    }
  }, [keyword, activeSource])

  const opportunityCards = buildOpportunityCards(data, keyword)
  const aiFailed = hasAiError(data)
  const aiStatus = !data ? (loading ? 'Đang phân tích...' : 'Đang chờ') : aiFailed ? 'Cần cấu hình khóa' : 'Đã tạo'
  const trendMessage = !data
    ? (loading ? 'AI đang phân tích Xu hướng Tìm kiếm...' : !keyword ? 'Vui lòng chọn từ khóa ở trang Nghiên cứu thị trường' : 'Nhấp để bắt đầu phân tích từ AI')
    : aiFailed
      ? 'AI không thể tạo phân tích với cấu hình hiện tại'
      : `AI phân tích từ nguồn ${activeSource}`
  const signalSummary = !data
    ? (!keyword ? 'Chưa chọn từ khóa. Vui lòng chọn từ khóa ở trang Nghiên cứu thị trường.' : `Chưa có kết quả AI cho "${keyword}".`)
    : data.marketInsight
  const recommendationSummary = !data
    ? (!keyword ? 'Chưa chọn từ khóa.' : 'Hãy bắt đầu chạy phân tích để tạo khuyến nghị chiến lược.')
    : data.recommendation
  const stats = data?.stats ?? [
    { value: keyword || '—', label: 'Từ khóa hiện tại' },
    { value: activeSource, label: 'Nguồn dữ liệu AI' },
    { value: aiStatus, label: 'Trạng thái AI' },
  ]
  const mediaSignals = data?.mediaSignals ?? [
    {
      title: 'Tóm tắt bằng chứng',
      desc: signalSummary,
    },
    {
      title: 'Nguồn đã chọn',
      desc: `Nguồn phân tích hiện tại: ${activeSource}.`,
    },
    {
      title: 'Trạng thái khuyến nghị',
      desc: recommendationSummary,
    },
  ]
  const trendPoints = data?.trendPoints ?? [
    { label: keyword, value: 52, note: 'Tín hiệu xu hướng cơ sở' },
  ]
  // sentimentBars removed as requested by the user
  const discussionTopics = data?.sentiment?.topics ?? [
    { name: keyword, change: data ? 'đang hoạt động' : 'đang chờ' },
    { name: activeSource, change: 'đã chọn' },
    { name: 'Nhận định thị trường', change: data ? 'sẵn sàng' : 'đang xử lý' },
    { name: 'Khuyến nghị', change: data ? 'sẵn sàng' : 'đang xử lý' },
  ]
  const strategicRecommendation = data?.strategicRecommendation ?? {
    title: data ? (aiFailed ? 'Tiến trình AI cần chú ý' : 'Định hướng từ AI') : 'Sẵn sàng tạo khuyến nghị',
    desc: recommendationSummary,
    stats: [
      { value: keyword, label: 'Từ khóa hiện tại' },
      { value: activeSource, label: 'Nguồn hiện tại' },
      { value: aiStatus, label: 'Trạng thái AI', highlight: Boolean(data) && !aiFailed },
    ],
  }

  const handleExport = async () => {
    if (!data) {
      alert("Không có dữ liệu phân tích chuyên sâu để xuất!");
      return;
    }

    setIsExporting(true);
    try {
      // Gọi API backend để lưu báo cáo vào Database
      const response = await appApi.exportAnalysisReport(keyword);
      if (response && response.success === false) {
          alert("Lỗi Backend: " + response.error + " (Chi tiết: " + response.cause + ")");
          return;
      }

      // Target Persona section in markdown
      let personaMd = '';
      if (data?.targetPersona) {
        const persona = data.targetPersona;
        personaMd = `
## 🎯 Chân Dung Khách Hàng (Target Persona)
- **Mô tả chung:** ${persona.description || 'Chưa có thông tin mô tả.'}
- **Vấn đề & Nỗi đau lớn nhất (Painpoints):**
${(persona.painPoints || []).map(p => `  - ${p}`).join('\n')}
- **Hành vi & Ý định tìm kiếm (Search Intent):**
${(persona.searchIntents || []).map(s => `  - ${s}`).join('\n')}
        `.trim();
      }

      // Competitor Map section in markdown
      let competitorsMd = '';
      if (data?.competitors && data.competitors.length > 0) {
        competitorsMd = `
## ⚔️ Bản Đồ Đối Thủ Cạnh Tranh (Competitor Map)
${data.competitors.map((c, idx) => `
### ${idx + 1}. ${c.name}
- **Liên kết:** ${c.channelUrl || 'N/A'}
- **Sức mạnh:** ${c.strengthLevel || 'N/A'}
- **Theo dõi (Subs):** ${c.followers || 'N/A'}
- **Tần suất hoạt động:** ${c.frequency || 'N/A'}
- **AI Chiến lược:** ${c.note || 'N/A'}
`.trim()).join('\n\n')}
        `.trim();
      }

      const mdContent = `
# Báo Cáo Phân Tích Chuyên Sâu (AI Deep Insight): ${keyword}
**Ngày tạo:** ${new Date().toLocaleDateString('vi-VN')}
**Nguồn dữ liệu tập trung:** ${activeSource}

## 📊 Market Insight (Nhận định thị trường)
- **Tóm tắt phát hiện:** ${signalSummary}

## 💬 Chủ đề thảo luận chính
${discussionTopics.map(t => `- **${t.name}**: ${t.change}`).join('\n')}

## 🎯 Opportunities (Cơ hội thị trường đề xuất)
${opportunityCards.map(opp => `- **${opp.title}**: ${opp.desc}`).join('\n')}

## ✨ Strategic Recommendation (Khuyến nghị chiến lược)
### ${strategicRecommendation.title}
${strategicRecommendation.desc}

${personaMd ? `\n${personaMd}` : ''}
${competitorsMd ? `\n${competitorsMd}` : ''}
      `.trim();

      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${keyword}_Deep_Insight_Report.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Xuất báo cáo chuyên sâu thành công! File .md đã được tải về và báo cáo đã được lưu vào Dashboard.");
    } catch (e) {
      alert("Lỗi khi xuất báo cáo: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="di-shell page-wrap">
      {/* Styles for premium skeleton loading pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Page Header */}
      <div className="di-page-top">
        <div>
          <p className="dashboard-kicker">Phân tích sâu</p>
          <h1>AI Phân tích chuyên sâu</h1>
          <p className="hint">Khuyến nghị chiến lược được xây dựng từ dữ liệu nghiên cứu thị trường đã thu thập.</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" className="btn-sm" onClick={handleExport} disabled={loading || !data || isExporting}>
            {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
          </Button>
          <Link to={keyword ? `${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(keyword)}` : ROUTES.ANALYSIS} className="btn btn-primary btn-sm">← Quay lại Nghiên cứu</Link>
        </div>
      </div>

      {/* AI Input Card */}
      <div className="di-data-input-card">
        <div className="di-card-header-row">
          <h4>⚡ Cấu hình đầu vào AI</h4>
          {loading && <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>⏳ AI đang phân tích dữ liệu...</span>}
        </div>
        <div className="di-keyword-box">
          <div className="di-input-label">Từ khóa nghiên cứu</div>
          <div className="di-keyword-value">{keyword || '— Chưa chọn từ khóa —'}</div>
          <div className="hint">{keyword ? 'Được lấy từ trang Nghiên cứu thị trường. Hệ thống sẽ tự động chạy phân tích mỗi khi bạn thay đổi Nguồn dữ liệu.' : 'Vui lòng quay lại trang Nghiên cứu thị trường và chọn từ khóa để kích hoạt phân tích.'}</div>
        </div>

        <div className="di-input-label">Nguồn dữ liệu</div>
        <div className="di-data-source-tabs">
          {availableSources.map((src) => (
            <button
              key={src}
              className={`di-data-source-tab${activeSource === src ? ' active' : ''}`}
              onClick={() => handleSourceChange(src)}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {keyword ? (
        <>
          {/* Sub-tab navigation bar */}
          <div className="di-report-tabs">
            <button
              className={`di-report-tab-btn${activeReportTab === 'overview' ? ' active' : ''}`}
              onClick={() => setActiveReportTab('overview')}
            >
              📊 Báo cáo tổng quan
            </button>
            <button
              className={`di-report-tab-btn${activeReportTab === 'persona' ? ' active' : ''}`}
              onClick={() => setActiveReportTab('persona')}
            >
              🎯 Chân dung khách hàng
            </button>
            <button
              className={`di-report-tab-btn${activeReportTab === 'competitor' ? ' active' : ''}`}
              onClick={() => setActiveReportTab('competitor')}
            >
              ⚔️ Bản đồ đối thủ
            </button>
          </div>

          {activeReportTab === 'overview' && (
            <>
              {/* Market Insight */}
              <div className="di-section-card">
                <div className="di-section-title">📊 Nhận định thị trường</div>
                <div className="di-key-finding">
                  <div className="di-kf-label">Phát hiện chính</div>
                  {loading && !data ? (
                    <div className="skeleton-pulse" style={{ height: '24px', width: '90%', margin: '8px 0', background: 'var(--gray-100)', borderRadius: '4px' }} />
                  ) : (
                    <p>{signalSummary ?? `Nhấp "Chạy phân tích" để tạo nhận định từ AI cho "${keyword}".`}</p>
                  )}
                </div>
                <div className="di-stat-grid">
                  {stats.map((s) => (
                    <div className="di-stat-box" key={s.label}>
                      <div className="di-stat-num di-stat-num-text">
                        {loading && !data ? (
                          <div className="skeleton-pulse" style={{ height: '28px', width: '80px', margin: '0 auto', background: 'var(--gray-200)', borderRadius: '4px' }} />
                        ) : (
                          s.value
                        )}
                      </div>
                      <div className="di-stat-desc">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Evidence items list section */}
                {filteredEvidence.length > 0 && (
                  <div className="di-evidence-container" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🔗 Bằng chứng nguồn gốc ({activeSource})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredEvidence.map((item, idx) => (
                        <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            {item.url ? (
                              <a href={item.url} target="_blank" rel="noreferrer noopener" style={{ fontWeight: '600', color: 'var(--primary)', textDecoration: 'none', fontSize: '13px', lineHeight: '1.4' }} className="evidence-title-link">
                                {item.title}
                              </a>
                            ) : (
                              <span style={{ fontWeight: '600', color: 'var(--gray-800)', fontSize: '13px', lineHeight: '1.4' }}>
                                {item.title}
                              </span>
                            )}
                            <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap', fontWeight: '500' }}>
                              {canonicalSource(item.source)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                            <span>{item.metric}</span>
                            {item.sentimentLabel && (
                              <span style={{ 
                                color: item.sentimentLabel === 'POSITIVE' ? 'var(--green)' : item.sentimentLabel === 'NEGATIVE' ? 'var(--red)' : '#f59e0b',
                                fontWeight: '600'
                              }}>
                                {item.sentimentLabel === 'POSITIVE' ? 'Tích cực' : item.sentimentLabel === 'NEGATIVE' ? 'Tiêu cực' : 'Trung lập'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search Trend Analysis */}
              <div className="di-section-card">
                <div className="di-section-title">📈 Phân tích xu hướng tìm kiếm</div>
                <div className="di-trend-status">{trendMessage}</div>
                <div className="di-trend-table">
                  <div className="di-trend-table-head">
                    <span className="di-tth di-tth-rank">#</span>
                    <span className="di-tth di-tth-name">Từ khóa</span>
                    <span className="di-tth di-tth-note">Số liệu</span>
                    <span className="di-tth di-tth-bar">Động lượng xu hướng</span>
                  </div>
                  {loading && !data ? (
                    [1, 2, 3].map((idx) => (
                      <div className="di-trend-table-row" key={idx}>
                        <span className="di-trend-rank">{idx}</span>
                        <span className="di-trend-kw"><div className="skeleton-pulse" style={{ height: '16px', width: '120px', background: 'var(--gray-100)', borderRadius: '4px' }} /></span>
                        <span className="di-trend-note"><div className="skeleton-pulse" style={{ height: '14px', width: '160px', background: 'var(--gray-100)', borderRadius: '4px' }} /></span>
                        <span className="di-trend-bar-cell">
                          <div className="di-trend-bar-track">
                            <div className="skeleton-pulse" style={{ height: '100%', width: '60%', background: 'var(--gray-200)', borderRadius: '2px' }} />
                          </div>
                        </span>
                      </div>
                    ))
                  ) : (
                    trendPoints.map((point, idx) => (
                      <div className="di-trend-table-row" key={point.label}>
                        <span className="di-trend-rank">{idx + 1}</span>
                        <span className="di-trend-kw">{point.label}</span>
                        <span className="di-trend-note">{point.note}</span>
                        <span className="di-trend-bar-cell">
                          <div className="di-trend-bar-track">
                            <div className="di-trend-bar-fill" style={{ width: `${point.value}%` }} />
                          </div>
                          <span className="di-trend-pct">{point.value}%</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Media & Industry Signals */}
              <div className="di-section-card">
                <div className="di-section-title">📡 Tín hiệu truyền thông & ngành</div>
                <div className="di-signal-grid">
                  {loading && !data ? (
                    [1, 2, 3].map((idx) => (
                      <div className="di-signal-card" key={idx}>
                        <div className="di-signal-icon skeleton-pulse" style={{ width: '40px', height: '40px', background: 'var(--gray-200)', borderRadius: '50%' }} />
                        <div style={{ flex: 1 }}>
                          <div className="skeleton-pulse" style={{ height: '18px', width: '140px', marginBottom: '8px', background: 'var(--gray-200)', borderRadius: '4px' }} />
                          <div className="skeleton-pulse" style={{ height: '14px', width: '100%', marginBottom: '4px', background: 'var(--gray-100)', borderRadius: '4px' }} />
                          <div className="skeleton-pulse" style={{ height: '14px', width: '80%', background: 'var(--gray-100)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    mediaSignals.map((sig, idx) => (
                      <div className="di-signal-card" key={sig.title}>
                        <div className="di-signal-icon">{SIGNAL_ICONS[idx % SIGNAL_ICONS.length]}</div>
                        <div>
                          <h5>{sig.title}</h5>
                          <p>{sig.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Estimated Audience Sentiment */}
              <div className="di-section-card">
                <div className="di-section-title">💬 Chủ đề thảo luận chính</div>
                <div className="hint" style={{ marginBottom: '15px' }}>Được ước tính từ lượt tương tác và sự trùng lặp từ khóa của các thảo luận.</div>
                <div className="di-topics-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {loading && !data ? (
                    [1, 2, 3, 4].map((idx) => (
                      <div className="di-discussion-topic" key={idx} style={{ border: '1px solid var(--gray-200)', background: '#f8fafc', padding: '12px 16px' }}>
                        <span className="di-topic-name"><div className="skeleton-pulse" style={{ height: '14px', width: '100px', background: 'var(--gray-100)', borderRadius: '4px' }} /></span>
                        <span className="di-topic-change"><div className="skeleton-pulse" style={{ height: '14px', width: '50px', background: 'var(--gray-200)', borderRadius: '4px' }} /></span>
                      </div>
                    ))
                  ) : (
                    discussionTopics.map((t) => (
                      <div className="di-discussion-topic" key={t.name} style={{ border: '1px solid var(--gray-200)', background: '#f8fafc', padding: '12px 16px' }}>
                        <span className="di-topic-name" style={{ fontWeight: '500' }}>{t.name}</span>
                        <span className="di-topic-change">{t.change}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Market Opportunities */}
              <div className="di-section-card">
                <div className="di-section-title">🎯 Cơ hội thị trường</div>
                <div className="di-opportunity-grid">
                  {loading && !data ? (
                    [1, 2, 3].map((idx) => (
                      <div className="di-opportunity-card di-opp-blue" style={{ opacity: 0.7 }} key={idx}>
                        <div className="di-opp-icon skeleton-pulse" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray-200)' }} />
                        <div className="skeleton-pulse" style={{ height: '18px', width: '140px', margin: '12px 0 8px', background: 'var(--gray-200)', borderRadius: '4px' }} />
                        <div className="skeleton-pulse" style={{ height: '14px', width: '100%', marginBottom: '4px', background: 'var(--gray-100)', borderRadius: '4px' }} />
                        <div className="skeleton-pulse" style={{ height: '14px', width: '80%', background: 'var(--gray-100)', borderRadius: '4px' }} />
                      </div>
                    ))
                  ) : (
                    opportunityCards.map((opp, idx) => (
                      <div className={`di-opportunity-card di-opp-${opp.theme}`} key={opp.title}>
                        <div className="di-opp-icon">{OPP_ICONS[idx % OPP_ICONS.length]}</div>
                        <h5>{opp.title}</h5>
                        <p>{opp.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Strategic Recommendation */}
              <div className="di-strategic-card">
                <h4>✨ Khuyến nghị chiến lược</h4>
                {loading && !data ? (
                  <>
                    <div className="skeleton-pulse" style={{ height: '22px', width: '200px', margin: '8px 0 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                    <div className="skeleton-pulse" style={{ height: '16px', width: '90%', marginBottom: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                    <div className="skeleton-pulse" style={{ height: '16px', width: '70%', marginBottom: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                    <div className="di-strategic-stats">
                      {[1, 2, 3].map((idx) => (
                        <div key={idx}>
                          <div className="skeleton-pulse" style={{ height: '24px', width: '80px', margin: '0 auto 8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                          <div className="skeleton-pulse" style={{ height: '14px', width: '60px', margin: '0 auto', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h5>{strategicRecommendation.title}</h5>
                    <p>{strategicRecommendation.desc ?? recommendationSummary ?? `Mô hình AI sẽ tự động phân tích và tạo khuyến nghị chiến lược cho "${keyword}" sau khi bạn nhấn Chạy phân tích.`}</p>
                    <div className="di-strategic-stats">
                      {strategicRecommendation.stats.map((s) => (
                        <div key={s.label}>
                          <div className={`di-s-value${s.highlight ? ' green' : ''}`}>{s.value}</div>
                          <div className="di-s-label">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {activeReportTab === 'persona' && (
            <div className="di-persona-container">
              {loading && !data ? (
                <>
                  <div className="di-persona-desc-card">
                    <h4>🎯 Phác họa chân dung đối tượng mục tiêu</h4>
                    <div className="skeleton-pulse" style={{ height: '16px', width: '90%', margin: '8px 0', background: 'var(--gray-200)', borderRadius: '4px' }} />
                    <div className="skeleton-pulse" style={{ height: '16px', width: '70%', background: 'var(--gray-200)', borderRadius: '4px' }} />
                  </div>
                  <div className="di-persona-column-card">
                    <h4>💔 Vấn đề & Nỗi đau lớn nhất (Painpoints)</h4>
                    <div className="skeleton-pulse" style={{ height: '14px', width: '85%', margin: '6px 0', background: 'var(--gray-100)', borderRadius: '4px' }} />
                    <div className="skeleton-pulse" style={{ height: '14px', width: '60%', margin: '6px 0', background: 'var(--gray-100)', borderRadius: '4px' }} />
                  </div>
                  <div className="di-persona-column-card">
                    <h4>🔍 Hành vi & Ý định tìm kiếm (Search Intent)</h4>
                    <div className="skeleton-pulse" style={{ height: '14px', width: '80%', margin: '6px 0', background: 'var(--gray-100)', borderRadius: '4px' }} />
                    <div className="skeleton-pulse" style={{ height: '14px', width: '65%', margin: '6px 0', background: 'var(--gray-100)', borderRadius: '4px' }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="di-persona-desc-card">
                    <h4>🎯 Phác họa chân dung đối tượng mục tiêu</h4>
                    <p>{data?.targetPersona?.description || `Mô hình AI đang tìm kiếm chân dung đối tượng mục tiêu phù hợp cho từ khóa "${keyword}".`}</p>
                  </div>
                  <div className="di-persona-column-card">
                    <h4 style={{ color: 'var(--red)' }}>💔 Vấn đề & Nỗi đau lớn nhất (Painpoints)</h4>
                    <div className="di-persona-list">
                      {data?.targetPersona?.painPoints?.length ? (
                        data.targetPersona.painPoints.map((item, idx) => (
                          <div key={idx} className="di-persona-item">
                            <span className="di-persona-item-icon">❌</span>
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="hint">Chưa có thông tin nỗi đau được ghi nhận từ dữ liệu hiện tại.</p>
                      )}
                    </div>
                  </div>
                  <div className="di-persona-column-card">
                    <h4 style={{ color: 'var(--green)' }}>🔍 Hành vi & Ý định tìm kiếm (Search Intent)</h4>
                    <div className="di-persona-list">
                      {data?.targetPersona?.searchIntents?.length ? (
                        data.targetPersona.searchIntents.map((item, idx) => (
                          <div key={idx} className="di-persona-item">
                            <span className="di-persona-item-icon">💡</span>
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <p className="hint">Chưa có dữ liệu ý định tìm kiếm cụ thể.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeReportTab === 'competitor' && (
            <div className="di-section-card">
              <div className="di-section-title">⚔️ Bản đồ đối thủ cạnh tranh</div>
              <p className="hint" style={{ marginBottom: '20px' }}>
                Tổng hợp 5-10 bằng chứng đầu vào nổi bật được AI phân loại theo nguồn kênh thương hiệu và đánh giá hiệu suất của họ.
              </p>
              
              {loading && !data ? (
                <div className="di-competitor-grid">
                  {[1, 2, 3, 4].map((idx) => (
                    <div className="di-competitor-card" key={idx} style={{ opacity: 0.7 }}>
                      <div className="di-competitor-header">
                        <div className="skeleton-pulse" style={{ height: '18px', width: '120px', background: 'var(--gray-200)', borderRadius: '4px' }} />
                        <div className="skeleton-pulse" style={{ height: '20px', width: '60px', background: 'var(--gray-100)', borderRadius: '10px' }} />
                      </div>
                      <div className="di-competitor-metrics">
                        <div className="skeleton-pulse" style={{ height: '24px', width: '100%', background: 'var(--gray-100)', borderRadius: '4px' }} />
                        <div className="skeleton-pulse" style={{ height: '24px', width: '100%', background: 'var(--gray-100)', borderRadius: '4px' }} />
                      </div>
                      <div className="skeleton-pulse" style={{ height: '14px', width: '90%', background: 'var(--gray-100)', borderRadius: '4px' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="di-competitor-grid">
                  {data?.competitors?.length ? (
                    data.competitors.map((comp, idx) => {
                      let strengthLabel = 'Mới nổi';
                      let strengthClass = 'strength-emerging';
                      const level = (comp.strengthLevel || '').toLowerCase();
                      if (level.includes('mạnh') || level.includes('high') || level.includes('strong')) {
                        strengthLabel = 'Mạnh';
                        strengthClass = 'strength-high';
                      } else if (level.includes('trung bình') || level.includes('medium') || level.includes('average')) {
                        strengthLabel = 'Trung bình';
                        strengthClass = 'strength-medium';
                      }

                      return (
                        <div className="di-competitor-card" key={idx}>
                          <div className="di-competitor-header">
                            {comp.channelUrl ? (
                              <a
                                href={comp.channelUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="di-competitor-name"
                              >
                                {comp.name} 🔗
                              </a>
                            ) : (
                              <span className="di-competitor-name">{comp.name}</span>
                            )}
                            <span className={`di-competitor-strength-badge ${strengthClass}`}>
                              {strengthLabel}
                            </span>
                          </div>

                          <div className="di-competitor-metrics">
                            <div className="di-competitor-metric-box">
                              <span className="di-competitor-metric-label">Theo dõi (Subs)</span>
                              <span className="di-competitor-metric-value">{comp.followers || '—'}</span>
                            </div>
                            <div className="di-competitor-metric-box">
                              <span className="di-competitor-metric-label">Tần suất đăng</span>
                              <span className="di-competitor-metric-value">{comp.frequency || '—'}</span>
                            </div>
                          </div>

                          {comp.note && (
                            <div className="di-competitor-note">
                              <strong>AI Chiến lược:</strong> {comp.note}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="dashboard-empty-state" style={{ padding: '40px 0', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚔️</div>
                      <h3>Chưa tìm thấy thông tin đối thủ</h3>
                      <p className="hint" style={{ maxWidth: '400px', margin: '8px auto' }}>
                        Dữ liệu bằng chứng cào được không chứa đủ thông tin để định danh đối thủ cạnh tranh cụ thể cho từ khóa này.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="di-section-card" style={{ marginTop: '20px' }}>
          <div className="di-section-title">⚡ Lịch sử phân tích chuyên sâu đã chạy</div>
          <p className="hint" style={{ marginBottom: '20px' }}>
            Dưới đây là các từ khóa bạn đã từng phân tích chuyên sâu. Hệ thống đã lưu trữ kết quả để bạn có thể xem lại bất kỳ lúc nào mà không tốn thêm lượt sử dụng AI.
          </p>
          <div className="dashboard-recent-list">
            {historyReports.length ? (
              historyReports.map((item) => {
                const source = item.title ? item.title.replace(" Deep Insight", "") : 'Cross-source synthesis';
                return (
                  <Link
                    key={item.id}
                    to={`${ROUTES.DEEP_INSIGHT}?keyword=${encodeURIComponent(item.keyword)}&source=${encodeURIComponent(source)}`}
                    className="dashboard-recent-item"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Từ khóa: {item.keyword}
                        <span className="badge badge-published" style={{ fontSize: '11px', padding: '2px 6px' }}>
                          {source}
                        </span>
                      </strong>
                      <p>Đã chạy phân tích và lưu kết quả</p>
                    </div>
                    <time>{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
                  </Link>
                );
              })
            ) : (
              <div className="dashboard-empty-state" style={{ padding: '40px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
                <h3>Chưa có phân tích chuyên sâu nào</h3>
                <p className="hint" style={{ maxWidth: '400px', margin: '8px auto 20px' }}>
                  Vui lòng chọn từ khóa ở trang Nghiên cứu thị trường và nhấn vào nút "Phân tích chuyên sâu" để kích hoạt phân tích AI.
                </p>
                <Link to={ROUTES.ANALYSIS} className="btn btn-primary">
                  Đi đến Nghiên cứu thị trường
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ask Expert removed */}

      {showUpgradeModal ? (
        <div className="upgrade-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Đã đạt giới hạn sử dụng AI</h3>
            <p>{upgradeMessage || 'Bạn đã đạt giới hạn sử dụng lượt chạy phân tích AI cho giai đoạn này.'}</p>
            <div className="upgrade-modal-actions">
              <Link to={ROUTES.PRICING} className="btn btn-primary" onClick={() => setShowUpgradeModal(false)}>
                Nâng cấp tài khoản
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUpgradeModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
