import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { appApi } from '../../services/appApi'
import { useAuth } from '../../hooks/useAuth'
import { AnimatedNumber, TypewriterText } from '../../components/Effects'
import { AnalysisSkeleton } from '../../components/Skeleton'
import { useToast } from '../../context/ToastContext'

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
  if (lower.includes('reddit')) return 'Reddit'
  if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter/X'
  if (lower.includes('github')) return 'GitHub'
  return normalizeSourceName(value)
}

function inferDirection(text = '', count = 0) {
  const lower = text.toLowerCase()
  if (/(decrease|decline|drop|down|fall|giam|giảm|negative|weak|lùi|giảm sút|sa sút)/.test(lower)) return 'giảm'
  if (/(increase|growth|rise|up|spike|positive|strong|tang|tăng|\+|phát triển|bùng nổ|hot|thu hút|quan tâm)/.test(lower)) return 'tăng'
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

function _loadGoogleIdentityScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'))
  if (window.google?.accounts?.id) return Promise.resolve()

  const existing = document.querySelector('script[data-google-identity="true"]')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')))
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity script'))
    document.head.appendChild(script)
  })
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
      
      let itemDirection = 'chưa rõ'
      if (item?.sentiment === 'POSITIVE') itemDirection = 'tăng'
      else if (item?.sentiment === 'NEGATIVE') itemDirection = 'giảm'
      else if (item?.sentiment === 'NEUTRAL') itemDirection = 'ổn định'
      else itemDirection = inferDirection(current.signalText, current.count)

      if (current.direction === 'chưa rõ' || itemDirection !== 'chưa rõ') {
        current.direction = itemDirection
      }
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
        ? `${row.count > 1 ? `Ghi nhận ${row.count} thảo luận. ` : ''}Nội dung nổi bật: ${row.titles[0] || 'Có bằng chứng nguồn nhưng chưa có tiêu đề nổi bật.'}`
        : noDataFor(`xu hướng từ ${row.source}`),
    }))
}

