# API contract MVP

Base path: `/api` (cùng origin với frontend). JSON UTF-8. Đây là hợp đồng giữa Worker và frontend; thay đổi phải sửa file này trước.

**Trạng thái:** Phase 2–3 đã triển khai local: health, catalog, delivery/options, checkout/quote, đặt đơn COD và tra đơn. `transitionOrder` là service nội bộ cho Phase 4; chưa có route admin/auth/hủy đơn khách. Frontend Home/Shop/Cart/Delivery/Quote giữ preview; gửi/tra đơn qua UI thuộc Phase 5. Route API lạ trả `NOT_FOUND` JSON 404 (message `Không tìm thấy API.`). [Hiện trạng](../PROJECT_STATUS.md) · [nghiệm thu Phase 3](PHASE_3_CHECKOUT_ORDERS.md).

## Quy ước chung

- **Thành công:** `{ "data": ... }`. **Lỗi:** `{ "error": { "code": "...", "message": "...", "details": ... } }`. `message` bằng tiếng Việt, ngắn, an toàn để hiển thị.
- **Tiền:** số nguyên VND (`450000`). **Ngày giao:** `YYYY-MM-DD` giờ Việt Nam. **Thời điểm:** ISO-8601 UTC có `Z` (ví dụ `2026-10-14T03:20:00Z`).
- **Số điện thoại:** server chuẩn hóa về dạng `0xxxxxxxxx` (chấp nhận `+84...`, khoảng trắng, dấu chấm). Hợp lệ: `^0\d{9}$` sau khi chuẩn hóa.
- **Tên sản phẩm:** luôn trả cả `name_vi` và `name_en`; frontend chọn theo locale.
- Không bao giờ trả `password_hash`, secret, stack trace, SQL.
- API dùng `Content-Type: application/json; charset=utf-8`, security headers và `X-Request-Id`. GET catalog thành công (categories/products/detail/delivery options) dùng `Cache-Control: public, max-age=30`; health, request ghi/admin và mọi lỗi dùng `no-store`. Lỗi `INTERNAL` chỉ có mã tham chiếu trong `error.details.request_id`; chi tiết lỗi được log phía server.

## Mã lỗi

| Code | HTTP | Khi nào |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Zod không qua; `details` = danh sách `{path, message}` |
| `UNAUTHORIZED` | 401 | Thiếu/hết hạn cookie admin |
| `INVALID_CREDENTIALS` | 401 | Sai mật khẩu admin |
| `FORBIDDEN` | 403 | Turnstile order không hợp lệ; kiểm Origin ở request ghi admin thuộc Phase 4 PLANNED |
| `NOT_FOUND` | 404 | Không có tài nguyên; tra đơn sai mã hoặc SĐT dùng chung mã này |
| `CONFLICT` | 409 | Trùng slug/SKU/mã |
| `OUT_OF_STOCK` | 409 | Thiếu tồn; `details`: `[{variant_id, requested, available}]` |
| `VARIANT_UNAVAILABLE` | 409 | Variant/sản phẩm không còn bán |
| `INVALID_TRANSITION` | 409 | Chuyển trạng thái đơn không hợp lệ |
| `NO_DELIVERY_ZONE` | 422 | Tỉnh/phường chưa được giao |
| `INVALID_DELIVERY_SLOT` | 422 | Ngày/khung giờ/phương thức không hợp lệ (quá khứ, quá giờ chốt…) |
| `CART_LIMIT` | 422 | Quá 15 dòng hoặc số lượng mỗi dòng > 20 |
| `RATE_LIMITED` | 429 | Quá giới hạn (nếu có) |
| `INTERNAL` | 500 | Lỗi không lường trước; chỉ trả mã tham chiếu `request_id` |

## Public

### `GET /api/health`
`{ data: { ok: true, time } }`.

### `GET /api/categories`
`data: [{ id, code, slug, name_vi, name_en }]` — chỉ `is_active = 1`, sắp theo `sort_order`.

### `GET /api/products?category=<code>&featured=1`
`data: { items: Product[] }` — tối đa 100 sản phẩm `ACTIVE` (frontend giữ logic lọc/tìm hiện có). Không phân trang ở MVP.

