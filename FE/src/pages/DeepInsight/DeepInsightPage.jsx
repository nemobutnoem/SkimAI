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
    : ['Google Search', 'Google News', 'YouTube', 'Cross-source synthesis']

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

      // Market Overview & Characteristics
      let overviewHtml = '';
      if (data?.marketOverview) {
        overviewHtml = `
          <h2>2. Quy Mô & Đặc Điểm Ngành</h2>
          <div class="section-box">
            <p><strong>Ước tính quy mô / Động lượng tăng trưởng:</strong> ${data.marketOverview.industrySize || 'N/A'}</p>
            <h3>Đặc điểm cốt lõi của ngành:</h3>
            <ul>
              ${(data.marketOverview.keyCharacteristics || []).map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      // SWOT Matrix
      let swotHtml = '';
      if (data?.swot) {
        swotHtml = `
          <h2>3. Ma Trận SWOT Ngành (Startup/SMB)</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; border: 2px solid #3182ce;">
            <thead>
              <tr style="background-color: #3182ce; color: #ffffff;">
                <th style="width: 50%; padding: 12px; border: 1px solid #3182ce; font-weight: bold; text-align: left; font-size: 11pt;">STRENGTHS (ĐIỂM MẠNH)</th>
                <th style="width: 50%; padding: 12px; border: 1px solid #3182ce; font-weight: bold; text-align: left; font-size: 11pt;">WEAKNESSES (ĐIỂM YẾU)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #cbd5e0; background-color: #e6f4ea; color: #137333; vertical-align: top; font-size: 10.5pt;">
                  <ul>
                    ${(data.swot.strengths || []).map(s => `<li>${s}</li>`).join('')}
                  </ul>
                </td>
                <td style="padding: 12px; border: 1px solid #cbd5e0; background-color: #fce8e6; color: #c5221f; vertical-align: top; font-size: 10.5pt;">
                  <ul>
                    ${(data.swot.weaknesses || []).map(w => `<li>${w}</li>`).join('')}
                  </ul>
                </td>
              </tr>
              <tr style="background-color: #3182ce; color: #ffffff;">
                <th style="padding: 12px; border: 1px solid #3182ce; font-weight: bold; text-align: left; font-size: 11pt;">OPPORTUNITIES (CƠ HỘI)</th>
                <th style="padding: 12px; border: 1px solid #3182ce; font-weight: bold; text-align: left; font-size: 11pt;">THREATS (THÁCH THỨC)</th>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #cbd5e0; background-color: #e8f0fe; color: #1a73e8; vertical-align: top; font-size: 10.5pt;">
                  <ul>
                    ${(data.swot.opportunities || []).map(o => `<li>${o}</li>`).join('')}
                  </ul>
                </td>
                <td style="padding: 12px; border: 1px solid #cbd5e0; background-color: #fef7e0; color: #b06000; vertical-align: top; font-size: 10.5pt;">
                  <ul>
                    ${(data.swot.threats || []).map(t => `<li>${t}</li>`).join('')}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        `;
      }

      // Target Persona section in HTML
      let personaHtml = '';
      if (data?.targetPersona) {
        const persona = data.targetPersona;
        personaHtml = `
          <h2>7. Chân Dung Khách Hàng (Target Persona)</h2>
          <div class="section-box">
            <p><strong>Mô tả chung:</strong> ${persona.description || 'Chưa có thông tin mô tả.'}</p>
            <h3>Vấn đề & Nỗi đau lớn nhất (Painpoints)</h3>
            <ul>
              ${(persona.painPoints || []).map(p => `<li>${p}</li>`).join('')}
            </ul>
            <h3>Hành vi & Ý định tìm kiếm (Search Intent)</h3>
            <ul>
              ${(persona.searchIntents || []).map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      // Consumer Behaviour section in HTML
      let consumerBehaviourHtml = '';
      if (data?.consumerBehaviour) {
        const cb = data.consumerBehaviour;
        consumerBehaviourHtml = `
          <h2>8. Phân Khúc Thị Trường & Tiêu Chí Mua Sắm</h2>
          <div class="section-box">
            <h3>Phân khúc thị trường đề xuất</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; border: 1px solid #cbd5e0;">
              <thead>
                <tr style="background-color: #edf2f7;">
                  <th style="border: 1px solid #cbd5e0; padding: 8px; text-align: left; font-weight: 600;">Tên phân khúc</th>
                  <th style="border: 1px solid #cbd5e0; padding: 8px; text-align: left; font-weight: 600;">Đối tượng mục tiêu</th>
                  <th style="border: 1px solid #cbd5e0; padding: 8px; text-align: left; font-weight: 600;">Chiến lược đề xuất</th>
                </tr>
              </thead>
              <tbody>
                ${(cb.marketSegmentation || []).map(s => `
                  <tr>
                    <td style="border: 1px solid #cbd5e0; padding: 8px;"><strong>${s.segmentName}</strong></td>
                    <td style="border: 1px solid #cbd5e0; padding: 8px;">${s.targetAudience}</td>
                    <td style="border: 1px solid #cbd5e0; padding: 8px;">${s.strategy}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h3>Tiêu chí quyết định mua sắm cốt lõi</h3>
            <ul>
              ${(cb.purchasingCriteria || []).map(c => `
                <li><strong>${c.criterion}</strong> [Mức độ quan trọng: ${c.importance}] - ${c.description}</li>
              `).join('')}
            </ul>
          </div>
        `;
      }

      // Competitor Map section in HTML
      let competitorsHtml = '';
      if (data?.competitors && data.competitors.length > 0) {
        competitorsHtml = `
          <h2>9. Bản Đồ Đối Thủ Cạnh Tranh (Competitor Map)</h2>
          ${data.competitors.map((c, idx) => `
            <div class="section-box" style="margin-bottom: 15px;">
              <h3>${idx + 1}. ${c.name}</h3>
              <p><strong>Liên kết:</strong> ${c.channelUrl || 'N/A'}</p>
              <p><strong>Sức mạnh:</strong> ${c.strengthLevel || 'N/A'}</p>
              <p><strong>Theo dõi (Subs):</strong> ${c.followers || 'N/A'}</p>
              <p><strong>Tần suất hoạt động:</strong> ${c.frequency || 'N/A'}</p>
              <p><strong>AI Chiến lược:</strong> ${c.note || 'N/A'}</p>
            </div>
          `).join('')}
        `;
      }

      // Regional Potential section in HTML
      let regionalPotentialHtml = '';
      if (data?.regionalPotential) {
        const regional = data.regionalPotential;
        regionalPotentialHtml = `
          <h2>10. Tiềm Năng Khu Vực (Regional Potential)</h2>
          <div class="section-box">
            <p><strong>Nhận xét địa lý:</strong> ${regional.analysisText || 'Chưa có thông tin phân tích.'}</p>
            <h3>Bảng phân bố nhu cầu theo tỉnh thành</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; border: 1px solid #cbd5e0;">
              <thead>
                <tr style="background-color: #edf2f7;">
                  <th style="border: 1px solid #cbd5e0; padding: 8px; text-align: left;">Khu vực / Tỉnh thành</th>
                  <th style="border: 1px solid #cbd5e0; padding: 8px; text-align: center;">Tỷ lệ quan tâm (%)</th>
                  <th style="border: 1px solid #cbd5e0; padding: 8px; text-align: center;">Mức độ cầu</th>
                </tr>
              </thead>
              <tbody>
                ${(regional.topRegions || []).map(r => `
                  <tr>
                    <td style="border: 1px solid #cbd5e0; padding: 8px;">${r.regionName}</td>
                    <td style="border: 1px solid #cbd5e0; padding: 8px; text-align: center;">${r.percentage}%</td>
                    <td style="border: 1px solid #cbd5e0; padding: 8px; text-align: center;">${r.demandLevel}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <h3>Nhận định địa lý & Phân phối tiếp thị</h3>
            <ul>
              ${(regional.geographicInsights || []).map(g => `<li>${g}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      // References section in HTML
      let referencesHtml = '';
      if (data?.references && data.references.length > 0) {
        referencesHtml = `
          <h2>11. Tài Liệu Tham Khảo (References - APA 7th)</h2>
          <div class="section-box" style="background-color: #ffffff; border-left: 4px solid #718096; padding: 15px;">
            <ul style="list-style-type: none; padding-left: 0; margin-left: 0;">
              ${data.references.map(r => `
                <li style="margin-bottom: 12px; padding-left: 18px; text-indent: -18px; font-size: 10pt; color: #4a5568;">${r}</li>
              `).join('')}
            </ul>
          </div>
        `;
      }

      const docHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Báo Cáo Phân Tích Chuyên Sâu: ${keyword}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      line-height: 1.5;
      color: #2d3748;
      margin: 1in;
    }
    h1 {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 24pt;
      color: #1a365d;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .meta-table td {
      padding: 4px 0;
      font-size: 10.5pt;
      color: #718096;
    }
    .divider {
      border-top: 3px solid #3182ce;
      margin-bottom: 25px;
    }
    h2 {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 16pt;
      color: #2b6cb0;
      margin-top: 30px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      font-weight: bold;
    }
    h3 {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12.5pt;
      color: #2d3748;
      margin-top: 20px;
      margin-bottom: 8px;
      font-weight: bold;
    }
    p, li {
      font-size: 11pt;
      margin-bottom: 8px;
      color: #2d3748;
    }
    .section-box {
      background-color: #f7fafc;
      border-left: 4px solid #3182ce;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>Báo Cáo Phân Tích Chuyên Sâu (AI Deep Insight)</h1>
  <table class="meta-table">
    <tr>
      <td style="width: 50%;"><strong>Từ khóa nghiên cứu:</strong> ${keyword}</td>
      <td style="width: 50%; text-align: right;"><strong>Ngày xuất báo cáo:</strong> ${new Date().toLocaleDateString('vi-VN')}</td>
    </tr>
    <tr>
      <td style="width: 50%;"><strong>Nguồn dữ liệu tập trung:</strong> ${activeSource}</td>
      <td style="width: 50%; text-align: right;"><strong>Hệ thống:</strong> SkimAI Platform</td>
    </tr>
  </table>
  <div class="divider"></div>

  <h2>1. Market Insight (Nhận định thị trường)</h2>
  <div class="section-box">
    <p>${signalSummary}</p>
  </div>

  ${overviewHtml}
  ${swotHtml}

  <h2>4. Chủ Đề Thảo Luận Chính</h2>
  <ul>
    ${discussionTopics.map(t => `<li><strong>${t.name}</strong>: ${t.change}</li>`).join('')}
  </ul>

  <h2>5. Cơ Hội Thị Trường Đề Xuất (Opportunities)</h2>
  <ul>
    ${opportunityCards.map(opp => `<li><strong>${opp.title}</strong>: ${opp.desc}</li>`).join('')}
  </ul>

  <h2>6. Khuyến Nghị Chiến Lược (Strategic Recommendation)</h2>
  <div class="section-box">
    <h3>${strategicRecommendation.title}</h3>
    <p>${strategicRecommendation.desc}</p>
  </div>

  ${personaHtml}
  ${consumerBehaviourHtml}
  ${competitorsHtml}
  ${regionalPotentialHtml}
  ${referencesHtml}

  <div style="margin-top: 50px; text-align: center; font-size: 9pt; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    Báo cáo được tạo tự động bởi hệ thống SkimAI — Trợ lý Nghiên Cứu Thị Trường Thông Minh
  </div>
</body>
</html>
      `.trim();

      const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${keyword}_Deep_Insight_Report.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Xuất báo cáo chuyên sâu thành công! File báo cáo Word (.doc) đã được tải về và báo cáo đã được lưu vào Dashboard.");
    } catch (e) {
      alert("Lỗi khi xuất báo cáo: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="di-shell page-wrap">
      {/* Styles for premium skeleton loading pulse and SWOT / Market Analysis layout */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .di-grid-layout {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-top: 20px;
          align-items: start;
        }
        .di-grid-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .di-grid-layout {
            grid-template-columns: 1fr;
          }
        }
        .swot-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        @media (max-width: 768px) {
          .swot-grid {
            grid-template-columns: 1fr;
          }
        }
        .swot-cell {
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid;
          background: var(--white);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          transition: all 0.2s ease;
        }
        .swot-cell:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }
        .swot-strengths {
          background-color: rgba(16, 185, 129, 0.05) !important;
          border-color: rgb(16, 185, 129) !important;
          color: rgb(6, 95, 70) !important;
        }
        .swot-weaknesses {
          background-color: rgba(239, 68, 68, 0.05) !important;
          border-color: rgb(239, 68, 68) !important;
          color: rgb(153, 27, 27) !important;
        }
        .swot-opportunities {
          background-color: rgba(59, 130, 246, 0.05) !important;
          border-color: rgb(59, 130, 246) !important;
          color: rgb(30, 58, 138) !important;
        }
        .swot-threats {
          background-color: rgba(245, 158, 11, 0.05) !important;
          border-color: rgb(245, 158, 11) !important;
          color: rgb(146, 64, 14) !important;
        }
        .di-strategic-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%) !important;
          border-radius: var(--radius-lg);
          padding: 30px;
          color: var(--white);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }
        .swot-cell h5 {
          margin: 0 0 10px 0;
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: inherit;
        }
        .swot-list {
          margin: 0;
          padding-left: 18px;
          font-size: 13.5px;
          line-height: 1.6;
        }
        .swot-list li {
          margin-bottom: 6px;
        }
        .ref-list {
          list-style: none;
          padding: 0;
          margin: 15px 0 0 0;
        }
        .ref-item {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 12px;
          padding-left: 18px;
          text-indent: -18px;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 8px;
        }
        .ref-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .char-list {
          list-style: none;
          padding: 0;
          margin: 15px 0 0 0;
        }
        .char-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .char-bullet {
          color: var(--primary);
          font-weight: bold;
        }
        .criteria-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 15px;
        }
        .criteria-item {
          padding: 12px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .criteria-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .criteria-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 13.5px;
        }
        .criteria-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .criteria-badge-high {
          background-color: #fce8e6;
          color: var(--red);
        }
        .criteria-badge-medium {
          background-color: #fef7e0;
          color: var(--orange);
        }
        .criteria-badge-low {
          background-color: #e2e8f0;
          color: var(--text-secondary);
        }
        .criteria-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }
        .seg-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 13px;
        }
        .seg-table th, .seg-table td {
          border: 1px solid #cbd5e0;
          padding: 10px 12px;
          text-align: left;
          vertical-align: top;
        }
        .seg-table th {
          background-color: #edf2f7;
          color: var(--text-primary);
          font-weight: 600;
        }
        .seg-table td {
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" className="btn-sm" onClick={handleExport} disabled={loading || !data || isExporting}>
            {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
          </Button>
          <Link to={keyword ? `${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(keyword)}` : ROUTES.ANALYSIS} className="btn btn-primary btn-sm">← Quay lại</Link>
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
            <button
              className={`di-report-tab-btn${activeReportTab === 'regional' ? ' active' : ''}`}
              onClick={() => setActiveReportTab('regional')}
            >
              📍 Tiềm năng khu vực
            </button>
          </div>

          {activeReportTab === 'overview' && (
            <>
              <div className="di-grid-layout">
              {/* Cột trái */}
              <div className="di-grid-col">
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

                {/* Market Overview & Characteristics */}
                <div className="di-section-card">
                  <div className="di-section-title">🏢 Quy mô & Đặc điểm ngành</div>
                  {loading && !data ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                      <div className="skeleton-pulse" style={{ height: '20px', width: '80%', background: 'var(--gray-200)', borderRadius: '4px' }} />
                      <div className="skeleton-pulse" style={{ height: '14px', width: '90%', background: 'var(--gray-100)', borderRadius: '4px' }} />
                      <div className="skeleton-pulse" style={{ height: '14px', width: '85%', background: 'var(--gray-100)', borderRadius: '4px' }} />
                    </div>
                  ) : (
                    <div style={{ marginTop: '15px' }}>
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--gray-800)', margin: '0 0 12px 0' }}>
                        <strong>Ước tính quy mô / Động lượng tăng trưởng:</strong> {data?.marketOverview?.industrySize || 'Chưa có thông tin'}
                      </p>
                      <h5 style={{ margin: '15px 0 8px 0', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '600' }}>Đặc điểm cốt lõi của ngành:</h5>
                      <ul className="char-list">
                        {data?.marketOverview?.keyCharacteristics?.length ? (
                          data.marketOverview.keyCharacteristics.map((char, idx) => (
                            <li key={idx} className="char-item">
                              <span className="char-bullet">•</span>
                              <span>{char}</span>
                            </li>
                          ))
                        ) : (
                          <p className="hint">Chưa có thông tin đặc điểm ngành.</p>
                        )}
                      </ul>
                    </div>
                  )}
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
              </div>

              {/* Cột phải */}
              <div className="di-grid-col">
                {/* SWOT Matrix */}
                <div className="di-section-card">
                  <div className="di-section-title">📊 Ma trận SWOT (Cho Startup/SMB tham chiếu)</div>
                  {loading && !data ? (
                    <div className="swot-grid">
                      {[1, 2, 3, 4].map(idx => (
                        <div className="skeleton-pulse" key={idx} style={{ height: '120px', background: 'var(--gray-100)', borderRadius: '10px' }} />
                      ))}
                    </div>
                  ) : (
                    <div className="swot-grid">
                      <div className="swot-cell swot-strengths">
                        <h5>Strengths (Điểm mạnh)</h5>
                        <ul className="swot-list">
                          {data?.swot?.strengths?.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>
                      <div className="swot-cell swot-weaknesses">
                        <h5>Weaknesses (Điểm yếu)</h5>
                        <ul className="swot-list">
                          {data?.swot?.weaknesses?.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>
                      <div className="swot-cell swot-opportunities">
                        <h5>Opportunities (Cơ hội)</h5>
                        <ul className="swot-list">
                          {data?.swot?.opportunities?.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>
                      <div className="swot-cell swot-threats">
                        <h5>Threats (Thách thức)</h5>
                        <ul className="swot-list">
                          {data?.swot?.threats?.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
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
              </div>
            </div>

            {/* Strategic Recommendation - Full-width */}
              <div className="di-strategic-card" style={{ marginTop: '20px' }}>
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
                  <div className="di-persona-column-card" style={{ gridColumn: '1 / -1' }}>
                    <h4>📊 Phân khúc & Tiêu chí mua sắm (Đang phân tích...)</h4>
                    <div className="skeleton-pulse" style={{ height: '80px', width: '100%', background: 'var(--gray-100)', borderRadius: '8px', marginTop: '10px' }} />
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

                  {/* Market Segmentation & Criteria */}
                  <div className="di-persona-column-card" style={{ gridColumn: '1 / -1' }}>
                    <h4 style={{ color: 'var(--primary)' }}>📊 Phân khúc thị trường & Tiêu chí quyết định</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }} className="swot-grid">
                      <div>
                        <h5 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>Phân khúc tiêu dùng đề xuất:</h5>
                        <table className="seg-table">
                          <thead>
                            <tr>
                              <th>Phân khúc</th>
                              <th>Đối tượng chính</th>
                              <th>Chiến lược</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data?.consumerBehaviour?.marketSegmentation?.length ? (
                              data.consumerBehaviour.marketSegmentation.map((seg, idx) => (
                                <tr key={idx}>
                                  <td><strong>{seg.segmentName}</strong></td>
                                  <td>{seg.targetAudience}</td>
                                  <td>{seg.strategy}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className="hint">Chưa có phân khúc mẫu.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h5 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>Tiêu chí quyết định mua sắm:</h5>
                        <div className="criteria-grid">
                          {data?.consumerBehaviour?.purchasingCriteria?.length ? (
                            data.consumerBehaviour.purchasingCriteria.map((crit, idx) => {
                              const importance = crit.importance || 'Trung bình';
                              const badgeCls = importance === 'Cao' ? 'criteria-badge-high' : importance === 'Trung bình' ? 'criteria-badge-medium' : 'criteria-badge-low';
                              return (
                                <div key={idx} className="criteria-item">
                                  <div className="criteria-header">
                                    <span className="criteria-name">{crit.criterion}</span>
                                    <span className={`criteria-badge ${badgeCls}`}>{importance}</span>
                                  </div>
                                  <p className="criteria-desc">{crit.description}</p>
                                </div>
                              );
                            })
                          ) : (
                            <p className="hint">Chưa có tiêu chí mua sắm cụ thể.</p>
                          )}
                        </div>
                      </div>
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

          {activeReportTab === 'regional' && (
            <div className="di-section-card">
              <div className="di-section-title">📍 Tiềm năng khu vực tại Việt Nam</div>
              <p className="hint" style={{ marginBottom: '20px' }}>
                Phân tích mức độ quan tâm và tiềm năng thị trường theo vùng địa lý Việt Nam được AI nhận diện từ dữ liệu tín hiệu.
              </p>
              
              {loading && !data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="di-persona-desc-card" style={{ padding: '20px' }}>
                    <div className="skeleton-pulse" style={{ height: '16px', width: '90%', margin: '8px 0', background: 'var(--gray-200)', borderRadius: '4px' }} />
                    <div className="skeleton-pulse" style={{ height: '16px', width: '70%', background: 'var(--gray-200)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="skeleton-pulse" style={{ height: '14px', width: '100px', background: 'var(--gray-200)', borderRadius: '4px' }} />
                        <div className="skeleton-pulse" style={{ height: '10px', flex: 1, background: 'var(--gray-100)', borderRadius: '4px' }} />
                        <div className="skeleton-pulse" style={{ height: '14px', width: '40px', background: 'var(--gray-200)', borderRadius: '4px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="di-persona-desc-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--primary)' }}>
                    <p style={{ margin: 0, fontSize: '14.5px', lineHeight: '1.6', color: 'var(--gray-800)' }}>
                      {data?.regionalPotential?.analysisText || `Mô hình AI đang phân tích dữ liệu phân bố vùng miền cho từ khóa "${keyword}".`}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '10px' }}>
                    {/* Top Regions List with Progress Bars */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h5 style={{ margin: '0 0 15px', color: 'var(--gray-800)', fontSize: '15px', fontWeight: '600' }}>📊 Lượng quan tâm theo tỉnh thành</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {data?.regionalPotential?.topRegions?.length ? (
                          data.regionalPotential.topRegions.map((region, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>{region.regionName}</span>
                                <span style={{ color: 'var(--gray-500)', fontSize: '12px' }}>
                                  {region.percentage}% • <strong style={{ color: region.demandLevel === 'Cao' ? 'var(--green)' : region.demandLevel === 'Trung bình' ? '#f59e0b' : 'var(--red)' }}>{region.demandLevel}</strong>
                                </span>
                              </div>
                              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                  height: '100%', 
                                  background: region.demandLevel === 'Cao' ? 'var(--green)' : region.demandLevel === 'Trung bình' ? '#f59e0b' : 'var(--red)',
                                  width: `${region.percentage}%`,
                                  transition: 'width 0.6s ease-out'
                                }} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="hint">Chưa có thông tin phân bố địa lý.</p>
                        )}
                      </div>
                    </div>

                    {/* Geographic Insights */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h5 style={{ margin: '0 0 15px', color: 'var(--gray-800)', fontSize: '15px', fontWeight: '600' }}>💡 Nhận định địa lý từ AI</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data?.regionalPotential?.geographicInsights?.length ? (
                          data.regionalPotential.geographicInsights.map((insight, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', lineHeight: '1.5', color: 'var(--gray-700)' }}>
                              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
                              <span>{insight}</span>
                            </div>
                          ))
                        ) : (
                          <p className="hint">Chưa có nhận định địa lý cụ thể.</p>
                        )}
                      </div>
                    </div>
                  </div>
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
