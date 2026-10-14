# Database MVP — Cloudflare D1

**Cập nhật:** 14/10/2026 · **Runtime:** D1/SQLite · **Phase 0:** DONE · **Phase 1:** migration, seed và verifier local · **Phase 2:** catalog/quote đọc D1 local. [Bằng chứng Phase 1](pipeline/PHASE_1_DATABASE.md) · [Phase 2](pipeline/PHASE_2_API_CATALOG.md) · [Hiện trạng](PROJECT_STATUS.md) · [Stack](TECH_STACK.md) · [Entity frontend](FRONTEND_ENTITIES.md).

| Phạm vi | Trạng thái |
| --- | --- |
| Schema chuẩn | [`migrations/0001_mvp.sql`](../migrations/0001_mvp.sql), DDL v2 đã thống nhất theo đúng 10 bảng Phase 1 |
| D1 local | Migration `0001_mvp.sql`; seed và `npm run db:verify`; output nghiệm thu ở [Phase 1](pipeline/PHASE_1_DATABASE.md) |
| API D1 local | Catalog tối đa 3 statements; quote đọc variants + phí giao, không ghi order/tồn. Test trạng thái/tồn dùng DB cô lập; DDL Phase 1 giữ nguyên |
| D1 remote | Chủ dự án đã tạo `lunara-db`; Phase 0–2 không truy cập hoặc thay đổi remote |
| Frontend | Fixtures, PHP/₱, Asia/Manila; chưa nối API commerce |

## Một nguồn schema chuẩn

[`migrations/0001_mvp.sql`](../migrations/0001_mvp.sql) là **nguồn DDL duy nhất**. [`sql/MVP_SCHEMA.sql`](sql/MVP_SCHEMA.sql) và [`pipeline/MVP_SCHEMA.sql`](pipeline/MVP_SCHEMA.sql) chỉ chứa chú thích dẫn về migration, không giữ bản DDL sao chép. Khi cần xem hoặc kiểm chứng schema, đọc migration này.

Canonical được chốt **trước migration**: chọn nguyên DDL v2 phù hợp 10 bảng và [seed dev](sql/MVP_SEED_DEV.sql); không thêm chức năng ngoài Phase 1. Sau khi chốt, chỉ sửa schema nếu test phát hiện lỗi thực tế và phải ghi lý do. Khi migration đã áp lên remote, mọi thay đổi phải thành migration tiếp theo, không sửa lịch sử.

Seed local gồm **4 categories, 8 products, 24 variants, 8 images, 4 delivery zones**. Các câu `INSERT OR IGNORE` kết hợp khóa unique giúp chạy lại không nhân đôi. Ảnh placeholder, giá/tồn và khu vực giao là dữ liệu mẫu; chưa phải cấu hình mở bán. [Verifier](../scripts/verify-schema.mjs) dùng D1 local; bộ SQLite in-memory tham chiếu cũ được thay bằng `npm run db:verify`.

## Đối chiếu canonical v1 → v2 đã chốt

