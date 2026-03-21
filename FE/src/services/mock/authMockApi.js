import { sleep } from '../../utils/sleep'
import { DB, createToken, toViewRole } from './core'

export const authMockApi = {
  async login({ email, password }) {
    await sleep(350)

    const user = DB.users.find((u) => u.email === email)
    if (!user || user.password_hash !== password) {
      const error = new Error('Email hoặc mật khẩu không đúng')
      error.status = 401
      throw error
    }

    return {
      token: createToken(user),
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: toViewRole(user.role),
      },
    }
  },
}
