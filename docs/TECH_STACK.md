# Tech stack Lunara Shop

Cập nhật **16/10/2026**. Repo `Lurana`; branding UI **Lunara Shop**. **Phase 0–5 DONE local; Phase 6 IN PROGRESS (5/7)**. [Hiện trạng và snapshot live](PROJECT_STATUS.md).

## Công nghệ và phiên bản repository

Giữ phiên bản trong package.json/package-lock.json, cài bằng `npm ci`; không nâng dependency trong lượt tài liệu này.

| Tầng | Công nghệ / hành vi |
| --- | --- |
| Frontend | React/React DOM 18.3.1, React Router 7.18.4, TypeScript 5.7.3, Vite 6.4.4, Tailwind 4.1.12, React plugin 4.7.0 |
| Backend | Hono 4.13.13, Cloudflare Workers, @cloudflare/vite-plugin 1.63.2, Wrangler 4.150.0 |
| Validation | Zod 4.6.7; root `shared/` chứa API schemas/constants, frontend bật jitless trước load schemas để chạy dưới CSP |
| Database | D1/SQLite, binding DB; 10 bảng, `migrations/0001_mvp.sql` base bất biến + `0002_category_images.sql` additive cho ảnh category; custom_requests deferred |
| i18n | i18next/react-i18next, `src/shared/i18n/`; preference → browser EN/VI → English fallback; VND/Asia/Ho_Chi_Minh không đổi theo locale |
| UI | cream/rose, font EN Fraunces 500/500 Italic (optical sizing auto) + Inter, VI Lora/Be Vietnam Pro; Button/Input/Dialog và Lucide |
| Media | Cloudinary signed direct upload, cookie admin + same-origin JSON, SHA-256 params server-owned; browser upload rồi Save image.url |
| Auth | Một admin từ secret, SHA-256/timingSafeEqual, hono/jwt HS256 cookie HttpOnly/Strict/12h; Secure trên HTTPS; không credentials/JWT trong browser storage |
| Chống bot | Turnstile fail-closed checkout/lookup/admin-login; thiếu secret503, controlled loopback opt-in only; kiểm action/hostname; RateLimit bindings riêng prod/staging; cap 3 PENDING/SĐT trong INSERT atomic |
| Scheduled | TTL 24h, Cron mỗi giờ; batch D1 3 statements ghi SYSTEM/restock/CANCELLED, không hủy đơn đã xác nhận/hoàn tồn lặp |
| SEO/bảo mật | Vite metadata Home/Shop, MetadataLayout cho client routes, canonical/OG/robots/sitemap; static _headers CSP/noindex; chưa prerender catalog/trang sản phẩm |
| Tooling | CodeGraph1.5.0 local; Node24.11.1/npm11.6.3 là môi trường đã kiểm; scripts architecture/typecheck/tests/smoke/UI |

## Kiến trúc và ownership

`pages → features → shared`; cross-feature qua index.ts. Pages ghép hooks/views, services gọi API client cùng origin; component không fetch trực tiếp. Router duy nhất `src/app/router.tsx`, MetadataLayout bọc routes, AppProviders ghép i18n/auth/catalog/cart. API Worker là ranh giới quyền; AdminRoute chỉ bảo vệ điều hướng UI.

CatalogProvider tải snapshot API không fixture fallback. CartProvider sở hữu lines theo variant ID; localStorage `lunara.cart.v1` chỉ variantId/quantity. Quote đọc giá/phí/tồn và không reserve stock. Checkout contact/intent/token chỉ ở memory; UUID giữ khi retry cùng payload, token lấy mới mỗi attempt. Confirmation chỉ từ API response. Wishlist/customer auth/profile/custom request/admin customers/settings/notifications source giữ nhưng ẩn, API-ready gate false.

Admin dùng stock_delta atomic; PATCH chỉ dirty fields. NETWORK/TIMEOUT/BAD_RESPONSE/INTERNAL có thể đã commit: xóa delta, khóa row, GET recheck thành công rồi mới nhập điều chỉnh mới. Không tự retry stock write hoặc product create. IN_TRANSIT hủy phải có lý do, restock mặc định false; early states mặc định true, CANCELLED terminal.

Catalog/admin products/summary ≤3 D1 statements; 15 dòng order success35/diagnostic36, toàn bộ retries≤40. Summary30 ngày lịch VN; orders mặc định90, tối đa366 ngày khi có cặp ngày đặt, q2–100 nếu khác rỗng, offset≤10000. Dùng raw ranges trên idx_orders_placed_at cho hai dạng UTC.

## Build, môi trường và secrets

