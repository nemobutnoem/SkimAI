# SkimAI / ResearchCo — AI Context (để vibe code nhanh)

Tài liệu này là “bản đồ dự án” cho những lần code tiếp theo: công nghệ đang dùng, ý tưởng sản phẩm, kiến trúc FE/BE, mock switch, và danh sách routes/endpoints đang có trong code.

---

## 1) Ý tưởng dự án (Product idea)

SkimAI là web app **market intelligence / research assistant**.

Người dùng nhập **keyword**, hệ thống sẽ:
- thu thập tín hiệu từ nhiều nguồn (Google/News qua SerpApi, YouTube Data API)
- normalize về format chung
- tổng hợp thành **market snapshot** (insights, keywords, timeline…)
- cho phép tạo **deep insight** (AI/generative) và **report**
- có các màn admin (users/revenue/reports)

Mục tiêu MVP: chạy end‑to‑end ổn định (fetch → normalize → analysis UI), kiến trúc đủ mở để thêm provider / endpoint mới.

---

## 2) Tech stack (đúng theo repo hiện tại)

### Frontend (SkimAI/FE)
- React `19.x`
- Vite `8.x`
- React Router `7.x`
- Fetch API + 1 lớp wrapper ở `src/services/appApi.js`
- Mock API tổng hợp ở `src/services/mockApi.js` (bật/tắt qua env)

### Backend (SkimAI/BE)
- Java `17`
- Spring Boot `3.3.3`
- Spring Web, Validation, Spring Data JPA, Spring Security
- JWT (`io.jsonwebtoken:jjwt`)
- PostgreSQL driver (runtime)
- Maven build

### Integrations
- SerpApi (Google + News)
- YouTube Data API (search → videos.list → channels.list)
- Gemini (Generative Language API) cho deep insight & “live trends” (optional: không có key thì fallback)
- Stripe (checkout/confirm) (optional: không có key thì endpoint sẽ fallback/giảm chức năng tuỳ service)

---

## 3) Kiến trúc tổng quan

FE (React/Vite) → BE (Spring Boot REST) → PostgreSQL

Nguyên tắc:
- FE chỉ gọi **DTO chuẩn** từ BE, không phụ thuộc raw payload của provider.
- BE dùng **provider pattern** để mở rộng nguồn dữ liệu.
- Auth dùng JWT (FE lưu session vào localStorage).

---

## 4) Frontend structure & routes

### Pages / routes
Router nằm ở `FE/src/routes/AppRouter.jsx`.

Public:
- `/` (Home) — nếu user là admin thì redirect sang `/admin/dashboard`
- `/pricing`

Shared (guest hoặc logged-in đều vào được):
- `/analysis`
- `/deep-insight`
- `/ask-expert`

Private (cần login):
- `/dashboard`
- `/account`

Admin (cần role `admin`):
- `/admin/dashboard`
- `/admin/reports`
- `/admin/users`
- `/admin/revenue`
- `/admin/settings`

### Auth model trên FE
- Session được lưu ở localStorage key: `skimai_auth`
- `AuthProvider` coi authenticated khi có đủ `user` và `token`.
- API wrapper auto gắn header `Authorization: Bearer <token>` nếu có token.

---

## 5) Mock-data architecture (để dev nhanh)

Điểm vào duy nhất là `FE/src/services/appApi.js`:
- Nếu `VITE_USE_MOCK_API=true` ⇒ dùng `mockApi` (từ `src/services/mockApi.js`).
- Nếu `VITE_USE_MOCK_API=false` ⇒ dùng real backend qua `fetch`.

Lưu ý quan trọng:
- `VITE_API_URL` phải là **base đã có `/api`** (vì code gọi `request('/auth/login')` và sẽ nối thẳng vào base).
	- Ví dụ đúng: `http://localhost:8080/api` hoặc `https://<host>/api`

---

## 6) Backend endpoints hiện có (controllers)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Home
- `GET /api/home/trends`

