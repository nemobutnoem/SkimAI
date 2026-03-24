import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export function PublicLayout() {
  return (
    <div className="site-shell">
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
