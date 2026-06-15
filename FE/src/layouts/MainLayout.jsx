import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { PageTransition } from '../components/PageTransition'

export function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}
