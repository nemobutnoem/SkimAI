import { Outlet, useNavigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/Button'

export function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">SkimAI</div>
        <div className="app-header-right">
          <span className="app-user">{user?.email}</span>
          <Button
            variant="secondary"
            onClick={() => {
              logout()
              navigate(ROUTES.LOGIN)
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