```ts
type Product = {
  id: number; slug: string; category_code: string;
  name_vi: string; name_en: string; description_vi: string|null; description_en: string|null;
  badge_code: 'BEST_SELLER'|'HOT'|'NEW'|null; is_featured: boolean;
  images: { url: string; alt_vi: string|null; alt_en: string|null; is_primary: boolean }[];
  variants: { id: number; sku: string; size_code: 'S'|'M'|'L'|'STANDARD'|'DELUXE';
              price: number; compare_at_price: number|null;
              in_stock: boolean; low_stock: boolean; max_quantity: number /* min(stock, 20) */ }[];
}
```
Chỉ trả variant `is_active = 1`. Không lộ `stock_quantity` chính xác.

Chỉ sản phẩm thuộc category đang active. `in_stock = stock > 0`; `low_stock = 0 < stock ≤ low_stock_threshold`. Danh sách sắp theo ID; variants theo S/M/L/STANDARD/DELUXE, ảnh theo `sort_order`, ID. `category` lọc theo code; `featured` chỉ nhận `1` khi có mặt. Danh sách/chi tiết có dữ liệu dùng đúng 3 statement D1 (products → variants → images); danh sách rỗng/slug không tồn tại chỉ cần 1. Mỗi truy vấn con có tối đa 100 tham số bind.

### `GET /api/products/:slug`
`data: Product`; 404 nếu không `ACTIVE`.

### `GET /api/delivery/options`
```ts
data: {
  provinces: { province_name: string; default_fee: number|null; free_from_amount: number|null;
               wards: { ward_name: string; fee: number }[] }[];
  methods: { code: 'STANDARD'|'EXPRESS'|'SAME_DAY'; surcharge: number }[];
  time_slots: string[];            // ví dụ "08:00-10:00"
  limits: { max_cart_lines: 15; max_quantity_per_line: 20; max_advance_days: 30 };
}
```
Frontend dùng danh sách này để dựng ô chọn tỉnh/phường/phương thức/khung giờ.

### `POST /api/checkout/quote`
Body:
```ts
{ items: { variant_id: number; quantity: number }[];
  province_name: string; ward_name: string;
  delivery_method_code: 'STANDARD'|'EXPRESS'|'SAME_DAY' }
```
`data`:
```ts
{ lines: { variant_id; sku; name_vi; name_en; size_code; image_url|null; unit_price; quantity; line_total }[];
  subtotal; discount_total: 0; delivery_fee; grand_total;
  issues: { variant_id: number; code: 'OUT_OF_STOCK'|'VARIANT_UNAVAILABLE'; available?: number }[] }
```
Luôn 200 nếu body hợp lệ (kể cả có `issues`) để UI hiển thị; `NO_DELIVERY_ZONE` trả 422.

Giỏ kiểm tra 1–15 dòng đầu vào, quantity nguyên 1–20, rồi gộp cùng `variant_id`; tổng quantity sau gộp >20 trả `CART_LIMIT` (422). Quantity 0/sai kiểu và giỏ rỗng trả `VALIDATION_ERROR` (400); >15 dòng hoặc quantity >20 trả `CART_LIMIT`. Các field ngoài schema (kể cả `price`, tổng, phí, role) bị bỏ qua. Tên tỉnh/phường được trim, dài 1–100 ký tự.

Variant thiếu/inactive, sản phẩm HIDDEN/ARCHIVED hoặc category inactive tạo `VARIANT_UNAVAILABLE` và không có dòng giá trong `lines`. Variant bán được nhưng thiếu tồn vẫn có dòng giá theo số lượng yêu cầu, kèm `OUT_OF_STOCK`/`available`. `subtotal` cộng các `lines`; ngưỡng miễn phí dùng subtotal này. Quote chỉ đọc, không giữ/trừ tồn hoặc tạo đơn; Phase 3 phải từ chối đặt đơn khi có issues. Ảnh snapshot ưu tiên ảnh chính, rồi sort_order/ID; không có ảnh → null. Giá hiện tại đọc từ DB bằng một statement variants `IN`, phí giao bằng một statement chọn phường trước/mặc định tỉnh sau.

