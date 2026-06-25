# AISKIM — AI Context (bản đồ dự án để vibe code nhanh)

Tài liệu này là "bản đồ dự án" cho những lần code tiếp theo: công nghệ đang dùng, ý tưởng sản phẩm, kiến trúc FE/BE, và danh sách routes/endpoints đang có trong code.

---

## 1) Ý tưởng dự án

AISKIM là web app **market intelligence / research assistant**.

Người dùng nhập **keyword**, hệ thống sẽ:
- Thu thập tín hiệu từ nhiều nguồn (Google/News qua SerpApi, YouTube Data API)
- Normalize về format chung
- Tổng hợp thành **market snapshot** (insights, keywords, timeline…)
- Cho phép tạo **deep insight** từ dữ liệu và **report**
- Có các màn admin (users/revenue/reports/feedbacks/settings)

Mục tiêu: app market research chuyên nghiệp, thu hút người dùng Việt Nam, UI thân thiện và trustworthy.

---

## 2) Tech stack

### Frontend (FE/)
- React `19.x`
- Vite `8.x` (dev server port 5173, `host: true` để test qua network)
- React Router `7.x`
- Fetch API + wrapper tại `src/services/appApi.js`
- CSS thuần (không dùng Tailwind/MUI) — design tokens tại `src/styles/global.css`

### Backend (BE/)
- Java `21`
- Spring Boot `3.3.3`
- Spring Web, Validation, Spring Data JPA, Spring Security
- JWT (`io.jsonwebtoken:jjwt`)
- PostgreSQL (Supabase, port 6543, connection pooler)
- Maven build — chạy qua `run.ps1`

### Integrations
- **SerpApi** — Google Search + Google News (key: `SERPAPI_API_KEY`)
- **YouTube Data API** — search → videos.list → channels.list (key: `YOUTUBE_API_KEY`)
- **Gemini** — deep insight & live trends (key: `GEMINI_API_KEY` + `GEMINI_MODEL`)
- **Google OAuth** — đăng nhập bằng Google (key: `GOOGLE_CLIENT_ID`)
- **Stripe** — checkout (key: `STRIPE_SECRET_KEY`, optional)
- **VietQR / Bank transfer** — thanh toán QR nội địa

---

## 3) Kiến trúc tổng quan

```
FE (React/Vite :5173) → [Vite proxy /api] → BE (Spring Boot :8080) → PostgreSQL (Supabase)
```

Nguyên tắc:
- FE chỉ gọi **DTO chuẩn** từ BE qua `appApi.js`, không gọi fetch trực tiếp ở page
- BE dùng **provider pattern** để mở rộng nguồn dữ liệu
- Auth dùng JWT (FE lưu session vào localStorage key `skimai_auth`)
- Không có mock API — chỉ dùng real backend

---

## 4) Frontend — cấu trúc file

