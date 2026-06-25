# AISKIM — UI System

Tài liệu mô tả design system, components, và CSS conventions của AISKIM frontend.

---

## 1) Design Tokens (CSS Variables)

Tất cả màu, spacing, shadow đều dùng CSS variables định nghĩa trong `:root` tại `FE/src/styles/global.css`.

### Colors
```css
--primary: #5b47e0          /* Brand purple */
--primary-dark: #4833d1
--primary-light: #7c6be8
--primary-bg: #eeeaff        /* Light purple background */
--primary-gradient: linear-gradient(135deg, #5b47e0, #7c6be8)

--green: #059669
--red: #ef4444
--orange: #f59e0b
--blue: #2563eb
--white: #ffffff

--text-primary: #0f172a
--text-secondary: #475569
--text-muted: #94a3b8
--border-color: #e2e8f0
--bg-page: #f8fafc
```

### Shadows
```css
--shadow-xs, --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
```

### Radius
```css
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--radius-xl: 18px
--radius-2xl: 24px
--radius-full: 9999px
```

### Transitions
```css
--transition-fast: 0.15s ease
--transition: 0.22s ease
--ease: cubic-bezier(0.16, 1, 0.3, 1)
```

---

## 2) Layout Classes

```css
.page-wrap          /* max-width: 1140px, margin auto, padding inline 24px */
.stack              /* display: grid, gap: 24px */
.grid-2             /* 2 cột equal */
.grid-3             /* 3 cột equal */
.grid-4             /* 4 cột equal */
/* Tất cả grid collapse về 1 cột ở mobile ≤768px */
```

---

## 3) Components

### Button (`Button.jsx`)
```jsx
<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button disabled>Disabled</Button>
```
CSS classes: `.btn`, `.btn-primary`, `.btn-secondary`

### Card (`Card.jsx`)
```jsx
<Card title="Tiêu đề">content</Card>
<Card className="dashboard-kpi-card">content</Card>
```
CSS class: `.card`

### Skeleton (`Skeleton.jsx`)
```jsx
import { Skeleton, DashboardSkeleton, AnalysisSkeleton } from '../../components/Skeleton'

<Skeleton width="200px" height="20px" />   // base shimmer block
<DashboardSkeleton />                       // full dashboard loading state
<AnalysisSkeleton />                        // full analysis loading state
```
CSS: `.skeleton` với `@keyframes shimmer`

### Toast (`ToastContext.jsx`)
```jsx
import { useToast } from '../../context/ToastContext'

const toast = useToast()
toast.success('Thành công!')
toast.error('Lỗi rồi', 6000)   // custom duration ms
toast.info('Thông tin')
toast.warn('Cảnh báo')
```
CSS: `.toast-container`, `.toast`, `.toast-success`, `.toast-error`, `.toast-info`, `.toast-warn`

### PageTransition (`PageTransition.jsx`)
Tự động wrap trong layouts — không cần dùng trực tiếp.
- Fade-in + slide-up 0.22s khi navigate
- Scroll về đầu trang khi đổi route

### Navbar (`Navbar.jsx`)
- Desktop: links ngang + avatar dropdown
- Mobile (≤768px): hamburger → side panel từ phải trượt vào
- Auto-detect auth state → render đúng links

---

## 4) CSS Patterns hay dùng

### Empty State
```jsx
<div className="empty-state">
  <div className="empty-state-icon">🔍</div>
  <div className="empty-state-title">Tiêu đề</div>
  <div className="empty-state-desc">Mô tả ngắn</div>
  <button className="btn btn-primary">CTA</button>
</div>
```

### Metric Bar (Visual Progress Bar)
```jsx
<div className="metric-bar-wrap">
  <div className="metric-bar-row">
    <span className="metric-bar-label">YouTube</span>
    <div className="metric-bar-track">
      <div className="metric-bar-fill metric-bar-fill-green" style={{ width: '75%' }} />
    </div>
    <span className="metric-bar-value">75</span>
  </div>
</div>
```
Fill variants: `metric-bar-fill-primary`, `-green`, `-red`, `-orange`, `-blue`

### Copy Button
```jsx
<button className="copy-btn" onClick={handleCopy}>⎘</button>
// Đổi sang ✓ sau khi copy, reset sau 2s
```

### Segmented Control (Toggle)
```jsx
<div className="segmented">
  <button className="on">Tháng</button>
  <button>Năm</button>
</div>
```

### Onboarding Banner
```jsx
<div className="onboarding-banner">
  <div className="onboarding-banner-header">
    <div className="onboarding-banner-icon">🚀</div>
    <div><strong>Title</strong><p>Subtitle</p></div>
  </div>
  <div className="onboarding-steps">
    <div className="onboarding-step onboarding-step-done">
      <span className="onboarding-step-icon">✓</span>
      <div><strong>Step 1</strong><p>Done</p></div>
    </div>
    <div className="onboarding-step">
      <span className="onboarding-step-icon">2</span>
      <div><strong>Step 2</strong><p>Todo</p></div>
    </div>
  </div>
</div>
```

---

## 5) Pricing Page

Classes đặc biệt cho pricing:

```css
.pricing-trust-bar          /* Top bar: SSL, kích hoạt ngay, hủy bất cứ lúc nào */
.pricing-hero               /* Center-aligned hero với toggle */
.pricing-toggle-wrap        /* Wrapper chứa segmented + saving badge */
.pricing-saving-badge       /* "Tiết kiệm ~20%" badge màu xanh */
.pricing-grid               /* Grid 4 cột (1 cột trên mobile) */
.pricing-card               /* Card gói */
.pricing-card-popular       /* Card nổi bật — border tím, shadow */
.pricing-popular-badge      /* "⭐ Phổ biến nhất" badge */
.pricing-current-badge      /* "✓ Gói hiện tại" badge */
.pricing-cta                /* Button trong card */
.pricing-cta-popular        /* CTA gradient cho card popular */
.pricing-faq                /* FAQ section */
.faq-item / .faq-question / .faq-answer  /* FAQ accordion */
```

---

## 6) Keyboard Shortcuts

| Phím | Trang | Hành động |
|---|---|---|
| `/` | Analysis | Focus vào ô tìm kiếm keyword |

---

## 7) Responsive Breakpoints

```css
@media (max-width: 768px)   /* Mobile — hamburger menu, 1-col grid */
@media (max-width: 480px)   /* Small mobile — extra collapse */
```

Trên mobile:
- Navbar ẩn links, hiện hamburger
- `.grid-2/.grid-3/.grid-4` → 1 cột
- `.pricing-grid` → 1 cột, popular card lên đầu
- `.analysis-header-row` → column
- `.prompt-summary-grid` → 2 cột → 1 cột (<480px)

---

## 8) Page Transition

```css
@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-transition { animation: pageFadeIn 0.22s ease both; }
```

Trigger: mỗi khi `location.pathname` thay đổi (dùng `key={location.pathname}` trên wrapper div).

---

## 9) Font

- **Inter** — load từ Google Fonts qua `<link>` trong `index.html`
- Weights: 300, 400, 500, 600, 700, 800
- `-webkit-font-smoothing: antialiased` bật trên body
- `letter-spacing: -0.025em` cho headings
