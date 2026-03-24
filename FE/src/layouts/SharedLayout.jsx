import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

/**
 * SharedLayout — used for pages that work for both guest and logged-in users.
 * The Navbar auto-detects auth state and renders the appropriate navbar.
 */
export function SharedLayout() {
  return (
    <div className="site-shell">
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
