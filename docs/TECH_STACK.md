# Tech stack Lunara

Chốt hướng MVP ngày **14/10/2026**, cập nhật frontend **15/10/2026**. Thương hiệu: **Lunara**; repository: **Lurana**. Phase 0–3 có Worker/health, schema/seed/verifier D1, catalog/phí giao/quote, COD/tồn/idempotency/tra đơn và transition service. Phase 4 DONE backend auth/admin local (9/9 tiêu chí). Phase 5 DONE local (6/6 tiêu chí): UI checkout COD/gửi/retry/xác nhận/tra đơn và admin đăng nhập/đơn/sản phẩm/tồn/phí giao/summary đã nghiệm thu đủ 10 kịch bản bắt buộc. Tính năng chưa có API vẫn ẩn và giữ source. Chủ dự án đã đăng ký Cloudflare, đăng nhập Wrangler và tạo D1 remote `lunara-db`; Phase 0–5 không truy cập hoặc tạo tài nguyên remote.

**Trạng thái:** Phase 0–3 DONE local ([Phase 1](pipeline/PHASE_1_DATABASE.md), [Phase 2](pipeline/PHASE_2_API_CATALOG.md), [Phase 3](pipeline/PHASE_3_CHECKOUT_ORDERS.md)) · [Phase 4](pipeline/PHASE_4_ADMIN.md) DONE local (9/9 tiêu chí) · [Phase 5](pipeline/PHASE_5_FRONTEND.md) DONE local (6/6 tiêu chí) · **Phase 6 IN PROGRESS (5/7)**: deployment/API live 7/7 + public browser và cleanup đã kiểm; D1 remote migration/backup PASS. Còn dữ liệu thật và xác nhận đã nắm cách xem quota. [Hiện trạng / việc còn thiếu](PROJECT_STATUS.md).

## Công nghệ

| Tầng | Công nghệ | Vai trò và trạng thái |
| --- | --- | --- |
| Frontend | React 18, TypeScript, React Router 7, Vite 6, Tailwind CSS 4 | Storefront/Admin theo `src/features/*`; đã có |
| i18n | `i18next` + `react-i18next`, JSON EN/VI | `src/shared/i18n/`; mặc định/fallback English; tên/địa chỉ/map URL footer ở EN/VI `common.json`; dữ liệu sản phẩm dùng `name_en/name_vi` |
| Browser storage | `localStorage` | Chỉ preference ngôn ngữ và cart guest version 1 (variantId/quantity). Không lưu contact/ý định đặt hàng/JWT trong localStorage/sessionStorage; cookie admin HttpOnly do server quản lý, sessionStorage demo không active, wishlist ẩn |
| API/runtime | Hono + Cloudflare Workers + `@cloudflare/vite-plugin` | Health/catalog/delivery/quote/orders/lookup và auth/admin local; admin status dùng transitionOrder Phase 3 |
| Validation/truy vấn | Zod + SQL tham số hóa | Root `shared/` giữ schema/constants và `admin-*-schemas.ts`; catalog/admin products/summary ≤3 queries; order 15 dòng success 35 / diagnostic 36, guard retry ≤40 |
| Database | Cloudflare D1 (SQLite) | Binding `DB`; [migration canonical](../migrations/0001_mvp.sql) có 10 bảng, local verifier 13 nhóm; Phase 6 đã áp `0001`/seed remote và backup thử, chưa dữ liệu thật. `custom_requests` deferred |
| Media | Cloudinary | Signed direct admin upload đã code local; vẫn nhận URL ảnh; keys/presets/upload thật/deploy chờ owner |
| Hạ tầng | Cloudflare DNS/CDN/SSL, Turnstile + rate limit | Worker đã deploy workers.dev/API smoke live PASS; Turnstile orders verifier có điều kiện secret đã kiểm mock, widget/Turnstile secrets thật và rate limit chưa cấu hình |
| Auth | Web Crypto SHA-256/timingSafeEqual + `hono/jwt` HS256 | Một admin từ secret, cookie HttpOnly/SameSite=Strict 12h; `requireAdmin`/`requireSameOrigin` tại API. AuthProvider gọi me/login/logout, AdminRoute bảo vệ UI; không dependency/bảng auth mới. Auth khách deferred |

