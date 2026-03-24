import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

  const [email, setEmail] = useState('demo@skimai.local')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const session = await login({ email, password })
      if (session?.user?.role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD)
      } else {
        navigate(ROUTES.DASHBOARD)
      }
    } catch (err) {
      setError(err?.message ?? 'Đăng nhập thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="center-page">
      <Card title="Login">
        <form onSubmit={onSubmit} className="form">
          <div className="grid grid-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEmail('demo@skimai.local')
                setPassword('123456')
              }}
            >
              User preset
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEmail('admin@skimai.local')
                setPassword('123456')
              }}
            >
              Admin preset
            </Button>
          </div>

          <label className="field">
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@skimai.local"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="123456"
              autoComplete="current-password"
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <div className="hint">
            Demo user: <code>demo@skimai.local</code> / <code>123456</code>
            <br />
            Demo admin: <code>admin@skimai.local</code> / <code>123456</code>
          </div>
        </form>
      </Card>
    </div>
  )
}
