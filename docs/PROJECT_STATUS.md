# Lunara — Trạng thái & mục cần điền

Cập nhật **14/10/2026**. Repo **Lurana** · thương hiệu **Lunara**.

## Hiện trạng

| Keyword | Trạng thái |
| --- | --- |
| Phase 0 | **Xong**: React/Vite + Hono Worker cùng origin; health JSON; D1 local |
| API | `GET /api/health` → `data.ok/time`; route API lạ → JSON 404 |
| Frontend | EN/VI, PHP/₱, Asia/Manila; Shop/Cart/Admin còn fixtures |
| Storefront | Footer song ngữ; link/địa chỉ FlowerCorner đã cung cấp; Zalo chờ cấu hình |
| Cart/auth | Cart in-memory; session/role demo ở trình duyệt; chưa auth server |
| Cloudflare | Chủ dự án báo đã đăng nhập và tạo `lunara-db` remote còn trống; Phase 0 chỉ dùng local, chưa kiểm tra remote |
| Build | `dist/client/` + `dist/lunara/`; runtime bindings local qua `remoteBindings: false` |
| Kiểm chứng | Typecheck, architecture, 18 tests, build, smoke, Edge UI pass; audit 0; xem [Phase 0](pipeline/PHASE_0_PREPARE.md) |
| Git | Chỉ source/docs/config được review; secrets, state, audit, build, browser profiles giữ local |

## Cần chủ shop điền/chốt

| Keyword | Hiện tại | Điền/chốt ở đâu |
| --- | --- | --- |
| Zalo | Chưa có link/SĐT public | Cung cấp link Zalo chính thức để nối widget `ZaloContact` |
| Thông tin shop | Footer đang dùng FlowerCorner | Xác nhận link, địa chỉ, công ty/MST cho Lunara; cấu hình `src/shared/config/storefront-footer.ts`, phần công ty trong `StorefrontFooter` |
| Domain | Chưa cấu hình deploy/domain | Domain public hoặc dùng `*.workers.dev` ở Phase 6 |
| Catalog | 8 sản phẩm frontend mẫu; seed v2 riêng | Tên EN/VI, ảnh, size, giá VND, SKU, tồn thực cho Phase 1/2/5 |
| Giao hàng | Phí/khu vực mẫu trong seed; config Worker chưa có | Tỉnh/phường phục vụ, phí, phụ phí, cutoff, khung giờ, chính sách hủy/hoàn tồn |
| Tiền/múi giờ | FE PHP/Asia/Manila; pipeline đích VND/Asia/Ho_Chi_Minh | Chuyển dữ liệu/giá/format/settings ở Phase 5; không chỉ đổi ký hiệu |
| Admin/JWT secrets | Giá trị demo local, chưa triển khai auth | Điền **chỉ trong `.dev.vars` local** hoặc Cloudflare secret ở Phase 4/6; không ghi giá trị thật vào docs/Git/`VITE_*` |
| Turnstile | Chưa tích hợp | Site key public ở frontend; secret phía Worker; cấu hình domain ở Phase 3/6 |
| Cloudinary | Chưa tích hợp | MVP dùng URL ảnh; upload/preset có giới hạn là phần sau MVP |

## Việc kỹ thuật còn thiếu

| Keyword | Việc tiếp theo |
| --- | --- |
| Schema — Phase 1 | Đối chiếu [canonical v1](sql/MVP_SCHEMA.sql) và [pipeline v2](pipeline/MVP_SCHEMA.sql); v1 có `custom_requests`, v2 có `delivery_zones` và deferred custom requests. Seed hiện theo v2; thống nhất trước migration/seed |
| Database — Phase 1 | Chưa có `migrations/0001_mvp.sql`; chưa áp migration/seed local hoặc remote. Scripts DB đã chuẩn bị, chưa dùng để nghiệm thu Phase 1 |
| API — Phase 2–4 | Catalog, phí giao, báo giá, COD, stock/idempotency, tra đơn, auth/admin chưa triển khai |
| Frontend — Phase 5 | API adapter, cart localStorage, VND/timezone, giao hàng/checkout thật và bỏ fixtures ở luồng MVP |
| Deploy — Phase 6 | Secrets, migrations remote, Worker/domain và smoke môi trường thật; script `deploy` đã có, chưa chạy |
| Kiểm tra — Phase 1/6 | Chưa có `db:verify`; smoke hiện chỉ nhận URL local dạng positional, chưa hỗ trợ remote/`--base-url` |
| Deferred | Customer auth/profile/wishlist server, wizard hoa riêng, online payment, coupon/reviews/upload ảnh; xem [backlog](pipeline/BACKLOG.md) |

Tham chiếu: [handbook](../PROJECT_GUIDE.md) · [stack](TECH_STACK.md) · [pipeline](pipeline/README.md) · [database](DATABASE_DESIGN.md) · [frontend entities](FRONTEND_ENTITIES.md).
