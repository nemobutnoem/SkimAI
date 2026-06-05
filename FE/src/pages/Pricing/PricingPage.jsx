import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

export function PricingPage() {
  const [cycle, setCycle] = useState('monthly')
  const [plans, setPlans] = useState([])
  const [submittingPlanId, setSubmittingPlanId] = useState(null)
  const [notice, setNotice] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [enterpriseForm, setEnterpriseForm] = useState({
    contactName: '',
    workEmail: '',
    companyName: '',
    teamSize: '',
    note: '',
  })
  const [showEnterpriseForm, setShowEnterpriseForm] = useState(false)

  // Payment states
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null)
  const [showQrCodeModal, setShowQrCodeModal] = useState(false)
  const [qrDetails, setQrDetails] = useState(null)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)

  const loadPricing = async () => {
    const nextPlans = await appApi.getPricing()
    setPlans(nextPlans)
  }

  useEffect(() => {
    loadPricing()
  }, [])

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus === 'cancelled') {
      setNotice({ tone: 'error', text: 'Thanh toán đã bị hủy trước khi hoàn tất.' })
      setSearchParams({}, { replace: true })
      return
    }

    if (paymentStatus === 'success' && sessionId) {
      ;(async () => {
        try {
          const result = await appApi.confirmPricing(sessionId)
          setNotice({ tone: result.status === 'success' ? 'success' : 'info', text: result.message })
          await loadPricing()
        } catch (error) {
          setNotice({ tone: 'error', text: error.message || 'Không thể xác nhận thanh toán vào lúc này.' })
        } finally {
          setSearchParams({}, { replace: true })
        }
      })()
    }
  }, [searchParams, setSearchParams])

  const handleCheckout = async (plan) => {
    if (plan.id === 'enterprise') {
      setShowEnterpriseForm(true)
      return
    }
    setSelectedPlanForPayment(plan)
    setShowPaymentMethodModal(true)
  }

  const executePaymentCheckout = async (provider) => {
    setShowPaymentMethodModal(false)
    setSubmittingPlanId(selectedPlanForPayment.id)
    try {
      const result = await appApi.checkoutPricing({
        planId: selectedPlanForPayment.id,
        billingCycle: cycle,
        provider
      })
      
      if (result.checkoutUrl && result.checkoutUrl.startsWith('http') && !result.checkoutUrl.includes('img.vietqr.io')) {
        window.location.href = result.checkoutUrl
        return
      }

      setQrDetails({
        provider,
        checkoutUrl: result.checkoutUrl,
        providerSessionId: result.providerSessionId,
        amount: result.amount,
        invoiceId: result.invoiceId
      })
      setShowQrCodeModal(true)
    } catch (error) {
      setNotice({ tone: 'error', text: error.message || 'Không thể hoàn tất thanh toán lúc này.' })
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
          setNotice({ tone: 'success', text: 'Thanh toán thành công! Gói dịch vụ của bạn đã được nâng cấp tự động.' })
          await loadPricing()
        } else {
          setNotice({ tone: 'info', text: result.message })
        }
      } catch (error) {
        setNotice({ tone: 'error', text: error.message || 'Không thể xác nhận thanh toán lúc này.' })
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
      const result = await appApi.contactSales({
        planId: 'enterprise',
        billingCycle: cycle,
        ...enterpriseForm,
        teamSize: enterpriseForm.teamSize ? Number(enterpriseForm.teamSize) : null,
      })
      setNotice({
        tone: 'success',
        text: `${result.message} Lead reference: ${result.leadId}.`,
      })
      setShowEnterpriseForm(false)
      setEnterpriseForm({
        contactName: '',
        workEmail: '',
        companyName: '',
        teamSize: '',
        note: '',
      })
    } catch (error) {
      setNotice({ tone: 'error', text: error.message || 'Không thể gửi yêu cầu tư vấn lúc này.' })
    } finally {
      setSubmittingPlanId(null)
    }
  }

  return (
    <div className="stack page-wrap">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Bảng giá</h1>
          <p className="hint">Chọn gói AISKIM phù hợp để phân tích thị trường ở mọi quy mô.</p>
        </div>
        <div className="segmented">
          <button className={cycle === 'monthly' ? 'on' : ''} onClick={() => setCycle('monthly')}>
            Hàng tháng
          </button>
          <button className={cycle === 'yearly' ? 'on' : ''} onClick={() => setCycle('yearly')}>
            Hàng năm
          </button>
        </div>
      </div>

      {notice ? (
        <div className={`inline-notice inline-notice-${notice.tone}`}>
          {notice.text}
        </div>
      ) : null}

      {showEnterpriseForm ? (
        <Card title="Yêu cầu Tư vấn gói Doanh nghiệp" className="enterprise-sales-card">
          <form className="form form-wide" onSubmit={submitEnterpriseLead}>
            <div className="grid grid-2">
              <label className="field">
                <span>Tên người liên hệ</span>
                <input
                  value={enterpriseForm.contactName}
                  onChange={(event) => setEnterpriseForm((prev) => ({ ...prev, contactName: event.target.value }))}
                  placeholder="Nguyen Van A"
                  required
                />
              </label>
              <label className="field">
                <span>Email công việc</span>
                <input
                  type="email"
                  value={enterpriseForm.workEmail}
                  onChange={(event) => setEnterpriseForm((prev) => ({ ...prev, workEmail: event.target.value }))}
                  placeholder="team@company.com"
                  required
                />
              </label>
            </div>

            <div className="grid grid-2">
              <label className="field">
                <span>Tên công ty</span>
                <input
                  value={enterpriseForm.companyName}
                  onChange={(event) => setEnterpriseForm((prev) => ({ ...prev, companyName: event.target.value }))}
                  placeholder="AISKIM Labs"
                  required
                />
              </label>
              <label className="field">
                <span>Số lượng thành viên</span>
                <input
                  type="number"
                  min="1"
                  value={enterpriseForm.teamSize}
                  onChange={(event) => setEnterpriseForm((prev) => ({ ...prev, teamSize: event.target.value }))}
                  placeholder="25"
                />
              </label>
            </div>

            <label className="field">
              <span>Ghi chú</span>
              <textarea
                rows="4"
                value={enterpriseForm.note}
                onChange={(event) => setEnterpriseForm((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Mô tả nhu cầu báo cáo, bộ phận hoặc thời gian triển khai mong muốn..."
              />
            </label>

            <div className="enterprise-sales-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEnterpriseForm(false)}
                disabled={submittingPlanId === 'enterprise'}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submittingPlanId === 'enterprise'}>
                {submittingPlanId === 'enterprise' ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid grid-3">
        {plans.map((plan) => (
          <Card key={plan.id} title={plan.name.startsWith('Gói') ? plan.name : `Gói ${plan.name}`}>
            <div className="stack">
              {plan.current ? <span className="badge badge-success">Gói hiện tại</span> : null}
              <div className="price">{plan[cycle]}</div>
              <div className="hint">/{cycle === 'monthly' ? 'tháng' : 'năm'}</div>
              <ul className="list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button
                variant={plan.current ? 'secondary' : 'primary'}
                onClick={() => handleCheckout(plan)}
                disabled={Boolean(submittingPlanId) || (plan.current && plan.id === 'free')}
              >
                {submittingPlanId === plan.id
                  ? 'Đang xử lý...'
                  : plan.current
                    ? (plan.id === 'free' ? 'Gói hiện tại' : 'Gói hiện tại (Gia hạn / Test)')
                    : plan.ctaLabel === 'Contact sales' ? 'Liên hệ tư vấn' : plan.ctaLabel === 'Start now' ? 'Bắt đầu ngay' : (plan.id === 'enterprise' ? 'Liên hệ tư vấn' : 'Bắt đầu ngay')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Method Selector Modal */}
      {showPaymentMethodModal && selectedPlanForPayment && (
        <div className="upgrade-modal-overlay">
          <div className="upgrade-modal" style={{ width: '480px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Chọn phương thức thanh toán
            </h3>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Bạn đang nâng cấp lên gói <strong>{selectedPlanForPayment.name}</strong> ({cycle === 'monthly' ? 'Thanh toán hàng tháng' : 'Thanh toán hàng năm'}).
            </p>
            
            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--white)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => executePaymentCheckout('BANK')}
              >
                <span style={{ fontSize: '24px' }}>🏦</span>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '15px' }}>Chuyển khoản Ngân hàng (VietQR)</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tự động kích hoạt ngay lập tức qua mã QR</span>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--white)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => executePaymentCheckout('MOMO')}
              >
                <span style={{ fontSize: '24px' }}>💖</span>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '15px' }}>Ví điện tử MoMo</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thanh toán qua ví MoMo cực nhanh</span>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--white)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => executePaymentCheckout('STRIPE')}
              >
                <span style={{ fontSize: '24px' }}>💳</span>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '15px' }}>Thẻ quốc tế (Visa/Mastercard/Stripe)</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cổng thanh toán quốc tế Stripe an toàn</span>
                </div>
              </button>
            </div>

            <div className="upgrade-modal-actions">
              <Button variant="secondary" onClick={() => setShowPaymentMethodModal(false)}>
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code and Instructions Modal */}
      {showQrCodeModal && qrDetails && (
        <div className="upgrade-modal-overlay">
          <div className="upgrade-modal" style={{ width: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px', textAlign: 'center' }}>
              Quét mã QR để thanh toán
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '18px' }}>
              Gói dịch vụ sẽ tự động kích hoạt ngay sau khi bạn thực hiện chuyển khoản thành công.
            </p>

            {isCheckingPayment ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: '16px' }}>
                <div className="spinner spinner-animation" style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid var(--border-color)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%'
                }}></div>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>Đang đối soát giao dịch...</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Hệ thống đang kiểm tra trạng thái thanh toán của bạn. Vui lòng chờ trong giây lát.
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                {/* QR Code Container */}
                <div style={{
                  padding: '12px',
                  borderRadius: '16px',
                  background: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '240px',
                  height: '240px'
                }}>
                  <img
                    src={qrDetails.provider === 'BANK' 
                      ? qrDetails.checkoutUrl 
                      : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=2key=phone:${qrDetails.momoPhone || '0868222999'}`
                    }
                    alt="Payment QR Code"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Transfer Info */}
                <div style={{
                  width: '100%',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '13px',
                  display: 'grid',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kênh thanh toán:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {qrDetails.provider === 'BANK' ? `Ngân hàng ${qrDetails.bankId || 'MB Bank'}` : 'Ví điện tử MoMo'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Chủ tài khoản:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {qrDetails.provider === 'BANK' ? (qrDetails.bankAccountName || 'SKIMAI LABS') : (qrDetails.momoAccountName || 'SKIMAI LABS')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Số tài khoản / Số ĐT:</span>
                    <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {qrDetails.provider === 'BANK' ? (qrDetails.bankAccountNo || '0868222999') : (qrDetails.momoPhone || '0868222999')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Số tiền:</span>
                    <strong style={{ color: 'var(--primary-dark)', fontSize: '15px', fontVariantNumeric: 'tabular-nums' }}>
                      {qrDetails.amount || `${(selectedPlanForPayment[cycle] * 25000).toLocaleString('vi-VN')} đ`}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Nội dung chuyển khoản:</span>
                    <strong style={{ color: 'var(--red)', fontSize: '14px', letterSpacing: '0.04em' }}>
                      SKIMAI {qrDetails.providerSessionId.substring(0, 8)}
                    </strong>
                  </div>
                </div>

                <div style={{
                  fontSize: '11px',
                  textAlign: 'center',
                  background: 'rgba(255, 121, 121, 0.1)',
                  color: '#d63031',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  width: '100%'
                }}>
                  ⚠️ <strong>Quan trọng:</strong> Vui lòng chuyển khoản chính xác số tiền và <strong>nội dung chuyển khoản</strong> để gói dịch vụ được tự động kích hoạt.
                </div>
              </div>
            )}

            <div className="upgrade-modal-actions" style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <Button
                variant="secondary"
                onClick={() => setShowQrCodeModal(false)}
                disabled={isCheckingPayment}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmManualPayment}
                disabled={isCheckingPayment}
              >
                {qrDetails.provider === 'BANK' ? 'Tôi đã chuyển khoản' : 'Tôi đã thanh toán qua MoMo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
