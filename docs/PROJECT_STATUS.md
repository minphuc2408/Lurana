# Lunara — Trạng thái & mục cần điền

Cập nhật **14/10/2026**. Repo **Lurana** · thương hiệu **Lunara**.

## Hiện trạng

| Keyword | Trạng thái |
| --- | --- |
| Phase 0 | **Xong**: React/Vite + Hono Worker cùng origin; health JSON; D1 local |
| Phase 1 | Database local: canonical 10 bảng, migration `0001_mvp.sql`, seed và `db:verify` 13 nhóm; [checklist/output nghiệm thu](pipeline/PHASE_1_DATABASE.md) |
| Phase 2 | **Xong local**: khung Hono/Zod/middleware/lỗi; catalog, delivery options, quote; [checklist/output nghiệm thu](pipeline/PHASE_2_API_CATALOG.md) |
| Phase 3 | **Xong local**: COD, tồn nguyên tử, idempotency, tra đơn và transition service; [output lịch sử](pipeline/PHASE_3_CHECKOUT_ORDERS.md); UI checkout/lookup thuộc Phase 5 |
| Phase 4 | **DONE local (9/9 tiêu chí)**: secret/JWT cookie, middleware quyền/Origin và API quản trị; status dùng lại transitionOrder. [Checklist/output](pipeline/PHASE_4_ADMIN.md) |
| Phase 5 | **PARTIAL**: catalog/cart/delivery/quote/VND/localStorage đã nối; chưa có UI gửi/tra đơn hoặc admin thật |
| Phase 6 | **PLANNED**: chưa deploy/migrate/seed D1 remote hoặc cấu hình production; tài khoản và D1 remote đã được chủ dự án tạo |
| API | Health/catalog/delivery/quote; POST orders/lookup từ D1; admin login/me/logout/summary/orders/products/variants/delivery-zones; API lạ → JSON 404, admin thiếu cookie → 401 |
| Frontend | Phase 5 PARTIAL: Home/Shop/Cart/Delivery/Quote VND, EN/VI; UI gửi/tra đơn chưa nối dù API Phase 3 đã có; auth/admin và features ngoài preview tạm ẩn. [Backup/audit](pipeline/FE_AUDIT.md) |
| Storefront | Footer song ngữ; link/địa chỉ FlowerCorner đã cung cấp; Zalo chờ cấu hình |
| Cart/auth | Cart localStorage chỉ variantId/quantity, giá/phí từ quote; AuthProvider demo không active; server admin dùng JWT cookie, UI login/admin chưa nối |
| Cloudflare | Chủ dự án báo đã đăng nhập và tạo `lunara-db` remote còn trống; Phase 0–4 chỉ dùng local, chưa kiểm tra hoặc thay đổi remote |
| Build | `dist/client/` + `dist/lunara/`; runtime bindings local qua `remoteBindings: false` |
| Kiểm chứng | [Phase 1](pipeline/PHASE_1_DATABASE.md): verifier 13 nhóm; [Phase 2](pipeline/PHASE_2_API_CATALOG.md): catalog ≤3 queries; [Phase 3 lịch sử](pipeline/PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026): 92/92 tests, 27/27 smoke, giỏ 15 dòng 35/36 statements. [Phase 4](pipeline/PHASE_4_ADMIN.md): 125/125 tests, 40/40 smoke; typecheck/architecture/build/UI pass |
| Git | Chỉ source/docs/config được review; secrets, state, audit, build, browser profiles giữ local |

## Cần chủ shop điền/chốt