function buildOverallRead(data, sourceRows, timelinePoints) {
  const isOffline = data?.snapshotId === 'OFFLINE_DEMO' || data?.snapshotId === 'N/A'
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

  const upCount = sourceRows.filter((row) => row.direction === 'tăng').length
  const downCount = sourceRows.filter((row) => row.direction === 'giảm').length
  const stableCount = sourceRows.filter((row) => row.direction === 'ổn định').length

  let marketState = 'ổn định'
  let stateReason = ''
  if (firstTimeline != null && lastTimeline != null) {
    if (lastTimeline > firstTimeline) {
      marketState = 'tăng trưởng'
      stateReason = `Điểm cuối dòng thời gian (${lastTimeline}) cao hơn điểm đầu (${firstTimeline}).`
    } else if (lastTimeline < firstTimeline) {
      marketState = 'giảm sút'
      stateReason = `Điểm cuối dòng thời gian (${lastTimeline}) thấp hơn điểm đầu (${firstTimeline}).`
    } else {
      marketState = 'ổn định'
      stateReason = `Dữ liệu dòng thời gian đi ngang.`
    }
  } else {
    if (upCount > downCount) {
      marketState = 'tăng trưởng'
      stateReason = `Có nhiều kênh nguồn xu hướng tăng hơn giảm (${upCount} tăng, ${downCount} giảm).`
    } else if (downCount > upCount) {
      marketState = 'giảm sút'
      stateReason = `Có nhiều kênh nguồn xu hướng giảm hơn tăng (${downCount} giảm, ${upCount} tăng).`
    } else {
      marketState = 'ổn định'
      stateReason = `Các nguồn tăng và giảm cân bằng (${upCount} tăng, ${downCount} giảm, ${stableCount} ổn định).`
    }
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
  const evidenceReasons = isOffline ? [
    'Số lượt xem không khả dụng (Chế độ offline)',
    'Số bình luận không khả dụng (Chế độ offline)',
    'Số lượng thảo luận không khả dụng (Chế độ offline)',
    `${sourceCount} nguồn có bằng chứng trực tiếp (ngoại tuyến)`,
  ] : [
    `${formatNumber(totalViews)} views quan sát được`,
    `${formatNumber(totalComments)} bình luận từ dữ liệu hiện có`,
    `${formatNumber(totalMentions)} tín hiệu keyword`,
    `${sourceCount} nguồn có bằng chứng trực tiếp`,
  ]
  const missingData = isOffline ? [
    'Hệ thống đang hoạt động ở chế độ offline do không kết nối được với API thực tế.'
  ] : [
    totalComments < 30 ? 'Thảo luận còn mỏng nên khó kết luận nhu cầu mua thật.' : null,
    sourceCount < 4 ? 'Độ đa dạng nguồn còn thấp, dễ bị lệch bởi một vài website.' : null,
    evidenceCoverage < 60 ? 'Evidence coverage chưa đủ mạnh để chấm confidence cao.' : null,
    keywords.length < 3 ? 'Cụm keyword liên quan còn ít, cần mở rộng truy vấn.' : null,
  ].filter(Boolean)

  return {
    isOffline,
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
    upCount,
    downCount,
    stableCount,
    stateReason,
    totalKeywords: keywords.length,
  }
}

function buildOpportunityRead(data, overall, sourceRows) {
  const keywords = data?.relatedKeywords ?? []
  if (overall.isOffline) {
    return {
      title: 'Không khả dụng (Chế độ offline)',
      score: 0,
      band: 'không khả dụng',
      why: ['Dữ liệu cơ hội từ khóa không khả dụng ở chế độ ngoại tuyến.'],
      risk: 'Không thể xác định cơ hội thị trường thực tế khi không có kết nối API.',
      nextMove: 'Vui lòng kiểm tra kết nối mạng hoặc cấu hình API key để nhận đề xuất.',
      strongest: null,
    }
  }
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

  const getKeywordScore = (k) => {
    if (!k) return 0;
    const viewsVal = Number(k.totalViews || 0);
    const engagementVal = Number(k.avgEngagement || 0);
    const mentionsVal = Number(k.mentionCount || 0);
    
    // 1. Views signal (log10 scale)
    const viewsScore = viewsVal > 0 ? Math.min(25, Math.log10(viewsVal) * 5) : 0;
    
    // 2. Engagement signal
    const engagementScore = Math.min(20, engagementVal * 100);
    
    // 3. Mentions count signal
    const mentionScore = Math.min(15, mentionsVal * 3);
    
    // 4. Intent multiplier (2.0x for commercial/actionable intent)
    const intentRegex = /(mua|bán|giá|review|so sánh|học|khóa học|tốt nhất|dịch vụ|phần mềm|tự động|hướng dẫn|tool|đánh giá|cách làm|thương hiệu|nhập khẩu|phân phối|chính hãng|uy tín|chất lượng|buy|price|best|vs|compare|how to|course|software|service|guide|comparison)/i;
    const hasIntent = intentRegex.test(k.keyword);
    
    // 5. Geographic/place name penalty (0.1x to prevent generic locations from being chosen as market opportunities)
    const geoRegex = /^(quang ngai|quảng ngãi|ha noi|hà nội|hồ chí minh|ho chi minh|tphcm|hcm|đà nẵng|da nang|hải phòng|hai phong|cần thơ|can tho|nha trang|đà lạt|da lat|nhật bản|nhat ban|trung quốc|trung quoc|hàn quốc|han quoc|việt nam|viet nam|thái lan|thai lan|singapore|wikipedia|binh duong|bình dương|dong nai|đồng nai|vung tau|vũng tàu|phu quoc|phú quốc|sapa|ha long|hạ long)$/i;
    const isGeo = geoRegex.test(k.keyword.trim());
    
    let multiplier = 1.0;
    if (hasIntent) multiplier = 2.0;
    
    // 6. Generic/noise word penalty (0.01x to prevent helper/conjunction phrases like "đuoc theo" from being chosen)
    const noiseRegex = /^(đuoc|duoc|được|đươc|đuợc|theo|bởi|boi|như|nhu|cho|với|voi|này|nay|của|cua|trên|tren|dưới|duoi|trong|ngoài|ngoai|cùng|cung|cũng|để|de|đến|den|đi|di|lại|lai|về|ve|thì|thi|cách|cach|ngày|ngay|tuần|tuan|tháng|thang|năm|nam|người|nguoi|nhà|nha|nước|nuoc|việt|viet|nam|tin|tức|mới|moi|và|va|là|la|các|cac|những|nhung|một|mot|hai|ba|bốn|bon|năm|nam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi|trước|truoc|sau|sau|khi|khi|chưa|chua|đã|da|rồi|roi|qua|qua|quá|qua|nhiều|nhieu|ít|it|hơn|hon|nhất|nhat|rất|rat|cực|cuc|đều|deu|cứ|cu|ra|vào|vao|lên|len|xuống|xuong|đây|day|kia|do|đó|nọ|no|thế|the|nào|nao|sao|gì|gi|đâu|dau|ai|chi|chỉ|cơ|co|hội|hoi|bằng|bang|chứng|chung)$/i;
    const words = k.keyword.toLowerCase().split(/\s+/);
    const isAllNoise = words.every(w => noiseRegex.test(w) || w.length < 2);

    if (isGeo || isAllNoise) multiplier = 0.01;
    
    return (viewsScore + engagementScore + mentionScore) * multiplier;
  };

  const strongest = [...keywords].sort((a, b) => getKeywordScore(b) - getKeywordScore(a))[0];
  const bestSource = sourceRows.find((row) => row.count > 0);
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

  const keywordPotential = clamp(Math.round(getKeywordScore(strongest)), 0, 40);
  const engagementSignal = clamp(Math.round((strongest.avgEngagement || overall.avgEngagement) * 200), 0, 15);
  const sourceSignal = clamp(overall.sourceCount * 5, 0, 20);
  const marketSignal = clamp(Math.round(overall.marketScore * 0.25), 0, 25);
  const rawScore = clamp(keywordPotential + engagementSignal + sourceSignal + marketSignal, 0, 100);
  
  const score = (strongest.mentionCount || 0) < 2 && overall.totalComments < 15
    ? Math.min(rawScore, 48)
    : rawScore;
  const band = score >= 70 ? 'mạnh' : score >= 40 ? 'vừa' : 'yếu';

  const intentRegex = /(mua|bán|giá|review|so sánh|học|khóa học|tốt nhất|dịch vụ|phần mềm|tự động|hướng dẫn|tool|đánh giá|cách làm|thương hiệu|nhập khẩu|phân phối|chính hãng|uy tín|chất lượng|buy|price|best|vs|compare|how to|course|software|service|guide|comparison)/i;
  const hasIntent = intentRegex.test(strongest.keyword);
  const firstReason = hasIntent
    ? `"${strongest.keyword}" có cụm từ ý định (intent) nổi bật thu hút ${formatNumber(strongest.totalViews)} lượt xem.`
    : `"${strongest.keyword}" ghi nhận mức độ quan tâm cao nhất (${formatNumber(strongest.totalViews)} views, ${strongest.mentionCount || 0} lượt nhắc).`;

  const why = [
    firstReason,
    `${bestSource ? `${bestSource.source} là nguồn có tín hiệu nổi bật nhất (${bestSource.count}).` : 'Chưa có nguồn nổi bật rõ ràng.'}`,
    `Market score hiện tại là ${overall.marketScore}/100, mức quan tâm ${overall.interestLevel}.`,
  ];
  
  const risk = score < 50
    ? 'Tín hiệu cơ hội còn sớm; chưa nên xem đây là nhu cầu thị trường lớn.'
    : 'Cơ hội có tín hiệu đáng chú ý nhưng vẫn cần kiểm chứng bằng dữ liệu theo intent mua/so sánh.';
  const nextMove = `Kiểm chứng thêm các truy vấn liên quan đến "${strongest.keyword}" như giá, review, so sánh, mua ở đâu và đối thủ trực tiếp.`;
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

function CopyButton({ getText, label }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    const text = typeof getText === 'function' ? getText() : getText
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handle} className="copy-btn" title={`Sao chép ${label ?? ''}`} aria-label={`Sao chép ${label ?? ''}`}>
      {copied ? '✓' : '⎘'}
    </button>
  )
}

