import { useEffect, useState } from 'react'
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

const OPP_ICONS = ['🚀', '💡', '📊', '🎯']
const SIGNAL_ICONS = ['📡', '💬', '⚔️']

export function DeepInsightPage() {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''
  const [analysisContext, setAnalysisContext] = useState(null)
  const [activeSource, setActiveSource] = useState('Tổng hợp đa nguồn')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  const availableSources = analysisContext?.dataSources?.length
    ? analysisContext.dataSources
    : ['Google Search', 'Google News', 'YouTube Signals', 'Tổng hợp đa nguồn']

  useEffect(() => {
    if (activeSource === 'Tổng hợp đa nguồn') {
      return
    }
    if (!availableSources.includes(activeSource)) {
      setActiveSource(availableSources[0] ?? 'Tổng hợp đa nguồn')
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

  const load = async () => {
    setLoading(true)
    try {
      const result = await appApi.getDeepInsight({ keyword, source: activeSource })
      setData(result)
    } catch (error) {
      if (error?.status === 403) {
        setUpgradeMessage(
          error?.message ||
            'Đã đạt giới hạn lượt sử dụng AI. Vui lòng nâng cấp tài khoản hoặc mua thêm lượt để tiếp tục.'
        )
        setShowUpgradeModal(true)
        return
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

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
  const sentimentBars = data?.sentiment?.bars ?? [
    { label: 'Tích cực', pct: data ? 70 : 0, color: 'var(--green)', cls: 'text-green' },
    { label: 'Trung lập', pct: data ? 20 : 0, color: 'var(--gray-500)', cls: '' },
    { label: 'Tiêu cực', pct: data ? 10 : 0, color: 'var(--red)', cls: 'text-red' },
  ]
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

      const mdContent = `
# Báo Cáo Phân Tích Chuyên Sâu (AI Deep Insight): ${keyword}
**Ngày tạo:** ${new Date().toLocaleDateString('vi-VN')}
**Nguồn dữ liệu tập trung:** ${activeSource}

## 📊 Market Insight (Nhận định thị trường)
- **Tóm tắt phát hiện:** ${signalSummary}

## 💬 Sentiment & Topics (Cảm nhận khán giả & Chủ đề thảo luận)
- **Tích cực (Positive):** ${sentimentBars[0]?.pct}%
- **Trung lập (Neutral):** ${sentimentBars[1]?.pct}%
- **Tiêu cực (Negative):** ${sentimentBars[2]?.pct}%

### Chủ đề thảo luận chính:
${discussionTopics.map(t => `- **${t.name}**: ${t.change}`).join('\n')}

## 🎯 Opportunities (Cơ hội thị trường đề xuất)
${opportunityCards.map(opp => `- **${opp.title}**: ${opp.desc}`).join('\n')}

## ✨ Strategic Recommendation (Khuyến nghị chiến lược)
### ${strategicRecommendation.title}
${strategicRecommendation.desc}
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
          <Button onClick={load} disabled={loading || !keyword} className="btn-sm">
            {loading ? '⏳ Đang phân tích...' : '🚀 Chạy phân tích'}
          </Button>
        </div>
        <div className="di-keyword-box">
          <div className="di-input-label">Từ khóa nghiên cứu</div>
          <div className="di-keyword-value">{keyword || '— Chưa chọn từ khóa —'}</div>
          <div className="hint">{keyword ? 'Được lấy từ trang Nghiên cứu thị trường. Chọn một nguồn và bấm Chạy phân tích.' : 'Vui lòng quay lại trang Nghiên cứu thị trường và chọn từ khóa để kích hoạt phân tích.'}</div>
        </div>

        <div className="di-input-label">Nguồn dữ liệu</div>
        <div className="di-data-source-tabs">
          {availableSources.map((src) => (
            <button
              key={src}
              className={`di-data-source-tab${activeSource === src ? ' active' : ''}`}
              onClick={() => setActiveSource(src)}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

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
        <div className="di-section-title">💬 Đánh giá cảm nhận khán giả</div>
        <div className="di-sentiment-two-col">
          <div className="di-sentiment-bars">
            {loading && !data ? (
              [1, 2, 3].map((idx) => (
                <div className="di-sentiment-bar-row" key={idx}>
                  <span className="di-sentiment-bar-label"><div className="skeleton-pulse" style={{ height: '14px', width: '50px', background: 'var(--gray-200)', borderRadius: '4px' }} /></span>
                  <div className="di-sentiment-bar-track">
                    <div className="skeleton-pulse" style={{ height: '100%', width: '40%', background: 'var(--gray-100)', borderRadius: '2px' }} />
                  </div>
                  <span className="di-sentiment-bar-value"><div className="skeleton-pulse" style={{ height: '14px', width: '30px', background: 'var(--gray-200)', borderRadius: '4px' }} /></span>
                </div>
              ))
            ) : (
              sentimentBars.map((bar) => (
                <div className="di-sentiment-bar-row" key={bar.label}>
                  <span className={`di-sentiment-bar-label ${bar.cls || ''}`}>{bar.label}</span>
                  <div className="di-sentiment-bar-track">
                    <div className="di-sentiment-bar-fill" style={{ width: `${bar.pct}%`, background: bar.color }} />
                  </div>
                  <span className="di-sentiment-bar-value">{bar.pct}%</span>
                </div>
              ))
            )}
          </div>

          <div>
            <h5 className="di-topics-title">Chủ đề thảo luận chính</h5>
            <div className="hint" style={{ marginBottom: 10 }}>Được ước tính từ lượt tương tác và sự trùng lặp từ khóa.</div>
            <div className="di-topics-list">
              {loading && !data ? (
                [1, 2, 3].map((idx) => (
                  <div className="di-discussion-topic" key={idx}>
                    <span className="di-topic-name"><div className="skeleton-pulse" style={{ height: '14px', width: '100px', background: 'var(--gray-100)', borderRadius: '4px' }} /></span>
                    <span className="di-topic-change"><div className="skeleton-pulse" style={{ height: '14px', width: '50px', background: 'var(--gray-200)', borderRadius: '4px' }} /></span>
                  </div>
                ))
              ) : (
                discussionTopics.map((t) => (
                  <div className="di-discussion-topic" key={t.name}>
                    <span className="di-topic-name">{t.name}</span>
                    <span className="di-topic-change">{t.change}</span>
                  </div>
                ))
              )}
            </div>
          </div>
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
