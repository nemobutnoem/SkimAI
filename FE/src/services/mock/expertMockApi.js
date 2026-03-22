import { sleep } from '../../utils/sleep'
import { mockState, nowIso } from './core'

export const expertMockApi = {
  async getExperts() {
    await sleep(160)
    return [
      { id: 'e1', name: 'Ngoc Bui', domain: 'Market Strategy', rating: 4.9, price: 20 },
      { id: 'e2', name: 'Tuan Ho', domain: 'Consumer Insight', rating: 4.8, price: 18 },
      { id: 'e3', name: 'Trang Le', domain: 'Growth Planning', rating: 4.7, price: 22 },
    ]
  },

  async submitExpertQuestion(payload) {
    await sleep(300)
    const item = {
      id: `ticket_${Date.now()}`,
      status: 'queued',
      etaHours: 12,
      createdAt: nowIso(),
      ...payload,
    }
    mockState.expertTickets = [item, ...mockState.expertTickets]
    return item
  },
}
