import { STORAGE_KEYS } from '../constants/storageKeys'
import { appApi } from './appApi'

export const authService = {
  async login({ email, password }) {
    const result = await appApi.login({ email, password })
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