```
FE/src/
├── App.jsx                        # Entry — chỉ render AppRouter
├── main.jsx                       # Root — AuthProvider > ToastProvider > App
├── routes/
│   ├── AppRouter.jsx              # Route definitions (Public/Shared/Private/Admin)
│   └── PrivateRoute.jsx           # Guard — redirect về /login nếu chưa auth
├── layouts/
│   ├── MainLayout.jsx             # Navbar + PageTransition + Outlet (private pages)
│   ├── PublicLayout.jsx           # Navbar + PageTransition + Outlet (public pages)
│   └── SharedLayout.jsx           # Navbar + PageTransition + Outlet (shared pages)
├── context/
│   ├── AuthContext.jsx            # useAuth() — user, token, login, logout
│   └── ToastContext.jsx           # useToast() — toast.success/error/info/warn
├── components/
│   ├── Button.jsx                 # Reusable button
│   ├── Card.jsx                   # Reusable card container
│   ├── Navbar.jsx                 # App header + mobile hamburger menu
│   ├── Skeleton.jsx               # DashboardSkeleton, AnalysisSkeleton
│   ├── PageTransition.jsx         # Fade-in animation + scroll-to-top on route change
│   ├── Effects.jsx                # AnimatedNumber, TypewriterText
│   └── AdminSectionNav.jsx        # Admin section navigation
├── pages/
│   ├── Login/LoginPage.jsx        # Google OAuth login + trust strip
│   ├── Home/HomePage.jsx          # Trang chủ public
│   ├── Dashboard/DashboardPage.jsx # Workspace — skeleton + onboarding banner
│   ├── Analysis/AnalysisPage.jsx   # Trang phân tích chính — streaming SSE
│   ├── DeepInsight/DeepInsightPage.jsx
│   ├── Pricing/PricingPage.jsx    # Redesign — trust bar, FAQ, toggle cycle
│   ├── Account/AccountPage.jsx
│   ├── Support/SupportPage.jsx
│   ├── NotFound/NotFoundPage.jsx
│   └── Admin*/                    # AdminDashboard, Reports, Users, Revenue, Feedbacks, Settings
├── services/
│   └── appApi.js                  # Tất cả API calls — không gọi fetch trực tiếp ở page
├── hooks/
│   └── useAuth.js                 # Shortcut hook cho AuthContext
├── constants/
│   └── routes.js                  # ROUTES object — tất cả path constants
└── styles/
    └── global.css                 # Toàn bộ CSS — design tokens + component styles
```

---

## 5) Frontend — routes

| Path | Layout | Auth | Component |
|---|---|---|---|
| `/` | PublicLayout | Guest | HomePage |
| `/pricing` | PublicLayout | Guest | PricingPage |
| `/analysis` | SharedLayout | Guest/User | AnalysisPage |
| `/deep-insight` | SharedLayout | Guest/User | DeepInsightPage |
| `/support` | SharedLayout | Guest/User | SupportPage |
| `/login` | — | Guest | LoginPage |
| `/dashboard` | MainLayout | Private | DashboardPage |
| `/account` | MainLayout | Private | AccountPage |
| `/admin/dashboard` | MainLayout | Admin | AdminDashboardPage |
| `/admin/reports` | MainLayout | Admin | AdminReportsPage |
| `/admin/users` | MainLayout | Admin | AdminUsersPage |
| `/admin/revenue` | MainLayout | Admin | AdminRevenuePage |
| `/admin/feedbacks` | MainLayout | Admin | AdminFeedbacksPage |
| `/admin/settings` | MainLayout | Admin | AdminSettingsPage |

---

## 6) Backend — package structure

```
com.researchco/
├── ResearchcoBackendApplication.java
├── auth/           # AuthController, AuthService, AuthDtos
├── frontend/       # FrontendController, FrontendService, FrontendDtos, StreamingAnalysisService
├── search/         # SearchController, SearchService, SearchDtos, entities, repositories
├── snapshot/       # SnapshotController, SnapshotService, SnapshotDtos, entities
├── report/         # ReportController, ReportService, ReportDtos, entities
├── admin/          # AdminController, AdminService, AdminDtos, SystemSetting entities
├── home/           # HomeController, HomeService, HomeDtos, MarketTrend entities
├── provider/       # SearchProvider interface, ProviderOrchestrator, NormalizedSourceItem
│   ├── SerpApiGoogleProvider.java
│   ├── SerpApiNewsProvider.java
│   ├── YoutubeApiProvider.java
│   └── ai/         # AiProvider interface, DefaultAiProvider
├── user/           # UserEntity, UserRepository
├── subscription/   # UserSubscriptionEntity, UserSubscriptionRepository
├── payment/        # PaymentTransactionEntity, PaymentTransactionRepository
├── sales/          # SalesLeadEntity, SalesLeadRepository
├── plan/           # PlanEntity, PlanRepository
├── feedback/       # SupportFeedbackController, SupportFeedbackEntity
├── usage/          # AiUsageEntity, AiUsageRepository
├── security/       # JwtAuthFilter, JwtTokenService, SecurityUtils, CustomUserDetailsService
├── config/         # SecurityConfig, DotEnvPostProcessor, EnvironmentLoader
└── common/         # GlobalExceptionHandler, AppException, BaseEntity, DemoDataInitializer
```

