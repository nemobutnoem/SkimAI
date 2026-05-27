import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'

function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'))
  if (window.google?.accounts?.id) return Promise.resolve()

  const existing = document.querySelector('script[data-google-identity="true"]')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')))
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity script'))
    document.head.appendChild(script)
  })
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth()

  const [mode, setMode] = useState('user') // 'user' | 'admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [googleReady, setGoogleReady] = useState(false)
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (mode !== 'user') return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setGoogleError('Thiếu VITE_GOOGLE_CLIENT_ID trong .env')
      setGoogleReady(false)
      return
    }

    let cancelled = false

    setGoogleError('')
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) return

        const google = window.google
        if (!google?.accounts?.id) {
          setGoogleError('Google Identity chưa sẵn sàng')
          return
        }

        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            setError('')
            setIsSubmitting(true)
            try {
              const session = await loginWithGoogle({ credential: response?.credential })
              if (session?.user?.role === 'admin') {
                navigate(ROUTES.ADMIN_DASHBOARD)
              } else {
                navigate(ROUTES.DASHBOARD)
              }
            } catch (err) {
              setError(err?.message ?? 'Google sign in failed')
            } finally {
              setIsSubmitting(false)
            }
          },
        })

        const container = document.getElementById('googleSignInBtn')
        if (!container) {
          setGoogleError('Không tìm thấy vùng hiển thị Google button')
          return
        }

        container.innerHTML = ''
        google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: '360',
        })

        setGoogleReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        setGoogleError(err?.message ?? 'Không load được Google Identity')
        setGoogleReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [mode, loginWithGoogle, navigate])

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

          <div className="login-mode-toggle" role="tablist" aria-label="Login mode">
            <button
              type="button"
              className={mode === 'user' ? 'active' : ''}
              onClick={() => {
                setMode('user')
                setError('')
              }}
            >
              User (Google)
            </button>
            <button
              type="button"
              className={mode === 'admin' ? 'active' : ''}
              onClick={() => {
                setMode('admin')
                setError('')
              }}
            >
              Admin (Account)
            </button>
          </div>

          {mode === 'user' && (
            <div className="login-google">
              <div id="googleSignInBtn" />
              {!googleReady && !googleError && <div className="login-google-hint">Loading Google Sign-In…</div>}
              {googleError && <div className="login-error">{googleError}</div>}
              {error && <div className="login-error">{error}</div>}
            </div>
          )}

          {mode === 'admin' && (
            <>
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
                <p>Try our demo presets:</p>
                <div className="login-preset-btns">
                  <button type="button" onClick={() => setPreset('admin')}>Demo Admin</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
