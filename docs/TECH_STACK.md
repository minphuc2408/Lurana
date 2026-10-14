# Tech stack Lunara

Chốt hướng MVP ngày **14/10/2026**. Thương hiệu: **Lunara**; repository: **Lurana**. Phase 0 bổ sung Worker và health API local; Phase 1 thêm schema, seed và verifier D1 local; Phase 2 thêm catalog, phí giao và quote từ DB. Storefront/admin vẫn dùng dữ liệu demo. Chủ dự án đã đăng ký Cloudflare, đăng nhập Wrangler và tạo D1 remote `lunara-db`; Phase 0–2 không truy cập hoặc tạo tài nguyên remote.

**Trạng thái:** Phase 0 DONE · Phase 1 database local ([nghiệm thu](pipeline/PHASE_1_DATABASE.md)) · Phase 2 API local DONE ([nghiệm thu](pipeline/PHASE_2_API_CATALOG.md)) · Phase 3–6 PLANNED · commerce UI demo. [Hiện trạng / việc còn thiếu](PROJECT_STATUS.md).

## Công nghệ

| Tầng | Công nghệ | Vai trò và trạng thái |
| --- | --- | --- |
| Frontend | React 18, TypeScript, React Router 7, Vite 6, Tailwind CSS 4 | Storefront/Admin theo `src/features/*`; đã có |
| i18n | `i18next` + `react-i18next`, JSON EN/VI | `src/shared/i18n/`; mặc định và fallback English; dữ liệu sản phẩm dùng `name_en/name_vi` |
| Browser storage | `localStorage`, `sessionStorage` | Hiện lưu ngôn ngữ và session demo; Phase 5 dự kiến cart guest localStorage, wishlist ngoài pipeline MVP |
| API/runtime | Hono + Cloudflare Workers + `@cloudflare/vite-plugin` | Health, JSON API 404, categories/products/detail, delivery options và checkout quote đã có local; đặt đơn/tồn/admin chưa triển khai |
| Validation/truy vấn | Zod + SQL tham số hóa | Root `shared/` giữ schema/constants; validator Hono, errors/middleware và pricing DB-only có ở Phase 2; catalog ≤3 truy vấn, quote 2 truy vấn |
| Database | Cloudflare D1 (SQLite) | Binding `DB` local; [migration canonical](../migrations/0001_mvp.sql) có 10 bảng, seed dev và `db:verify` 13 nhóm. Remote chưa truy cập; `custom_requests` deferred |
| Media | Cloudinary | Chưa tích hợp; MVP dán URL ảnh, upload/resize/CDN làm sau |
| Hạ tầng | Cloudflare DNS/CDN/SSL, Turnstile + rate limit | Chưa cấu hình/deploy; tài khoản đã có, cấu hình ở Phase 6 khi được yêu cầu |
| Auth | Admin secret + JWT cookie (pipeline MVP); auth khách để sau | Chưa triển khai; quyền phải kiểm tra tại API. Better Auth cần review schema khi làm auth khách |

Giữ các phiên bản frontend đã pin trong `package.json`/lockfile. Hono chạy cùng Vite qua Cloudflare plugin với `remoteBindings: false`; plugin tự quản lý assets directory. `npm run typecheck` kiểm tra frontend và Worker riêng; `npm run cf:typegen` sinh binding types. Cart hiện ở CartProvider, reload reset; wishlist Shop/Profile chưa dùng chung. Persistence của MVP là việc cần triển khai.

## Luồng MVP — kế hoạch

- Storefront → Workers/Hono → D1: đọc catalog, kiểm tra dữ liệu, tính lại giá/phí từ server, ghi đơn COD và cập nhật tồn nguyên tử. Đơn giữ snapshot sản phẩm/người nhận.
- MVP admin dán URL ảnh; upload Cloudinary làm sau. Khi triển khai: Admin → Cloudinary → Workers → D1, upload bằng **Unsigned Upload Preset** có giới hạn định dạng/dung lượng; API chỉ cho admin ghi metadata ảnh. Preset công khai không thay xác thực. Xóa ảnh cần request xác thực phía server. [Cloudinary upload](https://cloudinary.com/documentation/client_side_uploading).
- Ảnh được giao trực tiếp từ Cloudinary CDN; dùng URL resize + `q_auto,f_auto`. WebP/AVIF phụ thuộc trình duyệt và cấu hình Cloudinary. [Tối ưu ảnh](https://cloudinary.com/documentation/image_optimization).
- Checkout/admin login dự kiến gửi Turnstile token; Worker xác minh bằng Siteverify, kết hợp rate limit. Wizard/request ngoài MVP. [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Giả định sizing trong pipeline: Workers Free **100.000 requests/ngày, 10 ms CPU/request**, D1 **50 queries/request**. Đây là tham số kế hoạch; kiểm tra tài liệu/hạn mức gói thực tế trước deploy. Không coi lượt kiểm chứng local là xác nhận quota/chi phí cloud. [Giới hạn Workers](https://developers.cloudflare.com/workers/platform/limits/), [giới hạn D1](https://developers.cloudflare.com/d1/platform/limits/).

Schema canonical dùng tiền nguyên **VND** và địa chỉ tỉnh/phường. Frontend demo vẫn **PHP/₱, Asia/Manila**; khi nối API cần chuyển dữ liệu/thị trường và xác nhận giá, múi giờ, phí giao thật. Không quy đổi bằng cách đổi ký hiệu tiền hoặc locale.

## Chuẩn bị và triển khai

| Giai đoạn | Việc cần làm |
| --- | --- |
| Phase 0 | Hono health API cùng Vite, SPA fallback, D1 local binding, worker types và scripts; không đổi frontend pins. `.dev.vars`/`.wrangler` giữ local |
| Phase 1 local | Chốt DDL v2 làm [canonical duy nhất](../migrations/0001_mvp.sql), migrate/seed/verify; 4 categories, 8 products, 24 variants, 8 images, 4 zones. [Đối chiếu v1/v2 và giới hạn](DATABASE_DESIGN.md) |
| Phase 2 local — DONE | Catalog/delivery/quote từ D1, shared Zod schemas và khung lỗi/cache/security headers; 53 test và smoke 16/16. [Output](pipeline/PHASE_2_API_CATALOG.md) |
| Phase 3–5 | Đặt đơn COD/tồn/idempotency/auth, adapter FE, cart persistence, chuyển thị trường và test concurrency/retry theo [pipeline](pipeline/README.md) |
| Phase 6 khi được yêu cầu | Dùng D1 remote đã tạo, migration/seed remote, secrets, Turnstile, deploy API/frontend với SPA fallback, DNS/domain và kiểm tra môi trường thật. Không cần đăng ký/login/create D1 lại |

Auth khách còn mở: nếu dùng Better Auth, cần đối chiếu schema auth riêng trước migration. Secrets chỉ nằm phía server; dữ liệu trình duyệt không quyết định giá, tồn hoặc quyền admin. `.dev.vars.example` chỉ là placeholder cho demo local, không phải thông tin đăng nhập production.

Chi tiết: [database](DATABASE_DESIGN.md), [entity frontend](FRONTEND_ENTITIES.md), [sổ tay dự án](../PROJECT_GUIDE.md).