### `POST /api/orders`
Header **bắt buộc:** `Idempotency-Key: <uuid v4>`. Body:
```ts
{ items: { variant_id: number; quantity: number }[];
  sender:    { name: string; phone: string; email?: string; is_anonymous: boolean };
  recipient: { name: string; phone: string; province_name: string; ward_name: string; address_line: string };
  delivery:  { method_code: 'STANDARD'|'EXPRESS'|'SAME_DAY'; date: string; time_slot: string };
  card:      { type: 'NONE'|'GREETING_CARD'|'BANNER'; message?: string };
  customer_note?: string;
  turnstile_token?: string }           // bắt buộc khi Worker có TURNSTILE_SECRET
```
- **201** `data: OrderSummary` (đơn mới) • **200** cùng `OrderSummary` + `replayed: true` khi trùng `Idempotency-Key`.
- Replay dùng envelope `{ data: { ...OrderSummary, replayed: true } }`; UUID v4 được chuẩn hóa chữ thường. Sau validate/Turnstile, replay chỉ đọc một statement, không tính lại giá/ngày giao hay ghi tồn. Key xác định đơn đã tạo, kể cả body hợp lệ gửi lại thay đổi.
- Server **bỏ qua** mọi giá/tổng/phí từ client; tính lại từ DB.
- Giỏ 15 dòng dùng 35 statements; failed batch được tính nguyên khối, thêm một diagnostic read thành 36. Trùng mã đơn thử tối đa ba batch, nhưng dừng `CONFLICT` 409 trước retry có thể vượt 40 statements (không có đơn/tồn được ghi bởi batch thất bại).
- Khi có `TURNSTILE_SECRET`, verifier bắt buộc token hợp lệ, fail closed khi Siteverify lỗi; gửi UUID qua `idempotency_key` của Siteverify để hỗ trợ retry xác minh. Token Turnstile có hạn/single-use; client phải lấy token mới khi token cũ hết hạn/đã dùng. Local không secret bỏ qua verifier; test nhánh provider bằng mock.
```ts
type OrderSummary = { order_number: string; status_code: string; payment_method: 'COD'; payment_status: 'UNPAID'|'PAID';
  subtotal; discount_total; delivery_fee; grand_total; placed_at: string }
```
Lỗi có thể gặp: `VALIDATION_ERROR`, `OUT_OF_STOCK`, `VARIANT_UNAVAILABLE`, `NO_DELIVERY_ZONE`, `INVALID_DELIVERY_SLOT`, `CART_LIMIT`, `FORBIDDEN`, `CONFLICT`, `INTERNAL`.

### `POST /api/orders/lookup`
Body `{ order_number, phone }` (khớp SĐT người đặt **hoặc** người nhận). `data: OrderDetail`. Sai mã hoặc sai SĐT đều trả cùng `NOT_FOUND` (không lộ mã nào tồn tại).

Body/schema không hợp lệ (ví dụ SĐT không chuẩn hóa được về 10 chữ số) trả `VALIDATION_ERROR` 400; mã hoặc SĐT hợp lệ về cấu trúc nhưng không khớp đơn trả cùng `NOT_FOUND` 404. Lookup dùng ba statements và không trả admin_note/stock_released/actor.

```ts
type OrderDetail = OrderSummary & {
  sender: { name; phone; email|null; is_anonymous }; recipient: { name; phone; province_name; ward_name; address_line };
  delivery: { method_code; date; time_slot }; card: { type; message|null }; customer_note: string|null;
  items: { sku; name_vi; name_en; size; image_url|null; unit_price; quantity; line_total }[];
  timeline: { from_status|null; to_status; note|null; occurred_at: string }[];
  delivered_at: string|null; paid_at: string|null }
```

### `POST /api/orders/:orderNumber/cancel` *(tùy chọn, chưa triển khai)*
Body `{ phone }`. Khách chỉ hủy được khi `PENDING`. Cùng cơ chế hoàn tồn như admin.

## Admin (cookie `lunara_admin`, HttpOnly)

**PLANNED — Phase 4 chưa triển khai.** Toàn bộ routes/cookie/authorization bên dưới là hợp đồng đích; hiện `/api/admin/*` trả JSON API 404, không phải đã có middleware trả 401. Máy trạng thái/hoàn tồn đã có ở service nội bộ Phase 3, nhưng chưa có HTTP endpoint chuyển trạng thái. UI admin còn ẩn và sẽ nối ở Phase 5.

Mọi route dưới `/api/admin/*` (trừ `login`) yêu cầu cookie hợp lệ; request ghi (`POST/PATCH/PUT/DELETE`) phải có `Content-Type: application/json` và `Origin` trùng host.