| Mục | V1 | Canonical Phase 1 (DDL v2) | Lý do |
| --- | --- | --- | --- |
| Phạm vi 10 bảng | Có `custom_requests`, thiếu `delivery_zones` | Thay bằng `delivery_zones`; request ở [deferred/0002](sql/deferred/0002_custom_requests.sql), **không áp dụng** | MVP cần phí giao theo khu vực; wizard ngoài MVP |
| Email user | `UNIQUE`, không kiểm lowercase | `CHECK (email = lower(email))` + unique index `uq_users_email` | Từ chối email viết hoa ASCII và email trùng theo quy ước lưu chữ thường |
| Auth user | `password_hash NOT NULL`; locale cho phép NULL | Hash nullable; `preferred_locale NOT NULL`, mặc định `vi`, chỉ `vi/en` | Dựng sẵn cho auth khách tương lai; admin MVP dùng secret, không phụ thuộc user password |
| Địa chỉ mặc định | Chỉ cờ 0/1 | Unique index một phần theo user khi `is_default = 1` | Mỗi user tối đa một địa chỉ mặc định; vẫn có nhiều địa chỉ thường |
| Badge sản phẩm | TEXT bất kỳ | NULL hoặc `BEST_SELLER/HOT/NEW` | Dùng business code ổn định, tránh nhãn tùy ý |
| Giá/tồn variant | Giá không âm; compare-at >= price; tồn không âm; unique product+size | Giữ các ràng buộc; viết rõ compare-at nullable; thêm `low_stock_threshold >= 0` | Giữ so sánh giá hợp lệ, ngăn ngưỡng cảnh báo âm; CHECK tồn là điểm gây rollback khi bán quá tồn |
| Metadata ảnh | `cloudinary_public_id NOT NULL`; nhiều ảnh chính được phép | Cloudinary ID nullable; unique index một phần khi `is_primary = 1` | Seed/URL ngoài Cloudinary không có public ID; mỗi sản phẩm tối đa một ảnh chính |
| Delivery zones | Không có | Unique tỉnh+phường; phí/ngưỡng miễn phí không âm; ETA dương hoặc NULL; cờ active | Tra phí theo phường trước, fallback dòng `ward_name = ''` của tỉnh; seed v2 đã dùng bảng này |
| Checkout retry | Không có idempotency | `orders.idempotency_key` nullable, unique index một phần khi khác NULL | Ngăn key lặp; vẫn cho phép nhiều đơn chưa có key |
| COD và hoàn tồn | Không có các mốc/cờ hỗ trợ | `paid_at`, `delivered_at`, `stock_released` 0/1 | Chuẩn bị dữ liệu cho thu COD, giao hàng và hoàn tồn khi hủy; nghiệp vụ do API triển khai ở Phase 3 |
| Ngày giao | TEXT không kiểm dạng | GLOB đúng dạng `YYYY-MM-DD` | Chặn dạng như `2026-1-5`; xác thực ngày lịch thực hiện ở API |
| Tổng đơn | Số tiền không âm; currency TEXT tự do | `currency = 'VND'`; discount <= subtotal; total = subtotal − discount + fee | Ngăn tổng không nhất quán và currency lệch thị trường backend |
| Dòng đơn | Snapshot ảnh bắt buộc; line total chỉ không âm | Snapshot ảnh nullable; line total = unit price × quantity | Cho phép sản phẩm chưa có ảnh; bảo vệ công thức giá dòng |
| Timeline actor | Chỉ `actor_id` nullable | Thêm `actor_label` SYSTEM/CUSTOMER/ADMIN, mặc định SYSTEM | Admin dùng secret có thể không có user ID |
| Index | Có index lặp khóa unique | Bỏ `categories.slug`, `products.slug`, `orders.order_number` và `product_variants.product_id`; thêm `orders.placed_at`; timeline dùng `(order_id, occurred_at)` | Unique index đã phục vụ ba khóa đơn và tiền tố `(product_id, size_code)`; index mới phục vụ sắp xếp đơn/timeline |
| Foreign keys | `PRAGMA foreign_keys = ON` trong draft | Không có PRAGMA thực thi trong migration; giữ FK/cascade/restrict/set-null | D1 bật FK sẵn; tránh thay đổi PRAGMA không phù hợp migration D1 |

Không cần ràng buộc JSON cho 10 bảng hiện tại: các trường JSON nằm trong `custom_requests` deferred, chưa nằm trong schema MVP.

## 10 bảng MVP

| Bảng | Vai trò / ràng buộc chính |
| --- | --- |
| `users` | Email chữ thường/unique, role/status, locale EN/VI; chưa dùng cho auth admin |
| `user_addresses` | FK user cascade; địa chỉ tỉnh/phường; tối đa một mặc định/user |
| `categories` | Code/slug unique, tên EN/VI, thứ tự và trạng thái hoạt động |
| `products` | Category FK restrict, slug unique, tên/mô tả EN/VI, badge/featured, ACTIVE/HIDDEN/ARCHIVED |
| `product_variants` | SKU unique, unique product+size; giá/tồn không âm và ngưỡng cảnh báo theo variant |
| `product_images` | Product FK cascade; URL, metadata Cloudinary tùy chọn; tối đa một ảnh chính/product |
| `delivery_zones` | Tỉnh/phường unique, phí và ngưỡng miễn phí, ETA và active; không phải FK của snapshot đơn |
| `orders` | COD guest, snapshot người gửi/nhận/giao hàng/thiệp; total, idempotency và mốc/cờ hỗ trợ xử lý |
| `order_items` | Snapshot SKU/tên EN/VI/size/ảnh/giá; xóa catalog đặt FK product/variant về NULL, giữ snapshot |
| `order_status_history` | Timeline trạng thái, actor ID/label, ghi chú và thời gian |

Auth khách/profile/wishlist/wizard làm sau. Cart guest dự kiến localStorage ở Phase 5; hiện vẫn in-memory. Các mở rộng khác gồm inventory movement ledger, coupon/redemption, payment online, reviews, settings và audit logs. Không tạo bảng cho text UI, KPI hoặc chart.

