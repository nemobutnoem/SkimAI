import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { mockApi } from '../../services/mockApi'

export function PricingPage() {
  const [cycle, setCycle] = useState('monthly')
  const [plans, setPlans] = useState([])

  useEffect(() => {
    mockApi.getPricing().then(setPlans)
  }, [])

  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Pricing</h1>
          <p className="hint">Chon goi phu hop voi quy mo team cua ban.</p>
        </div>
        <div className="segmented">
          <button className={cycle === 'monthly' ? 'on' : ''} onClick={() => setCycle('monthly')}>
            Monthly
          </button>
          <button className={cycle === 'yearly' ? 'on' : ''} onClick={() => setCycle('yearly')}>
            Yearly
          </button>
        </div>
      </div>

      <div className="grid grid-4">
        {plans.map((plan) => (
          <Card key={plan.id} title={plan.name}>
            <div className="stack">
              <div className="price">${plan[cycle]}/ {cycle === 'monthly' ? 'mo' : 'yr'}</div>
              <ul className="list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Button variant={plan.id === 'pro' ? 'primary' : 'secondary'}>
                {plan.id === 'enterprise' ? 'Contact sales' : 'Start now'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
