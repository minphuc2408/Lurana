# Tech stack Lunarra

Đối chiếu source ngày **17/10/2026**. Tài liệu này mô tả công nghệ, kiến trúc kỹ thuật và build; trạng thái triển khai/nghiệm thu nằm tại [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Công nghệ và phiên bản repository

Các phiên bản dưới đây lấy từ `package-lock.json`. Một số khai báo trong `package.json` dùng dải `^`; dùng `npm ci` để tái lập đúng lockfile và giữ `.npmrc` với `ignore-scripts=true`.

| Tầng | Công nghệ / hành vi |
| --- | --- |
| Frontend | React/React DOM 18.3.1, React Router 7.18.4, TypeScript 5.7.3, Vite 6.4.4, Tailwind 4.1.12, React plugin 4.7.0 |
| Backend | Hono 4.13.13, Cloudflare Workers, @cloudflare/vite-plugin 1.63.2, Wrangler 4.150.0 |
| Validation | Zod 4.6.7; root `shared/` chứa API schemas/constants, frontend bật jitless trước load schemas để chạy dưới CSP |
| Database | D1/SQLite, binding DB; chuỗi migration tạo 12 bảng: base 10 bảng bất biến, mở rộng ảnh category và 2 bảng hành chính; [thiết kế schema](DATABASE_DESIGN.md) |
| i18n | i18next/react-i18next, `src/shared/i18n/`; preference → browser EN/VI → English fallback; VND/Asia/Ho_Chi_Minh không đổi theo locale |
| UI | cream/rose, font EN Fraunces 500/500 Italic (optical sizing auto) + Inter, VI Lora Regular 400/Be Vietnam Pro, html và sans/serif kế thừa token locale; Button/Input/Dialog/Dropdown (Radix Select)/Combobox tìm không dấu và Lucide |
| Media | Cloudinary signed direct upload, cookie admin + same-origin JSON, SHA-256 params server-owned; browser upload rồi Save image.url |
| Auth | Một admin từ secret, SHA-256/timingSafeEqual, hono/jwt HS256 cookie HttpOnly/Strict/12h; Secure trên HTTPS; không credentials/JWT trong browser storage |
| Chống bot | Turnstile widget + Siteverify fail-closed, Worker RateLimit bindings riêng production/staging; [cấu hình và giới hạn](BOT_PROTECTION.md) |
| Scheduled | Worker scheduled handler xử lý expiry; TTL/Cron lấy từ cấu hình môi trường |
| SEO/bảo mật | Vite phát HTML metadata Home/Shop/About; MetadataLayout cập nhật client routes, canonical/OG/robots/sitemap; static _headers CSP, staging noindex; chưa prerender nội dung catalog/sản phẩm |
| Tooling | CodeGraph 1.5.0 là dependency hỗ trợ điều hướng local; scripts architecture/typecheck/tests/smoke/UI |

## Kiến trúc và ownership

Danh mục hành chính ở hai bảng D1; admin nhận danh mục đầy đủ, public options JOIN các zone active thuộc danh mục. Checkout không dùng JSON runtime. Quy tắc coverage và thao tác quản trị: [DELIVERY_ADDRESS.md](DELIVERY_ADDRESS.md).

`pages → features → shared`; cross-feature qua index.ts. Pages ghép hooks/views, services gọi API client cùng origin; component không fetch trực tiếp. Router duy nhất `src/app/router.tsx`, MetadataLayout bọc routes, AppProviders ghép i18n/auth/catalog/cart. API Worker là ranh giới quyền; AdminRoute chỉ bảo vệ điều hướng UI.

CatalogProvider giữ snapshot API; CartProvider sở hữu giỏ theo variant ID, CheckoutFlowProvider giữ draft trong nhóm `/cart`–`/checkout`. Các feature deferred vẫn giữ source sau gate API readiness. [Frontend entities](FRONTEND_ENTITIES.md) mô tả DTO, persistence và vòng đời state.

Worker dùng prepared statements và D1 batch cho các thay đổi cần nguyên tử. [API contract](pipeline/API_CONTRACT.md) giữ request/response và giới hạn, [Database](DATABASE_DESIGN.md) giữ bất biến lưu trữ.

## Build, môi trường và secrets

| Môi trường | Frontend | Worker / database |
| --- | --- | --- |
| Local | Vite dev/preview `127.0.0.1` | `remoteBindings:false`, D1 local |
| Production | `.env.production`, Site key production/origin production/indexable | `lunara` / `lunara-db` |
| Staging | `.env.staging`, Site key staging/origin staging/noindex; Vite --mode staging | `lunara-staging` / `lunara-staging-db` |

Deploy commands: `npm run deploy` và `npm run deploy:staging`, đều build mới. Staging script chọn CLOUDFLARE_ENV và kiểm UUID trước/sau build. Output dùng chung `dist/client/` và `dist/lunara/`, chạy tuần tự. Env terminal/`.env*.local` có thể override public config. [Staging](STAGING.md).

TURNSTILE_SECRET và Cloudinary API secrets chỉ ở Worker, nhập riêng từng môi trường, không nhập lại mỗi deploy. Production và staging dùng cặp Site/Secret key riêng, đúng hostname cho các widget checkout/lookup/admin-login. .dev.vars local ignored, .dev.vars.example chỉ demo. Không đọc password local để kiểm chứng production.

## Media, metadata và kiểm tra

- Hero import WebP 640/960/1440 từ `src/assets/hero`; Vite phát URL có content hash. Ảnh category dùng public WebP 256px với URL revisioned trong D1. Nguồn ảnh/dữ liệu: [ATTRIBUTIONS.md](../ATTRIBUTIONS.md).
- Cloudinary upload trực tiếp từ browser theo ticket ký bởi Worker; gallery tối đa 8 ảnh dùng bảng hiện có. Quy trình và giới hạn provider ở [CLOUDINARY.md](CLOUDINARY.md).
- `publicSeoPaths` chỉ gồm Home/Shop; About có metadata riêng nhưng noindex, sản phẩm có metadata client khi nhận DTO. `public/_headers` áp cho static assets; API dùng middleware `secureHeaders`, không thừa hưởng `_headers`.
- Source Wrangler khai báo TTL 24 giờ/Cron mỗi giờ, RateLimit và Cloudinary vars cho cả production/staging; cấu hình source không chứng minh cloud đang chạy cùng version hoặc provider đã nghiệm thu.

`npm run typecheck` kiểm frontend và Worker riêng; `npm run check:architecture` kiểm ranh giới source; `npm test` chạy Node tests; `npm run build` tạo cả client và Worker. `npm run cf:typegen` tạo lại Worker types sau khi thay binding. Smoke và browser harness: [Guide](../PROJECT_GUIDE.md), [FE audit](pipeline/FE_AUDIT.md). Kết quả kiểm chứng hiện hành chỉ ghi ở [PROJECT_STATUS.md](PROJECT_STATUS.md).