## Quy ước và giới hạn dữ liệu

- ID: `INTEGER PRIMARY KEY AUTOINCREMENT`; bảng snake_case số nhiều. Truy vấn dùng prepared statements với tham số bind.
- Tiền: khai báo **INTEGER VND**, ví dụ 250000 = 250.000 đồng. SQLite dùng type affinity, chưa dùng `STRICT` hay CHECK kiểu dữ liệu: API phải từ chối số lẻ/kiểu không hợp lệ. Frontend demo còn PHP/₱; chuyển dữ liệu/giá ở Phase 5, không chỉ đổi ký hiệu hoặc locale.
- Thời gian: `datetime('now')` lưu UTC dạng `YYYY-MM-DD HH:MM:SS`; API trả ISO 8601 có timezone. `delivery_date` là ngày theo Asia/Ho_Chi_Minh. GLOB chỉ kiểm hình dạng, **không xác thực ngày lịch** như `2026-02-31`. `updated_at` do API cập nhật, không có trigger.
- Tên dùng `name_en/name_vi`, snapshot song ngữ trong order items. `name_vn` chỉ là alias FE; nội dung khách nhập giữ nguyên.
- Variant chấp nhận S/M/L/STANDARD/DELUXE; seed có S/M/L. Map Small/Medium/Large → S/M/L. PETITE/CLASSIC/GRANDE/LUXE thuộc wizard deferred.
- `lower()` SQLite mặc định chủ yếu xử lý ASCII; email cần normalize/validate ở API. CHECK email không thay thế kiểm tra cấu trúc địa chỉ email.
- `stock_released` chỉ là cờ 0/1; schema chưa bảo đảm hoàn tồn đúng một lần hoặc status transition. API phải kiểm transition và cập nhật tồn/cờ nguyên tử ở Phase 3.
- Unique idempotency ngăn key trùng; replay response, kiểm payload retry và concurrency là trách nhiệm API Phase 3.

## Quy tắc API cần triển khai

1. Zod validate contact, ngày giao thực, mã lựa chọn, money và số lượng. Server tính giá/phí/tổng; không tin total/role/stock từ client.
2. Order/items/history và trừ tồn phải nguyên tử. Trừ tồn không điều kiện để `CHECK (stock_quantity >= 0)` ném lỗi và rollback D1 batch; `UPDATE` 0 dòng không tự gây rollback. Verifier Phase 1 kiểm rollback khi CHECK lỗi; concurrency checkout thật nghiệm thu ở Phase 3. [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).
3. Ưu tiên archive sản phẩm đã bán; hiển thị đơn theo snapshot. Hủy chỉ hoàn tồn một lần theo transition hợp lệ.
4. D1 thực thi FK mặc định; không đưa `PRAGMA foreign_keys` vào migration. Kiểm `PRAGMA foreign_key_check` trên D1 local. [D1 foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/).
5. Admin secret + JWT HttpOnly, server kiểm quyền/Origin ở Phase 4. Browser session vẫn là demo. Better Auth/auth khách cần đối chiếu schema riêng sau MVP.

## Nghiệm thu và phần tiếp theo

`npm run db:verify` tự động hóa 13 nhóm ràng buộc trên D1 local, gồm phép ghi bị từ chối, trường hợp hợp lệ đối chứng, rollback batch, snapshot khi xóa và chạy lại migration/seed. Các phép thử ghi/xóa dùng D1 tạm không lưu trạng thái; D1 local đã migrate/seed chỉ được đọc để kiểm schema/counts/migrations/FK. Counts, `d1_migrations` và FK cũng cần đúng; xem output thực tế và checklist ở [Phase 1](pipeline/PHASE_1_DATABASE.md). Không dùng kết quả SQLite in-memory cũ để thay bằng chứng D1 local.

| Phase | Công việc |
| --- | --- |
| 1 | Canonical 10 bảng, migration/seed/verify local; không áp deferred/0002 |
| 2–4 | Catalog/quote → COD/idempotency/tồn → auth/admin |
| 5 | Adapter FE, cart localStorage, VND, tra đơn; ẩn luồng ngoài MVP |
| 6 | Deploy/migration remote/secrets/dữ liệu thật khi được yêu cầu |
| Sau MVP | Wizard, auth khách/profile/wishlist, upload ảnh, reviews/coupon |

Khu vực giao, giá VND, sản phẩm/ảnh/tồn và policy thật vẫn cần chủ shop chốt trước mở bán. Xem [pipeline](pipeline/README.md); Phase 1 không cho phép thay đổi remote hoặc deploy.
