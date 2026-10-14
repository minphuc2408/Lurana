# Phase 1 — Database D1 (local): migration, seed, kiểm tra

**Mục tiêu:** schema MVP áp lên D1 **local**, có dữ liệu mẫu, kiểm tra ràng buộc. Chưa đụng D1 remote.

**Trạng thái:** PLANNED · chưa migration/seed/`db:verify`. [Hiện trạng](../PROJECT_STATUS.md). Scripts D1 đã chuẩn bị ở Phase 0; schema/seed chưa được nghiệm thu.

**Trước bước 1.1:** đối chiếu canonical [`../sql/MVP_SCHEMA.sql`](../sql/MVP_SCHEMA.sql) với đề xuất [`MVP_SCHEMA.sql`](MVP_SCHEMA.sql) v2. Hai bản khác nội dung; v2 mới có `delivery_zones` và các ràng buộc mô tả dưới đây, còn seed đã chuyển vào `docs/sql/MVP_SEED_DEV.sql` dùng v2. Phase 0 chưa thay canonical hoặc chạy SQL. Thống nhất schema và cập nhật tài liệu liên quan trong Phase 1 trước khi tạo migration.

## 10 bảng của MVP

`users`, `user_addresses`, `categories`, `products`, `product_variants`, `product_images`, `delivery_zones`, `orders`, `order_items`, `order_status_history`.

`custom_requests` nằm ở [`../sql/deferred/0002_custom_requests.sql`](../sql/deferred/0002_custom_requests.sql) — **không áp dụng** ở MVP.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 1.1 | AGENT | `git mv` hoặc copy `docs/sql/MVP_SCHEMA.sql` → `migrations/0001_mvp.sql` (nội dung giữ nguyên). Giữ bản trong `docs/sql/` làm tham chiếu, hoặc thay bằng liên kết/ghi chú trỏ về `migrations/` để tránh hai bản lệch nhau |
| 1.2 | AGENT | `npm run db:migrate:local` rồi `npm run db:seed:local` |
| 1.3 | AGENT | Chạy các truy vấn kiểm tra bên dưới bằng `wrangler d1 execute lunara-db --local --command "..."` |
| 1.4 | AGENT | Viết `scripts/verify-schema.mjs`/Node tests theo runner hiện có để tự động hóa mục "Kiểm tra ràng buộc" trên SQLite/D1 local; thêm `npm run db:verify` ở Phase 1 |
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

> Bản nháp ghi kết quả SQLite 3.45: 28/28 pass. Đây là tham chiếu trước Phase 0, chưa được nghiệm thu lại trên D1 local. Không tick tiêu chí Phase 1 bằng số liệu này.

## Lưu ý D1/SQLite

- Dùng `?` hoặc `?1` kèm `.bind()`. Tối đa **100 tham số bind** mỗi câu lệnh.
- Mỗi statement trong `batch()` tính vào giới hạn 50 truy vấn/request ở gói Free.
- `batch()` chạy như một transaction: nếu một statement **lỗi**, toàn bộ rollback. Statement `UPDATE` ảnh hưởng 0 dòng **không phải lỗi** — vì vậy việc trừ tồn dựa vào `CHECK (stock_quantity >= 0)`, không dựa vào `WHERE stock >= ?` (xem Phase 3).
- `datetime('now')` là UTC, định dạng `YYYY-MM-DD HH:MM:SS` (không có `T`/`Z`). API chuyển sang ISO-8601 khi trả ra.
- Không đặt `PRAGMA foreign_keys` trong migration (D1 đã bật FK).

## Tài liệu cần sửa cho khớp

- `docs/DATABASE_DESIGN.md`: vẫn **10 bảng** nhưng thay `custom_requests` bằng `delivery_zones`; ghi các thay đổi ở đầu `MVP_SCHEMA.sql`; thêm `idempotency_key`, `paid_at`, `delivered_at`, `stock_released`, `actor_label`; xóa mục "Điểm còn thiếu" đã được xử lý (idempotency, ảnh chính/địa chỉ mặc định, công thức tổng tiền, JSON).
- `docs/TECH_STACK.md`: giữ auth admin MVP secret + JWT cookie; quota ghi là sizing kế hoạch, kiểm tra lại trước deploy.
- `docs/FRONTEND_ENTITIES.md`: đã ghi `CustomRequest` deferred và ánh xạ delivery v2; kiểm tra lại sau khi thống nhất schema.

## Tiêu chí nghiệm thu

- [ ] `migrations/0001_mvp.sql` áp dụng sạch trên D1 local; `d1_migrations` ghi nhận 1 migration.
- [ ] Seed có đủ 4/8/24/4 dòng; chạy lại không nhân đôi.
- [ ] `npm run db:verify` chạy đủ 13 nhóm kiểm tra ở trên và pass.
- [ ] `PRAGMA foreign_key_check` rỗng.
- [ ] Tài liệu cũ đã cập nhật; không còn tham chiếu `custom_requests` như một phần của MVP.

## Goal prompt (dán vào `/goal`)

```text
Đọc docs/pipeline/README.md và docs/pipeline/PHASE_1_DATABASE.md rồi thực hiện Phase 1.
Đưa docs/sql/MVP_SCHEMA.sql thành migrations/0001_mvp.sql, áp dụng + seed vào D1 LOCAL, viết script tự động kiểm tra 13 nhóm ràng buộc (npm run db:verify), cập nhật các tài liệu docs/ cũ cho khớp.
Ràng buộc: chỉ local, không động D1 remote; không sửa nội dung schema trừ khi test phát hiện lỗi thật (nếu sửa, ghi rõ lý do trong commit); không áp dụng deferred/0002.
Xong khi mọi mục "Tiêu chí nghiệm thu" Phase 1 pass với bằng chứng là output lệnh.
```