### Frontend API (phục vụ UI screens)
- `GET /api/dashboard`
- `GET /api/account/overview`
- `PUT /api/account/notifications`

- `GET /api/analysis?keyword=...`
- `GET /api/analysis/project?keyword=...`
- `GET /api/analysis/alerts?keyword=...`
- `GET /api/analysis/competitor?keyword=...`
- `GET /api/analysis/evidence?keyword=...`
- `GET /api/analysis/compare?keyword=...`
- `GET /api/analysis/timeline?keyword=...`

- `POST /api/deep-insight`

- `GET /api/experts`
- `POST /api/experts/questions`

- `GET /api/pricing`
- `POST /api/pricing/checkout`
- `POST /api/pricing/contact-sales`
- `POST /api/pricing/confirm`

### Search / snapshots / reports
- `POST /api/search`
- `GET /api/search/{id}/sources`
- `GET /api/search/history`

- `GET /api/snapshots/{id}`

- `POST /api/reports` (tạo report)

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/reports?status=all|...`
- `POST /api/admin/reports/{reportId}/moderate`
- `GET /api/admin/users?q=&type=&status=`
- `GET /api/admin/revenue`

Ghi chú: `SecurityConfig` hiện đang `permitAll` cho khá nhiều `/api/*` routes (FE vẫn tự chặn bằng `PrivateRoute`). Nếu muốn “đúng bài” (backend enforce auth/role), cần tightening rules sau.

---

## 7) Provider pattern (SearchProvider)

Interface: `com.researchco.provider.SearchProvider`
- `providerCode()`
- `search(keyword, countryCode, languageCode, timeRange)`

Output normalize: `NormalizedSourceItem` (providerCode/platform/contentType/title/snippet/url/sourceName/authorName/publishedAt/sentiment/rawPayload).

Orchestrator: `ProviderOrchestrator.aggregate(activeProviderCodes, ...)`.

Providers đã có trong code:
- SerpApi Google
- SerpApi News
- YouTube API (enrich thêm view/like/comment/subscriber + duration/tags/topicCategories vào `rawPayload`)

---

## 8) Biến môi trường (env vars)

### FE (.env)
- `VITE_USE_MOCK_API` = `true|false`
- `VITE_API_URL` = `http://localhost:8080/api` (hoặc URL production có `/api`)

### BE (Render/Local env)
- DB (chọn 1 trong 2 cách):
	- Cách A (theo placeholder trong `application.yml`): `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
	- Cách B (chuẩn Spring Boot, hay dùng trên Render): `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`

- `JWT_SECRET`
- `JWT_EXPIRATION_MS` (optional)

- `SERPAPI_API_KEY` (optional nhưng cần để lấy Google/News)
- `YOUTUBE_API_KEY` (optional)
- `GEMINI_API_KEY` + `GEMINI_MODEL` (optional; thiếu key thì deep insight/trends fallback)
- `STRIPE_SECRET_KEY` (optional)

---

## 9) Dev workflow (quick start)

### Run FE
- `cd SkimAI/FE`
- `npm install`
- `npm run dev`

### Run BE
- `cd SkimAI/BE`
- set env vars (ít nhất DB + JWT_SECRET)
- `mvn spring-boot:run`

---

## 10) “How to vibe code” (nguyên tắc khi sửa nhanh)

Khi thêm/sửa 1 feature, ưu tiên theo thứ tự:
1) FE page gọi `appApi.<method>()` (không gọi `fetch` trực tiếp ở page)
2) Nếu là mock flow: thêm vào `src/services/mock/*` rồi export qua `mockApi`
3) Nếu là backend flow: thêm endpoint ở BE controller/service + DTOs rõ ràng
4) Provider: luôn normalize về `NormalizedSourceItem` (không leak raw)

Nếu cần “thêm API mới”, hãy bắt đầu bằng việc:
- cập nhật `appApi.js` (1 method mới)
- tạo controller method ở BE (GET/POST) và DTO request/response
- (tuỳ) mock version tương ứng để FE dev không bị block.