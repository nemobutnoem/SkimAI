import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
    return () => clearTimeout(timer)
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg, d) => add(msg, 'success', d),
    error:   (msg, d) => add(msg, 'error',   d ?? 5000),
    info:    (msg, d) => add(msg, 'info',    d),
    warn:    (msg, d) => add(msg, 'warn',    d),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <span className="toast-icon" aria-hidden="true">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warn' ? '!' : 'i'}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => remove(t.id)} aria-label="Đóng">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
