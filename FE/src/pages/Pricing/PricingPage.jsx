import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'
import { ROUTES } from '../../constants/routes'

const PLAN_DESC = {
  free:       'Dành cho cá nhân mới bắt đầu khám phá xu hướng thị trường.',
  starter:    'Phù hợp cho freelancer và team nhỏ cần insight định kỳ.',
  team:       'Tối ưu cho team marketing và product đang scale.',
  enterprise: 'Giải pháp toàn diện cho doanh nghiệp với nhu cầu không giới hạn.',
}

const POPULAR_IDS = ['team', 'TEAM']

const FAQ = [
  { q: 'Tôi có thể hủy gói bất cứ lúc nào không?', a: 'Có. Bạn có thể hủy bất cứ lúc nào mà không bị tính thêm phí. Quyền truy cập vẫn hoạt động đến hết chu kỳ thanh toán hiện tại.' },
  { q: 'Thanh toán hàng năm tiết kiệm bao nhiêu?', a: 'Chọn hàng năm giúp tiết kiệm khoảng 20% so với thanh toán hàng tháng. Badge "Tiết kiệm 20%" sẽ hiển thị khi bạn chuyển sang chu kỳ năm.' },
  { q: 'Dữ liệu của tôi có an toàn không?', a: 'Toàn bộ dữ liệu được mã hóa SSL và lưu trữ trên Supabase với tuân thủ tiêu chuẩn bảo mật quốc tế. Chúng tôi không bán dữ liệu người dùng.' },
  { q: 'Gói Enterprise có gì khác biệt?', a: 'Gói Enterprise bao gồm tìm kiếm và xuất báo cáo không giới hạn, API tích hợp, hỗ trợ ưu tiên và onboarding 1-1 cùng đội ngũ AISKIM.' },
  { q: 'Tôi có thể nâng cấp gói giữa chu kỳ không?', a: 'Có. Khi nâng cấp, hệ thống sẽ tính phần chênh lệch tương ứng với số ngày còn lại trong chu kỳ hiện tại.' },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(v => !v)}>
        {q}
        <span className={`faq-chevron ${open ? 'open' : ''}`}>▼</span>
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  )
}