Giữ các phiên bản đã pin trong `package.json`/lockfile, không thêm UI stack hoặc dependency cho Phase 5. Hono chạy cùng Vite qua Cloudflare plugin với `remoteBindings: false`; plugin tự quản lý assets directory. `npm run typecheck` kiểm frontend và Worker riêng; `npm run cf:typegen` sinh binding types. CartProvider khôi phục IDs/quantity từ localStorage và refresh quote; `useCodCheckout` dùng cùng cart, không dựng state giỏ thứ hai. English mặc định/fallback; EN/VI chỉ đổi nhãn/định dạng, không đổi VND hoặc Asia/Ho_Chi_Minh.

Một API client chung `src/shared/api/client.ts` gọi `/api`, credentials same-origin, timeout 20 giây, đọc envelope data/error và ánh xạ code sang i18n. Service/adapter/hook thuộc feature; component không fetch trực tiếp. UUID v4 theo ý định đặt hàng tạo khi vào xác nhận, giữ khi retry cùng payload và đổi khi sửa; ref chặn bấm đúp. Chỉ 2xx mới xóa cart/hiện xác nhận với order_number và tổng server. Public lookup bằng mã + SĐT không đưa SĐT vào URL; kết quả cũ được xóa khi đổi input.

Admin active đọc API thật cho danh sách/chi tiết/chuyển trạng thái/ghi chú, product × variant và phí giao; dashboard chỉ summary + 10 đơn gần nhất. PATCH variant chỉ field đã sửa, cộng/trừ `stock_delta` nguyên tử; khi kết quả ghi không rõ, row khóa, delta về 0 và tự đọc canonical. Recheck đọc thành công mới mở row để nhập điều chỉnh mới; giữ dirty fields khác. Không hiển thị KPI/biểu đồ fixture. `VITE_ENABLE_CUSTOMER_AUTH` mặc định false và còn cần cờ sẵn sàng API nội bộ; bật env đơn lẻ không mở fixtures. Customer login/signup/profile/my-orders/wishlist, custom requests, customers/settings/notifications tiếp tục ẩn, giữ code.

Admin cookie `lunara_admin` có `Path=/`, `Max-Age=43200`, `Secure` trên HTTPS; HTTP loopback local bỏ Secure. Request ghi admin cần Origin cùng origin và Content-Type JSON. Thiếu/trống secret bị từ chối. Worker chỉ log mã request và tên lỗi cho INTERNAL, không log object lỗi chứa SQL/input/secret. Test Node dùng shim timingSafeEqual cho API mở rộng của Workers; runtime workerd dùng Web Crypto gốc. Kiểm chứng local không đo hoặc xác nhận CPU cloud 10 ms.

## Luồng MVP và phần triển khai sau

- Storefront đọc catalog/quote, form checkout gửi COD; API Workers/Hono → D1 kiểm dữ liệu, tính giá/phí, ghi COD/tồn nguyên tử và snapshot. UI tra đơn/admin đã nối API Phase 3–4; Phase 5 đã pass kiểm thử tự động và đủ 10 kịch bản UI bắt buộc + 2 mở rộng. Đây là nghiệm thu local, chưa đồng nghĩa chấp nhận môi trường remote.
- Cloudinary signed upload: admin cookie + same-origin POST /api/admin/uploads/sign → Worker ký SHA-256 params cố định → browser upload trực tiếp Cloudinary → Save product lưu URL vào D1. Không thêm SDK/dependency/migration; API secret chỉ server. Quyết định này thay đề xuất unsigned preset trước đó. Giới hạn 5 MB ở client/metadata, không phải Worker cưỡng chế byte. [Hướng dẫn](CLOUDINARY.md).
- Ảnh Cloudinary dùng HTTPS delivery URL từ provider; chưa tự gắn q_auto/f_auto/resize, có thể cấu hình incoming transformations trong preset sau khi kiểm thật. Không xóa asset tự động.
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
| Phase 4 — DONE local (9/9 tiêu chí) | Secret/JWT cookie + middleware quyền/Origin; summary/orders/products/variants/delivery-zones; dùng lại transitionOrder. Mốc lịch sử Phase 4: 125/125 tests, 40/40 smoke dev/preview, typecheck/architecture/build/UI pass. [Checklist/output lịch sử](pipeline/PHASE_4_ADMIN.md) |
| Phase 5 — DONE local (6/6 tiêu chí) | Giữ catalog/cart/quote/VND/localStorage; nối checkout COD/UUID intent/retry/xác nhận/lookup và cookie admin/đơn/sản phẩm/tồn/phí giao/dashboard. Typecheck/build pass; architecture 207 files; tests 136/136; smoke 40/40; UI 17 routes, bắt buộc 10/10 + mở rộng 2/2, 0 JS exceptions. [Bằng chứng tại mốc Phase 5](pipeline/PHASE_5_FRONTEND.md); không dùng số Phase 4 làm số nghiệm thu frontend mới |
| Phase 6 — IN PROGRESS | Đã pin account_id, áp migration/seed remote và mở backup offline; local pre-flight/dry-run PASS. Smoke remote `--base-url` mặc định chỉ đọc, ghi cần confirm origin/variant/exclusive window và credential stdin. Owner đã deploy/đặt secrets; API live 7/7 + browser public PASS, dọn 3 SMOKE orders, tồn variant 1 = 20/cả 24 variant khớp baseline/FK sạch. Chờ dữ liệu thật và xác nhận quota; [OPERATIONS](OPERATIONS.md) đã có; không đăng ký/login/create D1 lại |

