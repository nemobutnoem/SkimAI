import { useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { AuthContext } from './AuthContextBase'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => authService.getSession())

  const value = useMemo(() => {
    const user = session?.user ?? null
    const token = session?.token ?? null

    return {
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isHydrated: true,
      async login({ email, password }) {
        const result = await authService.login({ email, password })
        setSession(result)
        return result
      },
      logout() {
        authService.logout()
        setSession(null)
      },
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
