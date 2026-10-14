# Phase 3 — Đặt hàng COD, tồn kho, idempotency, tra đơn

**Mục tiêu:** `POST /api/orders` đúng, an toàn và không bán quá tồn; tra đơn cho khách; dịch vụ chuyển trạng thái đơn (dùng lại ở Phase 4). Hợp đồng: [API_CONTRACT.md](API_CONTRACT.md). Đây là phase **quan trọng nhất**; không cắt.

**Trạng thái:** PLANNED · chưa ghi order/tồn/idempotency. [Hiện trạng](../PROJECT_STATUS.md). Thuật toán dưới phụ thuộc schema v2 đã được thống nhất/migrate ở Phase 1 và services Phase 2.

## Thuật toán tạo đơn (`worker/services/orders.ts`)

1. Zod validate body; bắt buộc header `Idempotency-Key` (UUID). Chuẩn hóa SĐT. Nếu `TURNSTILE_SECRET` có giá trị → xác minh `turnstile_token` qua Siteverify (thiếu/sai → `FORBIDDEN`).
2. **Replay:** `SELECT ... FROM orders WHERE idempotency_key = ?`; có → trả `200` + `replayed: true` (không ghi gì).
3. `priceCart()` (Phase 2): đọc variants bằng 1 truy vấn, kiểm tra còn bán/đủ tồn → thiếu thì `OUT_OF_STOCK` kèm `details`.
4. `resolveFee()`: 1 truy vấn dạng `WHERE province_name = ? AND ward_name IN (?, '') AND is_active = 1 ORDER BY ward_name DESC LIMIT 1`.
5. Kiểm tra ngày/khung giờ/phương thức giao (`INVALID_DELIVERY_SLOT`).
6. Tính `subtotal`, `discount_total = 0`, `delivery_fee`, `grand_total = subtotal - discount_total + delivery_fee`.
7. Sinh `order_number` = `LNR-<YYMMDD giờ VN>-<6 ký tự ngẫu nhiên>` từ bảng chữ cái không gây nhầm lẫn (bỏ `0 O 1 I L`), dùng `crypto.getRandomValues`.
8. **Một `db.batch([...])`** theo đúng thứ tự:
   1. `INSERT INTO orders (...)`.
   2. Mỗi dòng: `INSERT INTO order_items (order_id, ...) VALUES ((SELECT id FROM orders WHERE order_number = ?), ...)` với snapshot lấy từ dữ liệu DB đã đọc ở bước 3.
   3. Mỗi dòng: `UPDATE product_variants SET stock_quantity = stock_quantity - ?, updated_at = datetime('now') WHERE id = ?` — **không điều kiện**. Nếu âm, `CHECK (stock_quantity >= 0)` báo lỗi và **cả batch rollback**.
   4. `INSERT INTO order_status_history (order_id, from_status, to_status, actor_label, note) VALUES ((SELECT id FROM orders WHERE order_number = ?), NULL, 'PENDING', 'CUSTOMER', 'Đặt hàng')`.
9. **Bắt lỗi batch:**
   - Thông điệp chứa `CHECK constraint failed` và `stock_quantity` → đọc lại tồn, trả `OUT_OF_STOCK` với `[{variant_id, requested, available}]`.
   - `UNIQUE constraint failed: orders.idempotency_key` → đọc đơn theo key, trả `200 replayed`.
   - `UNIQUE constraint failed: orders.order_number` → sinh mã mới, thử lại tối đa 3 lần.
   - Lỗi khác → `INTERNAL`.
10. Trả `201 OrderSummary` (dựng từ dữ liệu đã tính, không cần đọc lại).

> **Vì sao không dùng `UPDATE ... WHERE stock_quantity >= ?`:** statement đó ảnh hưởng 0 dòng vẫn là *thành công* nên batch không rollback, dẫn tới đơn được ghi mà tồn không trừ. Dùng trừ không điều kiện và để `CHECK` ném lỗi. D1 ghi tuần tự theo từng database nên hai đơn song song không xen kẽ; đơn nào chạm tồn âm sẽ rollback.

**Ngân sách truy vấn kế hoạch (giả định 50/request; kiểm tra quota trước deploy):** pre-read ≈ 3–4 + batch `2N + 2` với `N ≤ 15` → tối đa ≈ 36. Không thêm truy vấn trong vòng lặp theo từng dòng.

## Tra đơn

`POST /api/orders/lookup { order_number, phone }`: truy vấn `WHERE order_number = ? AND (sender_phone = ? OR recipient_phone = ?)`; không thấy → `NOT_FOUND` (cùng thông điệp dù sai mã hay sai SĐT). Sau đó đọc items và history (tổng 3 truy vấn). Không trả `admin_note`.

## Dịch vụ chuyển trạng thái (`transitionOrder`) — dùng ở Phase 4

Bảng chuyển hợp lệ ở [API_CONTRACT](API_CONTRACT.md). Đọc đơn + items trước (để biết trạng thái hiện tại `cur` và danh sách dòng), rồi một `batch`:

**Chuyển thông thường** (ví dụ `PENDING → CONFIRMED`):
```sql
UPDATE orders SET status_code = ?new, updated_at = datetime('now')
 WHERE order_number = ? AND status_code = ?cur;                       -- đọc meta.changes của statement này
INSERT INTO order_status_history (order_id, from_status, to_status, actor_label, note)
SELECT id, ?cur, ?new, ?actor, ?note FROM orders o
 WHERE o.order_number = ? AND o.status_code = ?new
   AND NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id AND h.to_status = ?new);
```
`→ DELIVERED`: thêm `payment_status = 'PAID', paid_at = datetime('now'), delivered_at = datetime('now')` vào `UPDATE`.