| Method + path | Mô tả |
| --- | --- |
| `POST /api/admin/login` `{ password }` | Đúng → set cookie, `data: { ok: true }`. Sai → `INVALID_CREDENTIALS` |
| `POST /api/admin/logout` | Xóa cookie |
| `GET /api/admin/me` | `data: { role: 'ADMIN' }` hoặc 401 |
| `GET /api/admin/summary` | `{ orders_by_status: Record<status, number>, today_orders, low_stock_count }` |
| `GET /api/admin/orders?status=&date=&q=&limit=20&offset=0` | `{ items: OrderRow[], total }`; `q` khớp mã đơn/SĐT/tên; `date` lọc theo `delivery_date` |
| `GET /api/admin/orders/:orderNumber` | `OrderDetail` + `admin_note`, `stock_released` |
| `PATCH /api/admin/orders/:orderNumber/status` `{ to_status, note? }` | Chuyển trạng thái (bảng dưới) |
| `PATCH /api/admin/orders/:orderNumber/note` `{ admin_note }` | Ghi chú nội bộ |
| `GET /api/admin/products` | Mọi trạng thái, kèm `stock_quantity` chính xác |
| `POST /api/admin/products` | Tạo sản phẩm + variants + 1 ảnh (URL) trong một `batch` |
| `PATCH /api/admin/products/:id` | Sửa tên/mô tả/badge/featured/status/ảnh chính (URL) |
| `PATCH /api/admin/variants/:id` | `{ price?, compare_at_price?, low_stock_threshold?, is_active?, stock_delta? | stock_quantity? }` — **ưu tiên `stock_delta`** (nguyên tử, không ghi đè lên đơn mới) |
| `GET/POST /api/admin/delivery-zones`, `PUT /api/admin/delivery-zones/:id` | Quản lý phí giao; "xóa" = `is_active = 0` |

### Máy trạng thái đơn

| Từ | Được chuyển tới | Tác dụng phụ |
| --- | --- | --- |
| `PENDING` | `CONFIRMED`, `CANCELLED` | |
| `CONFIRMED` | `PREPARING`, `CANCELLED` | |
| `PREPARING` | `IN_TRANSIT`, `CANCELLED` | |
| `IN_TRANSIT` | `DELIVERED` | |
| `DELIVERED`, `CANCELLED` | (kết thúc) | |

- `→ DELIVERED`: `payment_status = 'PAID'`, `paid_at = now`, `delivered_at = now`.
- `→ CANCELLED`: hoàn tồn **đúng một lần** (`stock_released = 0 → 1`). Giao thất bại sau `IN_TRANSIT` xử lý ngoài hệ thống ở MVP (ghi vào `admin_note`); trạng thái `DELIVERY_FAILED` nằm ở backlog.
- Mỗi lần chuyển ghi 1 dòng `order_status_history` (`actor_label = 'ADMIN'`).
- Chuyển trạng thái dùng điều kiện lạc quan: `UPDATE ... WHERE id = ? AND status_code = <trạng thái hiện tại>`; nếu 0 dòng bị đổi → `INVALID_TRANSITION`.

## Quy tắc kiểm tra dữ liệu đặt hàng

| Trường | Quy tắc |
| --- | --- |
| `items` | 1–15 dòng; `quantity` 1–20; cùng `variant_id` thì gộp |
| Tên (người gửi/nhận) | 1–100 ký tự sau trim |
| `address_line` | 5–200 ký tự |
| `card.message` | ≤ 200 ký tự; bắt buộc nếu `type ≠ NONE` |
| `customer_note` | ≤ 500 ký tự |
| `delivery.date` | hôm nay → +30 ngày (giờ VN) |
| `delivery.time_slot` | thuộc danh sách khung giờ trong `worker/config.ts` |
| `SAME_DAY`/`EXPRESS` | chỉ cho ngày hôm nay; trước giờ chốt cấu hình; khung giờ đủ thời gian chuẩn bị |
| `province_name`/`ward_name` | khớp `delivery_zones` đang hoạt động (phường không có dòng riêng thì dùng dòng mặc định của tỉnh) |

**Phí giao** = (phí khu vực; bằng 0 nếu `subtotal ≥ free_from_amount`) + phụ phí phương thức (`config.ts`). Giá trị phụ phí, giờ chốt, khung giờ trong `config.ts` là **giả định ban đầu**, chủ shop cần chỉnh.

Helper ngày/khung giờ Phase 2 đã được order service Phase 3 sử dụng; quote không kiểm ngày/slot vì body không có các trường này. Giả định config: STANDARD/EXPRESS/SAME_DAY có phụ phí 0/30000/50000; EXPRESS và SAME_DAY dùng cutoff 16:00, chuẩn bị ít nhất 120 phút. Sáu khung 2 giờ từ 08:00 đến 20:00; STANDARD ngày hôm nay không nhận khung đã bắt đầu trong quá khứ. Ngày hợp lệ đến +30 ngày theo Asia/Ho_Chi_Minh, gồm kiểm tra ngày có thật trong lịch.