| Môi trường | Frontend | Worker / database |
| --- | --- | --- |
| Local | Vite dev/preview `127.0.0.1` | `remoteBindings:false`, D1 local |
| Production | `.env.production`, Site key production/origin production/indexable | `lunara` / `lunara-db` |
| Staging | `.env.staging`, Site key staging/origin staging/noindex; Vite --mode staging | `lunara-staging` / `lunara-staging-db` |

Deploy commands: `npm run deploy` và `npm run deploy:staging`, đều build mới. Staging script chọn CLOUDFLARE_ENV và kiểm UUID trước/sau build. Output dùng chung `dist/client/` và `dist/lunara/`, chạy tuần tự. Env terminal/`.env*.local` có thể override public config. [Staging](STAGING.md).

TURNSTILE_SECRET và Cloudinary API secrets chỉ ở Worker, nhập riêng từng môi trường, không nhập lại mỗi deploy. Hai widget dùng hai cặp Site/Secret key đúng hostname. .dev.vars local ignored, .dev.vars.example chỉ demo. Không đọc password local để kiểm chứng production.

Snapshot 16/10: production còn version15/10; staging đã deploy bản mới13:31, có CSP/SEO/rate-limit/TTL/scheduled handler và Cloudinary config. Cả hai thiếu TURNSTILE_SECRET. Có binding/secret name không thay nghiệm thu runtime thật; [chi tiết](PROJECT_STATUS.md#snapshot-remote-chỉ-đọc--16102026).

## Kiểm chứng và giới hạn

Bản fail-closed mới16/10: Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 hiện local/chưa deploy. Tests170 PASS; header live kiểm độc lập22phản hồi, native verifier3cấu hình PASS. [Chi tiết](HARDENING.md#turnstile-fail-closed-và-header-live-16102026).

Local gần nhất: typecheck/architecture 215/tests 166/build/dry-run hai môi trường PASS; smoke 40/40, persisted D1 giữ nguyên. Các số 125/136/143/148/150/158/160 tests là mốc cũ, không cộng hoặc dùng thay current count. Pipeline giữ nguyên output lịch sử.

UI Phase 5 đầy đủ tại mốc cũ:17 routes/0 exceptions,10/10 MVP+2/2 extended. Hardening UI/mock/test-key đã pass targeted; responsive rộng còn tràn Shop320px, chưa nghiệm thu lại toàn suite. CPU cloud/quota/challenge thật/upload thật/Cron thực chạy chưa được xác minh đầy đủ. Không dùng evidence local để kết Phase 6.

Workers Free tham chiếu100.000 request/ngày,10ms CPU/request; D1 50 queries/invocation,5 triệu rows read/100.000 written/ngày,500MB/database,5GB/account. Đối chiếu lại nguồn chính thức16/10; quota thực tế account cần owner kiểm. [Workers](https://developers.cloudflare.com/workers/platform/limits/) · [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) · [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Dữ liệu seed, delivery surcharges0/30.000/50.000, cutoff16:00, preparation120 phút/slots08:00–20:00 vẫn cần owner chốt cho mở bán. Không thêm DDL/dependency/provider ngoài yêu cầu.

[Guide](../PROJECT_GUIDE.md) · [Database](DATABASE_DESIGN.md) · [Entities](FRONTEND_ENTITIES.md) · [API](pipeline/API_CONTRACT.md) · [Operations](OPERATIONS.md) · [Hardening](HARDENING.md).

UI Home local16/10 tham chiếu cấu trúc Stitch 14566722138013174841; dùng React/Tailwind hiện có, palette brand.css, chung ProductGrid/ProductCard với Shop. Ảnh trang trí trống; ảnh/mô tả sản phẩm từ D1. Header dùng React Router Form GET; useProducts nhận q/category từ URL. Không thêm UI stack/dependency.

Hero asset local16/10: import WebP tĩnh từ src/assets/hero (640/960/1440), Vite content hash, srcset/sizes và fetchPriority high; tsconfig frontend nạp vite/client để khai báo module ảnh. Không thêm dependency; cwebp có sẵn chỉ dùng để tạo derivative, build không yêu cầu cwebp. Ba file ảnh có allowlist chính xác. Hero dùng ảnh AI được chủ shop chấp thuận, category/trang trí khác giữ trống.

Ảnh category: public WebP256px với URL revisioned lưu D1 categories.image_url, GET categories trả nullable; không Cloudinary key/dependency mới. Test/harness SQLite/workerd áp cả migration0001+0002. Local172 tests,architecture215,db:verify13/13,smoke40 PASS; ảnh256px tải thật ở10 case EN/VI/5viewport. [Runbook](CATEGORY_IMAGES.md).

Staging đã deploy version `75fcbb54-5528-4cc1-b101-22fdc7a91a40`;APIcategory+ảnh publiclive và browser10casePASS.Production chưa migrate0002 hoặc deploy lần này;không thêm dependency.
