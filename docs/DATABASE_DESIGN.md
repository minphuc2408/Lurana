# Database MVP — Cloudflare D1

Đối chiếu source ngày **18/10/2026**. Tài liệu giữ quyết định schema, ràng buộc và bất biến dữ liệu. [API contract](pipeline/API_CONTRACT.md) mô tả giao tiếp; lịch sử migration/deploy và counts theo môi trường nằm ở [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Một nguồn schema chuẩn

[`migrations/0001_mvp.sql`](../migrations/0001_mvp.sql) là **base DDL bất biến**; schema trong source là base cộng [`0002_category_images.sql`](../migrations/0002_category_images.sql) và [`0003_hanoi_administrative_areas.sql`](../migrations/0003_hanoi_administrative_areas.sql). Migration 0003 theo yêu cầu owner nhập danh mục Hà Nội vào 2 bảng riêng, không thêm phí giao. [`sql/MVP_SCHEMA.sql`](sql/MVP_SCHEMA.sql) và [`pipeline/MVP_SCHEMA.sql`](pipeline/MVP_SCHEMA.sql) chỉ chứa chú thích dẫn về migration, không giữ bản DDL sao chép. Khi cần xem hoặc kiểm chứng schema, đọc chuỗi migration này.

Canonical Phase 1 chọn DDL v2 cho 10 bảng và [seed dev](sql/MVP_SEED_DEV.sql). Các mở rộng được yêu cầu sau đó dùng migration mới: 0002 thêm `categories.image_url` nullable; 0003 tạo `administrative_provinces`/`administrative_wards` và nhập Hà Nội (mã 01, 126 phường/xã). Không sửa migration đã áp hoặc áp [custom_requests deferred](sql/deferred/0002_custom_requests.sql) vào chuỗi MVP.

File seed gồm **4 categories, 8 products, 24 variants, 8 images, 4 delivery zones**. Các câu `INSERT OR IGNORE` kết hợp khóa unique giúp chạy lại không nhân đôi. Ảnh placeholder, giá/tồn và khu vực giao là dữ liệu mẫu. Dòng tỉnh mặc định/ngoài danh mục vẫn có thể tồn tại trong DB nhưng không mở coverage ở service hiện tại.

## Bộ dữ liệu staging theo quyết định owner

- Owner yêu cầu thay toàn bộ dữ liệu nghiệp vụ staging sau backup; đây là bộ mẫu riêng, không đổi seed dev/schema. Có 40 thiết kế EN/VI, mã `LNR-STG-001`–`040`, 4 danh mục và 120 biến thể S/M/L; bao phủ ACTIVE/HIDDEN/ARCHIVED, featured, BEST_SELLER/HOT/NEW, tồn thường/thấp/hết và variant tắt.
- `product_images` được owner cho phép trống; không chèn URL rỗng/ảnh giả. Ảnh danh mục và snapshot ảnh đơn cũng NULL. Quy tắc gallery khi lưu qua API vẫn giữ nguyên.
- Khách/địa chỉ/đơn/timeline là dữ liệu tổng hợp có nhãn STAGING, email `example.test`, không kích hoạt customer auth. Mỗi trạng thái đơn có 3 mẫu; COD giao thành công là PAID, hủy đã hoàn tồn; tồn ban đầu trừ đúng lượng của các đơn chưa hủy. Pending vẫn chịu TTL/Cron hiện hành.
- Giữ nguyên danh mục hành chính, coverage/phí hiện có, migration history và schema. ID số mới lớn hơn ID/sequence cũ; không reset `sqlite_sequence`, tránh giỏ đã lưu variant ID cũ nhận nhầm sản phẩm mới. Artifact SQL/CSV và backup chỉ nằm trong `.security-review/` ignored; bằng chứng/đường dẫn ở [PROJECT_STATUS](PROJECT_STATUS.md#dữ-liệu-staging-thay-mới-theo-owner--18102026).

## Quyết định base schema (v1 → v2 tại Phase 1)

| Mục | V1 | Canonical Phase 1 (DDL v2) | Lý do |
| --- | --- | --- | --- |
| Phạm vi 10 bảng | Có `custom_requests`, thiếu `delivery_zones` | Thay bằng `delivery_zones`; request ở [deferred/0002](sql/deferred/0002_custom_requests.sql), **không áp dụng** | MVP cần phí giao theo khu vực; wizard ngoài MVP |
| Email user | `UNIQUE`, không kiểm lowercase | `CHECK (email = lower(email))` + unique index `uq_users_email` | Từ chối email viết hoa ASCII và email trùng theo quy ước lưu chữ thường |
| Auth user | `password_hash NOT NULL`; locale cho phép NULL | Hash nullable; `preferred_locale NOT NULL`, mặc định `vi`, chỉ `vi/en` | Dựng sẵn cho auth khách tương lai; admin MVP dùng secret, không phụ thuộc user password |
| Địa chỉ mặc định | Chỉ cờ 0/1 | Unique index một phần theo user khi `is_default = 1` | Mỗi user tối đa một địa chỉ mặc định; vẫn có nhiều địa chỉ thường |
| Badge sản phẩm | TEXT bất kỳ | NULL hoặc `BEST_SELLER/HOT/NEW` | Dùng business code ổn định, tránh nhãn tùy ý |
| Giá/tồn variant | Giá không âm; compare-at >= price; tồn không âm; unique product+size | Giữ các ràng buộc; viết rõ compare-at nullable; thêm `low_stock_threshold >= 0` | Giữ so sánh giá hợp lệ, ngăn ngưỡng cảnh báo âm; CHECK tồn là điểm gây rollback khi bán quá tồn |
| Metadata ảnh | `cloudinary_public_id NOT NULL`; nhiều ảnh chính được phép | Cloudinary ID nullable; unique index một phần khi `is_primary = 1` | Seed/URL ngoài Cloudinary không có public ID; mỗi sản phẩm tối đa một ảnh chính |
| Delivery zones | Không có | Unique tỉnh+phường; phí/ngưỡng miễn phí không âm; ETA dương hoặc NULL; cờ active | DDL/seed giữ dòng tỉnh mặc định `ward_name = ''`; service hiện tại chỉ chấp nhận phường thuộc danh mục có zone active, không fallback tỉnh |
| Checkout retry | Không có idempotency | `orders.idempotency_key` nullable, unique index một phần khi khác NULL | Ngăn key lặp; vẫn cho phép nhiều đơn chưa có key |
| COD và hoàn tồn | Không có các mốc/cờ hỗ trợ | `paid_at`, `delivered_at`, `stock_released` 0/1 | Chuẩn bị dữ liệu cho thu COD, giao hàng và hoàn tồn khi hủy; nghiệp vụ do API triển khai ở Phase 3 |
| Ngày giao | TEXT không kiểm dạng | GLOB đúng dạng `YYYY-MM-DD` | Chặn dạng như `2026-1-5`; xác thực ngày lịch thực hiện ở API |
| Tổng đơn | Số tiền không âm; currency TEXT tự do | `currency = 'VND'`; discount <= subtotal; total = subtotal − discount + fee | Ngăn tổng không nhất quán và currency lệch thị trường backend |
| Dòng đơn | Snapshot ảnh bắt buộc; line total chỉ không âm | Snapshot ảnh nullable; line total = unit price × quantity | Cho phép sản phẩm chưa có ảnh; bảo vệ công thức giá dòng |
| Timeline actor | Chỉ `actor_id` nullable | Thêm `actor_label` SYSTEM/CUSTOMER/ADMIN, mặc định SYSTEM | Admin dùng secret có thể không có user ID |
| Index | Có index lặp khóa unique | Bỏ `categories.slug`, `products.slug`, `orders.order_number` và `product_variants.product_id`; thêm `orders.placed_at`; timeline dùng `(order_id, occurred_at)` | Unique index đã phục vụ ba khóa đơn và tiền tố `(product_id, size_code)`; index mới phục vụ sắp xếp đơn/timeline |
| Foreign keys | `PRAGMA foreign_keys = ON` trong draft | Không có PRAGMA thực thi trong migration; giữ FK/cascade/restrict/set-null | D1 bật FK sẵn; tránh thay đổi PRAGMA không phù hợp migration D1 |

Không có cột JSON trong 12 bảng hiện tại: các trường JSON nằm trong `custom_requests` deferred, chưa nằm trong schema MVP.

## 10 bảng base MVP và 2 bảng danh mục

| Bảng | Vai trò / ràng buộc chính |
| --- | --- |
| `users` | Email chữ thường/unique, role/status, locale EN/VI; admin MVP dùng secret, không đọc/ghi tài khoản trong bảng này |
| `user_addresses` | FK user cascade; địa chỉ tỉnh/phường; tối đa một mặc định/user |
| `categories` | Code/slug unique, tên EN/VI, thứ tự và trạng thái hoạt động; 0002 thêm image_url nullable, độ dài 1–2048 nếu có |
| `products` | Category FK restrict, slug unique, tên/mô tả EN/VI, badge/featured, ACTIVE/HIDDEN/ARCHIVED |
| `product_variants` | SKU unique, unique product+size; giá/tồn không âm và ngưỡng cảnh báo theo variant |
| `product_images` | Product FK cascade; URL, Cloudinary public ID nullable, alt EN/VI, sort_order; unique partial index giới hạn tối đa một primary/product |
| `administrative_provinces` | Mã TEXT 2 ký tự PK, tên unique; 0003 nhập Hà Nội 01 |
| `administrative_wards` | Mã TEXT 5 ký tự PK, FK tỉnh RESTRICT, unique tên trong tỉnh; 0003 nhập 126 phường/xã Hà Nội |
| `delivery_zones` | Tỉnh/phường unique, phí/ngưỡng/ETA/active; service kiểm danh mục, legacy không bị xóa; không phải FK snapshot đơn |
| `orders` | COD guest, snapshot người gửi/nhận/giao hàng/thiệp; total, idempotency và mốc/cờ hỗ trợ xử lý |
| `order_items` | Snapshot SKU/tên EN/VI/size/ảnh/giá; xóa catalog đặt FK product/variant về NULL, giữ snapshot |
| `order_status_history` | Timeline trạng thái, actor ID/label, ghi chú và thời gian |

Auth khách/profile chưa có API dù users/user_addresses đã nằm trong base. Không có bảng cart/wishlist/custom request, coupon/redemption, payment online, review, settings hay inventory ledger. Form checkout, consent/chuyển khoản và ý định đặt hàng là state memory, không tạo cột hoặc bản ghi riêng; [ownership frontend](FRONTEND_ENTITIES.md).

## Quy ước và giới hạn dữ liệu

- ID: 10 bảng base dùng `INTEGER PRIMARY KEY AUTOINCREMENT`; 2 bảng danh mục hành chính dùng mã TEXT làm PK. Bảng snake_case số nhiều; truy vấn dùng prepared statements với tham số bind.
- Tiền: khai báo **INTEGER VND**, ví dụ 250000 = 250.000 đồng. SQLite dùng type affinity, chưa dùng `STRICT` hay CHECK kiểu dữ liệu: API phải từ chối số lẻ/kiểu không hợp lệ. Locale không quy đổi giá hoặc currency.
- Thời gian: `datetime('now')` lưu UTC dạng `YYYY-MM-DD HH:MM:SS`; API trả ISO 8601 có timezone. `delivery_date` là ngày theo Asia/Ho_Chi_Minh. GLOB chỉ kiểm hình dạng, **không xác thực ngày lịch** như `2026-02-31`. `updated_at` do API cập nhật, không có trigger.
- Tên dùng `name_en/name_vi`, snapshot song ngữ trong order items. `name_vn` chỉ là alias FE; nội dung khách nhập giữ nguyên.
- Variant chấp nhận S/M/L/STANDARD/DELUXE; seed có S/M/L. Map Small/Medium/Large → S/M/L. PETITE/CLASSIC/GRANDE/LUXE thuộc wizard deferred.
- `lower()` SQLite mặc định chủ yếu xử lý ASCII; email cần normalize/validate ở API. CHECK email không thay thế kiểm tra cấu trúc địa chỉ email.
- `stock_released` chỉ là cờ 0/1; DDL tự nó không bảo đảm hoàn tồn một lần hay transition. transitionOrder dùng conditional release + CAS trạng thái trong một batch, kiểm meta.changes và chống history trùng; route admin dùng actor_label ADMIN/actor_id NULL. CANCELLED vẫn terminal khi stock_released=0 (hủy không hoàn tồn). Batch expiry lọc PENDING quá hạn/stock_released=0, ghi SYSTEM history, hoàn tồn rồi CANCELLED trong cùng giao dịch; [quy tắc expiry](BOT_PROTECTION.md).
- Unique idempotency ngăn key trùng; API Phase 3 kiểm UUID v4, canonical lowercase, replay một read và xử lý UNIQUE race rollback. Key xác định đơn đã tạo; body hợp lệ gửi lại khác nội dung vẫn replay đơn cũ, không có kiểm hash payload. Frontend quản lý key theo payload trong memory; [vòng đời ý định](FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu).

## Bất biến do service bảo vệ

1. Zod validate contact, ngày giao thực, mã lựa chọn, money và số lượng. Server tính giá/phí/tổng; không tin total/role/stock từ client.
2. Order/items/history và trừ tồn nằm trong một batch. Trừ tồn không điều kiện để `CHECK (stock_quantity >= 0)` ném lỗi và rollback; `UPDATE` 0 dòng tự nó không gây rollback. Cap tối đa 3 PENDING theo sender_phone chuẩn hóa nằm trong INSERT, dùng NOT NULL guard sẵn có khi vượt cap; không thêm bảng đếm. [Nghiệm thu backend](pipeline/PHASE_3_CHECKOUT_ORDERS.md).
3. Ưu tiên archive sản phẩm đã bán; hiển thị đơn theo snapshot. Hủy chỉ hoàn tồn một lần theo transition hợp lệ.
4. D1 thực thi FK mặc định; không đưa `PRAGMA foreign_keys` vào migration. Kiểm `PRAGMA foreign_key_check` trên D1 local. [D1 foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/).
5. Admin secret/cookie không đọc users. API kiểm quyền, Origin và JSON; role client chỉ điều khiển UI. RateLimit dùng Worker bindings, không có bảng D1 counter.
6. Admin tạo product/variants/gallery và thay gallery bằng D1 batch. API gallery yêu cầu 1–8 ảnh, đúng một primary và không trùng URL/public ID; DB chỉ bảo vệ tối đa một primary. Public ID được lưu khi có, unlink không xóa asset provider. ARCHIVED ghi archived_at; ưu tiên archive sản phẩm đã bán. [Giới hạn gallery](CLOUDINARY.md).
7. Variant stock_delta dùng `stock_quantity = stock_quantity + ?`; CHECK chặn tồn âm. Delta không có idempotency như tạo đơn nên phản hồi không rõ cần đọc lại trước khi ghi tiếp. Delivery zone không có FK tới danh mục; service JOIN chỉ zone active đúng tỉnh/phường, chấp nhận alias tiền tố cũ nhưng không fallback tỉnh. Snapshot địa chỉ đơn không phụ thuộc các thay đổi coverage sau đó.

## Kiểm chứng và dữ liệu mẫu

`npm run db:verify` kiểm schema/migration/FK trên D1 local; các phép thử constraints, rollback, snapshot khi xóa và migration/seed lặp chạy trên D1 tạm cô lập. Dữ liệu persisted chỉ được đọc để kiểm tra. Quy trình và output nghiệm thu giữ tại [Phase 1](pipeline/PHASE_1_DATABASE.md); kết quả hiện hành ở [PROJECT_STATUS.md](PROJECT_STATUS.md).

Seed là dữ liệu phát triển; migration danh mục hành chính không tự tạo coverage hoặc phí giao. Không dùng counts seed để suy ra dữ liệu hiện tại trên local/staging/production. Dữ liệu mở bán và policy giao cần chủ shop chốt; [runbook staging](STAGING.md), [ảnh category](CATEGORY_IMAGES.md), [địa chỉ giao](DELIVERY_ADDRESS.md) và [vận hành](OPERATIONS.md) hướng dẫn thao tác theo môi trường.
