import { sleep } from '../utils/sleep'

const MOCK_USERS = [
  {
    id: 'u_1',
    name: 'Demo User',
    email: 'demo@skimai.local',
    password: '123456',
    role: 'user',
  },
  {
    id: 'admin_1',
    name: 'Admin',
    email: 'admin@skimai.local',
    password: '123456',
    role: 'admin',
  },
]

const createToken = (user) => {
  // Mock token (do not use in production)
  return `mock.${btoa(JSON.stringify({ sub: user.id, role: user.role }))}.token`
}

export const mockApi = {
  async login({ email, password }) {
    await sleep(450)

    const user = MOCK_USERS.find((u) => u.email === email)
    if (!user || user.password !== password) {
      const error = new Error('Email hoặc mật khẩu không đúng')
      error.status = 401
      throw error
    }

    const { password: _pw, ...safeUser } = user
    return {
      token: createToken(user),
      user: safeUser,
    }
  },

  async getDashboard() {
    await sleep(350)
    return {
      kpis: [
        { label: 'Documents', value: 12 },
        { label: 'Insights', value: 5 },
        { label: 'Reports', value: 2 },
      ],
      recent: [
        { id: 'd1', title: 'Market summary', createdAt: new Date().toISOString() },
        { id: 'd2', title: 'Competitor snapshot', createdAt: new Date().toISOString() },
      ],
    }
  },
}
