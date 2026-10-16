# Phase 1 — Database D1 (local): migration, seed, kiểm tra

> Rà soát 16/10/2026: [hiện trạng chuẩn](../PROJECT_STATUS.md), [contract hiện tại](API_CONTRACT.md). Phase 0–5 DONE local, Phase 6 IN PROGRESS5/7. Local170 tests/215 source files/40 smoke; staging đã deploy bản mới13:31 ngày 16/10, production vẫn bản 15/10. Output/checklist ghi ngày cũ bên dưới là lịch sử, không phải trạng thái cloud hiện tại.


**Mục tiêu:** schema MVP áp lên D1 **local**, có dữ liệu mẫu, kiểm tra ràng buộc. Chưa đụng D1 remote.

**Trạng thái:** DONE · 5/5 tiêu chí, nghiệm thu D1 local ngày **14/10/2026**. [Hiện trạng](../PROJECT_STATUS.md). Phạm vi nghiệm thu14/10 chỉ dùng D1 local; current Phase 6 đã migrate cả hai D1 remote. Không áp deferred/0002 hoặc sửa migration0001 đã áp remote.

**Quyết định trước migration:** đã đối chiếu v1 và v2, chốt nguyên DDL v2 theo phạm vi 10 bảng và seed hiện có. [Bảng khác biệt và lý do](../DATABASE_DESIGN.md#đối-chiếu-canonical-v1--v2-đã-chốt). [`migrations/0001_mvp.sql`](../../migrations/0001_mvp.sql) là nguồn DDL duy nhất; hai file schema trong docs chỉ chứa chú thích dẫn về migration. Sau khi chốt không phát hiện lỗi schema qua test, nên **không sửa DDL**. SHA-256 khi nghiệm thu: `9ee756750b15b50f902e17db41a3ef75a2c0e5437c9eb56b7a9253a83c9aa4e0`.

## 10 bảng của MVP

`users`, `user_addresses`, `categories`, `products`, `product_variants`, `product_images`, `delivery_zones`, `orders`, `order_items`, `order_status_history`.

`custom_requests` nằm ở [`../sql/deferred/0002_custom_requests.sql`](../sql/deferred/0002_custom_requests.sql) — **không áp dụng** ở MVP.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 1.1 | AGENT | Thống nhất canonical v1 với v2 theo phạm vi 10 bảng của Phase 1 và seed v2; ghi rõ thay đổi trong docs. Sau đó tạo `migrations/0001_mvp.sql` từ canonical đã thống nhất. Giữ một nguồn schema chuẩn; bản tham chiếu phải khớp migration hoặc trỏ về migration để tránh lệch |
| 1.2 | AGENT | `npm run db:migrate:local` rồi `npm run db:seed:local` |
| 1.3 | AGENT | Chạy các truy vấn kiểm tra bên dưới bằng `wrangler d1 execute lunara-db --local --command "..."` |
| 1.4 | AGENT | Đã có [`scripts/verify-schema.mjs`](../../scripts/verify-schema.mjs), chạy bằng `npm run db:verify`; 13 nhóm trên D1 local, không thêm dependency |
| 1.5 | AGENT | Cập nhật tài liệu cũ cho khớp schema mới (xem mục "Tài liệu cần sửa") |
| 1.6 | NGƯỜI | Điền **khu vực giao thật** vào `delivery_zones` (tỉnh/thành, phường, phí, ngưỡng miễn phí). Seed hiện chỉ là ví dụ. Có thể làm sau ở Phase 4 qua trang admin hoặc ở Phase 6 trước khi mở bán |

## Truy vấn kiểm tra nhanh

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY 1;   -- kỳ vọng 10 bảng (+ d1_migrations)
SELECT COUNT(*) FROM categories;        -- 4
SELECT COUNT(*) FROM products;          -- 8
SELECT COUNT(*) FROM product_variants;  -- 24
SELECT COUNT(*) FROM delivery_zones;    -- 4
PRAGMA foreign_key_check;               -- rỗng
```

## Kiểm tra ràng buộc (phải tự động hóa)

Mỗi mục là một trường hợp phải **bị từ chối** (trừ khi ghi chú khác):

1. Đơn có `grand_total ≠ subtotal − discount_total + delivery_fee`.
2. `delivery_date` sai định dạng (`2026-1-5`).
3. Hai đơn cùng `idempotency_key`; nhưng nhiều đơn `idempotency_key = NULL` thì **được phép**.
4. `order_number` trùng.
5. Trừ tồn vượt số hiện có (`stock_quantity − n < 0`) → lỗi CHECK, và khi đặt trong `batch`/transaction thì **không còn đơn nào được ghi**.
6. `line_total ≠ unit_price × quantity`.
7. Hai ảnh `is_primary = 1` cùng sản phẩm; hai địa chỉ mặc định cùng user.
8. `compare_at_price < price`; trùng (product, size); size lạ.
9. Email viết hoa hoặc trùng email.
10. `payment_method` khác `COD`.
11. Xóa cứng sản phẩm vẫn giữ nguyên snapshot trong `order_items` (FK về `NULL`).
12. Xóa category còn sản phẩm bị chặn.
13. Áp `0001` hai lần không lỗi (`IF NOT EXISTS`); seed chạy hai lần không nhân đôi dữ liệu.

Verifier đọc database D1 local được Wrangler migrate/seed để kiểm đúng 10 bảng, một migration, số dòng, FK và DDL khớp canonical. Các ca cố tình ghi/xóa dùng binding D1 local riêng qua `getPlatformProxy({ persist: false, remoteBindings: false })`; database đã seed chỉ được đọc. Nhóm 5 gọi `.batch()` thật và kiểm không còn order/items/history, tồn giữ nguyên khi lỗi CHECK. Nhóm 13 chạy lại raw DDL rồi seed hai lần và so sánh toàn bộ dòng nghiệp vụ, kể cả 8 ảnh.

Verifier Python in-memory cũ đã bỏ để không duy trì hai suite và tránh tự áp deferred/0002. Không dùng kết quả 28/28 cũ để tick tiêu chí. Khi phát triển verifier, `PRAGMA integrity_check` bị D1 binding trả `SQLITE_AUTH`; bỏ phép kiểm bổ sung không thuộc tiêu chí này, giữ `PRAGMA foreign_key_check` được D1 hỗ trợ. Đây là thay đổi verifier, không phải lỗi hoặc thay đổi schema.

## Lưu ý D1/SQLite

- Dùng `?` hoặc `?1` kèm `.bind()`. Tối đa **100 tham số bind** mỗi câu lệnh.
- Mỗi statement trong `batch()` tính vào giới hạn 50 truy vấn/request ở gói Free.
- `batch()` chạy như một transaction: nếu một statement **lỗi**, toàn bộ rollback. Statement `UPDATE` ảnh hưởng 0 dòng **không phải lỗi** — vì vậy việc trừ tồn dựa vào `CHECK (stock_quantity >= 0)`, không dựa vào `WHERE stock >= ?` (xem Phase 3).
- `datetime('now')` là UTC, định dạng `YYYY-MM-DD HH:MM:SS` (không có `T`/`Z`). API chuyển sang ISO-8601 khi trả ra.
- Không đặt `PRAGMA foreign_keys` trong migration (D1 đã bật FK).

## Tài liệu cần sửa cho khớp

- `docs/DATABASE_DESIGN.md`: đã ghi 10 bảng, đối chiếu đầy đủ v1/v2 và lý do; các cột idempotency/COD/hoàn tồn/actor, CHECK, unique, index và giới hạn thực tế. JSON chỉ thuộc wizard deferred.
- `docs/TECH_STACK.md`: đã cập nhật trạng thái database local; giữ auth admin MVP secret + JWT cookie, quota là sizing kế hoạch cần kiểm tra lại trước deploy.
- `docs/FRONTEND_ENTITIES.md`: đã đối chiếu canonical; `CustomRequest` deferred, delivery mapping giữ theo v2. README, handbook và project status đã cập nhật cùng nguồn schema.

## Tiêu chí nghiệm thu

- [x] `migrations/0001_mvp.sql` áp dụng sạch trên D1 local; `d1_migrations` ghi nhận 1 migration.
- [x] Seed có đủ 4/8/24/4 dòng (và 8 ảnh); chạy lại không nhân đôi.
- [x] `npm run db:verify` chạy đủ 13 nhóm kiểm tra ở trên và pass.
- [x] `PRAGMA foreign_key_check` rỗng.
- [x] Tài liệu cũ đã cập nhật; không còn tham chiếu `custom_requests` như một phần của MVP hiện hành (chỉ lịch sử đối chiếu và deferred).

## Bằng chứng lệnh — 14/10/2026

Output trích từ lệnh chạy trong repository, Node 24.11.1 / Wrangler 4.150.0, tất cả exit code 0. Khu vực, phí, sản phẩm/ảnh, giá và tồn trong seed là **dữ liệu mẫu**; bước 1.6 không chặn nghiệm thu database local, cần chủ shop điền trước mở bán.

```text
> npm run db:migrate:local
> wrangler d1 migrations apply lunara-db --local
Resource location: local
🚣 25 commands executed successfully.
┌──────────────┬────────┐
│ name         │ status │
├──────────────┼────────┤
│ 0001_mvp.sql │ ✅     │
└──────────────┴────────┘

> npm run db:seed:local
> wrangler d1 execute lunara-db --local --file=./docs/sql/MVP_SEED_DEV.sql
Resource location: local
🚣 48 commands executed successfully.

> npm run db:seed:local
Resource location: local
🚣 48 commands executed successfully.

> npm run db:migrate:local
Resource location: local
✅ No migrations to apply!
```

Truy vấn trực tiếp sau seed lần hai:

```powershell
node node_modules/wrangler/bin/wrangler.js d1 execute lunara-db --local --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name; SELECT name FROM d1_migrations ORDER BY id; SELECT (SELECT COUNT(*) FROM categories) AS categories, (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM product_variants) AS product_variants, (SELECT COUNT(*) FROM product_images) AS product_images, (SELECT COUNT(*) FROM delivery_zones) AS delivery_zones; PRAGMA foreign_key_check;" --json
```

Các `results` theo thứ tự trong output JSON (bỏ `meta.duration`):

```json
[
  {"results":[{"name":"categories"},{"name":"d1_migrations"},{"name":"delivery_zones"},{"name":"order_items"},{"name":"order_status_history"},{"name":"orders"},{"name":"product_images"},{"name":"product_variants"},{"name":"products"},{"name":"user_addresses"},{"name":"users"}],"success":true},
  {"results":[{"name":"0001_mvp.sql"}],"success":true},
  {"results":[{"categories":4,"products":8,"product_variants":24,"product_images":8,"delivery_zones":4}],"success":true},
  {"results":[],"success":true}
]
```

```text
> npm run db:verify
> node scripts/verify-schema.mjs
D1 LOCAL ONLY: remoteBindings=false; persisted database is read-only in this verifier.
Canonical SHA-256: 9ee756750b15b50f902e17db41a3ef75a2c0e5437c9eb56b7a9253a83c9aa4e0
Using secrets defined in .dev.vars
LOCAL migration: [{"name":"0001_mvp.sql"}]; seed: {"categories":4,"products":8,"product_variants":24,"product_images":8,"delivery_zones":4}
LOCAL foreign_key_check: []; business tables: 10
Using secrets defined in .dev.vars
PASS 01/13 order total formula and discount CHECK
PASS 02/13 delivery_date YYYY-MM-DD shape CHECK
PASS 03/13 unique idempotency_key; multiple NULL keys allowed
PASS 04/13 duplicate order_number rejected
PASS 05/13 oversell CHECK rolls back real D1 batch: order/items/history/stock
PASS 06/13 line_total = unit_price * quantity CHECK
PASS 07/13 one primary image/product and default address/user
PASS 08/13 variant price, unique product/size and valid size CHECK
PASS 09/13 lowercase and unique email
PASS 10/13 COD only
PASS 11/13 hard delete preserves every order snapshot; product/variant FKs become NULL
PASS 12/13 category delete RESTRICT with products
PASS 13/13 raw 0001 reapplies; seed twice leaves business rows unchanged
D1 LOCAL constraints: 13/13 groups passed; 0 failed; 46 assertions.
Deferred/0002 was not loaded. Persisted local seed was not modified by destructive cases.
```

Kiểm tra bắt buộc của repository:

```text
> npm run typecheck
> tsc --noEmit && tsc -p tsconfig.worker.json --noEmit
[exit 0, không có lỗi]

> npm run check:architecture
Architecture checked: 170 source files; layer boundaries, public APIs, presentation state, and Tailwind page styles.

> npm test
ℹ tests 18
ℹ pass 18
ℹ fail 0

> npm run build
vite v6.4.4 building SSR bundle for production...
✓ 29 modules transformed.
✓ built in 629ms
vite v6.4.4 building for production...
✓ 2492 modules transformed.
✓ built in 31.38s
```

`[exit 0, không có lỗi]` là chú thích về kết quả lệnh. Không đổi dependency nên không chạy lại audit. Không đổi Worker route hoặc UI; flow bị ảnh hưởng được kiểm bằng migration/seed/13 nhóm D1 local. [Wrangler getPlatformProxy](https://developers.cloudflare.com/workers/wrangler/api/) / [D1 batch rollback](https://developers.cloudflare.com/d1/worker-api/d1-database/) là tài liệu API đã đối chiếu khi triển khai verifier.
