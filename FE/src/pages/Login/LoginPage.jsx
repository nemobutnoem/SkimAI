import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setError(err?.message ?? 'Sign in failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const setPreset = (type) => {
    setEmail(type === 'admin' ? 'admin@skimai.local' : 'demo@skimai.local')
    setPassword('123456')
  }

  return (
    <div className="login-layout">
      {/* LEFT SIDE - BRANDING */}
      <div className="login-visual">
        <div className="login-visual-content">
          <div className="login-logo">
            <div className="login-logo-icon">AI</div>
            <span>AISKIM</span>
          </div>
          <h1>Market Intelligence at the Speed of Thought.</h1>
          <p>
            Unlock data-driven decisions with real-time trend detection, 
            sentiment analysis, and competitor monitoring powered by AI.
          </p>
          <div className="login-badges">
            <span className="login-badge">🚀 10x Faster Analysis</span>
            <span className="login-badge">📈 Live Search Trends</span>
            <span className="login-badge">💡 Deep AI Insights</span>
          </div>
        </div>
        {/* Abstract shapes in the background */}
        <div className="login-shape shape-1" />
        <div className="login-shape shape-2" />
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="login-form-container">
        <div className="login-form-inner">
          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Please enter your details to sign in.</p>
          </div>

          <form onSubmit={onSubmit} className="login-form">
            <div className="login-field">
              <label>Email ID</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="login-options">
              <label className="login-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="login-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="login-presets">
            <p>Don't have an account? Try our demo presets:</p>
            <div className="login-preset-btns">
              <button type="button" onClick={() => setPreset('user')}>Demo User</button>
              <button type="button" onClick={() => setPreset('admin')}>Demo Admin</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
