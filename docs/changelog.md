# AISKIM — Changelog

---

## [Unreleased] — đang phát triển

### Backend

#### Security & Correctness
- `GlobalExceptionHandler` — sửa lỗi leak internal error message ra client (`ex.getMessage()` → `"Internal server error"`)
- `FrontendService.contactSales()` — thêm `@Transactional` (class-level là `readOnly=true`, method write cần override)
- `FrontendDtos.ExpertQuestionRequest` — thêm `@Size(max = 36)` cho `expertId` (UUID max 36 chars)

#### Logging & Debugging
- `SearchService` — thêm SLF4J logger, log active providers khi search (`[SEARCH] Active providers for keyword=...`)
- `SerpApiGoogleProvider` — cải thiện error logging:
  - HTTP error → log level ERROR thay vì WARN
  - Detect SerpAPI trả 200 nhưng có `error` field (key sai / hết quota) → log rõ message
  - Bỏ fallback mock data — trả empty list khi lỗi
- `SerpApiNewsProvider` — tương tự: improved error logging, bỏ fallback mock data

#### Config
- `run.ps1` — script tự load `BE/.env` + `FE/.env` (lấy `GOOGLE_CLIENT_ID`) rồi chạy Maven

---

### Frontend

#### Foundation
- `FE/.env` — tạo file với `VITE_GOOGLE_CLIENT_ID`
- `FE/vite.config.js` — thêm `host: true` (cho phép test qua LAN network); proxy target đọc từ `VITE_BACKEND_URL`
- `FE/index.html` — thêm `lang="vi"`, meta description, theme-color, Google Fonts Inter preconnect, title "AISKIM — Trí tuệ Thị trường"

#### Design System (`global.css`)
- Toàn bộ CSS variables (`:root`): brand palette, neutral scale, shadows, radius, transitions
- Body: `-webkit-font-smoothing: antialiased`, `::selection` style
- Headings: `letter-spacing: -0.025em`
- Navbar: glass morphism (`backdrop-filter: blur(14px)`, `background: rgba(255,255,255,0.88)`)
- Buttons: rewrite với active states, disabled, letter-spacing
- Inputs: transition, placeholder color
- Hero title: gradient text via `background-clip: text`

#### New Components
- `ToastContext.jsx` — toast notification system (`useToast()` → `.success/.error/.info/.warn`)
- `Skeleton.jsx` — `Skeleton`, `DashboardSkeleton`, `AnalysisSkeleton` với shimmer animation
- `PageTransition.jsx` — fade-in animation khi navigate + scroll-to-top on route change

#### Navbar (`Navbar.jsx`)
- Thêm hamburger menu cho mobile (≤768px)
- Side panel từ phải trượt vào với overlay
- Auto-close khi navigate hoặc bấm overlay
- Prevent body scroll khi menu mở

#### Login Page (`LoginPage.jsx`)
- Thêm shape thứ 3 cho background
- Trust strip: "🔒 Bảo mật SSL", "⚡ Phân tích tức thì", "🇻🇳 Dữ liệu Việt Nam"

#### Pricing Page (`PricingPage.jsx`)
- Redesign hoàn toàn từ Card-based sang pricing-specific layout
- Trust bar ở top
- Toggle hàng tháng / hàng năm với badge "Tiết kiệm ~20%"
- Popular badge, current plan badge
- Checkmark feature list thay vì bullets
- FAQ accordion (5 câu hỏi thường gặp)
- `useToast()` thay thế inline `setNotice` state
- QR payment modal được giữ nguyên

#### Dashboard (`DashboardPage.jsx`)
- `DashboardSkeleton` khi loading thay vì blank screen
- `OnboardingBanner` cho user mới (0 search + 0 report): 3 bước onboarding
- Empty state đẹp với icon cho "Hoạt động gần đây" và "Báo cáo đã lưu"
- Parallel fetch dashboard + reports

#### Analysis Page (`AnalysisPage.jsx`)
- `AnalysisSkeleton` khi `loading && !data` (lần load đầu)
- Copy-to-clipboard button (`⎘`) trên 4 InsightSection (Tổng quan, Đánh giá, Tiềm năng, Kênh)
- Phím tắt `/` — focus vào ô tìm kiếm keyword từ bất kỳ đâu
- Visual metric bars trong "Tổng quan xu hướng": bar màu theo direction (xanh=tăng, đỏ=giảm, xanh dương=ổn định)
- Visual metric bars trong "Tiềm năng thị trường": bar từ khóa theo số mention

#### Layouts
- `MainLayout.jsx`, `PublicLayout.jsx`, `SharedLayout.jsx` — thêm `PageTransition` wrapper

#### Responsive
- Grid collapse về 1 cột trên mobile
- Pricing card popular lên đầu trên mobile
- Analysis header row → column trên mobile
- `prompt-summary-grid` → 2 cột → 1 cột (<480px)

---

## Vấn đề đã biết / cần theo dõi

- `google.accounts.id.initialize() called multiple times` — Google Sign-In JS init 2 lần, không ảnh hưởng login nhưng là warning
- Google OAuth không hoạt động khi test qua LAN IP (`10.x.x.x`) — Google chỉ chấp nhận `localhost` hoặc domain thật. Workaround: dùng ngrok
- SerpAPI: khi key hết quota hoặc sai, provider trả empty list → analysis hiện "CHƯA ĐỦ DỮ LIỆU". Check log backend: `[SERPAPI_GOOGLE] API error: ...`
