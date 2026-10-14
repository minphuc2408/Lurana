# Phase 4 — Admin: đăng nhập và API quản trị

**Mục tiêu:** chủ shop đăng nhập an toàn, quản lý đơn, sản phẩm/tồn kho, phí giao. Hợp đồng: [API_CONTRACT.md](API_CONTRACT.md) (mục Admin).

**Trạng thái:** PLANNED · Phase 3 backend đã DONE local; chưa triển khai API auth/admin và chưa nghiệm thu Phase 4. Source auth fixture/sessionStorage được giữ nhưng AuthProvider và route admin legacy đang ẩn trong preview. [Hiện trạng](../PROJECT_STATUS.md). Secret trong `.dev.vars.example` chỉ là demo; không phải credentials production.

**Đầu vào đã có:** `worker/services/orders.ts` export createOrder, lookupOrder và `transitionOrder(db, orderNumber, newStatus, actorLabel = 'ADMIN', note?)`; máy trạng thái/PAID/hoàn tồn một lần và các race đã kiểm D1 local cô lập. Phase 4 bổ sung authorization và routes quản trị gọi lại service này, không viết lại thuật toán hoàn tồn. lookupOrder public không trả admin_note/stock_released; admin detail cần projection có quyền riêng. [Nghiệm thu Phase 3](PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026).

## Thiết kế đăng nhập — MVP đề xuất

Sizing pipeline giả định **10 ms CPU/request**; kiểm tra gói/runtime thực tế trước deploy. Thiết kế MVP tránh bcrypt/argon2, dự kiến **một tài khoản admin** với **mật khẩu dài ngẫu nhiên** trong secret:

1. `POST /api/admin/login { password }`: băm SHA-256 cả mật khẩu gửi lên và `env.ADMIN_PASSWORD` bằng `crypto.subtle.digest`, so sánh bằng `crypto.subtle.timingSafeEqual`.
2. Đúng → ký JWT HS256 bằng `env.JWT_SECRET` (`hono/jwt`): `{ role: 'ADMIN', iat, exp: +12h }`; đặt cookie `lunara_admin`: `HttpOnly`, `SameSite=Strict`, `Path=/`, `Max-Age=43200`, `Secure` khi chạy HTTPS (local HTTP `127.0.0.1` bỏ Secure).
3. Middleware `requireAdmin` xác thực JWT từ cookie cho mọi `/api/admin/*` (trừ `login`). Sai/hết hạn → `UNAUTHORIZED`.
4. Request ghi: bắt buộc `Content-Type: application/json` và header `Origin` trùng host của request (chống CSRF, bổ sung cho `SameSite=Strict`).
5. Không dùng bảng `users` ở MVP; lịch sử trạng thái ghi `actor_label = 'ADMIN'`, `actor_id = NULL`.

