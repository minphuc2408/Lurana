# Tech stack Lunara

Chốt hướng MVP ngày **14/10/2026**. Thương hiệu: **Lunara**; repository: **Lurana**. Phase 0–3 có Worker/health, schema/seed/verifier D1, catalog/phí giao/quote, COD/tồn/idempotency/tra đơn và transition service. Phase 4 đã DONE backend auth/admin local (9/9 tiêu chí). Home/Shop/Cart/Delivery/Quote đã nối D1 local; UI gửi/tra đơn/login/admin và features ngoài preview tạm ẩn. Chủ dự án đã đăng ký Cloudflare, đăng nhập Wrangler và tạo D1 remote `lunara-db`; Phase 0–4 không truy cập hoặc tạo tài nguyên remote.

**Trạng thái:** Phase 0–3 DONE local ([Phase 1](pipeline/PHASE_1_DATABASE.md), [Phase 2](pipeline/PHASE_2_API_CATALOG.md), [Phase 3](pipeline/PHASE_3_CHECKOUT_ORDERS.md)) · [Phase 4](pipeline/PHASE_4_ADMIN.md) DONE local (9/9 tiêu chí) · Phase 5 PARTIAL (catalog/cart/delivery/quote/VND/localStorage preview) · Phase 6 PLANNED. [Hiện trạng / việc còn thiếu](PROJECT_STATUS.md).

## Công nghệ

| Tầng | Công nghệ | Vai trò và trạng thái |
| --- | --- | --- |
| Frontend | React 18, TypeScript, React Router 7, Vite 6, Tailwind CSS 4 | Storefront/Admin theo `src/features/*`; đã có |
| i18n | `i18next` + `react-i18next`, JSON EN/VI | `src/shared/i18n/`; mặc định/fallback English; tên/địa chỉ/map URL footer ở EN/VI `common.json`; dữ liệu sản phẩm dùng `name_en/name_vi` |
| Browser storage | `localStorage`, `sessionStorage` | Lưu ngôn ngữ và cart guest version 1 (chỉ variantId/quantity); session demo không active, wishlist ẩn |
| API/runtime | Hono + Cloudflare Workers + `@cloudflare/vite-plugin` | Health/catalog/delivery/quote/orders/lookup và auth/admin local; admin status dùng transitionOrder Phase 3 |
| Validation/truy vấn | Zod + SQL tham số hóa | Root `shared/` giữ schema/constants và `admin-*-schemas.ts`; catalog/admin products/summary ≤3 queries; order 15 dòng success 35 / diagnostic 36, guard retry ≤40 |
| Database | Cloudflare D1 (SQLite) | Binding `DB` local; [migration canonical](../migrations/0001_mvp.sql) có 10 bảng, seed dev và `db:verify` 13 nhóm. Remote chưa truy cập; `custom_requests` deferred |
| Media | Cloudinary | Chưa tích hợp; MVP dán URL ảnh, upload/resize/CDN làm sau |
| Hạ tầng | Cloudflare DNS/CDN/SSL, Turnstile + rate limit | Turnstile server verifier có điều kiện secret đã kiểm mock; widget/secrets thật, rate limit và production hạ tầng chưa cấu hình/deploy |
| Auth | Web Crypto SHA-256/timingSafeEqual + `hono/jwt` HS256 | Một admin từ secret, cookie HttpOnly/SameSite=Strict 12h; `requireAdmin`/`requireSameOrigin` tại API; không dependency mới/băm mật khẩu nặng/bảng auth mới. UI admin và auth khách chưa nối |

Giữ các phiên bản frontend đã pin trong `package.json`/lockfile. Hono chạy cùng Vite qua Cloudflare plugin với `remoteBindings: false`; plugin tự quản lý assets directory. `npm run typecheck` kiểm tra frontend và Worker riêng; `npm run cf:typegen` sinh binding types. Cart hiện ở CartProvider; reload khôi phục IDs/quantity từ localStorage và refresh quote. Wishlist chưa có API; UI login/admin vẫn ẩn dù API Phase 4 đã có.

Admin cookie `lunara_admin` có `Path=/`, `Max-Age=43200`, `Secure` trên HTTPS; HTTP loopback local bỏ Secure. Request ghi admin cần Origin cùng origin và Content-Type JSON. Thiếu/trống secret bị từ chối. Worker chỉ log mã request và tên lỗi cho INTERNAL, không log object lỗi chứa SQL/input/secret. Test Node dùng shim timingSafeEqual cho API mở rộng của Workers; runtime workerd dùng Web Crypto gốc. Kiểm chứng local không đo hoặc xác nhận CPU cloud 10 ms.

## Luồng MVP — kế hoạch

