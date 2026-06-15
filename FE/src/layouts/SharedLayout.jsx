import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { PageTransition } from '../components/PageTransition'

export function SharedLayout() {
  return (
    <div className="site-shell">
      <Navbar />
      <main className="site-main">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}