---

## 7) Backend — API endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Frontend API
- `GET /api/dashboard`
- `GET /api/account/overview`
- `PUT /api/account/notifications`
- `GET /api/analysis?keyword=`
- `GET /api/analysis/stream?keyword=` (SSE streaming)
- `GET /api/analysis/evidence?keyword=`
- `GET /api/analysis/timeline?keyword=`
- `GET /api/analysis/export?keyword=`
- `POST /api/deep-insight`
- `GET /api/pricing`
- `POST /api/pricing/checkout`
- `POST /api/pricing/confirm`
- `POST /api/pricing/contact-sales`
- `GET /api/experts`
- `POST /api/experts/questions`

### Search / Snapshots / Reports
- `POST /api/search`
- `GET /api/search/history`
- `GET /api/snapshots/{id}`
- `POST /api/reports`
- `GET /api/reports`

### Home
- `GET /api/home/trends`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/reports`
- `POST /api/admin/reports/{id}/moderate`
- `GET /api/admin/users`
- `GET /api/admin/revenue`
- `GET /api/admin/feedbacks`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

### Support
- `POST /api/support/feedback`

---

## 8) Provider pattern

Interface: `com.researchco.provider.SearchProvider`
```java
String providerCode()
List<NormalizedSourceItem> search(keyword, countryCode, languageCode, timeRange)
```

`NormalizedSourceItem` fields: `providerCode`, `platform`, `contentType`, `title`, `snippet`, `url`, `sourceName`, `authorName`, `publishedAt`, `sentiment`, `rawPayload`

`ProviderOrchestrator.aggregate(activeProviderCodes, ...)` — chạy parallel, catch exception per provider.

Providers đã implement:
- `SERPAPI_GOOGLE` — Google organic results, fallback về empty list nếu lỗi (không mock)
- `SERPAPI_NEWS` — Google News results, fallback về empty list nếu lỗi
- `YOUTUBE` — search + videos.list + channels.list, enrich rawPayload

Provider active/inactive được quản lý qua bảng `search_providers` trong DB.

---

## 9) Biến môi trường

### FE (`FE/.env`)
```
VITE_GOOGLE_CLIENT_ID=<google_oauth_client_id>
```

### BE (`BE/.env`)
```
# Database (Supabase)
SUPABASE_DB_HOST=
SUPABASE_DB_PORT=6543
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USERNAME=postgres.<project_ref>
SUPABASE_DB_PASSWORD=

# Auth
JWT_SECRET=
JWT_EXPIRATION_MS=86400000

# Google OAuth
GOOGLE_CLIENT_ID=   (auto-loaded từ FE/.env nếu không set)

# Search providers
SERPAPI_API_KEY=
YOUTUBE_API_KEY=

# AI
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Payment (optional)
STRIPE_SECRET_KEY=
```

---

## 10) Run locally

### Frontend
```powershell
cd FE
npm install
npm run dev
# → http://localhost:5173 (local)
# → http://<LAN_IP>:5173 (network, host: true đã bật)
```

### Backend
```powershell
cd BE
.\run.ps1     # load .env rồi chạy mvn spring-boot:run
# → http://localhost:8080
```

Khi thay đổi code BE, cần chạy `mvn clean compile` trước nếu Maven không tự detect:
```powershell
cd BE; mvn clean compile -DskipTests; .\run.ps1
```

---

## 11) Nguyên tắc khi thêm feature

1. FE page gọi `appApi.<method>()` — không gọi `fetch` trực tiếp ở page
2. Backend: thêm endpoint ở `FrontendController` + `FrontendService` + DTOs
3. Provider: luôn normalize về `NormalizedSourceItem` — không leak raw payload lên FE
4. CSS: dùng CSS variables từ `:root` trong `global.css` — không hardcode màu
5. Toast: dùng `useToast()` thay vì `alert()` hoặc inline notice state
6. Loading: dùng `DashboardSkeleton` / `AnalysisSkeleton` thay vì spinner đơn giản
