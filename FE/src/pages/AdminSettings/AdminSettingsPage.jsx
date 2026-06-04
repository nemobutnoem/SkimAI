import { useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('packages')

  // Sample data for packages config
  const [packages, setPackages] = useState([
    {
      id: 'free',
      name: 'Gói Miễn Phí',
      price: '$0',
      period: 'Vô thời hạn',
      aiLimit: 2, // Mới chỉnh lại thành 2 theo yêu cầu người dùng
      features: 'Nghiên cứu thị trường cơ bản\nLịch sử 3 ngày\nHỗ trợ thông thường',
    },
    {
      id: 'standard',
      name: 'Gói Tiêu Chuẩn (Pro)',
      price: '$20',
      period: '/ tháng',
      aiLimit: 50,
      features: 'Nghiên cứu thị trường đầy đủ\nCông cụ Deep Insight\nLịch sử 1 năm\nHỗ trợ ưu tiên',
    },
    {
      id: 'premium',
      name: 'Gói Premium / Đội Nhóm',
      price: '$60',
      period: '/ tháng',
      aiLimit: 200,
      features: 'Tất cả tính năng gói Tiêu chuẩn\nHỏi chuyên gia (GPT-4o)\nTruy cập API\nXuất báo cáo PDF/CSV\nQuản lý hỗ trợ riêng',
    },
  ])

  const handlePackageChange = (id, field, value) => {
    setPackages(packages.map(pkg => pkg.id === id ? { ...pkg, [field]: value } : pkg))
  }

  return (
    <div className="stack page-wrap">
      <div className="page-header">
        <div>
          <h1>Cấu hình Hệ thống</h1>
          <p className="hint">Quản lý tùy chọn hệ thống, cấu hình AI, bảng giá và các quy tắc hiệu suất.</p>
        </div>
        <div className="tag-wrap">
          <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>Cài đặt chung & Thông báo</button>
          <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>Nội dung & Chất lượng AI</button>
          <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Hiệu suất Hệ thống</button>
          <button className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => setActiveTab('packages')}>⭐ Gói dịch vụ & Đăng ký</button>
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-2">
          <Card title="Tùy chọn chung">
            <div className="stack">
              <label className="field">
                <span>Tên ứng dụng</span>
                <input defaultValue="AISKIM" />
              </label>
              <label className="field">
                <span>Ngôn ngữ mặc định</span>
                <select defaultValue="vi">
                  <option value="en">Tiếng Anh (Mỹ)</option>
                  <option value="vi">Tiếng Việt (Việt Nam)</option>
                </select>
              </label>
              <div className="flex-row">
                <Button>Lưu thay đổi</Button>
              </div>
            </div>
          </Card>
          <Card title="Cảnh báo & Thông báo">
            <div className="stack">
              <label className="login-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Thông báo Admin khi thanh toán thất bại</span>
              </label>
              <label className="login-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Thông báo Admin khi có người đăng ký Premium mới</span>
              </label>
              <label className="login-checkbox">
                <input type="checkbox" />
                <span>Gửi email báo cáo tổng hợp hàng tuần</span>
              </label>
              <div className="flex-row">
                <Button>Cập nhật cấu hình</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="grid grid-2">
          <Card title="Mô hình AI & Tích hợp">
            <div className="stack">
              <label className="field">
                <span>Mô hình tạo nội dung OpenAI</span>
                <select defaultValue="gpt-4o">
                  <option value="gpt-4o">GPT-4o (Chất lượng cao, Chi phí cao)</option>
                  <option value="gpt-4o-mini">GPT-4o-mini (Nhanh, Chi phí thấp)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5-Turbo (Kế thừa)</option>
                </select>
              </label>
              <label className="field">
                <span>Khóa SerpAPI (Tìm kiếm thời gian thực)</span>
                <input type="password" defaultValue="sk-live-1234567890" />
              </label>
              <div className="list-item">
                <span>Kết nối OpenAI</span>
                <span className="badge badge-active">Đã kết nối ✔️</span>
              </div>
              <div className="list-item">
                <span>Kết nối SerpAPI</span>
                <span className="badge badge-active">Đã kết nối ✔️</span>
              </div>
              <div className="flex-row">
                <Button>Lưu cấu hình</Button>
              </div>
            </div>
          </Card>

          <Card title="Chất lượng báo cáo & Định dạng">
            <div className="stack">
              <label className="field">
                <span>Độ sáng tạo AI Temperature (0.0 đến 1.0)</span>
                <input type="number" step="0.1" defaultValue="0.7" max="1" min="0" />
                <span className="hint">Thấp hơn = Chính xác/Thực tế, Cao hơn = Sáng tạo</span>
              </label>
              <label className="field">
                <span>Mức độ nghiêm ngặt phân tích</span>
                <select defaultValue="strict">
                  <option value="loose">Mở rộng (Nhiều suy luận)</option>
                  <option value="strict">Nghiêm ngặt (Chỉ dùng điểm dữ liệu thật)</option>
                </select>
              </label>
              <label className="field">
                <span>Độ dài báo cáo mặc định</span>
                <select defaultValue="standard">
                  <option value="short">Ngắn (Gạch đầu dòng)</option>
                  <option value="standard">Tiêu chuẩn (Dạng trang)</option>
                  <option value="deep">Phân tích sâu (Chi tiết)</option>
                </select>
              </label>
              <div className="flex-row">
                <Button>Áp dụng cấu hình</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-2">
          <Card title="Lưu bộ nhớ đệm & Giới hạn tần suất">
            <div className="stack">
              <label className="field">
                <span>Thời gian lưu cache dữ liệu thị trường (giờ)</span>
                <input type="number" defaultValue="24" />
                <span className="hint">Thời gian tái sử dụng kết quả cào để tiết kiệm chi phí gọi API.</span>
              </label>
              <label className="field">
                <span>Số lượt gọi API tối đa mỗi người dùng (Hàng ngày)</span>
                <input type="number" defaultValue="100" />
                <span className="hint">Giới hạn số lượt phân tích chuyên sâu mà người dùng thông thường có thể tạo.</span>
              </label>
              <div className="flex-row">
                <Button>Cập nhật giới hạn</Button>
                <Button variant="secondary">Xóa bộ nhớ đệm ngay</Button>
              </div>
            </div>
          </Card>

          <Card title="Tiến trình chạy ngầm">
            <div className="stack">
              <div className="list-item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Tiến trình thu thập xu hướng</span>
                  <span className="hint">Cào Google Trends tìm từ khóa hot hàng ngày</span>
                </div>
                <span className="badge badge-active">Hoạt động tốt</span>
              </div>
              <div className="list-item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Đồng bộ hóa gia hạn đăng ký</span>
                  <span className="hint">Kiểm tra trạng thái thanh toán từ Stripe</span>
                </div>
                <span className="badge badge-active">Đang chạy</span>
              </div>
              <div className="list-item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Lưu trữ báo cáo cũ</span>
                  <span className="hint">Di chuyển các bản nháp báo cáo trên 30 ngày vào lưu trữ</span>
                </div>
                <span className="badge badge-draft">Tạm dừng</span>
              </div>
              
              <div className="flex-row" style={{ marginTop: '16px' }}>
                <Button>Bắt buộc đồng bộ tất cả tiến trình</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="stack">
          <Card title="Tích hợp doanh thu Stripe">
            <div className="grid grid-2">
              <div className="stack">
                <label className="field">
                  <span>Khóa bí mật Stripe</span>
                  <input type="password" defaultValue="sk_live_51NQo9y..." />
                </label>
                <div className="flex-row">
                  <Button>Kiểm tra kết nối</Button>
                </div>
              </div>
              <div style={{ background: 'var(--primary-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--primary)' }}>Doanh thu định kỳ hàng tháng (MRR)</h4>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>$4,250.00</div>
                <p className="hint" style={{ marginTop: '8px' }}>+12.5% so với tháng trước. Tự động đồng bộ từ Stripe.</p>
              </div>
            </div>
          </Card>

          <h3 style={{ marginTop: '20px' }}>Cấu hình các Gói dịch vụ</h3>
          <div className="grid grid-3">
            {packages.map((pkg) => (
              <Card key={pkg.id}>
                <div className="stack">
                  <label className="field">
                    <span>Tên gói dịch vụ</span>
                    <input value={pkg.name} onChange={(e) => handlePackageChange(pkg.id, 'name', e.target.value)} />
                  </label>
                  <div className="grid grid-2">
                    <label className="field">
                      <span>Giá tiền</span>
                      <input value={pkg.price} onChange={(e) => handlePackageChange(pkg.id, 'price', e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Chu kỳ</span>
                      <input value={pkg.period} onChange={(e) => handlePackageChange(pkg.id, 'period', e.target.value)} />
                    </label>
                  </div>
                  <label className="field">
                    <span>Giới hạn lượt chạy AI (Hàng tháng)</span>
                    <input type="number" value={pkg.aiLimit} onChange={(e) => handlePackageChange(pkg.id, 'aiLimit', e.target.value)} />
                    <span className="hint">Đặt bằng 0 nếu không giới hạn.</span>
                  </label>
                  <label className="field">
                    <span>Các tính năng đi kèm (Mỗi tính năng 1 dòng)</span>
                    <textarea 
                      rows={5} 
                      value={pkg.features} 
                      onChange={(e) => handlePackageChange(pkg.id, 'features', e.target.value)} 
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                    />
                  </label>
                  <label className="login-checkbox" style={{ marginTop: '10px' }}>
                    <input type="checkbox" defaultChecked />
                    <span>Hiển thị trên Trang bảng giá</span>
                  </label>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex-row" style={{ marginTop: '16px', justifyContent: 'flex-end' }}>
            <Button variant="secondary">Khôi phục mặc định</Button>
            <Button>Lưu gói dịch vụ & Quy tắc bảng giá</Button>
          </div>
        </div>
      )}

    </div>
  )
}
