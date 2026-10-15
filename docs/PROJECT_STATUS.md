# Lunara — Trạng thái & mục cần điền

Cập nhật **15/10/2026**. Repo **Lurana** · thương hiệu **Lunara**.

## Hiện trạng

| Keyword | Trạng thái |
| --- | --- |
| Phase 0 | **Xong**: React/Vite + Hono Worker cùng origin; health JSON; D1 local |
| Phase 1 | Database local: canonical 10 bảng, migration `0001_mvp.sql`, seed và `db:verify` 13 nhóm; [checklist/output nghiệm thu](pipeline/PHASE_1_DATABASE.md) |
| Phase 2 | **Xong local**: khung Hono/Zod/middleware/lỗi; catalog, delivery options, quote; [checklist/output nghiệm thu](pipeline/PHASE_2_API_CATALOG.md) |
| Phase 3 | **Xong local**: COD, tồn nguyên tử, idempotency, tra đơn và transition service; [output lịch sử](pipeline/PHASE_3_CHECKOUT_ORDERS.md); UI đã nối/nghiệm thu Phase 5 |
| Phase 4 | **DONE local (9/9 tiêu chí)**: secret/JWT cookie, middleware quyền/Origin và API quản trị; status dùng lại transitionOrder. [Checklist/output](pipeline/PHASE_4_ADMIN.md) |
| Phase 5 | **DONE local (6/6 tiêu chí)**: giữ catalog/cart/delivery/quote/VND/localStorage; nối COD/gửi/retry/xác nhận/lookup và cookie auth/admin đơn/sản phẩm/tồn/phí/dashboard; [10/10 kịch bản + 2/2 mở rộng](pipeline/PHASE_5_FRONTEND.md#kết-quả-10-kịch-bản--15102026) |
| Phase 6 | **IN PROGRESS (5/7 tiêu chí)**: deploy/secrets, migration/seed/backup, API Production 7/7 + public browser/10 kết quả MVP PASS và cleanup xong; chờ dữ liệu thật, xác nhận đã nắm cách xem quota. [Bằng chứng và đầu vào](pipeline/PHASE_6_DEPLOY.md) |
| API | Health/catalog/delivery/quote; POST orders/lookup từ D1; admin login/me/logout/summary/orders/products/variants/delivery-zones; API lạ → JSON 404, admin thiếu cookie → 401 |
| Frontend | MVP local dùng API thật: `/cart` COD, `/orders/track`, `/admin/login`, dashboard/orders/stock/delivery-zones. EN mặc định/fallback + VI; VND/giờ VN. Customer auth/profile/wishlist/request/settings/customers/notifications giữ source và ẩn bằng cờ/API readiness. [Backup/audit](pipeline/FE_AUDIT.md) |
| Storefront | Footer tên/địa chỉ/map URL cấu hình JSON EN/VI; Zalo icon tự vẽ góc phải, viền xanh animate width khi hover/focus/click (400ms, reduced motion 200ms); link Zalo thật chờ cấu hình |
| Cart/auth | Cart localStorage chỉ variantId/quantity; giá/phí từ server. Intent UUID giữ key khi retry cùng payload, không persist contact. AuthProvider `/me/login/logout` với JWT cookie HttpOnly; không session demo. Stock_delta chưa rõ kết quả khóa gửi lại đến GET Recheck thành công |
| Cloudflare | Đã xác minh account và UUID `lunara-db`; pin account_id trong Wrangler; Phase 6 đã migrate `0001`/seed remote, 10 bảng; đã deploy [lunara.minphuc2408.workers.dev](https://lunara.minphuc2408.workers.dev), smoke/cleanup xong, orders 0, variant 1 tồn 20, 24 variant khớp baseline/FK sạch |
| Build | `dist/client/` + `dist/lunara/`; runtime bindings local qua `remoteBindings: false` |
| Kiểm chứng | **Mốc Phase 5:** typecheck/build PASS, architecture 207 files, tests 136/136, smoke 40/40, UI preview 17 routes/0 exceptions; 10/10 kịch bản và 2/2 nhóm mở rộng pass. [Evidence Phase 5](pipeline/PHASE_5_FRONTEND.md). **Phase 6:** 143/143 tests (thêm 7 smoke-remote tests), native workerd fail-closed 9/9 cấu hình, audit 0, dry-run và backup remote integrity/FK PASS; API live 7/7 và public browser EN/VI/VND/cart reload PASS, 0 JS exceptions; 10/10 kết quả MVP, tách API khỏi UI checkout/admin chưa test đủ remote; xem [Phase 6](pipeline/PHASE_6_DEPLOY.md) |
| Git | Chỉ source/docs/config được review; secrets, state, audit, build, browser profiles giữ local |

## Cần chủ shop điền/chốt

**Cổng kết Phase 6 — còn 2/7 tiêu chí:**

| Tiêu chí còn thiếu | Phần đã xong | Đầu vào cần để kết |
| --- | --- | --- |
| Dữ liệu mở bán thật | Đã dọn 3 đơn SMOKE, đối chiếu tồn và FK; không còn đơn thử | Chủ shop cung cấp/nhập catalog, ảnh, giá/SKU/tồn và khu vực/phí/policy thật; ẩn sản phẩm mẫu, tắt vùng ví dụ rồi kiểm lại catalog/quote |
| Người vận hành nắm cách xem hạn mức | Đã viết OPERATIONS và hướng dẫn Workers/D1 Metrics | Chủ dự án xem được các chỉ số và xác nhận đã nắm cách kiểm hằng ngày; yêu cầu hướng dẫn trước đó chưa phải xác nhận hoàn tất |

Phase 6 giữ **IN PROGRESS**, chưa đánh dấu DONE hoặc sẵn sàng mở bán. Turnstile và domain riêng là tùy chọn, không thay thế hai tiêu chí trên.

| Keyword | Hiện tại | Điền/chốt ở đâu |
| --- | --- | --- |
| Zalo | Chưa có link/SĐT public | Cung cấp link Zalo chính thức để nối widget `ZaloContact` |
| Thông tin shop | Footer đang dùng FlowerCorner | Tên/địa chỉ/map URL: `src/shared/i18n/locales/en/common.json` và `vi/common.json`; links khác: `src/shared/config/storefront-footer.ts`; công ty/MST trong `StorefrontFooter` |
| Domain | Đã dùng HTTPS `lunara.minphuc2408.workers.dev`, SPA PASS | Custom Domain là tùy chọn, chưa cấu hình |
| Catalog | UI active đọc seed D1: 4 categories/8 products/24 variants/8 ảnh/4 zones; fixture frontend chỉ còn source legacy/backup | Chủ shop cần tên EN/VI, ảnh, size, giá VND, SKU, tồn thực trước mở bán |
| Giao hàng | Phí/khu vực mẫu trong seed; config giả định: phụ phí 0/30.000/50.000 VND, cutoff 16:00, chuẩn bị 120 phút, slots 08:00–20:00 | Chỉnh `worker/config.ts`/zones theo tỉnh/phường phục vụ, phí, khung giờ và policy thật trước mở bán |
| Tiền/múi giờ | Active UI VND từ API, Worker Asia/Ho_Chi_Minh; legacy settings ẩn | Giá/khu vực mẫu cần chốt trước mở bán; giữ currency/timezone khi đổi EN/VI |
| Admin/JWT secrets | Production có ADMIN_PASSWORD/JWT_SECRET; owner nhập password qua prompt ẩn, login HTTPS/session PASS. Không đọc/reuse local password; local tests vẫn dùng demo | **[NGƯỜI]** quản lý ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên và JWT_SECRET ≥32 ký tự ngẫu nhiên, khác nhau, trong `.dev.vars`; production dùng Cloudflare secret Phase 6. Không đưa giá trị vào chat/docs/Git/`VITE_*` |
| Turnstile | Server verifier Phase 3 đã có, test mock; local UI test không có secret Turnstile | Cấu hình widget/site key/domain/token thật và secret Worker ở Phase 6 |
| Cloudinary | Chưa tích hợp | MVP dùng URL ảnh; upload/preset có giới hạn là phần sau MVP |

## Tiến độ kỹ thuật và việc tiếp theo

| Keyword | Việc tiếp theo |
| --- | --- |
| Schema — đã chốt Phase 1 | [Canonical duy nhất](../migrations/0001_mvp.sql) dùng nguyên DDL v2; hai đường dẫn schema cũ là comment pointers. [Khác biệt/lý do/giới hạn](DATABASE_DESIGN.md); `custom_requests` chỉ ở deferred, chưa áp dụng |
| Database | Local verifier 13/13; Phase 6 đã áp canonical/seed remote, backup riêng tư mở lại được. Không sửa migration đã áp remote; dữ liệu thật vẫn cần chủ shop cung cấp |
| API — Phase 2 đã xong | Catalog/phí giao/quote local từ D1; shared schemas/constants ở root `shared/`; endpoint quote luôn chỉ đọc, việc ghi đơn/trừ tồn do API Phase 3 thực hiện |
| API — Phase 3–4 | COD, trừ/hoàn tồn, idempotency/tra đơn và auth/admin đã có local; [Phase 4](pipeline/PHASE_4_ADMIN.md) DONE local; không thêm bảng/dependency |
| Frontend — Phase 5 DONE local | Đủ 6/6 tiêu chí và 10/10 kịch bản, không fixture/fetch component; giữ source deferred. Cần nghiệm thu lại trên deployment Phase 6 với dữ liệu/policy thật |
| Deploy — Phase 6 | Deployment/secrets và API smoke/public browser đã PASS; cleanup 3 SMOKE xong, stock/FK đối chiếu đúng. Còn dữ liệu mở bán thật. [Runbook](OPERATIONS.md) đã thêm 2 bước xem quota theo yêu cầu, chờ owner xác nhận đã nắm |
| Kiểm tra — Phase 5/6 | `db:verify` kiểm schema local; smoke API và Edge/CDP UI Phase 5 dùng D1 persist:false/remoteBindings:false, credentials tổng hợp; snapshot SQL readonly bảo vệ dữ liệu persisted. Bridge Node có shim timingSafeEqual, native workerd auth Phase 4 giữ bằng chứng riêng. CPU cloud, Turnstile thật và remote smoke thuộc Phase 6 |
| Deferred | Customer auth/profile/wishlist server, wizard hoa riêng, online payment, coupon/reviews/upload ảnh; xem [backlog](pipeline/BACKLOG.md) |

Tham chiếu: [handbook](../PROJECT_GUIDE.md) · [stack](TECH_STACK.md) · [pipeline](pipeline/README.md) · [database](DATABASE_DESIGN.md) · [frontend entities](FRONTEND_ENTITIES.md).
