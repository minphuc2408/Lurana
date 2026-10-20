# Phase 5 — Nối frontend với API thật

Hồ sơ dành cho frontend/QA: **DONE local, 6/6 tiêu chí, 15/10/2026**. Ghi nghiệm thu nối catalog/cart/checkout/lookup/admin với API; không phải đặc tả UI hiện hành. Owner behavior/state: [Architecture](../ARCHITECTURE.md), [Entities](../reference/FRONTEND_ENTITIES.md), [Checkout](../features/CHECKOUT_UI.md), [Tra đơn](../features/ORDER_TRACKING.md). [PROJECT_STATUS](../PROJECT_STATUS.md) giữ trạng thái/checks/deployment mới.

## Tiêu chí nghiệm thu

- [x] 10 kịch bản bên dưới PASS qua Edge headless/CDP.
- [x] Không PHP/₱/Asia/Manila trong runtime MVP; format VND dùng helper chung.
- [x] Không fixture hiển thị ở shop/cart/checkout/lookup/admin active.
- [x] Component không fetch trực tiếp; lỗi API có i18n.
- [x] Typecheck/architecture/tests/build PASS.
- [x] Feature customer/deferred không để liên kết chết trong menu.

MVP dùng feature service/adapter và public index.ts, server sở hữu giá/phí/tồn/quyền. Customer auth/profile/wishlist tài khoản/request và admin customers/settings/notifications vẫn deferred tại mốc này; wishlist storefront memory hiện có được mô tả riêng trong Architecture, không bị coi là chưa triển khai vì checklist cũ.

## Kết quả 10 kịch bản — 15/10/2026

| # | Kết quả | Bằng chứng lịch sử |
| --- | --- | --- |
| 1 | PASS | Home→Shop 8 sản phẩm/24 variants; EN mặc định/fallback, VI/EN vẫn VND, có 450.000 ₫. |
| 2 | PASS | Size M/reload giữ variant ID/quantity; storage hỏng →giỏ rỗng, app không vỡ. |
| 3 | PASS lịch sử | Phí Hoàn Kiếm 20000/default tỉnh 35000 đúng ngày 15/10; từ 16/10 không fallback, acceptance hiện hành ở [Delivery](../features/DELIVERY_ADDRESS.md). |
| 4 | PASS | Double click chỉ tạo một đơn và một lần trừ tồn. |
| 5 | PASS | Lỗi500 trước ghi/mất phản hồi sau commit giữ giỏ/form; retry cùng UUID/body không thêm đơn, sửa payload tạo key mới. |
| 6 | PASS | Confirmation lấy mã/tổng server; lookup đúng món/tổng/timeline, SĐT sai NOT_FOUND và ẩn kết quả cũ. |
| 7 | PASS | Login sai báo lỗi; đúng có cookie HttpOnly qua tab/reload; logout/hết cookie bị guard chặn. |
| 8 | PASS | Đi đủ PENDING→CONFIRMED→PREPARING→IN_TRANSIT→DELIVERED/PAID; hủy đơn khác hoàn một lần, terminal không có action sai. |
| 9 | PASS | Delta hạ size M về 0; chọn đúng variant trên Shop thấy hết hàng/disable Add. |
| 10 | PASS | 74 file runtime active sạch tiền/timezone legacy; 40 hits toàn src thuộc deferred, menu không có link feature ẩn. |

**Hai nhóm mở rộng PASS:** product S/M/L, giá/ngưỡng/active; phí thêm/sửa/tắt; dashboard đối chiếu D1 và lọc đơn; EN/VI/error/loading/retry, responsive 320/390/768/1024 px. Stock PATCH commit nhưng mất phản hồi rồi GET lỗi: delta chỉ áp một lần, Save khóa đến GET Recheck thành công, Save không đổi không gửi PATCH. Đổi locale giữ dữ liệu khách.

## Bằng chứng kiểm chứng — 15/10/2026

- Typecheck, architecture **207 source files**, **136/136 tests**, build, **40/40 smoke**, UI **17 routes/0 exceptions**, Phase 5 runner **10/10 +2/2/0 exceptions** PASS.
- Edge/CDP dùng build frontend, Worker source và D1 workerd persist:false/remoteBindings:false; env example/synthetic secrets. SQL readonly kiểm schema/nội dung persisted không đổi, không so byte WAL/cache/observability. Bridge Node dùng shim timingSafeEqual; native auth có [bằng chứng Phase 4](PHASE_4_ADMIN.md#bằng-chứng-lệnh--14102026).
- Evidence local ignored: phase5-ui-results.json (15/10, 07:34:46Z/14:34 VN), phase5 screenshots và test/build/smoke logs trong .security-review. Provenance backup demo ở [hồ sơ lịch sử](../archive/VERIFICATION_HISTORY.md#backup-demo-frontend--14102026); counts scan lịch sử giữ tại bảng kết quả phía trên.
- Không đổi pin/lockfile/DDL, không deploy/ghi remote. API/challenge mock không nghiệm thu Turnstile/provider/CPU cloud. Raw terminal output còn trong Git; không cộng kiểm UI/hardening sau đó vào mốc 136 tests này.
