import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export function NotFoundPage() {
  return (
    <div className="center-page">
      <div className="stack">
        <h1>404</h1>
        <p>Trang không tồn tại.</p>
        <Link to={ROUTES.HOME}>Quay lại trang chủ</Link>
      </div>
    </div>
  )
}
