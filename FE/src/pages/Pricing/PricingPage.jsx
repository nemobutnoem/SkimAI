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
    setSubmittingPlanId(plan.id)
    try {
      if (plan.id === 'enterprise') {
        setShowEnterpriseForm(true)
        return
      }

      const result = await appApi.checkoutPricing({ planId: plan.id, billingCycle: cycle })
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
        return
      }
      setNotice({ tone: 'info', text: result.message })
    } catch (error) {
      setNotice({ tone: 'error', text: error.message || 'Không thể hoàn tất thanh toán lúc này.' })
    } finally {
      setSubmittingPlanId(null)
    }
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
          <Card key={plan.id} title={plan.id === 'free' ? 'Gói Miễn Phí' : plan.id === 'starter' ? 'Gói Starter' : plan.id === 'team' ? 'Gói Team' : plan.name}>
            <div className="stack">
              {plan.current ? <span className="badge badge-success">Gói hiện tại</span> : null}
              <div className="price">${plan[cycle]}</div>
              <div className="hint">/{cycle === 'monthly' ? 'tháng' : 'năm'}</div>
              <ul className="list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button
                variant={plan.current ? 'secondary' : 'primary'}
                onClick={() => handleCheckout(plan)}
                disabled={Boolean(submittingPlanId) || plan.current}
              >
                {submittingPlanId === plan.id
                  ? 'Đang xử lý...'
                  : plan.current
                    ? 'Gói hiện tại'
                    : plan.ctaLabel === 'Contact sales' ? 'Liên hệ tư vấn' : plan.ctaLabel === 'Start now' ? 'Bắt đầu ngay' : (plan.id === 'enterprise' ? 'Liên hệ tư vấn' : 'Bắt đầu ngay')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
