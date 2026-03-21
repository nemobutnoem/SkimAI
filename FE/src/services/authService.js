import { STORAGE_KEYS } from '../constants/storageKeys'
import { mockApi } from './mockApi'

export const authService = {
  async login({ email, password }) {
    const result = await mockApi.login({ email, password })
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(result))
    return result
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
  },

  getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
}