**Yêu cầu bảo mật:**
- [NGƯỜI] Mật khẩu admin ≥ 24 ký tự ngẫu nhiên (`openssl rand -base64 24`); `JWT_SECRET` ≥ 32 ký tự ngẫu nhiên, khác mật khẩu. Vì không có băm chậm nên **độ dài/ngẫu nhiên của mật khẩu là lớp bảo vệ chính**.
- Hạn chế dò mật khẩu: bật Turnstile cho form đăng nhập nếu kịp; nếu có tên miền riêng, cân nhắc rule rate limit ở dashboard Cloudflare (kiểm tra gói Free có hỗ trợ không). Không thêm bảng đếm lần đăng nhập (tốn lượt ghi D1).
- Không log mật khẩu, JWT hay cookie.
- `ADMIN_PASSWORD`/`JWT_SECRET` thiếu hoặc trống → từ chối đăng nhập; test fail closed trước deploy. Giá trị demo local không dùng production.
- Khi cần nhiều tài khoản/vai trò: chuyển sang Better Auth hoặc dịch vụ ngoài (xem [BACKLOG](BACKLOG.md)); đừng tự viết băm mật khẩu trong Worker Free.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 4.1 | AGENT | `worker/lib/auth.ts`: `checkPassword`, `signSession`, `requireAdmin`, `requireSameOrigin` |
| 4.2 | AGENT | `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me` |
| 4.3 | AGENT | `GET /api/admin/summary` (đếm đơn theo trạng thái, đơn hôm nay giờ VN, số variant tồn ≤ ngưỡng) — 3 truy vấn gộp tối đa |
| 4.4 | AGENT | `GET /api/admin/orders` (lọc `status`, `date` = `delivery_date`, `q`; `limit ≤ 50`, `offset`; sắp `placed_at DESC`; trả `total`). Escape `%` và `_` trong `q` khi dùng `LIKE ... ESCAPE '\'`. `GET /api/admin/orders/:orderNumber` (kèm items, timeline, `admin_note`) |
| 4.5 | AGENT | `PATCH .../status` gọi `transitionOrder` (Phase 3); map lỗi sang `INVALID_TRANSITION`. `PATCH .../note` |
| 4.6 | AGENT | `GET /api/admin/products` (mọi trạng thái, có `stock_quantity` chính xác, 3 truy vấn) |
| 4.7 | AGENT | `POST /api/admin/products`: một `batch` gồm insert sản phẩm, N variant, 1 ảnh; trùng slug/SKU → `CONFLICT` |
| 4.8 | AGENT | `PATCH /api/admin/products/:id` (tên, mô tả, badge, featured, `status`, ảnh chính bằng URL). Đổi `ARCHIVED` ghi `archived_at` |
| 4.9 | AGENT | `PATCH /api/admin/variants/:id`: `stock_delta` → `UPDATE ... SET stock_quantity = stock_quantity + ?` (nếu vi phạm `CHECK` → `VALIDATION_ERROR` "Tồn kho không thể âm"); `stock_quantity` tuyệt đối chỉ khi không có `stock_delta`; `compare_at_price ≥ price` phải được kiểm tra trước khi ghi |
| 4.10 | AGENT | `GET/POST /api/admin/delivery-zones`, `PUT /api/admin/delivery-zones/:id` (xóa = `is_active = 0`) |
| 4.11 | AGENT | Mở rộng `scripts/smoke.mjs`: đăng nhập sai/đúng, truy cập không cookie bị 401, ghi với `Origin` lạ bị 403, đi hết máy trạng thái, hủy hoàn tồn đúng một lần (qua API), `stock_delta` âm quá tồn bị từ chối |
| 4.12 | NGƯỜI | Đặt `ADMIN_PASSWORD`, `JWT_SECRET` trong `.dev.vars` (local). Bản thật đặt ở Phase 6 |

## Tiêu chí nghiệm thu

- [ ] Không cookie → mọi `/api/admin/*` (trừ login) trả 401; sai mật khẩu → `INVALID_CREDENTIALS`; đúng → cookie `HttpOnly; SameSite=Strict`.
- [ ] Request ghi từ `Origin` khác → 403; thiếu `Content-Type: application/json` → bị từ chối.
- [ ] Máy trạng thái đúng bảng chuyển; chuyển sai (ví dụ `PENDING → DELIVERED`) → `INVALID_TRANSITION`.
- [ ] `DELIVERED` → `payment_status = PAID`, có `paid_at`, `delivered_at`. Hủy đơn → tồn hoàn đúng; hủy lần hai không cộng thêm.
- [ ] `stock_delta` làm tồn âm bị từ chối; `stock_delta` hợp lệ cộng/trừ đúng và không ghi đè thay đổi do đơn mới.
- [ ] Tạo sản phẩm mới xuất hiện ở `GET /api/products`; ẩn/archived thì biến mất khỏi public nhưng còn ở admin.
- [ ] Sửa phí giao ở admin có hiệu lực ngay ở báo giá.
- [ ] Không có response nào chứa mật khẩu, JWT hay secret.
- [ ] `npm run typecheck`, `npm test`, `npm run smoke` pass.