- Storefront preview đã đọc catalog/quote; API Workers/Hono → D1 đã kiểm dữ liệu, tính giá/phí, ghi COD/tồn nguyên tử và snapshot; auth/admin API đã có local. Còn nối UI checkout/lookup/login/admin ở Phase 5; chưa nghiệm thu toàn luồng UI MVP.
- MVP admin dán URL ảnh; upload Cloudinary làm sau. Khi triển khai: Admin → Cloudinary → Workers → D1, upload bằng **Unsigned Upload Preset** có giới hạn định dạng/dung lượng; API chỉ cho admin ghi metadata ảnh. Preset công khai không thay xác thực. Xóa ảnh cần request xác thực phía server. [Cloudinary upload](https://cloudinary.com/documentation/client_side_uploading).
- Ảnh được giao trực tiếp từ Cloudinary CDN; dùng URL resize + `q_auto,f_auto`. WebP/AVIF phụ thuộc trình duyệt và cấu hình Cloudinary. [Tối ưu ảnh](https://cloudinary.com/documentation/image_optimization).
- Order API đã có verifier Siteverify khi cấu hình TURNSTILE_SECRET, fail closed, provider mock-tested. Widget checkout/admin login, site key/secret/domain thật và rate limit chưa triển khai. Wizard/request ngoài MVP. [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Giả định sizing trong pipeline: Workers Free **100.000 requests/ngày, 10 ms CPU/request**, D1 **50 queries/request**. Đây là tham số kế hoạch; kiểm tra tài liệu/hạn mức gói thực tế trước deploy. Không coi lượt kiểm chứng local là xác nhận quota/chi phí cloud. [Giới hạn Workers](https://developers.cloudflare.com/workers/platform/limits/), [giới hạn D1](https://developers.cloudflare.com/d1/platform/limits/).

Schema canonical dùng tiền nguyên **VND** và địa chỉ tỉnh/phường. Frontend active đã hiển thị **VND** từ D1; code legacy PHP/settings được ẩn. Phí/khu vực/ảnh/tồn seed vẫn là mẫu, cần chủ shop xác nhận trước mở bán. Không quy đổi bằng cách đổi ký hiệu tiền hoặc locale.

## Chuẩn bị và triển khai

| Giai đoạn | Việc cần làm |
| --- | --- |
| Phase 0 | Hono health API cùng Vite, SPA fallback, D1 local binding, worker types và scripts; không đổi frontend pins. `.dev.vars`/`.wrangler` giữ local |
| Phase 1 local | Chốt DDL v2 làm [canonical duy nhất](../migrations/0001_mvp.sql), migrate/seed/verify; 4 categories, 8 products, 24 variants, 8 images, 4 zones. [Đối chiếu v1/v2 và giới hạn](DATABASE_DESIGN.md) |
| Phase 2 local — DONE | Catalog/delivery/quote từ D1, shared Zod schemas và khung lỗi/cache/security headers; tại mốc này 53 tests và smoke 16/16. [Output lịch sử](pipeline/PHASE_2_API_CATALOG.md) |
| Phase 3 local — DONE | COD/tồn/idempotency/lookup/transition; tại mốc Phase 3: tests 92/92, smoke 27/27, đối chiếu tồn và budget ≤40. [Output lịch sử](pipeline/PHASE_3_CHECKOUT_ORDERS.md) |
| Phase 4 — DONE local (9/9 tiêu chí) | Secret/JWT cookie + middleware quyền/Origin; summary/orders/products/variants/delivery-zones; dùng lại transitionOrder. Source hiện tại 125/125 tests, 40/40 smoke dev/preview, typecheck/architecture/build/UI pass. [Checklist/output](pipeline/PHASE_4_ADMIN.md) |
| Phase 5 — PARTIAL | Catalog/cart/delivery/quote adapters, VND và localStorage đã có; còn checkout/lookup/admin UI, i18n/lỗi và nghiệm thu toàn luồng |
| Phase 6 khi được yêu cầu | Dùng D1 remote đã tạo, migration/seed remote, secrets, Turnstile, deploy API/frontend với SPA fallback, DNS/domain và kiểm tra môi trường thật. Không cần đăng ký/login/create D1 lại |

Auth khách còn mở: nếu dùng Better Auth, cần đối chiếu schema auth riêng trước migration. Secrets chỉ nằm phía server; dữ liệu trình duyệt không quyết định giá, tồn hoặc quyền admin. `.dev.vars.example` chỉ là placeholder cho demo local. **[NGƯỜI]** tự đặt ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên và JWT_SECRET ≥32 ký tự ngẫu nhiên, khác nhau, trong `.dev.vars` trước khi sử dụng local với dữ liệu thật; secret production thuộc Phase 6. Agent chỉ dùng secret demo kiểm thử và không đặt giá trị thật.

Chi tiết: [database](DATABASE_DESIGN.md), [entity frontend](FRONTEND_ENTITIES.md), [sổ tay dự án](../PROJECT_GUIDE.md).