Auth khách còn mở: nếu dùng Better Auth, cần đối chiếu schema auth riêng trước migration. Secrets chỉ nằm phía server; dữ liệu trình duyệt không quyết định giá, tồn hoặc quyền admin. `.dev.vars.example` chỉ là placeholder cho demo local. **[NGƯỜI]** tự đặt ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên và JWT_SECRET ≥32 ký tự ngẫu nhiên, khác nhau, trong `.dev.vars` trước khi sử dụng local với dữ liệu thật; secret production thuộc Phase 6. Agent chỉ dùng secret demo kiểm thử và không đặt giá trị thật.

Smoke cuối chạy trên preview loopback `127.0.0.1:4175`; kiểm UI Phase 5 dùng D1 cô lập và demo secrets, logical snapshot xác nhận D1 persisted không đổi. UI kiểm đúng kết quả server, retry đơn cùng UUID khi mất phản hồi và chặn gửi lại delta tồn chưa kiểm chứng. Không có phép deploy, ghi D1 remote hoặc xác nhận quota production trong bằng chứng local.

Chi tiết: [database](DATABASE_DESIGN.md), [entity frontend](FRONTEND_ENTITIES.md), [sổ tay dự án](../PROJECT_GUIDE.md).

Staging: Cloudflare env.staging, Worker/D1 riêng; cùng migrations và binding DB. Build chọn CLOUDFLARE_ENV=staging, kiểm config sinh ra trước deploy; chưa nghiệm thu remote. Xem [STAGING](STAGING.md).

Tên hiển thị website từ 15/10/2026 là **Lunara Shop** (tab, header/footer, admin, EN/VI); giữ Worker/D1 và repo GitHub hiện có. Typecheck/build/architecture và 143 tests PASS; kiểm branding EN/VI 320/390/1440px PASS. UI tổng quát dừng ở bước quote chưa chọn khu vực giao; chi tiết deploy tại [Phase 6](pipeline/PHASE_6_DEPLOY.md).

Cập nhật staging 15/10/2026: đã xác minh remote lunara-staging-db / ed391b18-0bcf-41b3-8315-389807ace7f2 và áp 0001_mvp.sql thành công (25 commands). Đã kiểm đủ 10 bảng nghiệp vụ, lịch sử 0001, không còn migration chờ, foreign_key_check rỗng, orders=0. db:verify local cô lập PASS 13/13 nhóm, 46 assertions. Chưa seed, đặt secrets hoặc deploy staging; production không được truy cập/ghi trong lượt sửa này.

Cloudinary 15/10/2026: đã tích hợp local signed direct upload (SHA-256, cookie admin/same-origin, JPEG/PNG/WebP, client 5 MB, prefix local/staging/prod). Typecheck/build/architecture 208 source files PASS; tests 148/148, smoke local 40/40 PASS. Browser mock EN/VI 390px PASS: file sai, thành công/preview, Save URL, thiếu config giữ URL; 0 JS exceptions. Chưa tạo preset/đặt keys/upload thật/deploy tính năng, không ghi D1 remote; Phase 6 vẫn 5/7. Không thêm migration/dependency hoặc tự xóa asset. [Cấu hình Cloudinary](CLOUDINARY.md).
