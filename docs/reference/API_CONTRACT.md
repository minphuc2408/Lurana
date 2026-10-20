# API contract MVP

Reference cho frontend/backend/QA; public catalog đối chiếu **20/10/2026**, các contract khác giữ mốc **17/10/2026**. Base path `/api`, cùng origin với frontend; JSON UTF-8. File này giữ request/response, validation và hành vi API đã triển khai. Phiên bản remote và bằng chứng kiểm thử nằm ở [PROJECT_STATUS](../PROJECT_STATUS.md).

Route API lạ trả `NOT_FOUND` JSON 404, message `Không tìm thấy API.`; boundary admin kiểm cookie trước khi trả 404. Chưa có endpoint hủy đơn dành cho khách.

## Quy ước chung

- **Thành công:** `{ "data": ... }`. **Lỗi:** `{ "error": { "code": "...", "message": "...", "details": ... } }`. `message` bằng tiếng Việt, ngắn, an toàn để hiển thị.
- **Tiền:** số nguyên VND (`450000`). **Ngày giao:** `YYYY-MM-DD` giờ Việt Nam. **Thời điểm:** ISO-8601 UTC có `Z` (ví dụ `2026-10-14T03:20:00Z`).
- **Số điện thoại:** server chuẩn hóa về dạng `0xxxxxxxxx` (chấp nhận `+84...`, khoảng trắng, dấu chấm). Hợp lệ: `^0\d{9}$` sau khi chuẩn hóa.
- **Tên sản phẩm:** luôn trả cả `name_vi` và `name_en`; frontend chọn theo locale.
- Không bao giờ trả `password_hash`, secret, stack trace, SQL.
- API dùng `Content-Type: application/json; charset=utf-8`, security headers và `X-Request-Id`. GET catalog thành công (categories/products/detail/delivery options) dùng `Cache-Control: public, max-age=30`; health, request ghi/admin và mọi lỗi dùng `no-store`. Lỗi INTERNAL chỉ trả mã tham chiếu trong error.details.request_id; policy redacted diagnostics/observability thuộc [HARDENING](../operations/HARDENING.md#diagnostics-và-observability).
- Quy ước client, locale và lưu trữ: [FRONTEND_ENTITIES](FRONTEND_ENTITIES.md). API không nhận giá/tổng/phí hoặc quyền từ client làm nguồn quyết định.

## Mã lỗi

| Code | HTTP | Khi nào |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Zod không qua; `details` = danh sách `{path, message}` |
| `UNAUTHORIZED` | 401 | Thiếu/hết hạn cookie admin |
| `INVALID_CREDENTIALS` | 401 | Sai mật khẩu admin |
| `TURNSTILE_NOT_CONFIGURED` | 503 | TURNSTILE_SECRET thiếu/rỗng/whitespace; không truy vấn D1 hoặc kiểm mật khẩu, no-store |
| `FORBIDDEN` | 403 | Turnstile checkout/lookup/login không hợp lệ; Origin thiếu/khác ở request ghi admin, kể cả login/logout |
| `NOT_FOUND` | 404 | Không có tài nguyên; tra đơn sai mã hoặc SĐT dùng chung mã này |
| `CONFLICT` | 409 | Trùng slug/SKU/mã |
| `OUT_OF_STOCK` | 409 | Thiếu tồn; `details`: `[{variant_id, requested, available}]` |
| `VARIANT_UNAVAILABLE` | 409 | Variant/sản phẩm không còn bán |
| `INVALID_TRANSITION` | 409 | Chuyển trạng thái đơn không hợp lệ |
| `NO_DELIVERY_ZONE` | 422 | Tỉnh/phường chưa được giao |
| `INVALID_DELIVERY_SLOT` | 422 | Ngày/khung giờ/phương thức không hợp lệ (quá khứ, quá giờ chốt…) |
| `CART_LIMIT` | 422 | Quá 15 dòng hoặc số lượng mỗi dòng > 20 |
| `RATE_LIMITED` | 429 | Quá giới hạn IP/route, `Retry-After: 60`; chặn trước D1/Siteverify |
| `PENDING_ORDER_LIMIT` | 429 | SĐT người đặt đã có 3 đơn PENDING; không tạo đơn/trừ tồn |
| `CLOUDINARY_NOT_CONFIGURED` | 503 | Thiếu hoặc sai cấu hình ký upload ảnh |
| `INTERNAL` | 503 | Thiếu rate-limit binding trên hostname ngoài loopback |
| `INTERNAL` | 500 | Lỗi không lường trước; chỉ trả mã tham chiếu `request_id` |

## Public

Rate-limit bindings chạy trước validation/D1/Siteverify: POST orders/login 6/phút/IP/route; lookup/quote và GET catalog 60/phút/IP/route. Key CF-Connecting-IP, namespace prod/staging riêng; rate limit có tính nhất quán cuối cùng theo Cloudflare location, không phải bộ đếm chính xác toàn cầu. Token Turnstile dài tối đa 2048 ký tự. [Cấu hình](../operations/BOT_PROTECTION.md).

### `GET /api/health`
`{ data: { ok: true, time } }`. Chỉ kiểm Worker liveness, không kiểm D1 readiness.

### `GET /api/categories`
`data: [{ id, code, slug, name_vi, name_en, image_url: string | null }]` — chỉ `is_active = 1`, sắp theo `sort_order`, ID. `image_url=null` khi chưa gán ảnh; URL ảnh được trả trong JSON, không trả bytes/base 64. Không có endpoint ghi danh mục. Nguồn assets/migration: [CATEGORY_IMAGES](../features/CATEGORY_IMAGES.md).

### `GET /api/products?page=1&q=&category=<code>&price=all&sort=featured&featured=1`
`data: { items: Product[]; total: number; page: number; pageSize: 40; totalPages: number }`. Phân trang cố định **40 sản phẩm/trang**, không nhận page size từ client. `total` tính sau lọc và trước phân trang; `totalPages = ceil(total / 40)`, bằng 0 khi rỗng. `page` mặc định 1, chỉ nhận số nguyên dương ở dạng thập phân không số 0 đầu, tối đa `floor(Number.MAX_SAFE_INTEGER / 40)`; trang vượt cuối trả `items: []` và giữ page đã yêu cầu để frontend điều hướng.

- `q` tùy chọn, trim, tối đa 100 ký tự, không NUL; tìm trên cả `name_en`/`name_vi`. Worker chuẩn hóa NFD/bỏ dấu tổ hợp/đ → d/chữ thường, rồi so khớp chuỗi con literal; NFC/NFD, hoa/thường và dấu Việt cho cùng kết quả. `*`, `?`, `[`, `]`, `%`, `_` đều là ký tự thường; không ghép từ khóa vào SQL.
- `category` lọc code active, trim 1–100 ký tự; `featured` chỉ nhận `1` khi có mặt. `price`: `all` (mặc định), `under-500` [0,500000), `500-1000` [500000,1000000), `1000-2000` [1000000,2000000), `over-2000` [2000000,+∞), đơn vị VND.
- `sort`: `featured` (mặc định) = featured DESC/ID ASC; `low`/`high` = giá ASC/DESC rồi ID ASC. Giá lọc/sắp là giá variant active có cỡ nhỏ nhất: S → STANDARD → M → DELUXE → L; sản phẩm không có variant active dùng 0 như card hiện hành. `rating` được nhận để tương thích nhưng dùng featured/ID vì chưa có dữ liệu rating. Lọc/tìm/sắp áp dụng trên toàn catalog trước phân trang.

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

Chỉ sản phẩm thuộc category đang active. `in_stock = stock > 0`; `low_stock = 0 < stock ≤ low_stock_threshold`. Variants theo S/M/L/STANDARD/DELUXE, ảnh theo `sort_order`, ID. Danh sách chỉ trả cover (ưu tiên primary, sau đó sort_order/ID); chi tiết trả toàn bộ ảnh, không có public ID. Không `q`: trang có dữ liệu dùng 4 statement D1 (count + products cùng batch, rồi bulk variants + images), rỗng dùng 2. Có `q`: SQL lọc/sắp candidate, chỉ đọc ID/tên EN/VI về Worker; Worker normalize/tìm trên toàn candidate, đếm rồi cắt tối đa 40 ID trước đọc DTO + variants + images, tổng 4 statement; rỗng/trang vượt cuối dùng 1. Hai child IN tối đa 40 bind, không N+1. Detail có dữ liệu dùng 3 statement; slug không tồn tại chỉ cần 1.

**Quyết định search:** Unicode GLOB mở rộng trả `SQLITE_ERROR`/`pattern_too_complex` trên workerd D1 dù Node SQLite chạy được. Nhánh lightweight giữ tìm tiếng Việt đúng toàn catalog và response 40, không đổi schema; đổi lại CPU/bộ nhớ Worker tăng theo số candidate. Targeted probe 118 sản phẩm đã chạy workerd cô lập; chưa đo giới hạn cloud cho catalog lớn.

### `GET /api/products/by-variants?variant_ids=1,2`
`data: { items: Product[] }` cho khôi phục giỏ đã lưu mà không tải mọi trang catalog. Bắt buộc **1–15 variant ID** nguyên dương/safe integer, không trùng, phân cách bằng dấu phẩy; không khoảng trắng hoặc số 0 đầu. Trả mỗi product một lần, ID ASC, cover và các variant active theo DTO public ở trên. ID không tồn tại/inactive hoặc product/category không active bị bỏ qua; tất cả không còn bán trả `items: []`. Không trả tồn kho nội bộ, không ghi hoặc giữ tồn. Có dữ liệu dùng 3 statement, rỗng dùng 1; rate-limit/cache giống các GET catalog khác. `by-variants` là slug dành riêng, admin create từ chối giá trị này.

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
Frontend dùng danh sách này để dựng ô chọn tỉnh/phường/phương thức/khung giờ. Provinces/wards chỉ gồm từng zone active khớp hai bảng danh mục D1 (hiện Hà Nội 126). Không có zone hợp lệ → provinces=[]; không trả toàn bộ danh mục hoặc mặc định tỉnh. default_fee và free_from_amount cấp tỉnh luôn null, giữ shape tương thích. Tên phường trả dạng chuẩn không tiền tố.

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

Variant thiếu/inactive, sản phẩm HIDDEN/ARCHIVED hoặc category inactive tạo `VARIANT_UNAVAILABLE` và không có dòng giá trong `lines`. Variant bán được nhưng thiếu tồn vẫn có dòng giá theo số lượng yêu cầu, kèm `OUT_OF_STOCK`/`available`. `subtotal` cộng các `lines`; ngưỡng miễn phí dùng subtotal này. Quote chỉ đọc, không giữ/trừ tồn hoặc tạo đơn; Phase 3 phải từ chối đặt đơn khi có issues. Ảnh snapshot ưu tiên ảnh chính, rồi sort_order/ID; không có ảnh → null. Giá hiện tại đọc từ DB bằng một statement variants `IN`, phí giao bằng một statement JOIN danh mục và zone active của phường; không fallback mặc định tỉnh. Phường chưa cấu hình/tắt/ngoài danh mục →422 NO_DELIVERY_ZONE cho cả quote và order.

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
- Client dùng UUID v4 cho mỗi payload đặt đơn và giữ key khi retry cùng nội dung; thay token không đổi key. API chỉ nhận COD, không nhận payment/consent fields. Luồng giao diện: [CHECKOUT_UI](../features/CHECKOUT_UI.md).
- Replay dùng envelope `{ data: { ...OrderSummary, replayed: true } }`; UUID v4 được chuẩn hóa chữ thường. Sau validate/Turnstile, replay chỉ đọc một statement, không tính lại giá/ngày giao hay ghi tồn. Key xác định đơn đã tạo, kể cả body hợp lệ gửi lại thay đổi.
- Server **bỏ qua** mọi giá/tổng/phí từ client; tính lại từ DB.
- Giỏ 15 dòng dùng 35 statements; failed batch được tính nguyên khối, thêm một diagnostic read thành 36. Trùng mã đơn thử tối đa ba batch, nhưng dừng `CONFLICT` 409 trước retry có thể vượt 40 statements (không có đơn/tồn được ghi bởi batch thất bại).
- Turnstile yêu cầu action checkout/hostname hợp lệ, lỗi provider/token →403 FORBIDDEN; thiếu/rỗng/whitespace secret →503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Mỗi attempt cần token mới; controlled server-only loopback opt-in và thứ tự fail-closed thuộc [BOT_PROTECTION](../operations/BOT_PROTECTION.md#fail-closed).
- Tối đa 3 đơn PENDING/SĐT người đặt chuẩn hóa; vượt trả 429 PENDING_ORDER_LIMIT, không tạo đơn/trừ tồn. Replay không chiếm thêm hạn mức; cơ chế COUNT/NOT NULL guard atomic thuộc [BOT_PROTECTION](../operations/BOT_PROTECTION.md#các-lớp-đã-có-trong-code).
```ts
type OrderSummary = { order_number: string; status_code: string; payment_method: 'COD'; payment_status: 'UNPAID'|'PAID';
  subtotal; discount_total; delivery_fee; grand_total; placed_at: string }
```
Mã đơn có dạng `LNR-<YYMMDD giờ VN>-<6 ký tự ngẫu nhiên>`, từ crypto.getRandomValues/rejection sampling, bỏ ký tự dễ nhầm 0/O/1/I/L theo [ids.ts](../../worker/lib/ids.ts). Đây không phải điều kiện regex của lookup.

Lỗi có thể gặp: `TURNSTILE_NOT_CONFIGURED`, `RATE_LIMITED`, `PENDING_ORDER_LIMIT`, `VALIDATION_ERROR`, `OUT_OF_STOCK`, `VARIANT_UNAVAILABLE`, `NO_DELIVERY_ZONE`, `INVALID_DELIVERY_SLOT`, `CART_LIMIT`, `FORBIDDEN`, `CONFLICT`, `INTERNAL`.

### `POST /api/orders/lookup`
Body `{ order_number, phone, turnstile_token? }` (khớp SĐT người đặt **hoặc** người nhận). Secret thiếu/rỗng trả 503 TURNSTILE_NOT_CONFIGURED; token bắt buộc khi secret đã cấu hình; action `lookup`, đúng hostname. `data: OrderDetail`. Sai mã hoặc sai SĐT đều trả cùng `NOT_FOUND` (không lộ mã nào tồn tại).

`order_number` trim, dài 1–100 ký tự; server giữ nguyên hoa/thường và không bắt regex mã đơn. `phone` chuẩn hóa theo quy ước chung. Schema không hợp lệ trả `VALIDATION_ERROR` 400; dữ liệu hợp lệ nhưng không khớp trả cùng `NOT_FOUND` 404 với message `Không tìm thấy đơn hàng.`. Middleware rate-limit chạy trước schema; Turnstile chạy sau schema và trước D1. Thành công dùng ba statements (order, items, history); không khớp chỉ dùng một. Response luôn `no-store`.

```ts
type OrderDetail = OrderSummary & {
  sender: { name; phone; email|null; is_anonymous }; recipient: { name; phone; province_name; ward_name; address_line };
  delivery: { method_code; date; time_slot }; card: { type; message|null }; customer_note: string|null;
  items: { sku; name_vi; name_en; size; image_url|null; unit_price; quantity; line_total }[];
  timeline: { from_status|null; to_status; note|null; occurred_at: string }[];
  delivered_at: string|null; paid_at: string|null }
```

DTO public không chứa `id`, `user_id`, `idempotency_key`, `admin_note`, `stock_released`, `actor_id` hoặc `actor_label`; thông tin sender vẫn được trả khi `is_anonymous=true`. Giao diện và quyền riêng tư phía client: [ORDER_TRACKING](../features/ORDER_TRACKING.md).

## Admin (cookie `lunara_admin`, HttpOnly)

API admin dùng cookie do server cấp; frontend gửi credentials same-origin. Hành vi session phía client và dữ liệu được phép lưu: [FRONTEND_ENTITIES](FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu).

Mọi route dưới `/api/admin` và `/api/admin/*` (trừ đúng `POST /api/admin/login`) yêu cầu cookie hợp lệ, kể cả route lạ và logout. Request ghi (`POST/PATCH/PUT/DELETE`), bao gồm login/logout, phải có `Content-Type: application/json` (chấp nhận charset) và `Origin` bằng origin đầy đủ của URL request: scheme/host/port. Thiếu/sai Origin → `FORBIDDEN` 403; thiếu/sai Content-Type → `VALIDATION_ERROR` 400. Thiếu cookie được trả 401 trước validate Origin/body.

Login băm SHA-256 hai giá trị và dùng Workers `crypto.subtle.timingSafeEqual`; không băm mật khẩu chậm. Sau khi qua cổng Turnstile, cấu hình thiếu/trống, ADMIN_PASSWORD <24 ký tự, JWT_SECRET <32 ký tự sau trim hoặc hai secret trùng nhau → login `INVALID_CREDENTIALS` 401, không đặt cookie. Secret ngẫu nhiên thật do [NGƯỜI] đặt, không commit. Login giới hạn body 8192 byte và password 1–1024 ký tự, giữ nguyên password (không trim). Thiếu TURNSTILE_SECRET trả 503 trước kiểm mật khẩu (ngoại trừ controlled loopback test opt-in). Turnstile token bắt buộc khi có secret, action `admin_login`/đúng hostname, xác minh trước mật khẩu.

Cookie `lunara_admin`: HttpOnly; SameSite=Strict; Path=/; Max-Age=43200; Secure với HTTPS (HTTP loopback local bỏ Secure). JWT HS256 chỉ chứa role ADMIN/iat/exp, hạn 12 giờ; middleware kiểm chữ ký, thuật toán, role và thời gian bắt buộc. JSON không trả JWT/password/secret; JWT nằm trong header Set-Cookie theo thiết kế. Logout đặt cookie rỗng/Max-Age=0; JWT đã sao chép vẫn có hiệu lực đến exp (MVP stateless; xoay JWT_SECRET vô hiệu hóa toàn bộ session).

| Method + path | Mô tả |
| --- | --- |
| `POST /api/admin/login` `{ password, turnstile_token? }` | Đúng → set cookie, `data: { ok: true }`. Sai → `INVALID_CREDENTIALS` |
| `POST /api/admin/logout` | Xóa cookie |
| `GET /api/admin/me` | `data: { role: 'ADMIN' }` hoặc 401 |
| `GET /api/admin/summary` | `{ orders_by_status: Record<status, number>, period_days: 30, today_orders, low_stock_count }` |
| `GET /api/admin/orders?status=&date=&q=&placed_from=&placed_to=&limit=20&offset=0` | `{ items: OrderRow[], total }`; mặc định 90 ngày đặt gần nhất; date lọc delivery_date, placed_from/to lọc ngày đặt |
| `GET /api/admin/orders/:orderNumber` | `OrderDetail` + `admin_note`, `stock_released` |
| `PATCH /api/admin/orders/:orderNumber/status` `{ to_status, note?, restock? }` | Chuyển trạng thái; restock boolean chỉ cho CANCELLED; IN_TRANSIT hủy bắt buộc note khác rỗng |
| `PATCH /api/admin/orders/:orderNumber/note` `{ admin_note }` | Ghi chú nội bộ |
| `GET /api/admin/products` | Mọi trạng thái, kèm `stock_quantity` chính xác |
| `POST /api/admin/products` | Tạo sản phẩm + variants + ảnh trong một `batch` |
| `PATCH /api/admin/products/:id` | Sửa tên/mô tả/badge/featured/status/ảnh |
| `PATCH /api/admin/variants/:id` | `{ price?, compare_at_price?, low_stock_threshold?, is_active?, stock_delta? \| stock_quantity? }` — **ưu tiên `stock_delta`** (nguyên tử, không ghi đè lên đơn mới) |
| `GET/POST /api/admin/delivery-zones`, `PUT /api/admin/delivery-zones/:id` | Quản lý phí giao; "xóa" = `is_active = 0` |

### DTO và validation admin

- Summary dùng đúng 3 aggregate statements. today_orders đếm placed_at giữa hai mốc nửa đêm VN; orders_by_status có mọi trạng thái kể cả 0, trong 30 ngày lịch VN gần nhất (gồm hôm nay), period_days=30. Dùng raw ranges/index placed_at cho cả timestamp ISO và SQLite UTC. low_stock_count chỉ đếm variant is_active=1 thuộc product ACTIVE/category active và tồn ≤ ngưỡng, gồm 0.
- Orders list: status thuộc enum; date/placed_from/placed_to là ngày có thật YYYY-MM-DD. Cặp placed_from/to phải cùng có mặt, từ ≤ đến, tối đa 366 ngày (gồm hai đầu); bỏ cả cặp mặc định 90 ngày lịch VN gần nhất. q trim rỗng được phép; khác rỗng dài 2–100 ký tự, khớp literal ký tự LIKE. Limit mặc định 20, nguyên 1–50; offset mặc định 0, nguyên 0–10000; cần thu hẹp ngày để tra nhiều hơn. OrderRow gồm id/order_number/status_code/payment_method/payment_status/sender_name/sender_phone/recipient_name/recipient_phone/delivery_date/delivery_time_slot/grand_total/placed_at. Sắp placed_at DESC, id DESC; total tính trước phân trang trong cửa sổ đã chọn. Chi tiết theo mã đơn không giới hạn ngày.
- Admin detail = OrderDetail + admin_note nullable, stock_released boolean, timeline thêm actor_label. Không trả idempotency_key, user_id hoặc actor_id. Status PATCH trả OrderSummary; note PATCH nhận `{admin_note: string|null}` ≤500 ký tự, trả `{order_number,admin_note}`. Note chuyển trạng thái ≤500 ký tự.
- Product create (201): `{category_id,slug,name_vi,name_en,description_vi?,description_en?,badge_code?,is_featured?,status?,image?,images?,variants:[{sku,size_code,price,compare_at_price?,stock_quantity?,low_stock_threshold?,is_active?}]}`. Bắt buộc đúng một trong `image` hoặc `images`; 1–5 variants, size/SKU không trùng. Price/stock/threshold là safe integer không âm; compare_at_price nullable và ≥ price. Slug tối đa 200 ký tự lowercase chữ/số/gạch ngang; tên trim 1–200, descriptions nullable ≤5000.
- Products GET trả `{items}` mọi trạng thái với id/slug/category_code/category_id/tên/mô tả/badge/featured/status/archived_at/images/variants; variants có stock_quantity/low_stock_threshold/is_active. Ảnh có `id`, `sort_order`, `cloudinary_public_id` cùng URL/alt/is_primary. Dùng 3 truy vấn bulk, không N+1.
- Product PATCH chỉ nhận tên/mô tả/badge/featured/status/image/images; không nhận slug/category/variants. ARCHIVED ghi archived_at, rời ARCHIVED xóa mốc. POST/PATCH trả `{id}`.
- `image` legacy nhận `{url,cloudinary_public_id?,alt_vi?,alt_en?}`; `images: [{url,cloudinary_public_id?:string|null,alt_vi?:string|null,alt_en?:string|null,is_primary:boolean}]` có 1–8 ảnh, đúng một primary, URL/public ID không trùng. Server đặt sort_order theo vị trí mảng; full replacement và cập nhật text chạy trong một D1 batch, lỗi rollback toàn bộ, ID ảnh có thể đổi. PATCH không có gallery giữ ảnh cũ; `image` legacy cập nhật cover và giữ ảnh phụ; không gửi cả hai field.
- URL ảnh tối đa 2048 ký tự, chỉ HTTPS từ res.cloudinary.com/images.unsplash.com, không credentials/custom port. Alt nullable ≤200. Public ID nullable/tùy chọn, trim 1–255 ký tự `[a-zA-Z0-9/_-]`; khi có phải khớp hậu tố URL Cloudinary `.jpg`, `.png` hoặc `.webp`. Không xóa asset tại provider khi gỡ liên kết; chưa có concurrency version/ETag.
- Variant PATCH trả variant với id/product_id/sku/size_code/price/compare_at_price/stock_quantity/low_stock_threshold/is_active. stock_delta được cộng nguyên tử và ưu tiên khi có cả stock_quantity; stock_quantity tuyệt đối chỉ dùng khi không có delta. Không ghi đè price/compare_at_price/stock từ snapshot cũ khi client không sửa field đó. CHECK tồn âm → VALIDATION_ERROR 400 "Tồn kho không thể âm"; phép cộng vượt safe integer cũng bị từ chối. compare_at_price được kiểm trước ghi và CHECK bảo vệ race. Không nhận SKU/size/product_id ở PATCH.
- `stock_delta` không có idempotency key; quy trình xử lý ghi chưa rõ kết quả ở [OPERATIONS](../operations/OPERATIONS.md).
- Delivery zones GET `{items,provinces}`: items giữ id/province_name/ward_name/fee/free_from_amount/eta_minutes/is_active; provinces là `{code,province_name,wards:[{code,ward_name}] }[]` đầy đủ danh mục (Hà Nội 01/126). POST 201/PUT giữ body tên/fee/free_from_amount/eta_minutes/is_active, yêu cầu tỉnh-phường trong danh mục; rỗng/ngoài danh mục → VALIDATION_ERROR 400. Chuẩn hóa tiền tố Phường/Xã/Đặc khu, trùng kể cả alias → CONFLICT 409. Fee/free safe integer không âm, ETA nullable hoặc nguyên dương. PUT cho phép tắt dòng legacy không hợp danh mục nếu không đổi địa chỉ; không cho bật mới dòng đó. Response write giữ DTO zone. Chỉ zone active hợp danh mục hiện public; không fallback dòng province-default. Cookie/Origin/JSON boundaries giữ nguyên.
- Object schemas bỏ field ngoài contract. PATCH rỗng sau strip → VALIDATION_ERROR 400. Không tạo bảng mới, không thêm dependency. Mọi giá trị input bind; chỉ ghép SQL fragments/column names do server chọn.

### Máy trạng thái đơn

Expiry/Cron nội bộ không có public HTTP route; TTL/config/transaction guard/điều kiện nghiệm thu do [BOT_PROTECTION](../operations/BOT_PROTECTION.md#việc-chủ-shop-cần-cấu-hình-trên-cloudflare) sở hữu, kết quả cloud ở PROJECT_STATUS.

| Từ | Được chuyển tới | Tác dụng phụ |
| --- | --- | --- |
| `PENDING` | `CONFIRMED`, `CANCELLED` | |
| `CONFIRMED` | `PREPARING`, `CANCELLED` | |
| `PREPARING` | `IN_TRANSIT`, `CANCELLED` | |
| `IN_TRANSIT` | `DELIVERED`, `CANCELLED` | Hủy cần lý do; restock mặc định false |
| `DELIVERED`, `CANCELLED` | (kết thúc) | |

- `→ DELIVERED`: `payment_status = 'PAID'`, `paid_at = now`, `delivered_at = now`.
- `→ CANCELLED`: mặc định hoàn tồn ở PENDING/CONFIRMED/PREPARING. Từ IN_TRANSIT bắt buộc lý do sau trim; mặc định `restock=false` giữ tồn đã tiêu thụ (`stock_released=0`), `restock=true` hoàn tồn đúng một lần (`stock_released=1`). CANCELLED luôn kết thúc, kể cả không hoàn tồn; hủy lặp bị từ chối. Không đổi payment sang PAID khi hủy. Trạng thái riêng DELIVERY_FAILED vẫn ở backlog.
- Mỗi lần chuyển ghi 1 dòng `order_status_history` (`actor_label = 'ADMIN'`).
- Transition dùng CAS theo order_number/trạng thái đã đọc; meta.changes khác1 →INVALID_TRANSITION. Rationale hoàn tồn/history cùng transaction ở [ARCHITECTURE](../ARCHITECTURE.md#worker-và-dữ-liệu-bền-vững).

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
| `province_name`/`ward_name` | khớp danh mục D1 và `delivery_zones` active của chính phường; không dùng mặc định tỉnh |

**Phí giao** = (phí khu vực; bằng 0 nếu `subtotal ≥ free_from_amount`) + phụ phí phương thức (`config.ts`). Giá trị phụ phí, giờ chốt, khung giờ trong `config.ts` là **giả định ban đầu**, chủ shop cần chỉnh.

Helper ngày/khung giờ Phase 2 đã được order service Phase 3 sử dụng; quote không kiểm ngày/slot vì body không có các trường này. Giả định config: STANDARD/EXPRESS/SAME_DAY có phụ phí 0/30000/50000; EXPRESS và SAME_DAY dùng cutoff 16:00. Mọi phương thức giao hôm nay, gồm STANDARD, yêu cầu ít nhất 120 phút đến giờ bắt đầu khung; đúng 120 phút được nhận. Sáu khung 2 giờ từ 08:00 đến 20:00. Ngày hợp lệ đến +30 ngày theo Asia/Ho_Chi_Minh, gồm kiểm tra ngày có thật trong lịch.

## Admin image upload — signed direct integration

### `POST /api/admin/uploads/sign`

Yêu cầu admin cookie, Origin cùng nguồn và JSON ≤1 KB. Input strict `{mime,size}`: mime thuộc image/jpeg, image/png, image/webp; size nguyên 1–5242880. Đây là metadata khai báo, không phải Worker nhận hoặc đo bytes ảnh.

`data: {cloud_name,api_key,signature,params:{timestamp,public_id,asset_folder,upload_preset,overwrite,allowed_formats}}`. Server tự chọn params và ký SHA-256; params overwrite là chuỗi `"false"`. Không ghi D1. Browser upload trực tiếp Cloudinary rồi gửi URL/public ID vào `image`/`images` của product. Thiếu/sai cấu hình →503 `CLOUDINARY_NOT_CONFIGURED`; input sai →400 `VALIDATION_ERROR`; auth/Origin dùng cùng boundary admin. Không ký params tùy ý, không trả API_SECRET và không xóa asset tự động. Quy trình provider: [CLOUDINARY](../operations/CLOUDINARY.md).
