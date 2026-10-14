# Database MVP — Cloudflare D1

**Cập nhật:** 14/10/2026 · **Runtime:** D1/SQLite · **Phase 0:** DONE · **Phase 1:** PLANNED. [Hiện trạng](PROJECT_STATUS.md) · [Stack](TECH_STACK.md) · [Entity frontend](FRONTEND_ENTITIES.md).

| Hiện trạng | Kết quả |
| --- | --- |
| Worker | Hono health API; binding `DB` local; `SELECT 1` đã pass |
| Schema local | Chưa áp migration/seed; không có bảng nghiệp vụ |
| D1 remote | Chủ dự án đã tạo `lunara-db` trống; Phase 0 không truy cập remote |
| Frontend | Fixtures, PHP/₱, Asia/Manila; chưa nối API commerce |

## Hai SQL draft — phải thống nhất trước migration

| Bản | Phạm vi | Trạng thái |
| --- | --- | --- |
| [Canonical v1](sql/MVP_SCHEMA.sql) | 10 bảng, có `custom_requests`, chưa có `delivery_zones` | Giữ nguyên; chưa migrate |
| [Pipeline v2](pipeline/MVP_SCHEMA.sql) | 10 bảng, thêm `delivery_zones`, chuyển wizard sang [deferred](sql/deferred/0002_custom_requests.sql) | Đề xuất Phase 1; chưa thay canonical |
| [Dev seed](sql/MVP_SEED_DEV.sql) | 4 categories, 8 products, 24 variants, 8 images, 4 zones | Dùng cấu trúc v2; chưa chạy |

Phase 1 đối chiếu, thống nhất schema rồi tạo `migrations/0001_mvp.sql`. Không chạy seed v2 trực tiếp trên canonical v1. Verifier [SQLite tham chiếu](pipeline/verify_schema.reference.py) dùng v2/in-memory; không thay nghiệm thu D1 local.

### Phạm vi canonical v1 hiện có

| Bảng | Vai trò / ràng buộc chính |
| --- | --- |
| `users` | Email unique, password hash, role/status, locale EN/VI; pipeline chưa dùng bảng này cho auth admin |
| `user_addresses` | Địa chỉ đã lưu của user: người nhận, tỉnh/thành phố, phường/xã, địa chỉ chi tiết |
| `categories` | Code/slug unique, tên EN/VI, thứ tự và trạng thái hoạt động |
| `products` | Category FK, slug unique, tên/mô tả EN/VI, badge/featured, ACTIVE/HIDDEN/ARCHIVED |
| `product_variants` | SKU unique, unique product+size; giá và tồn kho theo variant |
| `product_images` | Product FK; `image_url`, `cloudinary_public_id`, alt EN/VI, thứ tự/ảnh chính |
| `orders` | Đơn COD, user nullable cho guest; snapshot người gửi/người nhận/địa chỉ/giao hàng/thiệp và tổng tiền |
| `order_items` | Order FK; snapshot SKU/tên EN/VI/size/ảnh/giá; product/variant nullable khi bị xóa |
| `order_status_history` | Timeline trạng thái, nhân viên xử lý, ghi chú và thời gian |
| `custom_requests` | Có trong v1; wizard ngoài pipeline MVP, v2 chuyển sang deferred |

Pipeline MVP: catalog, tồn theo variant, COD guest, phí giao theo zone, auth admin secret + JWT cookie. Auth khách/profile/wishlist/wizard làm sau. Cart guest dự kiến localStorage ở Phase 5; hiện vẫn in-memory.

Bổ sung sau khi có nhu cầu: inventory movement ledger, cart/wishlist theo user, coupon/redemption, payment online, reviews, settings và audit logs. Không tạo bảng cho text UI, KPI hoặc chart; UI dùng JSON i18n, KPI tính từ dữ liệu thật.

## Quy ước dữ liệu