| Keyword | Hiện tại | Điền/chốt ở đâu |
| --- | --- | --- |
| Zalo | Chưa có link/SĐT public | Cung cấp link Zalo chính thức để nối widget `ZaloContact` |
| Thông tin shop | Footer đang dùng FlowerCorner | Xác nhận link, địa chỉ, công ty/MST cho Lunara; cấu hình `src/shared/config/storefront-footer.ts`, phần công ty trong `StorefrontFooter` |
| Domain | Chưa cấu hình deploy/domain | Domain public hoặc dùng `*.workers.dev` ở Phase 6 |
| Catalog | UI active đọc seed D1: 4 categories/8 products/24 variants/8 ảnh/4 zones; fixture frontend chỉ còn source legacy/backup | Chủ shop cần tên EN/VI, ảnh, size, giá VND, SKU, tồn thực trước mở bán |
| Giao hàng | Phí/khu vực mẫu trong seed; config giả định: phụ phí 0/30.000/50.000 VND, cutoff 16:00, chuẩn bị 120 phút, slots 08:00–20:00 | Chỉnh `worker/config.ts`/zones theo tỉnh/phường phục vụ, phí, khung giờ và policy thật trước mở bán |
| Tiền/múi giờ | Active UI VND từ API, Worker Asia/Ho_Chi_Minh; legacy settings ẩn | Giá/khu vực mẫu cần chốt trước mở bán; giữ currency/timezone khi đổi EN/VI |
| Admin/JWT secrets | Auth đã triển khai; test/smoke dùng secret demo tổng hợp, chưa đặt secret thật | **[NGƯỜI]** tự đặt ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên và JWT_SECRET ≥32 ký tự ngẫu nhiên, khác nhau, trong `.dev.vars` trước khi dùng admin thật ở local; production dùng Cloudflare secret Phase 6. Không đưa giá trị vào chat/docs/Git/`VITE_*` |
| Turnstile | Server verifier Phase 3 đã có, test mock | Site key public ở frontend; secret phía Worker; còn cấu hình domain/token thật ở Phase 5–6 |
| Cloudinary | Chưa tích hợp | MVP dùng URL ảnh; upload/preset có giới hạn là phần sau MVP |

## Việc kỹ thuật còn thiếu

| Keyword | Việc tiếp theo |
| --- | --- |
| Schema — đã chốt Phase 1 | [Canonical duy nhất](../migrations/0001_mvp.sql) dùng nguyên DDL v2; hai đường dẫn schema cũ là comment pointers. [Khác biệt/lý do/giới hạn](DATABASE_DESIGN.md); `custom_requests` chỉ ở deferred, chưa áp dụng |
| Database — local | `db:migrate:local`, `db:seed:local`, `db:verify`; [nghiệm thu Phase 1](pipeline/PHASE_1_DATABASE.md). Dữ liệu thật và migration remote thuộc các phase sau |
| API — Phase 2 đã xong | Catalog/phí giao/quote local từ D1; shared schemas/constants ở root `shared/`; endpoint quote luôn chỉ đọc, việc ghi đơn/trừ tồn do API Phase 3 thực hiện |
| API — Phase 3–4 | COD, trừ/hoàn tồn, idempotency/tra đơn và auth/admin đã có local; [Phase 4](pipeline/PHASE_4_ADMIN.md) DONE local; không thêm bảng/dependency |
| Frontend — Phase 5 PARTIAL | Catalog/giỏ/quote/VND/storage đã nối local; API checkout/lookup/admin sẵn có, UI gửi/tra đơn/login/admin chưa nối |
| Deploy — Phase 6 | Secrets, migrations remote, Worker/domain và smoke môi trường thật; script `deploy` đã có, chưa chạy |
| Kiểm tra — Phase 3–4/6 | `db:verify` kiểm schema local; smoke giữ catalog/order/query budget và bổ sung auth/admin. Các ca ghi dùng workerd D1 persist:false qua HTTP loopback, secret demo riêng, không sửa seed persisted; remote smoke thuộc Phase 6 |
| Deferred | Customer auth/profile/wishlist server, wizard hoa riêng, online payment, coupon/reviews/upload ảnh; xem [backlog](pipeline/BACKLOG.md) |

Tham chiếu: [handbook](../PROJECT_GUIDE.md) · [stack](TECH_STACK.md) · [pipeline](pipeline/README.md) · [database](DATABASE_DESIGN.md) · [frontend entities](FRONTEND_ENTITIES.md).
