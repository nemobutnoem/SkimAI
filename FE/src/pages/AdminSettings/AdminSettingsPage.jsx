import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { appApi } from '../../services/appApi'

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('packages')
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  const [settings, setSettings] = useState({
    ai_provider: 'GEMINI',
    ai_model: 'gemini-2.5-flash',
    ai_api_key: '',
    ai_endpoint: '',
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [settingsSaveStatus, setSettingsSaveStatus] = useState(null)
  const [revenueData, setRevenueData] = useState(null)

  useEffect(() => {
    if (activeTab === 'packages') {
      setLoadingPlans(true)
      Promise.all([
        appApi.getAdminPlans(),
        appApi.getAdminRevenue()
      ])
        .then(([plansData, revData]) => {
          setPlans(plansData || [])
          setRevenueData(revData)
        })
        .catch(err => {
          console.error("Lỗi tải cấu hình hoặc doanh thu gói:", err)
        })
        .finally(() => setLoadingPlans(false))
    } else if (activeTab === 'content') {
      setLoadingSettings(true)
      appApi.getAdminSettings()
        .then(data => {
          if (data) {
            setSettings({
              ai_provider: data.ai_provider || 'GEMINI',
              ai_model: data.ai_model || 'gemini-2.5-flash',
              ai_api_key: data.ai_api_key || '',
              ai_endpoint: data.ai_endpoint || '',
            })
          }
        })
        .catch(err => {
          console.error("Lỗi tải cấu hình:", err)
        })
        .finally(() => setLoadingSettings(false))
    }
  }, [activeTab])

  const handlePlanChange = (id, field, value) => {
    setPlans(prevPlans => prevPlans.map(plan => plan.id === id ? { ...plan, [field]: value } : plan))
  }

  const handleSavePlans = async () => {
    setSaveStatus('saving')
    try {
      for (const plan of plans) {
        const payload = {
          price: Number(plan.price),
          searchLimit: Number(plan.searchLimit),
          exportLimit: Number(plan.exportLimit),
          deepInsightLimit: Number(plan.deepInsightLimit),
          description: plan.description || ''
        }
        await appApi.updateAdminPlan(plan.id, payload)
      }
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err) {
      console.error("Lỗi khi lưu gói:", err)
      setSaveStatus('error')
    }
  }

  const handleSaveSettings = async () => {
    setSettingsSaveStatus('saving')
    try {
      await appApi.updateAdminSettings(settings)
      setSettingsSaveStatus('success')
      setTimeout(() => setSettingsSaveStatus(null), 3000)
    } catch (err) {
      console.error("Lỗi khi lưu cấu hình AI:", err)
      setSettingsSaveStatus('error')
    }
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
                <input defaultValue="SKIM AI" />
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
          <Card title="Cấu hình AI Phân tích (Deep Insight)">
            <div className="stack">
              {settingsSaveStatus === 'success' && (
                <div className="inline-notice inline-notice-success" style={{ marginBottom: '16px' }}>
                  Cập nhật cấu hình AI thành công!
                </div>
              )}
              {settingsSaveStatus === 'error' && (
                <div className="inline-notice inline-notice-error" style={{ marginBottom: '16px' }}>
                  Có lỗi xảy ra khi lưu cấu hình AI.
                </div>
              )}

              {loadingSettings ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                  Đang tải cấu hình AI...
                </div>
              ) : (
                <>
                  <label className="field">
                    <span>Nhà cung cấp dịch vụ AI (Provider)</span>
                    <select 
                      value={settings.ai_provider} 
                      onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value })}
                    >
                      <option value="GEMINI">Google Gemini API (Mặc định)</option>
                      <option value="OPENAI">OpenAI / Tương thích OpenAI (DeepSeek, Groq, OpenRouter, v.v.)</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Tên mô hình AI (Model Name)</span>
                    <input 
                      type="text" 
                      placeholder={settings.ai_provider === 'GEMINI' ? 'Ví dụ: gemini-2.5-flash' : 'Ví dụ: gpt-4o'} 
                      value={settings.ai_model} 
                      onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                    />
                    <span className="hint">Mã định danh mô hình chính xác (ví dụ: <code>gemini-2.5-flash</code> hoặc <code>gpt-4o</code> hoặc <code>deepseek-chat</code>)</span>
                  </label>

                  <label className="field">
                    <span>Khóa API (API Key)</span>
                    <input 
                      type="password" 
                      placeholder="Nhập API Key ở đây"
                      value={settings.ai_api_key} 
                      onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
                    />
                    <span className="hint">Mã hóa bảo mật. Dùng để gọi API dịch vụ AI đã chọn</span>
                  </label>

                  <label className="field">
                    <span>Đường dẫn API tùy chỉnh (Endpoint URL - Tùy chọn)</span>
                    <input 
                      type="text" 
                      placeholder={settings.ai_provider === 'GEMINI' ? 'Để trống nếu dùng mặc định' : 'Ví dụ: https://api.deepseek.com/v1'} 
                      value={settings.ai_endpoint} 
                      onChange={(e) => setSettings({ ...settings, ai_endpoint: e.target.value })}
                    />
                    <span className="hint">Chỉ điền khi dùng Proxy, hoặc các nhà cung cấp tương thích OpenAI (DeepSeek, OpenRouter, Groq, v.v.)</span>
                  </label>

                  <div className="flex-row">
                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={settingsSaveStatus === 'saving'}
                    >
                      {settingsSaveStatus === 'saving' ? 'Đang lưu...' : 'Lưu cấu hình AI'}
                    </Button>
                  </div>
                </>
              )}
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
          <Card title="Cấu hình & Tích hợp Doanh thu">
            <div className="grid grid-2">
              <div className="stack">
                <div className="list-item">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Cổng thanh toán PayOS (VietQR)</span>
                    <span className="hint">Xử lý thanh toán quét mã ngân hàng tự động</span>
                  </div>
                  <span className="badge badge-active">Đang chạy (Test Mode)</span>
                </div>
                <div className="list-item">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Ví điện tử MoMo</span>
                    <span className="hint">Xử lý thanh toán ví điện tử giả lập</span>
                  </div>
                  <span className="badge badge-active">Sẵn sàng</span>
                </div>
                <div className="list-item">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Chuyển khoản Ngân hàng Trực tiếp</span>
                    <span className="hint">Mã VietQR cá nhân (đối soát thủ công)</span>
                  </div>
                  <span className="badge badge-active">Sẵn sàng</span>
                </div>
              </div>
              <div style={{ background: 'var(--primary-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                <h4 style={{ margin: '0 0 10px', color: 'var(--primary)' }}>Doanh thu định kỳ hàng tháng (MRR)</h4>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {revenueData ? (revenueData.metrics?.find(m => m.label === 'MRR')?.value || '$0.00') : '$0.00'}
                </div>
                <p className="hint" style={{ marginTop: '8px' }}>
                  {revenueData ? `Tỷ lệ nâng cấp: ${revenueData.metrics?.find(m => m.label === 'Upgrade Rate')?.value || '0.0%'}` : 'Tỷ lệ nâng cấp: 0.0%'} • Tự động tổng hợp từ lịch sử giao dịch (PayOS, VietQR, MoMo).
                </p>
              </div>
            </div>
          </Card>

          <h3 style={{ marginTop: '20px' }}>Cấu hình các Gói dịch vụ</h3>
          
          {saveStatus === 'success' && (
            <div className="inline-notice inline-notice-success" style={{ marginBottom: '16px' }}>
              Cập nhật cấu hình các gói thành công!
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="inline-notice inline-notice-error" style={{ marginBottom: '16px' }}>
              Có lỗi xảy ra khi lưu cấu hình các gói.
            </div>
          )}

          {loadingPlans ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              Đang tải danh sách gói từ cơ sở dữ liệu...
            </div>
          ) : (
            <>
              <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                {plans.map((plan) => {
                  const getPlanDisplayName = (n) => {
                    switch (n?.toUpperCase()) {
                      case 'FREE': return 'Miễn Phí'
                      case 'STARTER': return 'Pro'
                      case 'TEAM': return 'Premium'
                      case 'ENTERPRISE': return 'Enterprise'
                      default: return n || ''
                    }
                  }

                  return (
                    <Card key={plan.id} title={`Gói ${getPlanDisplayName(plan.name)}`}>
                      <div className="stack">
                        <label className="field">
                          <span>Tên mã gói (Read-only)</span>
                          <input value={plan.name} readOnly disabled />
                        </label>
                        <div className="grid grid-2">
                          <label className="field">
                            <span>Giá tiền (USD)</span>
                            <input 
                              type="number" 
                              step="0.01" 
                              value={plan.price || 0} 
                              onChange={(e) => handlePlanChange(plan.id, 'price', e.target.value)} 
                            />
                            <span className="hint">~ {(Number(plan.price || 0) * 25000).toLocaleString('vi-VN')} đ</span>
                          </label>
                          <label className="field">
                            <span>Deep Insight / tuần</span>
                            <input 
                              type="number" 
                              value={plan.deepInsightLimit || 0} 
                              onChange={(e) => handlePlanChange(plan.id, 'deepInsightLimit', e.target.value)} 
                            />
                          </label>
                        </div>
                        <div className="grid grid-2">
                          <label className="field">
                            <span>Tìm kiếm / tháng</span>
                            <input 
                              type="number" 
                              value={plan.searchLimit || 0} 
                              onChange={(e) => handlePlanChange(plan.id, 'searchLimit', e.target.value)} 
                            />
                          </label>
                          <label className="field">
                            <span>Xuất báo cáo / tháng</span>
                            <input 
                              type="number" 
                              value={plan.exportLimit || 0} 
                              onChange={(e) => handlePlanChange(plan.id, 'exportLimit', e.target.value)} 
                            />
                          </label>
                        </div>
                        <label className="field">
                          <span>Mô tả ngắn</span>
                          <textarea 
                            rows={3} 
                            value={plan.description || ''} 
                            onChange={(e) => handlePlanChange(plan.id, 'description', e.target.value)} 
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                          />
                        </label>
                      </div>
                    </Card>
                  )
                })}
              </div>
              
              <div className="flex-row" style={{ marginTop: '16px', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={handleSavePlans} 
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? 'Đang lưu...' : 'Lưu cấu hình các Gói'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  )
}
