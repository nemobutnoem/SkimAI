import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { appApi } from '../../services/appApi'

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

function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let running = true

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const N = 55
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }))
    const colors = ['rgba(13,148,136,', 'rgba(99,102,241,', 'rgba(52,211,153,', 'rgba(255,255,255,']

    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = colors[i % colors.length] + p.alpha + ')'
        ctx.fill()
        particles.forEach((p2, j) => {
          if (j <= i) return
          const dx = p.x - p2.x, dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 90) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = 'rgba(255,255,255,' + (0.06 * (1 - dist / 90)) + ')'
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      requestAnimationFrame(draw)
    }
    draw()

    return () => {
      running = false
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithGoogle, login, isAuthenticated, user } = useAuth()
  const redirectFromRef = useRef(location.state?.from || ROUTES.DASHBOARD)

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      const target = user?.role === 'admin'
        ? ROUTES.ADMIN_DASHBOARD
        : redirectFromRef.current
      navigate(target, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) { setGoogleError('Chưa cấu hình Google Client ID'); return }
    let cancelled = false
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) return
        const google = window.google
        if (!google?.accounts?.id) { setGoogleError('Google Identity chưa sẵn sàng'); return }
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            setError('')
            setIsSubmitting(true)
            try {
              const session = await loginWithGoogle({ credential: response?.credential })
              const target = session?.user?.role === 'admin'
                ? ROUTES.ADMIN_DASHBOARD
                : redirectFromRef.current
              navigate(target, { replace: true })
            } catch (err) {
              setError(err?.message ?? 'Đăng nhập Google thất bại')
            } finally {
              setIsSubmitting(false)
            }
          },
        })
        const container = document.getElementById('googleSignInBtn')
        if (!container) return
        container.innerHTML = ''
        google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: '340' })
      })
      .catch((err) => { if (!cancelled) setGoogleError(err?.message ?? 'Không load được Google Identity') })
    return () => { cancelled = true }
  }, [loginWithGoogle, navigate, location.state])

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', overflow: 'hidden', background: '#0F172A' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ flex: '0 0 48%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '44px 48px' }}>
        <ParticleCanvas />

        {/* Blobs */}
        <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%,rgba(13,148,136,.55),rgba(13,148,136,.05) 70%)', top: -80, left: -100, filter: 'blur(2px)', zIndex: 1, animation: 'lpFloat1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle at 55% 55%,rgba(99,102,241,.5),rgba(99,102,241,.04) 70%)', bottom: 40, right: -80, filter: 'blur(2px)', zIndex: 1, animation: 'lpFloat2 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(34,211,238,.35),rgba(34,211,238,.02) 70%)', top: '45%', left: '40%', filter: 'blur(1px)', zIndex: 1, animation: 'lpFloat3 7s ease-in-out infinite' }} />

        {/* Spinning rings */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-42%,-52%)', zIndex: 1 }}>
          <div style={{ width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(13,148,136,.2)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'lpSpinCW 18s linear infinite' }} />
          <div style={{ width: 420, height: 420, borderRadius: '50%', border: '1px dashed rgba(255,255,255,.08)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'lpSpinCCW 28s linear infinite' }} />
          <div style={{ width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(99,102,241,.2)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'lpSpinCW 10s linear infinite reverse' }} />
        </div>

        {/* Glassmorphism card */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-42%,-52%)', width: 260, padding: '22px', borderRadius: 20, background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,.12)', zIndex: 2, animation: 'lpFadeUp 1s .4s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9488', animation: 'lpGlowPulse 2.5s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.55)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Live analysis</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-.04em', lineHeight: 1 }}>+34%</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>Lượt tìm kiếm tuần này</div>
          <div style={{ marginTop: 14, height: 4, background: 'rgba(255,255,255,.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '72%', background: 'linear-gradient(90deg,#0D9488,#34D399)', borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(255,255,255,.3)', marginTop: 5 }}>
            <span>0</span><span>72% quota</span><span>100</span>
          </div>
        </div>

        {/* Brand text */}
        <div style={{ position: 'relative', zIndex: 3, animation: 'lpSlideRight .8s .1s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
              <circle cx="28" cy="28" r="20" stroke="#a29bfe" strokeWidth="5.5" fill="rgba(255,255,255,0.08)" />
              <rect x="18" y="28" width="4.5" height="10" rx="2" fill="#a29bfe" />
              <rect x="25" y="22" width="4.5" height="16" rx="2" fill="#a29bfe" />
              <rect x="32" y="16" width="4.5" height="22" rx="2" fill="#a29bfe" />
              <path d="M38 18c0-2 1-3 3-3c-2 0-3-1-3-3c0 2-1 3-3 3c2 0 3 1 3 3z" fill="#a29bfe" />
              <path d="M43 12c0-1 .5-1.5 1.5-1.5c-1 0-1.5-.5-1.5-1.5c0 1-.5 1.5-1.5 1.5c1 0 1.5.5 1.5 1.5z" fill="#a29bfe" />
              <line x1="42" y1="42" x2="54" y2="54" stroke="#a29bfe" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>
              SKIM <span style={{ color: '#a29bfe' }}>AI</span>
            </span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
            Thấu hiểu thị trường<br />trong <span style={{ color: '#34D399' }}>vài giây</span>
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.45)', lineHeight: 1.6, maxWidth: 280 }}>
            Dữ liệu từ 3 nguồn thật · Gemini 2.5 Flash · ResearchGuard AI
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>

        {/* Subtle bg */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%,rgba(13,148,136,.04) 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(99,102,241,.04) 0%,transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1, animation: 'lpFadeUp .7s .2s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Header */}
          <div style={{ marginBottom: 32, textAlign: 'center', width: '100%' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 8 }}>Đăng nhập</h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
              Truy cập hệ thống phân tích thị trường AISKIM nhanh chóng và bảo mật bằng tài khoản Google của bạn.
            </p>
          </div>

          {/* Google button */}
          <div style={{ marginBottom: 24, width: '100%', display: 'flex', justifyContent: 'center' }}>
            {!googleError ? (
              <div id="googleSignInBtn" style={{ minHeight: 44, display: 'flex', justifyContent: 'center', width: '100%' }} />
            ) : (
              <div style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', textAlign: 'center', width: '100%' }}>
                {googleError}
              </div>
            )}
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 24, width: '100%', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, marginTop: 8 }}>
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#" style={{ color: '#0D9488', textDecoration: 'none' }}>Điều khoản dịch vụ</a>
            {' '}và{' '}
            <a href="#" style={{ color: '#0D9488', textDecoration: 'none' }}>Chính sách quyền riêng tư</a>.
          </p>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes lpFloat1 {0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.06)}66%{transform:translate(-20px,25px) scale(.96)}}
        @keyframes lpFloat2 {0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-25px,18px) scale(1.04)}66%{transform:translate(22px,-22px) scale(.97)}}
        @keyframes lpFloat3 {0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(18px,18px) scale(1.05)}}
        @keyframes lpSpinCW  {to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes lpSpinCCW {to{transform:translate(-50%,-50%) rotate(-360deg)}}
        @keyframes lpFadeUp  {from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lpSlideRight{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
        @keyframes lpGlowPulse{0%,100%{box-shadow:0 0 0 0 rgba(13,148,136,.35)}50%{box-shadow:0 0 24px 6px rgba(13,148,136,.18)}}
        @media(max-width:768px){
          .lp-left{display:none!important}
          .lp-right{flex:1!important;border-radius:0!important}
        }
      `}</style>
    </div>
  )
}
