import { sleep } from '../../utils/sleep'
import { DB, getPlanForUser, mockState } from './core'

export const accountMockApi = {
  async getPricing() {
    await sleep(160)

    return DB.plans.map((plan) => {
      const yearly = Number((plan.price * 10).toFixed(0))
      const currentPlan = getPlanForUser('11111111-1111-1111-1111-111111111111')
      return {
        id: plan.id,
        name: plan.name,
        monthly: Number(plan.price),
        yearly,
        features: [
          `${plan.search_limit >= 9999 ? 'Unlimited' : plan.search_limit} searches/month`,
          `${plan.export_limit >= 999 ? 'Unlimited' : plan.export_limit} exports/month`,
          plan.description,
        ],
        current: currentPlan?.id === plan.id,
        ctaLabel: currentPlan?.id === plan.id ? 'Current plan' : plan.id === 'enterprise' ? 'Contact sales' : 'Start now',
      }
    })
  },

  async checkoutPricing(payload) {
    await sleep(300)
    return {
      status: 'success',
      message: `Mock checkout completed for ${payload?.planId ?? 'selected'} plan.`,
    }
  },

  async contactSales(payload) {
    await sleep(240)
    return {
      status: 'queued',
      message: `Mock sales request created for ${payload?.planId ?? 'enterprise'} plan.`,
    }
  },

  async getAccountOverview() {
    await sleep(200)

    const userId = '11111111-1111-1111-1111-111111111111'
    const user = DB.users.find((u) => u.id === userId)
    const plan = getPlanForUser(userId)

    const userQueries = DB.search_queries.filter((q) => q.user_id === userId)
    const userReports = DB.reports.filter((r) => r.user_id === userId)
    const exports = DB.report_exports.filter((exp) => userReports.some((r) => r.id === exp.report_id))

    const apiUsage = Math.min(95, userQueries.length * 18 + 24)
    const storageUsage = Math.min(95, exports.length * 22 + 18)
    const seatUsage = plan?.name === 'Pro' ? 60 : 30

    return {
      profile: { name: user?.full_name ?? 'Demo User', email: user?.email ?? '', company: 'SkimAI Labs' },
      subscription: {
        planId: plan?.id ?? 'free',
        planName: plan?.name ?? 'Free',
        status: 'ACTIVE',
        billingCycle: 'monthly',
        renewsAt: '2026-04-01T00:00:00',
      },
      usage: [
        { label: 'API Calls', value: apiUsage },
        { label: 'Storage', value: storageUsage },
        { label: 'Team Seats', value: seatUsage },
      ],
      invoices: [
        { id: 'inv_031', amount: `$${plan?.price ?? 0}`, status: 'paid', date: '2026-03-01' },
        { id: 'inv_030', amount: `$${plan?.price ?? 0}`, status: 'paid', date: '2026-02-01' },
      ],
      notifications: mockState.notificationSettings,
    }
  },

  async saveNotificationSettings(settings) {
    await sleep(120)
    mockState.notificationSettings = { ...settings }
    return mockState.notificationSettings
  },
}