**Hủy (`→ CANCELLED`) — hoàn tồn đúng một lần.** Thứ tự statement **quan trọng** (hoàn tồn trước, đổi trạng thái sau, cùng điều kiện):
```sql
-- (a) mỗi dòng hàng:
UPDATE product_variants SET stock_quantity = stock_quantity + ?qty, updated_at = datetime('now')
 WHERE id = ?variant_id
   AND EXISTS (SELECT 1 FROM orders WHERE order_number = ? AND status_code = ?cur AND stock_released = 0);
-- (b)
UPDATE orders SET status_code = 'CANCELLED', stock_released = 1, updated_at = datetime('now')
 WHERE order_number = ? AND status_code = ?cur AND stock_released = 0;   -- kiểm tra meta.changes
-- (c) ghi history như trên
```
Nếu `meta.changes` của (b) = 0 (đơn đã đổi trạng thái/đã hủy) → thì (a) cũng không chạy; trả `INVALID_TRANSITION`. Hủy hai lần không cộng tồn hai lần.

Không có `variant_id` (variant đã bị xóa cứng) thì bỏ qua dòng đó khi hoàn tồn.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 3.1 | AGENT | `shared/schemas.ts`: schema Zod cho body đặt đơn, lookup (dùng được ở FE) |
| 3.2 | AGENT | `worker/lib/ids.ts`: `newOrderNumber()`, `isUuid()`; `worker/lib/turnstile.ts` (chỉ chạy khi có secret) |
| 3.3 | AGENT | `worker/services/orders.ts`: `createOrder`, `lookupOrder`, `transitionOrder` theo mô tả trên |
| 3.4 | AGENT | `worker/routes/orders.ts`: `POST /api/orders`, `POST /api/orders/lookup`; (tùy chọn) `POST /api/orders/:orderNumber/cancel` — khách chỉ hủy khi `PENDING` và đúng SĐT |
| 3.5 | AGENT | Mở rộng `scripts/smoke.mjs` với các kịch bản dưới đây (dùng `wrangler d1 execute --local --command` qua `child_process` để chỉnh tồn khi cần) |
| 3.6 | AGENT | Unit test các hàm thuần: tính tiền, sinh mã, kiểm tra khung giờ |

## Kịch bản smoke bắt buộc

1. Đặt đơn hợp lệ → 201; `grand_total = subtotal + phí`; tồn giảm đúng số lượng.
2. Gửi lại cùng `Idempotency-Key` → 200 `replayed: true`; số đơn trong DB không tăng, tồn không giảm thêm.
3. Hai `POST` **song song** (khác key) mua cùng variant khi `stock_quantity = 1` → đúng 1 × 201 và 1 × 409 `OUT_OF_STOCK`; tồn cuối = 0; không có đơn "treo".
4. Body kèm `price`, `grand_total` giả → bị bỏ qua; tổng theo DB.
5. Số lượng vượt tồn → 409 `OUT_OF_STOCK` kèm `available`; tồn không đổi, không có đơn mới.
6. Tỉnh chưa giao → 422 `NO_DELIVERY_ZONE`; phường có dòng riêng → phí riêng; `subtotal ≥ free_from_amount` → phí khu vực = 0.
7. `SAME_DAY` cho ngày mai, hoặc ngày quá khứ → 422 `INVALID_DELIVERY_SLOT`.
8. Lookup đúng mã + SĐT người đặt / người nhận → 200; sai SĐT hoặc sai mã → 404 cùng thông điệp.
9. Thiếu `Idempotency-Key` hoặc không phải UUID → 400.
10. `transitionOrder`: `PENDING→CONFIRMED→PREPARING→IN_TRANSIT→DELIVERED` ghi đủ history, `PAID` sau `DELIVERED`; hủy một đơn → tồn hoàn; hủy lần hai → `INVALID_TRANSITION`, tồn **không** cộng thêm (viết thành test gọi trực tiếp service, hoặc chờ Phase 4 để gọi qua API).

## Tiêu chí nghiệm thu

- [ ] 10 kịch bản smoke trên pass (output đính kèm trong commit/PR).
- [ ] Không có đường nào ghi `orders` mà không trừ tồn, hoặc trừ tồn mà không có đơn (kiểm tra bằng truy vấn đối chiếu sau smoke: tổng `order_items.quantity` của đơn chưa hủy khớp mức tồn giảm).
- [ ] Tổng số truy vấn D1 của `POST /api/orders` với giỏ 15 dòng ≤ 40 (đếm trong test).
- [ ] Không có SQL nối chuỗi từ input; mọi tham số đều bind.
- [ ] `npm run typecheck`, `npm test` pass.

## Goal prompt (dán vào `/goal`)

```text
Đọc docs/pipeline/README.md, API_CONTRACT.md, PHASE_2_API_CATALOG.md (để biết các service đã có) và PHASE_3_CHECKOUT_ORDERS.md rồi thực hiện Phase 3.
Cài POST /api/orders (Idempotency-Key, trừ tồn bằng UPDATE không điều kiện + CHECK để rollback batch), POST /api/orders/lookup, và service transitionOrder (hoàn tồn đúng một lần theo mẫu SQL trong tài liệu).
Ràng buộc: server tự tính tiền/phí; ≤ 40 truy vấn D1 mỗi request với giỏ 15 dòng; mọi SQL bind tham số; không thêm dependency; không làm admin/frontend ở phase này.
Mở rộng scripts/smoke.mjs với 10 kịch bản trong tài liệu, gồm test song song mua nốt món cuối. Xong khi mọi "Tiêu chí nghiệm thu" Phase 3 pass, kèm output.
```
