import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export function NotFoundPage() {
  return (
    <div className="center-page">
      <div className="stack">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link to={ROUTES.DASHBOARD}>Go home</Link>
      </div>
    </div>
  )
}
