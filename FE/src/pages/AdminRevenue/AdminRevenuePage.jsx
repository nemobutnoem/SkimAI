import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { appApi } from '../../services/appApi'

export function AdminRevenuePage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    appApi.getAdminRevenue().then(setData)
  }, [])

  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Quản trị Doanh thu</h1>
          <p className="hint">Giao diện quản lý tài chính: giám sát MRR, chất lượng thanh toán và các sự kiện đăng ký gói.</p>
        </div>
      </div>

      <div className="grid grid-4">
        {(data?.metrics ?? []).map((item) => (
          <Card key={item.label} title={item.label === 'MRR' ? 'Doanh thu tháng (MRR)' : item.label === 'ARR' ? 'Doanh thu năm ước tính (ARR)' : item.label === 'Upgrade Rate' ? 'Tỷ lệ nâng cấp' : item.label === 'Failed Payments' ? 'Giao dịch thất bại' : item.label}>
            <div className="kpi">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-2">
        <Card title="Doanh thu theo Kênh">
          <div className="stack">
            {(data?.channels ?? []).map((channel) => (
              <div key={channel.name} className="list-item">
                <span>{channel.name === 'Stripe Checkout' ? 'Cổng thanh toán Stripe' : channel.name === 'Direct Bank Transfer' ? 'Chuyển khoản trực tiếp' : channel.name}</span>
                <span>
                  {channel.amount} ({channel.pct}%)
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Sự kiện Đăng ký gói">
          <div className="hint" style={{ marginBottom: 12 }}>
            Giao dịch gần đây nhất từ luồng thanh toán.
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Sự kiện</th>
                <th>Gói dịch vụ</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(data?.events ?? []).map((event) => (
                <tr key={event.id}>
                  <td>{event.user}</td>
                  <td>{event.event === 'checkout_completed' ? 'Thanh toán hoàn tất' : event.event === 'checkout_failed' ? 'Thanh toán thất bại' : event.event === 'subscription_cancelled' ? 'Hủy gói dịch vụ' : event.event}</td>
                  <td>{event.plan?.toUpperCase() === 'FREE' ? 'Miễn phí' : event.plan?.toUpperCase() === 'STARTER' ? 'Gói Starter' : event.plan?.toUpperCase() === 'TEAM' ? 'Gói Team' : event.plan?.toUpperCase() === 'ENTERPRISE' ? 'Gói Enterprise' : event.plan}</td>
                  <td>{event.amount}</td>
                  <td>
                    <span className={['badge', `badge-${event.status}`].join(' ')}>{event.status === 'success' ? 'Thành công' : event.status === 'failed' ? 'Thất bại' : event.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