export function PricingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const toast = useToast()

  const [cycle, setCycle] = useState('monthly')
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [submittingPlanId, setSubmittingPlanId] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [enterpriseForm, setEnterpriseForm] = useState({ contactName: '', workEmail: '', companyName: '', note: '' })
  const [showEnterpriseForm, setShowEnterpriseForm] = useState(false)
  const [showQrCodeModal, setShowQrCodeModal] = useState(false)
  const [qrDetails, setQrDetails] = useState(null)
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)

  const loadPricing = async () => {
    try {
      const nextPlans = await appApi.getPricing()
      setPlans(nextPlans)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPricing() }, [])

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus === 'cancelled') {
      toast.warn('Thanh toán đã bị hủy trước khi hoàn tất.')
      setSearchParams({}, { replace: true })
      return
    }

    if (paymentStatus === 'success' && sessionId) {
      ;(async () => {
        try {
          const result = await appApi.confirmPricing(sessionId)
          if (result.status === 'success') toast.success(result.message)
          else toast.info(result.message)
          await loadPricing()
        } catch (error) {
          toast.error(error.message || 'Không thể xác nhận thanh toán vào lúc này.')
        } finally {
          setSearchParams({}, { replace: true })
        }
      })()
    }
  }, [searchParams, setSearchParams])

  const handleCheckout = async (plan) => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: window.location.pathname } })
      return
    }
    if (plan.id === 'enterprise') { setShowEnterpriseForm(true); return }

    setSubmittingPlanId(plan.id)
    try {
      const result = await appApi.checkoutPricing({ planId: plan.id, billingCycle: cycle, provider: 'BANK' })
      if (result.status === 'success') {
        toast.success(result.message || 'Kích hoạt gói thành công!')
        await loadPricing()
        return
      }
      if (result.checkoutUrl?.startsWith('http') && !result.checkoutUrl.includes('img.vietqr.io')) {
        window.location.href = result.checkoutUrl
        return
      }
      setQrDetails({ provider: 'BANK', checkoutUrl: result.checkoutUrl, providerSessionId: result.providerSessionId, amount: result.amount, invoiceId: result.invoiceId })
      setSelectedPlanForPayment(plan)
      setShowQrCodeModal(true)
    } catch (error) {
      toast.error(error.message || 'Không thể hoàn tất thanh toán lúc này.')
    } finally {
      setSubmittingPlanId(null)
    }
  }

  const handleConfirmManualPayment = async () => {
    setIsCheckingPayment(true)
    setTimeout(async () => {
      try {
        const result = await appApi.confirmPricing(qrDetails.providerSessionId)
        if (result.status === 'success') {
          toast.success('Thanh toán thành công! Gói dịch vụ đã được kích hoạt.')
          await loadPricing()
        } else {
          toast.info(result.message)
        }
      } catch (error) {
        toast.error(error.message || 'Không thể xác nhận thanh toán lúc này.')
      } finally {
        setIsCheckingPayment(false)
        setShowQrCodeModal(false)
      }
    }, 2500)
  }

  const submitEnterpriseLead = async (event) => {
    event.preventDefault()
    setSubmittingPlanId('enterprise')
    try {
      const result = await appApi.contactSales({ planId: 'enterprise', billingCycle: cycle, ...enterpriseForm })
      toast.success(`${result.message} Lead ID: ${result.leadId}.`)
      setShowEnterpriseForm(false)
      setEnterpriseForm({ contactName: '', workEmail: '', companyName: '', note: '' })
    } catch (error) {
      toast.error(error.message || 'Không thể gửi yêu cầu tư vấn lúc này.')
    } finally {
      setSubmittingPlanId(null)
    }
  }

  const isPopular = (plan) => POPULAR_IDS.includes(plan.id) || POPULAR_IDS.includes(plan.id?.toUpperCase())

  return (
    <div className="stack page-wrap">
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.spinner-animation{animation:spin 1s linear infinite}`}</style>

      {/* Trust bar */}
      <div className="pricing-trust-bar">
        <div className="pricing-trust-item"><span className="pricing-trust-icon">🔒</span> Bảo mật SSL</div>
        <div className="pricing-trust-item"><span className="pricing-trust-icon">⚡</span> Kích hoạt ngay lập tức</div>
        <div className="pricing-trust-item"><span className="pricing-trust-icon">🔄</span> Hủy bất cứ lúc nào</div>
        <div className="pricing-trust-item"><span className="pricing-trust-icon">🇻🇳</span> Hỗ trợ tiếng Việt</div>
      </div>

      {/* Hero */}
      <div className="pricing-hero">
        <h1>Chọn gói phù hợp</h1>
        <p>Phân tích thị trường chuyên nghiệp cho mọi quy mô đội nhóm.</p>

        {/* Toggle */}
        <div className="pricing-toggle-wrap">
          <div className="segmented">
            <button className={cycle === 'monthly' ? 'on' : ''} onClick={() => setCycle('monthly')}>Hàng tháng</button>
            <button className={cycle === 'yearly' ? 'on' : ''} onClick={() => setCycle('yearly')}>Hàng năm</button>
          </div>
          {cycle === 'yearly' && <span className="pricing-saving-badge">Tiết kiệm ~20%</span>}
        </div>
      </div>

      {/* Enterprise form */}
      {showEnterpriseForm && (
        <Card title="Yêu cầu Tư vấn gói Doanh nghiệp" className="enterprise-sales-card">
          <form className="form form-wide" onSubmit={submitEnterpriseLead}>
            <div className="grid grid-2">
              <label className="field">
                <span>Tên người liên hệ</span>
                <input value={enterpriseForm.contactName} onChange={e => setEnterpriseForm(p => ({ ...p, contactName: e.target.value }))} placeholder="Nguyen Van A" required />
              </label>
              <label className="field">
                <span>Email công việc</span>
                <input type="email" value={enterpriseForm.workEmail} onChange={e => setEnterpriseForm(p => ({ ...p, workEmail: e.target.value }))} placeholder="team@company.com" required />
              </label>
            </div>
            <label className="field">
              <span>Tên công ty</span>
              <input value={enterpriseForm.companyName} onChange={e => setEnterpriseForm(p => ({ ...p, companyName: e.target.value }))} placeholder="AISKIM Labs" required />
            </label>
            <label className="field">
              <span>Ghi chú (tùy chọn)</span>
              <textarea rows="3" value={enterpriseForm.note} onChange={e => setEnterpriseForm(p => ({ ...p, note: e.target.value }))} placeholder="Mô tả nhu cầu, số lượng thành viên, thời gian triển khai..." />
            </label>
            <div className="enterprise-sales-actions">
              <Button type="button" variant="secondary" onClick={() => setShowEnterpriseForm(false)} disabled={submittingPlanId === 'enterprise'}>Hủy</Button>
              <Button type="submit" disabled={submittingPlanId === 'enterprise'}>{submittingPlanId === 'enterprise' ? 'Đang gửi...' : 'Gửi yêu cầu'}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Plans grid */}
      {loading ? (
        <div className="pricing-grid">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="pricing-card" style={{ minHeight: 380 }}>
              <div className="skeleton" style={{ height: 12, width: 80, borderRadius: 6, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 44, width: 120, borderRadius: 8, marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 13, width: '90%', borderRadius: 6, marginBottom: 24 }} />
              {[0,1,2,3].map(j => <div key={j} className="skeleton" style={{ height: 13, width: `${85 - j * 8}%`, borderRadius: 6, marginBottom: 10 }} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="pricing-grid">
          {plans.map(plan => {
            const popular = isPopular(plan)
            return (
              <div key={plan.id} className={`pricing-card ${popular ? 'pricing-card-popular' : ''}`}>
                {popular && <div className="pricing-popular-badge">⭐ Phổ biến nhất</div>}

                <div className="pricing-plan-name">{plan.name?.toUpperCase?.() ?? plan.id}</div>

                {plan.current && (
                  <div className="pricing-current-badge">✓ Gói hiện tại của bạn</div>
                )}

                <div className="pricing-price-row">
                  <span className="pricing-price-amount">{plan[cycle]}</span>
                  {plan[cycle] !== 'Liên hệ' && plan[cycle] !== '0' && (
                    <span className="pricing-price-unit">$</span>
                  )}
                </div>
                <div className="pricing-price-period">
                  {plan[cycle] === '0' || plan[cycle] === 0 ? 'Miễn phí mãi mãi'
                    : plan[cycle] === 'Liên hệ' ? 'Báo giá theo nhu cầu'
                    : `/ ${cycle === 'monthly' ? 'tháng' : 'năm'}`}
                </div>

                <p className="pricing-desc">
                  {plan.description || PLAN_DESC[plan.id?.toLowerCase()] || ''}
                </p>

                <ul className="pricing-features">
                  {(plan.features ?? []).map(feature => (
                    <li key={feature} className="pricing-feature-item">
                      <span className="pricing-check">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`pricing-cta ${popular ? 'pricing-cta-popular' : ''}`}
                  onClick={() => handleCheckout(plan)}
                  disabled={Boolean(submittingPlanId) || (plan.current && plan.id === 'free')}
                >
                  {submittingPlanId === plan.id ? 'Đang xử lý...'
                    : plan.current && plan.id === 'free' ? 'Đang dùng'
                    : plan.current ? 'Gia hạn'
                    : plan.id === 'enterprise' ? 'Liên hệ tư vấn'
                    : 'Bắt đầu ngay'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* FAQ */}
      <div className="pricing-faq">
        <h2>Câu hỏi thường gặp</h2>
        {FAQ.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
      </div>

      {/* QR Modal */}
      {showQrCodeModal && qrDetails && (
        <div className="upgrade-modal-overlay">
          <div className="upgrade-modal" style={{ width: 500, padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, textAlign: 'center', letterSpacing: '-0.02em' }}>Quét mã QR để thanh toán</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 20 }}>
              Gói dịch vụ kích hoạt tự động ngay sau khi chuyển khoản thành công.
            </p>

            {isCheckingPayment ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 16 }}>
                <div className="spinner-animation" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: 15 }}>Đang đối soát giao dịch...</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>Vui lòng chờ trong giây lát.</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ padding: 12, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', width: 240, height: 240, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src={qrDetails.checkoutUrl} alt="QR thanh toán" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '100%', background: 'var(--gray-50)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 14, fontSize: 13, display: 'grid', gap: 8 }}>
                  {[
                    ['Kênh thanh toán', `Ngân hàng ${qrDetails.bankId || 'MB Bank'}`],
                    ['Chủ tài khoản', qrDetails.bankAccountName || 'SKIMAI LABS'],
                    ['Số tài khoản', qrDetails.bankAccountNo || '0868222999'],
                    ['Số tiền', qrDetails.amount || `${(selectedPlanForPayment?.[cycle] * 25000).toLocaleString('vi-VN')} đ`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}:</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Nội dung CK:</span>
                    <strong style={{ color: 'var(--red)', letterSpacing: '0.04em' }}>SKIMAI {qrDetails.providerSessionId?.substring(0, 8)}</strong>
                  </div>
                </div>
                <div style={{ fontSize: 11, textAlign: 'center', background: '#fff7ed', color: '#c2410c', padding: '8px 12px', borderRadius: 8, width: '100%', border: '1px solid #fed7aa' }}>
                  ⚠️ Nhập đúng nội dung chuyển khoản để gói được kích hoạt tự động.
                </div>
              </div>
            )}

            <div className="upgrade-modal-actions" style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
              <Button variant="secondary" onClick={() => setShowQrCodeModal(false)} disabled={isCheckingPayment}>Hủy bỏ</Button>
              <Button variant="primary" onClick={handleConfirmManualPayment} disabled={isCheckingPayment}>Tôi đã chuyển khoản</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