function InsightSection({ title, badge, children, getCopyText, isLocked }) {
  const navigate = useNavigate()
  return (
    <section className="card prompt-insight-card" style={{ position: 'relative' }}>
      <div className="prompt-insight-head">
        <div>
          <span className="prompt-insight-badge">{badge}</span>
          <h3>{title}</h3>
        </div>
        {getCopyText && !isLocked && <CopyButton getText={getCopyText} label={title} />}
      </div>
      <div style={isLocked ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' } : {}}>
        {children}
      </div>
      {isLocked && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 10,
          padding: '24px',
          textAlign: 'center',
          borderRadius: '12px'
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg, #ffffff)',
            padding: '24px 32px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color, #e5e7eb)',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '28px' }}>🔒</span>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Mở khóa phân tích sâu AI
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Đăng nhập tài khoản (Miễn phí) để xem đánh giá chi tiết thị trường, tiềm năng cơ hội và gợi ý từ AI.
            </p>
            <Button
              onClick={() => navigate(ROUTES.LOGIN + `?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
              variant="primary"
              size="sm"
              style={{ marginTop: '8px', width: '100%', fontWeight: 600 }}
            >
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

export function AnalysisPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword')?.trim() || ''
  const [draftKeyword, setDraftKeyword] = useState('')
  const searchInputRef = useRef(null)

  const [data, setData] = useState(null)
  const [evidenceItems, setEvidenceItems] = useState([])
  const [timelinePoints, setTimelinePoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [streamProgress, setStreamProgress] = useState(0)
  const [_cacheInfo, setCacheInfo] = useState(null)

  const copyToClipboard = useCallback((text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Đã sao chép ${label ?? 'nội dung'}`)
    }).catch(() => {
      toast.error('Không thể sao chép — vui lòng thử lại')
    })
  }, [toast])

  // `/` shortcut focuses search input
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== '/') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])



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

            // Fetch timeline and evidence data asynchronously since streaming doesn't provide them
            Promise.all([
              appApi.getAnalysisTimeline(keyword).catch(() => []),
              appApi.getAnalysisEvidence(keyword).catch(() => [])
            ]).then(([timeline, evidence]) => {
              setTimelinePoints(timeline)
              setEvidenceItems(evidence)
            }).finally(() => setTimeout(() => setLoading(false), 300))
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

  // Watch for post-login auto-export query param
  useEffect(() => {
    if (isAuthenticated && !loading && overall.hasData && searchParams.get('export') === 'true') {
      const params = new URLSearchParams(window.location.search)
      params.delete('export')
      navigate(`${ROUTES.ANALYSIS}?${params.toString()}`, { replace: true })
      executeExport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading, overall.hasData, searchParams])


  const executeExport = async () => {
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
      
      const docHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Báo Cáo Phân Tích Thị Trường: ${keyword}</title>
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
    .kpi-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .kpi-table th {
      background-color: #ebf8ff;
      color: #2b6cb0;
      font-weight: bold;
      text-align: left;
      padding: 10px;
      border: 1px solid #bee3f8;
      font-size: 10.5pt;
    }
    .kpi-table td {
      padding: 10px;
      border: 1px solid #e2e8f0;
      font-size: 11pt;
    }
    .verdict-box {
      background-color: #f7fafc;
      border-left: 4px solid #3182ce;
      padding: 15px;
      margin-bottom: 25px;
      border-radius: 4px;
    }
    .verdict-box p {
      margin: 0;
      font-size: 11.5pt;
      font-style: italic;
      color: #2d3748;
    }
    .trend-row {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #edf2f7;
    }
    .keyword-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .keyword-table th {
      background-color: #f7fafc;
      color: #4a5568;
      font-weight: bold;
      text-align: left;
      padding: 8px;
      border: 1px solid #e2e8f0;
      font-size: 10.5pt;
    }
    .keyword-table td {
      padding: 8px;
      border: 1px solid #e2e8f0;
      font-size: 10.5pt;
    }
    .evidence-item {
      margin-bottom: 15px;
      padding: 10px;
      background-color: #fff;
      border: 1px solid #edf2f7;
      border-radius: 4px;
    }
    .evidence-title {
      font-weight: bold;
      color: #2b6cb0;
      text-decoration: none;
    }
    .evidence-meta {
      font-size: 9.5pt;
      color: #718096;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <h1>Báo Cáo Phân Tích Thị Trường</h1>
  <table class="meta-table">
    <tr>
      <td style="width: 50%;"><strong>Từ khóa nghiên cứu:</strong> ${keyword}</td>
      <td style="width: 50%; text-align: right;"><strong>Ngày xuất báo cáo:</strong> ${new Date().toLocaleDateString('vi-VN')}</td>
    </tr>
  </table>
  
  <div class="divider"></div>
  
  <h2>1. Tóm Tắt Chỉ Số Thị Trường (KPIs)</h2>
  <table class="kpi-table">
    <thead>
      <tr>
        <th style="width: 30%;">Chỉ Số</th>
        <th style="width: 30%;">Giá Trị Phân Tích</th>
        <th style="width: 40%;">Ý Nghĩa</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Trạng Thái Thị Trường</strong></td>
        <td><span style="color: ${overall.marketState === 'tăng trưởng' ? '#2f855a' : overall.marketState === 'giảm sút' ? '#c53030' : '#d69e2e'}; font-weight: bold;">Thị trường đang ${overall.marketState}</span></td>
        <td>Đánh giá chiều hướng phát triển hiện tại của từ khóa.</td>
      </tr>
      <tr>
        <td><strong>Mức Độ Quan Tâm</strong></td>
        <td><strong>${overall.isOffline ? 'N/A' : overall.interestLevel.toUpperCase()}</strong></td>
        <td>Mức độ thảo luận và tìm kiếm trên các kênh truyền thông.</td>
      </tr>
      <tr>
        <td><strong>Điểm Thị Trường (Market Score)</strong></td>
        <td><strong>${overall.isOffline ? 'N/A' : `${overall.marketScore}/100`}</strong></td>
        <td>Điểm số tổng hợp năng lực thị trường từ tương tác và lượt xem.</td>
      </tr>
      <tr>
        <td><strong>Tỷ Lệ Bao Phủ (Coverage)</strong></td>
        <td><strong>${Number(overall.coverage)}%</strong></td>
        <td>Mức độ phong phú thông tin từ các kênh nguồn thu thập được.</td>
      </tr>
      <tr>
        <td><strong>Tương Tác Trung Bình (Engagement)</strong></td>
        <td><strong>${overall.isOffline ? 'N/A' : pct(overall.avgEngagement)}</strong></td>
        <td>Tỷ lệ tương tác bình quân (Likes, Comments / Views).</td>
      </tr>
    </tbody>
  </table>

  <div class="verdict-box">
    <p>Thị trường cho từ khóa "${keyword}" đang ở trạng thái <strong>${overall.marketState}</strong>. ${overall.isOffline ? 'Số liệu lượt xem và bình luận không khả dụng do hệ thống đang hoạt động ngoại tuyến.' : `Độ tin cậy dữ liệu đạt mức <strong>${overall.confidenceBand} (${overall.confidenceScore}/100)</strong>, dựa trên tỷ lệ bao phủ <strong>${Number(overall.coverage)}%</strong> với <strong>${overall.sourceCount}</strong> nguồn thông tin chính thức và <strong>${formatNumber(overall.totalComments)}</strong> lượt bình luận được ghi nhận và phân tích.`}</p>
  </div>

  <h2>2. Tổng Quan Xu Hướng Theo Kênh Nguồn</h2>
  <div>
    ${sourceRows.map(row => `
      <div class="trend-row">
        <p style="margin: 0 0 4px;"><strong>${row.source}</strong> (${row.count} tín hiệu nguồn | Xu hướng: <span style="font-weight: bold; color: ${row.direction === 'tăng' ? '#2f855a' : row.direction === 'giảm' ? '#c53030' : '#2d3748'}">${directionLabel(row.direction)}</span>)</p>
        <p style="margin: 0; color: #4a5568; font-size: 10pt;">${row.summary}</p>
      </div>
    `).join('')}
  </div>

  <h2>3. Phân Tích Cụm Từ Khóa Liên Quan</h2>
  <table class="keyword-table">
    <thead>
      <tr>
        <th>Cụm Từ Khóa</th>
        <th>Lượt Nhắc (Mentions)</th>
        <th>Lượt Xem (Views)</th>
        <th>Điểm Cảm Xúc (Sentiment)</th>
      </tr>
    </thead>
    <tbody>
      ${(data?.relatedKeywords ?? []).slice(0, 10).map(k => `
        <tr>
          <td><strong>${k.keyword}</strong></td>
          <td>${overall.isOffline ? 'N/A' : (k.mentionCount || 0)}</td>
          <td>${overall.isOffline ? 'N/A' : formatNumber(k.totalViews)}</td>
          <td>${k.sentimentScore || 0}/100</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>4. Bằng Chứng & Nguồn Tin Thị Trường</h2>
  <div>
    ${evidenceItems.map(ev => `
      <div class="evidence-item">
        <p style="margin: 0;"><span style="background-color: #edf2f7; padding: 2px 6px; border-radius: 3px; font-size: 9pt; font-weight: bold; color: #4a5568; margin-right: 8px;">${canonicalSource(ev.source)}</span> <a href="${ev.url || '#'}" class="evidence-title" target="_blank">${ev.title}</a></p>
        <p class="evidence-meta">Đường dẫn: ${ev.url || 'Không có liên kết trực tiếp'} | Tín hiệu: ${ev.signal || 'N/A'}</p>
      </div>
    `).join('')}
  </div>
  
  <div style="margin-top: 50px; text-align: center; font-size: 9pt; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    Báo cáo được tạo tự động bởi hệ thống SkimAI — Trợ lý Nghiên Cứu Thị Trường Thông Minh
  </div>
</body>
</html>
      `.trim();
      
      const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${keyword}_Market_Report.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert("Xuất báo cáo thành công! File báo cáo Word (.doc) đã được tải về và lưu vào Dashboard.");
    } catch (e) {
      alert("Lỗi khi xuất báo cáo: " + e.message);
    } finally {
      setIsExporting(false);
    }
  }

  const handleExport = () => {
    if (!isAuthenticated) {
      const fromUrl = window.location.pathname + window.location.search + '&export=true'
      navigate(ROUTES.LOGIN, { state: { from: fromUrl } })
      return
    }
    executeExport()
  }


  if (!keyword) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Page header */}
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>Phân tích</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Nhập từ khóa để tổng hợp insight thị trường</div>
        </div>

        {/* Main search card */}
        <div style={{ background: 'var(--dark)', borderRadius: 'var(--radius-xl)', padding: '28px 30px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>
            Nhập từ khóa nghiên cứu
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 'var(--radius-md)', padding: '6px 6px 6px 16px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              ref={searchInputRef}
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const kw = draftKeyword.trim()
                  if (kw) navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(kw)}`)
                }
              }}
              placeholder='phở, xe máy điện, AI agent... (bấm / để focus)'
              style={{ flex: 1, border: 'none', outline: 'none', font: 'inherit', fontSize: 14, color: '#fff', background: 'transparent', padding: '8px 0' }}
            />
            <button
              onClick={() => {
                const kw = draftKeyword.trim()
                if (kw) navigate(`${ROUTES.ANALYSIS}?keyword=${encodeURIComponent(kw)}`)
              }}
              style={{ padding: '10px 24px', background: '#fff', color: 'var(--dark)', border: 'none', borderRadius: 8, font: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Phân tích →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['xe máy điện', 'skincare nội địa', 'TikTok Shop', 'F&B 2025'].map(kw => (
              <button
                key={kw}
                onClick={() => { setDraftKeyword(kw); searchInputRef.current?.focus() }}
                style={{ border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.07)', cursor: 'pointer', font: 'inherit', fontSize: 12, color: 'rgba(255,255,255,.75)', padding: '4px 12px', borderRadius: 99 }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div style={{ background: 'var(--sur)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '20px 24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Tư khóa theo dõi</span>
            <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-muted)' }}>Chưa chọn</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Xu hướng nguồn', 'Độ quan tâm tổng thể', 'Kênh tiếp cận'].map(label => (
              <span key={label} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                {label}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, marginBottom: 0 }}>
            Trang sẽ chỉ đưa ra nhận định dựa trên dữ liệu thu thập được. Nếu thiếu dữ liệu, hệ thống sẽ ghi rõ mục không thể đánh giá.
          </p>
        </div>
      </div>
    )
  }

  if (loading && !data) return <AnalysisSkeleton />

  return (
    <div className="analysis-shell page-wrap">
      <style>{`
        .tooltip-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: help;
        }
        .tooltip-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #4b5563;
          font-size: 10px;
          font-weight: bold;
          font-style: normal;
          transition: all 0.2s ease;
          text-transform: none !important;
          letter-spacing: normal !important;
          margin-left: 4px;
        }
        .tooltip-container:hover .tooltip-icon {
          background: #3b82f6;
          color: #ffffff;
        }
        .tooltip-text {
          visibility: hidden;
          width: 240px;
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          text-align: left;
          border-radius: 6px;
          padding: 8px 12px;
          position: absolute;
          z-index: 100;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          font-size: 12px;
          line-height: 1.4;
          font-weight: normal;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          pointer-events: none;
          white-space: normal;
          text-transform: none !important;
          letter-spacing: normal !important;
        }
        .tooltip-text::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
        }
      `}</style>
      <section className="analysis-suite-hero card">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>
            Phân tích thị trường
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(18px,2vw,22px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {keyword}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, background: researchGuard?.canProceed === false ? 'rgba(239,68,68,.2)' : 'rgba(13,148,136,.25)', color: researchGuard?.canProceed === false ? '#FCA5A5' : '#5EEAD4', padding: '3px 10px', borderRadius: 99 }}>
              {researchGuard?.canProceed === false ? '⚠ Hạn chế' : '✓ Đủ dữ liệu'}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
              {loading ? 'Đang phân tích...' : 'Vừa cập nhật'}
            </span>
          </div>
          <div className="analysis-module-strip">
            <span className="analysis-module-chip">Xu hướng</span>
            <span className="analysis-module-chip">Đánh giá tổng thể</span>
            <span className="analysis-module-chip">Tiềm năng</span>
            <span className="analysis-module-chip">Kênh đề xuất</span>
          </div>
        </div>

        <div className="analysis-suite-meta">
          {[
            { label: 'Độ phủ nguồn', value: `${data?.dataQuality?.evidenceCoveragePct ?? 0}%` },
            { label: 'Nguồn dữ liệu', value: `${(data?.dataSources ?? []).length}` },
          ].map(s => (
            <div key={s.label} className="analysis-meta-stat">
              <div className="analysis-suite-meta-label">{s.label}</div>
              <strong>{s.value}</strong>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {canRunDeepInsight ? (
              <Link to={`${ROUTES.DEEP_INSIGHT}?keyword=${encodeURIComponent(keyword)}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: 12.5, fontWeight: 700 }}>
                <span>AI</span> Phân tích chuyên sâu
              </Link>
            ) : (
              <button disabled style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)', borderRadius: 'var(--radius-md)', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'not-allowed' }}
                title={researchGuard?.message || 'Tối ưu từ khóa để mở khóa phân tích chuyên sâu'}>
                <span>AI</span> Phân tích chuyên sâu
              </button>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="secondary" className="btn-sm" onClick={handleExport} disabled={isExporting || loading} style={{ flex: 1 }}>
                {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
              </Button>
              <Button onClick={load} disabled={loading} className="btn-sm" style={{ flex: 1 }}>
                {loading ? '...' : 'Làm mới'}
              </Button>
            </div>
          </div>
        </div>
      </section>

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



      <div className="prompt-summary-grid">
        <section className="card prompt-summary-card">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Trạng thái thị trường
            <span className="tooltip-container">
              <span className="tooltip-icon">!</span>
              <span className="tooltip-text">
                {overall.isOffline
                  ? "Trạng thái thị trường dựa trên nguồn lưu trữ ngoại tuyến."
                  : (overall.hasData
                    ? `Xu hướng các thảo luận: ${overall.upCount} nguồn tăng, ${overall.downCount} nguồn giảm, ${overall.stableCount} nguồn ổn định. ${overall.stateReason}`
                    : "Được tính bằng cách so sánh tổng số nguồn tin có xu hướng Tăng và Giảm. Nếu số nguồn Tăng nhiều hơn Giảm, thị trường được coi là Tăng trưởng."
                  )
                }
              </span>
            </span>
          </span>
          <strong style={{
            textTransform: 'uppercase',
            color: (overall.hasData && !overall.isOffline)
              ? (overall.marketState?.toLowerCase() === 'tăng trưởng' ? 'var(--green)' : overall.marketState?.toLowerCase() === 'giảm sút' ? 'var(--red)' : '#f59e0b') 
              : 'var(--text-muted)'
          }}>
            {overall.hasData ? overall.marketState : 'chưa đủ dữ liệu'}
          </strong>
        </section>
        <section className="card prompt-summary-card">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Mức quan tâm
            <span className="tooltip-container">
              <span className="tooltip-icon">!</span>
              <span className="tooltip-text">
                {overall.isOffline
                  ? "Số liệu không khả dụng do hệ thống đang hoạt động ở chế độ ngoại tuyến (Offline)."
                  : (overall.hasData
                    ? `Market Score đạt ${overall.marketScore}/100. Đánh giá từ ${formatNumber(overall.totalViews)} views, ${formatNumber(overall.totalComments)} bình luận, và ${overall.totalMentions} lượt nhắc từ khóa.`
                    : "Dựa trên điểm số Market Score (0-100), tổng hợp từ lượt xem, bình luận, tỷ lệ tương tác và độ đa dạng nguồn tin của từ khóa liên quan."
                  )
                }
              </span>
            </span>
          </span>
          <strong style={{
            textTransform: 'uppercase',
            color: (overall.hasData && !overall.isOffline)
              ? (overall.interestLevel?.toLowerCase() === 'cao' ? 'var(--green)' : overall.interestLevel?.toLowerCase() === 'thấp' ? 'var(--red)' : '#f59e0b') 
              : 'var(--text-muted)'
          }}>
            {overall.isOffline ? 'N/A' : (overall.hasData ? overall.interestLevel : 'chưa đủ dữ liệu')}
          </strong>
        </section>
        <section className="card prompt-summary-card">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Bằng chứng
            <span className="tooltip-container">
              <span className="tooltip-icon">!</span>
              <span className="tooltip-text">
                {overall.isOffline
                  ? `Độ phủ dữ liệu đạt ${overall.coverage}%. Thu thập trực tiếp từ ${overall.sourceCount} kênh nguồn ngoại tuyến.`
                  : (overall.hasData
                    ? `Độ phủ dữ liệu đạt ${overall.coverage}%. Thu thập trực tiếp từ ${overall.sourceCount} kênh nguồn và ${overall.totalKeywords} cụm từ khóa.`
                    : "Tỷ lệ bao phủ thông tin (Evidence Coverage) đo lường mức độ phong phú và đầy đủ của dữ liệu thu thập được từ các nguồn so với từ khóa tìm kiếm."
                  )
                }
              </span>
            </span>
          </span>
          <strong><AnimatedNumber value={Number(overall.coverage)} />%</strong>
        </section>
        <section className="card prompt-summary-card">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Tương tác TB
            <span className="tooltip-container">
              <span className="tooltip-icon">!</span>
              <span className="tooltip-text">
                {overall.isOffline
                  ? "Số liệu không khả dụng do hệ thống đang hoạt động ở chế độ ngoại tuyến (Offline)."
                  : (overall.hasData
                    ? `Tương tác bình quân đạt ${pct(overall.avgEngagement)}. Tính dựa trên các chỉ số tương tác (like, comment, share / views) từ ${overall.totalKeywords} cụm từ khóa.`
                    : "Tỷ lệ tương tác trung bình (Likes + Comments / Views) của 6 cụm từ khóa liên quan nổi bật nhất thu thập được từ các bài đăng."
                  )
                }
              </span>
            </span>
          </span>
          {overall.isOffline ? (
            <strong>N/A</strong>
          ) : (
            <strong><AnimatedNumber value={overall.avgEngagement * 100} format={(v) => v.toFixed(2)} />%</strong>
          )}
        </section>
      </div>

      <InsightSection title="Tổng quan xu hướng" badge="01" getCopyText={() => sourceRows.map(r => `${r.source}: ${r.direction} — ${r.summary}`).join('\n')}>
        <div className="source-trend-list">
          {sourceRows.length ? sourceRows.map((row) => (
            <div className="source-trend-row" key={row.source}>
              <div>
                <strong>{row.source}</strong>
                <p>{row.summary}</p>
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

      <InsightSection title="Đánh giá tổng thể" badge="02" isLocked={!isAuthenticated} getCopyText={() => `Trạng thái: ${overall.marketState}\nĐiểm: ${overall.marketScore}/100\nMức quan tâm: ${overall.interestLevel}\nĐộ phủ: ${overall.coverage}%\n\nBằng chứng:\n${overall.evidenceReasons.join('\n')}`}>
        <div className="decision-grid">
          <div className="decision-score-card">
            <span className="decision-label">Điểm thị trường</span>
            <strong>{overall.isOffline ? 'N/A' : (overall.hasData ? <><AnimatedNumber value={overall.marketScore} />/100</> : 'N/A')}</strong>
            <div className="score-track">
              <div className="score-fill" style={{ width: `${(overall.hasData && !overall.isOffline) ? overall.marketScore : 0}%` }} />
            </div>
            <p>{overall.isOffline ? 'Không khả dụng (Chế độ offline)' : (overall.hasData ? `Mức quan tâm: ${overall.interestLevel}` : noDataFor('mức độ quan tâm hiện tại'))}</p>
          </div>
          <div className="decision-verdict">
            <span className="decision-label">Đánh giá chung</span>
            <h4>{overall.isOffline ? 'Không khả dụng (Chế độ offline)' : (overall.hasData ? `Thị trường đang ${overall.marketState}` : noDataFor('đánh giá tổng thể'))}</h4>
            <p>
              {overall.isOffline
                ? 'Dữ liệu tương tác và lượt xem không khả dụng ở chế độ ngoại tuyến.'
                : (overall.hasData
                  ? `Độ tin cậy ở mức ${overall.confidenceBand} (${overall.confidenceScore}/100), dựa trên độ phủ ${Number(overall.coverage)}%, ${overall.sourceCount} nguồn và ${formatNumber(overall.totalComments)} bình luận.`
                  : noDataFor('độ tin cậy'))}
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

      <InsightSection title="Tiềm năng thị trường" badge="03" isLocked={!isAuthenticated} getCopyText={() => overall.isOffline ? 'Dữ liệu không khả dụng ở chế độ offline.' : `Điểm cơ hội: ${opportunityRead.score}/100 (${opportunityRead.band})\n${opportunityRead.title}\n${opportunityRead.risk}\n\nHành động đề xuất: ${opportunityRead.nextMove}`}>
        <div className="decision-grid">
          <div className="decision-score-card opportunity-score">
            <span className="decision-label">Điểm cơ hội</span>
            <strong>{overall.isOffline ? 'N/A' : `${opportunityRead.score}/100`}</strong>
            <div className="score-track">
              <div className="score-fill" style={{ width: `${overall.isOffline ? 0 : opportunityRead.score}%` }} />
            </div>
            <p>Độ mạnh tín hiệu: {overall.isOffline ? 'không khả dụng' : opportunityRead.band}</p>
          </div>
          <div className="decision-verdict">
            <span className="decision-label">Cơ hội tốt nhất</span>
            <h4>{opportunityRead.title}</h4>
            <p>{opportunityRead.risk}</p>
          </div>
        </div>
        <div className="decision-detail-grid">
          <div>
            <div className="analysis-subsection-title">Ý nghĩa</div>
            <ul className="prompt-bullet-list">
              {opportunityRead.why.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="analysis-subsection-title">Hành động đề xuất tiếp theo</div>
            <p className="prompt-main-text">{opportunityRead.nextMove}</p>
          </div>
        </div>
        {topKeywords.length && !overall.isOffline ? (
          <div className="metric-bar-wrap" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Từ khóa nổi bật
            </div>
            {(() => {
              const maxMentions = Math.max(...topKeywords.map(k => k.mentionCount ?? 1), 1)
              return topKeywords.map((item, i) => (
                <div key={item.keyword} className="metric-bar-row">
                  <span className="metric-bar-label">{item.keyword}</span>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill metric-bar-fill-primary"
                      style={{ width: `${Math.round(((item.mentionCount ?? 1) / maxMentions) * 100)}%`, opacity: 1 - i * 0.12 }}
                    />
                  </div>
                  <span className="metric-bar-value">{item.mentionCount ?? 1}</span>
                </div>
              ))
            })()}
          </div>
        ) : null}
      </InsightSection>

      <InsightSection title="Kênh tiếp cận đề xuất" badge="04" isLocked={!isAuthenticated} getCopyText={() => channelRecommendation}>
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
              <div className="card-title">Kiểm định Từ khóa</div>
              <p className="hint">{researchGuard.message}</p>
            </div>
            <div className="guard-score">{researchGuard.intentScore}/100</div>
          </div>
          <div className="grid grid-2">
            <div className="opportunity-item">
              <strong>Trạng thái: {researchGuard.status}</strong>
              <p className="hint">
                {canRunDeepInsight
                  ? 'Từ khóa này hợp lệ để phân tích thị trường và phân tích chuyên sâu.'
                  : 'Phân tích chuyên sâu tạm thời bị khóa cho đến khi độ rõ của từ khóa được cải thiện.'}
              </p>
            </div>
            <div className="opportunity-item">
              <strong>Từ khóa gợi ý</strong>
              <p className="hint">{(researchGuard.suggestedKeywords ?? []).slice(0, 5).join(' | ')}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="card" style={{ position: 'relative' }}>
        <div className="analysis-section-heading">
          <div>
            <div className="card-title">Bằng chứng đầu vào</div>
            <p className="hint">Chỉ hiển thị để kiểm tra nguồn; các nhận định trên không bổ sung kiến thức ngoài dữ liệu này.</p>
          </div>
        </div>
        <div className="stack" style={!isAuthenticated ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' } : {}}>
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
        {!isAuthenticated && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 10,
            padding: '24px',
            textAlign: 'center',
            borderRadius: '12px'
          }}>
            <div style={{
              backgroundColor: 'var(--card-bg, #ffffff)',
              padding: '24px 32px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--border-color, #e5e7eb)',
              maxWidth: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '28px' }}>🔒</span>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Mở khóa danh sách bằng chứng
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Đăng nhập tài khoản (Miễn phí) để xem nguồn tin chi tiết và dữ liệu cào của các bằng chứng thị trường.
              </p>
              <Button
                onClick={() => navigate(ROUTES.LOGIN + `?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                variant="primary"
                size="sm"
                style={{ marginTop: '8px', width: '100%', fontWeight: 600 }}
              >
                Đăng nhập ngay
              </Button>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