- ID: `INTEGER PRIMARY KEY AUTOINCREMENT`; bảng snake_case số nhiều. Prepared statements với tham số bind.
- Tiền SQL: **integer VND**, ví dụ 250000 = 250.000 đồng. Pipeline dự kiến chuyển thị trường ở Phase 5; frontend hiện PHP/₱. Cần giá thật, không chỉ đổi ký hiệu hoặc locale.
- Thời gian: `datetime('now')` lưu UTC dạng text; API trả ISO 8601 có timezone. `delivery_date/needed_date` là YYYY-MM-DD theo múi giờ cửa hàng; frontend demo còn Asia/Manila. `updated_at` do API cập nhật, chưa có trigger.
- Tên: `name_en/name_vi`, snapshot song ngữ trong order items. `name_vn` chỉ là alias FE; nội dung khách nhập giữ nguyên.
- Variant: S/M/L/STANDARD/DELUXE; map Small/Medium/Large → S/M/L. Custom size PETITE/CLASSIC/GRANDE/LUXE thuộc wizard deferred.
- Order status: PENDING → CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED; CANCELLED theo chính sách được chốt. COD là method; UNPAID/PAID là payment status riêng.
- Request status: PENDING/IN_REVIEW/APPROVED/COMPLETED/DECLINED. Nhãn EN/VI chỉ ở UI; transition do API kiểm tra.

## Quy tắc API cần triển khai

1. Zod validate contact, ngày giao, mã lựa chọn và số lượng. Server tính giá/phí/tổng; không tin total/role/stock từ client. Ngân sách/JSON wizard để sau.
2. Order/items/history và trừ tồn phải nguyên tử, có idempotency. Pipeline v2 dự kiến trừ tồn không điều kiện, để `CHECK (stock_quantity >= 0)` ném lỗi và rollback batch; `UPDATE` 0 dòng không tự gây rollback. Kiểm chứng concurrency ở Phase 3. [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).
3. Ưu tiên archive sản phẩm đã bán; luôn hiển thị đơn theo snapshot. Hủy đơn chỉ hoàn tồn một lần theo transition hợp lệ.
4. D1 thực thi FK mặc định; không đưa `PRAGMA foreign_keys` vào migration D1. Verifier SQLite in-memory bật FK riêng. Canonical v1 chưa đổi dòng PRAGMA; xử lý khi thống nhất migration. [D1 foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/).
5. Auth admin dự kiến secret + JWT HttpOnly, server kiểm tra quyền/Origin ở Phase 4. Browser session hiện chỉ là demo. Better Auth/auth khách cần đối chiếu schema riêng khi triển khai sau.

## Khoảng cách v1 → v2 / quyết định còn thiếu

| Mục | V1 hiện có / v2 đề xuất |
| --- | --- |
| Checkout retry | V1 thiếu idempotency; v2 thêm unique `idempotency_key` |
| Data constraints | V2 thêm email lowercase, một ảnh chính/địa chỉ mặc định, công thức tổng, ngày giao và nullable auth/media fields |
| COD / hủy đơn | V2 thêm `paid_at`, `delivered_at`, `stock_released`, `actor_label`; API transition chưa có |
| Delivery | V2 thêm zones; phí/khu vực/cutoff/khung giờ trong seed/config chỉ là ví dụ/giả định |
| Wizard | V1 còn thiếu JSON/budget constraints; deferred v2 bổ sung; ngoài MVP |
| Dữ liệu thật | Cần giá VND, sản phẩm/ảnh, tồn và khu vực giao trước mở bán |
| Ngoài MVP | Stock ledger, coupon rules, auth khách, reviews, payment online |

Các kết quả SQLite ghi trong bản nháp là tham chiếu trước Phase 0. Lượt Phase 0 chỉ kiểm chứng binding bằng `SELECT 1`; schema constraints/D1 rollback/concurrency/retry/auth chưa được nghiệm thu.

## Thứ tự nối frontend

| Phase | Việc còn làm |
| --- | --- |
| 1 | Thống nhất schema → migration/seed/verify local |
| 2–4 | Catalog/quote → COD/idempotency/tồn → auth/admin |
| 5 | Service/adapter FE, cart localStorage, VND, tra đơn; ẩn luồng ngoài MVP |
| 6 | Deploy/migration remote/secrets/dữ liệu thật khi được yêu cầu |
| Sau MVP | Wizard, customer auth/profile/wishlist, upload ảnh, reviews/coupon |

Chi tiết các cổng nghiệm thu: [pipeline](pipeline/README.md). Không suy ra quyền migrate/deploy từ việc rà tài liệu.
