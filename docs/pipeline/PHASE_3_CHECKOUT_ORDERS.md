# Phase 3 — Đặt hàng COD, tồn kho, idempotency, tra đơn

File giữ thuật toán và nghiệm thu backend Phase 3 ngày 14/10/2026; payload/errors hiện hành ở [API_CONTRACT](API_CONTRACT.md), UX ở [ORDER_TRACKING](../ORDER_TRACKING.md), cấu hình bảo vệ ở [BOT_PROTECTION](../BOT_PROTECTION.md). Các bổ sung sau mốc nghiệm thu đã được đối chiếu source; deployment/checks hiện tại ở [PROJECT_STATUS](../PROJECT_STATUS.md).

**Mục tiêu:** `POST /api/orders` đúng, an toàn và không bán quá tồn; tra đơn cho khách; dịch vụ chuyển trạng thái đơn (dùng lại ở Phase 4). Hợp đồng: [API_CONTRACT.md](API_CONTRACT.md). Đây là phase **quan trọng nhất**; không cắt.

**Trạng thái:** DONE local · **5/5 tiêu chí**, 14/10/2026. Đã có API ghi order/tồn/idempotency, tra đơn và service chuyển trạng thái; không làm frontend/admin. [Hiện trạng](../PROJECT_STATUS.md). Dùng nguyên [schema canonical](../../migrations/0001_mvp.sql) Phase 1 và services Phase 2. [Bằng chứng/output](#bằng-chứng-lệnh--14102026).

## Điều kiện bắt đầu — đã kiểm 14/10/2026

**Đầu vào đã được đáp ứng và Phase 3 đã triển khai/nghiệm thu local.** Mục này ghi các điều kiện bắt đầu và kết quả đối chiếu sau khi hoàn tất; không phải danh sách việc còn thiếu. Không tạo tài nguyên Cloudflare hoặc chỉnh DDL trong Phase 3.

| Điều kiện | Bằng chứng / lưu ý |
| --- | --- |
| Schema/seed Phase 1 đủ bảng và ràng buộc | `npm run db:verify`: 13/13 nhóm, 46 assertions; 10 bảng, FK sạch, counts 4/8/24/8/4; đã kiểm unique idempotency, total CHECK và rollback batch |
| Catalog/quote Phase 2 đã nghiệm thu | 8/8 tiêu chí, 53 test pass, dev/preview smoke 16/16; [output](PHASE_2_API_CATALOG.md#bằng-chứng-lệnh--14102026) |
| Service dùng lại | `priceCart(db, items, province, ward, methodCode)` trả totals + issues; `phoneSchema`/`normalizePhone`, `validateDeliverySlot`, `todayInVN`, `toIso`, AppError và validator đã có |
| D1/query budget | Giỏ tối đa 15 dòng; replay 1 + pricing 2 + batch 32 = 35 statements cho luồng tạo đơn bình thường. Phải đếm thực tế và giữ các nhánh retry/error trong giới hạn 40 |
| Config/policy | Dùng giả định Phase 2 cho test local; trước mở bán chủ shop cần chốt khu vực/phí/cutoff/slot thật. UI dùng VND/giờ VN; admin backend Phase 4 và frontend Phase 5 đã nghiệm thu local |
| Turnstile | Verifier đã triển khai. Hiện thiếu/blank secret fail-closed 503; bypass chỉ khi server opt-in rõ ràng và hostname loopback chính xác. Provider mock không thay nghiệm thu cloud |
| Phạm vi hoàn tất / tiếp theo | Schema order/lookup, UUID v4/mã đơn, create/lookup/transition services, routes và 10 ca smoke đã xong. Phase 4 admin status gọi lại transitionOrder; Phase 5 checkout/retry/xác nhận/lookup/admin UI DONE local (15/10/2026). Nghiệm thu remote/policy/quota xem PROJECT_STATUS. Không có route hủy đơn khách |

Smoke hiện giữ các ca catalog read-only trên URL positional local; ca ghi/chỉnh tồn Phase 3 tự dùng HTTP loopback + workerd D1 `persist:false`, `remoteBindings:false`. Không reset/xóa seed đang dùng trên 5173/4173 và không truy cập remote.

## Thuật toán tạo đơn (`worker/services/orders.ts`)

1. Zod validate body; bắt buộc header `Idempotency-Key` (UUID v4 theo contract). Chuẩn hóa SĐT. Qua Turnstile trước D1: secret thiếu/blank →503 (trừ controlled loopback opt-in), token/action/hostname sai hoặc provider lỗi →403 `FORBIDDEN`. Token mới cho mỗi lần gửi; không chuyển UUID đơn vào Siteverify.
2. **Replay:** `SELECT ... FROM orders WHERE idempotency_key = ?`; có → trả `200` + `replayed: true` (không ghi gì).
3. `priceCart(db, items, province, ward, methodCode)` (Phase 2): đọc variants bằng 1 truy vấn, gộp dòng, trả snapshot `lines`, tổng và `issues`. Khác quote HTTP 200, createOrder phải từ chối `VARIANT_UNAVAILABLE` hoặc `OUT_OF_STOCK` (409); chuyển issue thiếu tồn thành `details: [{variant_id, requested, available}]`, `requested` lấy quantity sau gộp. Không ghi batch khi có issue.
4. Phí đã được `priceCart()` tính qua `resolveFee()` bằng 1 truy vấn JOIN zone active với danh mục của chính phường, không fallback tỉnh. Dùng `delivery_fee` trong kết quả pricing, **không gọi lại resolveFee**. Vẫn phải xử lý `NO_DELIVERY_ZONE` 422.
5. Kiểm tra ngày/khung giờ/phương thức giao (`INVALID_DELIVERY_SLOT`).
6. Tính `subtotal`, `discount_total = 0`, `delivery_fee`, `grand_total = subtotal - discount_total + delivery_fee`.
7. Sinh `order_number` = `LNR-<YYMMDD giờ VN>-<6 ký tự ngẫu nhiên>` từ bảng chữ cái không gây nhầm lẫn (bỏ `0 O 1 I L`), dùng `crypto.getRandomValues`.
8. **Một `db.batch([...])`** theo đúng thứ tự:
   1. `INSERT INTO orders (...)` với COUNT nguyên tử giới hạn 3 PENDING/SĐT người đặt chuẩn hóa; vượt cap kích hoạt NOT NULL guard và rollback.
   2. Mỗi dòng: `INSERT INTO order_items (order_id, ...) VALUES ((SELECT id FROM orders WHERE order_number = ?), ...)` với snapshot lấy từ dữ liệu DB đã đọc ở bước 3.
   3. Mỗi dòng: `UPDATE product_variants SET stock_quantity = stock_quantity - ?, updated_at = datetime('now') WHERE id = ?` — **không điều kiện**. Nếu âm, `CHECK (stock_quantity >= 0)` báo lỗi và **cả batch rollback**.
   4. `INSERT INTO order_status_history (order_id, from_status, to_status, actor_label, note) VALUES ((SELECT id FROM orders WHERE order_number = ?), NULL, 'PENDING', 'CUSTOMER', 'Đặt hàng')`.
9. **Bắt lỗi batch:**
   - Thông điệp chứa `CHECK constraint failed` và `stock_quantity` → đọc lại tồn, trả `OUT_OF_STOCK` với `[{variant_id, requested, available}]`.
   - `UNIQUE constraint failed: orders.idempotency_key` → đọc đơn theo key, trả `200 replayed`.
   - `UNIQUE constraint failed: orders.order_number` → sinh mã mới, tối đa 3 batch tổng cộng; chỉ retry nếu ngân sách còn đủ cho cả batch và một diagnostic read. Không đủ → `CONFLICT` 409, không ghi thêm.
   - NOT NULL guard `orders.sender_phone` → `PENDING_ORDER_LIMIT` 429, batch rollback.
   - Lỗi khác → `INTERNAL`.
10. Trả `201 OrderSummary` (dựng từ dữ liệu đã tính, không cần đọc lại).

> **Vì sao không dùng `UPDATE ... WHERE stock_quantity >= ?`:** statement đó ảnh hưởng 0 dòng vẫn là *thành công* nên batch không rollback, dẫn tới đơn được ghi mà tồn không trừ. Dùng trừ không điều kiện và để `CHECK` ném lỗi. D1 ghi tuần tự theo từng database nên hai đơn song song không xen kẽ; đơn nào chạm tồn âm sẽ rollback.

**Ngân sách truy vấn kế hoạch (giả định 50/request; kiểm tra quota trước deploy):** pre-read = replay 1 + pricing 2; batch `2N + 2` với `N ≤ 15` → 35 statements cho luồng thường, cổng nghiệm thu vẫn ≤40. Không thêm truy vấn đọc variants trong vòng lặp. Đếm riêng các nhánh lỗi/retry, gồm từng statement trong batch; không giả định retry nguyên batch miễn phí. Nếu retry có thể vượt 40, phải giảm số statements hoặc dừng an toàn trong giới hạn trước khi ghi lại.

## Tra đơn

Backend đã triển khai `POST /api/orders/lookup`; [hợp đồng request/response và lỗi](API_CONTRACT.md#post-apiorderslookup). Query khớp mã và SĐT người đặt/người nhận, đọc thêm items/history khi tìm thấy; dùng DTO public, không có route hủy dành cho khách. Giao diện/timeline/quyền riêng tư: [ORDER_TRACKING](../ORDER_TRACKING.md).

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

**Hủy (`→ CANCELLED`) với `restock=true` — hoàn tồn đúng một lần.** Đây là mặc định ở PENDING/CONFIRMED/PREPARING. IN_TRANSIT hủy cần note không rỗng và mặc định restock=false; nhánh đó chỉ cập nhật trạng thái/history, giữ stock_released=0. CANCELLED vẫn terminal. Thứ tự statement **quan trọng** (hoàn tồn trước, đổi trạng thái sau, cùng điều kiện):
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

## Checklist đã thực hiện

| # | Ai | Việc |
| --- | --- | --- |
| 3.1 | AGENT | `shared/schemas.ts`: schema Zod cho body đặt đơn, lookup (dùng được ở FE) |
| 3.2 | AGENT | `worker/lib/ids.ts`: `newOrderNumber()`, `isUuid()`; `worker/lib/turnstile.ts` (fail-closed; controlled loopback bypass chỉ do server opt-in) |
| 3.3 | AGENT | `worker/services/orders.ts`: `createOrder`, `lookupOrder`, `transitionOrder` theo mô tả trên |
| 3.4 | AGENT | `worker/routes/orders.ts`: `POST /api/orders`, `POST /api/orders/lookup`; không triển khai route hủy cho khách |
| 3.5 | AGENT | Mở rộng `scripts/smoke.mjs` với các kịch bản dưới đây; chỉnh tồn chỉ trong DB local cô lập hoặc snapshot/restore dữ liệu test. Mọi lệnh Wrangler phải `--local`; giữ guard 127.0.0.1 |
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
10. `transitionOrder`: `PENDING→CONFIRMED→PREPARING→IN_TRANSIT→DELIVERED` ghi đủ history, `PAID` sau `DELIVERED`; hủy một đơn → tồn hoàn; hủy lần hai → `INVALID_TRANSITION`, tồn **không** cộng thêm. Phase 3 kiểm service trực tiếp; Phase 4 đã bổ sung kiểm qua admin API.

## Tiêu chí nghiệm thu

- [x] 10 kịch bản smoke trên pass (output tại mốc Phase 3 giữ bên dưới).
- [x] Không có đường nào ghi `orders` mà không trừ tồn, hoặc trừ tồn mà không có đơn (đối chiếu sau smoke: tổng `order_items.quantity` của đơn chưa hủy khớp mức tồn giảm).
- [x] Tổng số truy vấn D1 của `POST /api/orders` với giỏ 15 dòng ≤ 40 (success 35, CHECK/unique race 36, collision dừng ở 35; đếm nguyên failed batch).
- [x] Không có SQL nối chuỗi từ input; mọi tham số đều bind (review source và test chuỗi customer chứa SQL trong batch binds).
- [x] `npm run typecheck`, `npm test` pass.

## Triển khai và phạm vi kiểm chứng

- [Schemas](../../shared/schemas.ts) dùng chung FE/Worker; trim tên/địa chỉ, normalize SĐT, giữ nội dung khách nhập; client giá/tổng/role bị bỏ qua. [ids.ts](../../worker/lib/ids.ts) kiểm UUID v4, mã đơn dùng ngày VN và `crypto.getRandomValues` với rejection sampling.
- [orders.ts](../../worker/services/orders.ts): replay → pricing hai queries → validate delivery → một batch INSERT order/items, trừ tồn không điều kiện rồi history. FK của item chống ghi đơn khi variant bị xóa giữa pricing và batch; CHECK rollback toàn bộ khi hụt tồn. Lookup ba statements với whitelist DTO, giữ snapshot, không trả admin_note/stock_released/actor.
- `transitionOrder(db, orderNumber, newStatus, actorLabel = 'ADMIN', note?, options?)` dùng đúng thứ tự SQL hoàn tồn trước CAS đổi trạng thái sau. Kiểm `meta.changes`, bỏ qua variant_id null, history NOT EXISTS. Tại mốc Phase 3 service chưa expose route; Phase 4 đã bổ sung admin status với authorization và gọi nguyên service. Đã kiểm hủy từ PENDING/CONFIRMED/PREPARING, hủy đồng thời, race CONFIRMED/CANCELLED, DELIVERED/PAID và variant xóa cứng.
- [turnstile.ts](../../worker/lib/turnstile.ts): yêu cầu Siteverify explicit success/action/hostname, provider lỗi fail-closed; thiếu secret chỉ bypass khi cờ server và exact loopback cùng đúng. Routes không truyền UUID đơn cho Siteverify. Cấu hình và nghiệm thu provider xem BOT_PROTECTION.
- Ngân sách bảo thủ: mỗi batch tính toàn bộ số statement gửi, kể cả lỗi ở statement đầu. Trước mỗi lần ghi, service dành một statement cho chẩn đoán; giỏ 15 dòng dùng 35 hoặc 36 khi có diagnostic read. Trùng order_number ở giỏ này trả CONFLICT an toàn sau batch đầu, vì retry nguyên batch sẽ vượt 40; giỏ nhỏ có tối đa ba batch.
- [smoke.mjs](../../scripts/smoke.mjs) giữ 16 nhóm catalog trên URL positional loopback rồi tạo HTTP server `127.0.0.1` cổng ngẫu nhiên với workerd D1 `persist:false`, `remoteBindings:false`. Mười ca order và đối chiếu tồn chạy trên DB này; cleanup server/proxy trong finally. Không reset/snapshot/chỉnh seed persisted, không dùng D1 remote; không đổi DDL/dependency/frontend/admin. Phase 3 smoke chạy source Hono qua HTTP + binding D1 thật; catalog/validation cũng kiểm build preview.

## Bằng chứng lệnh — 14/10/2026

Output bên dưới giữ nguyên tại mốc Phase 3 (**92 tests, 27 nhóm smoke**), không phải số đếm source hiện tại; xem PROJECT_STATUS cho checks mới.

Output trích từ source cuối; các lệnh kiểm tra exit 0. `[exit 0]` là chú thích kết quả.

```text
> npm run typecheck
> tsc --noEmit && tsc -p tsconfig.worker.json --noEmit
[exit 0]

> npm run check:architecture
Architecture checked: 178 source files; layer boundaries, public APIs, presentation state, and Tailwind page styles.

> npm test
Phase 3 D1 LOCAL race: last stock=1; HTTP=[201,409/OUT_OF_STOCK]; final stock=0; orders/items/history=[1,1,1]; submitted=[7,8].
Phase 3 D1 LOCAL idempotency race: HTTP=[201,200 replayed]; exactly one decrement and one order; submitted=[7,8].
Phase 3 D1 LOCAL statement budget: 15 lines success=35; last-stock CHECK failure=36; failed order/items/history=[0,0,0]; all earlier decrements rolled back; limit=40.
Phase 3 D1 LOCAL transition: PENDING -> CONFIRMED -> PREPARING -> IN_TRANSIT -> DELIVERED; history=5; payment=PAID; paid_at=delivered_at; terminal changes rejected.
Phase 3 D1 LOCAL cancellation: PENDING/CONFIRMED/PREPARING -> CANCELLED restores both lines exactly once; second cancel=INVALID_TRANSITION; no extra history/stock.
Phase 3 D1 LOCAL concurrent cancellation: both pre-read PENDING; one success/one INVALID_TRANSITION; stock restored once; history=[PENDING,CANCELLED].
Phase 3 D1 statement budget: collision lines=15 submitted=35 batches=1, limit=40.
ℹ tests 92
ℹ pass 92
ℹ fail 0

> npm run build
vite v6.4.4 building SSR bundle for production...
✓ 147 modules transformed.
dist/lunara/index.js 269.99 kB
✓ built in 847ms
vite v6.4.4 building for production...
✓ 1816 modules transformed.
✓ built in 3.00s
```

```text
> npm run preview -- --port 4173 --strictPort
➜ Local: http://127.0.0.1:4173/
> npm run smoke -- http://127.0.0.1:4173
Catalog smoke: 16/16 PASS, 0 FAIL at http://127.0.0.1:4173.
Phase 3 isolated HTTP smoke at http://127.0.0.1:54936; real D1, persist=false, remoteBindings=false.
PASS Phase 3 01/10 valid COD order: DB totals, stock deducted, snapshots/history persisted
PASS Phase 3 02/10 same idempotency key replays once without order/stock writes
D1 Phase 3 concurrency: HTTP statuses=201,409; last_stock=0; new_orders=1; loser_statements=8.
PASS Phase 3 03/10 parallel HTTP last-item purchase: exactly 201 + 409; no hanging order
PASS Phase 3 04/10 forged client prices/totals/fees are ignored
PASS Phase 3 05/10 overstock rejection includes merged requested/available; DB unchanged
PASS Phase 3 06/10 unavailable province rejects; ward fee and both free thresholds use DB
PASS Phase 3 07/10 SAME_DAY tomorrow and past delivery date reject without writes
PASS Phase 3 08/10 lookup accepts sender/recipient normalized phones; wrong code/phone share 404
PASS Phase 3 09/10 missing/malformed/non-v4 idempotency keys return 400 without writes
D1 Phase 3 transitions: history=PENDING,CONFIRMED,PREPARING,IN_TRANSIT,DELIVERED; payment=PAID; cancellation=+2 once; repeat=INVALID_TRANSITION/+0.
PASS Phase 3 10/10 transition history + DELIVERED/PAID; cancellation releases stock once
Phase 3 mandatory smoke: 10/10 PASS, 0 FAIL.
D1 Phase 3 query budget: cart_lines=15; submitted_statements=35; limit=40; maximum_all_order_requests=35.
D1 Phase 3 reconciliation: variants=24; every stock reduction=uncancelled order_items quantity; dangling_orders=0; foreign_key_check=[]; orders=8.
PASS Phase 3 acceptance: 15-line query budget and full stock/order reconciliation
Local smoke: 27/27 PASS, 0 FAIL; persisted seed untouched.
```

```text
> npm run graph:sync
* Synced 9 changed files
• Added: 9 - 94 nodes in 501ms
> npm run graph:status -- --json
pendingChanges: { added: 0, modified: 0, removed: 0 }
> git diff --check
[exit 0]
```

Rollup có warning chú thích PURE trong dependency Zod; Node có warning SQLite experimental. Các warning không làm thất bại kiểm tra. Commit/push/deploy chỉ khi có yêu cầu riêng.
