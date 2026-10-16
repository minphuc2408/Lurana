# API contract MVP

> Rà soát 16/10/2026: [hiện trạng chuẩn](../PROJECT_STATUS.md), [contract hiện tại](API_CONTRACT.md). Phase 0–5 DONE local, Phase 6 IN PROGRESS5/7. Local170 tests/215 source files/40 smoke; staging đã deploy bản mới13:31 ngày 16/10, production vẫn bản 15/10. Output/checklist ghi ngày cũ bên dưới là lịch sử, không phải trạng thái cloud hiện tại.


Base path: `/api` (cùng origin với frontend). JSON UTF-8. Đây là hợp đồng giữa Worker và frontend; thay đổi phải sửa file này trước.

**Trạng thái code (16/10/2026):** Phase 2–4 API và Phase 5 frontend DONE local: health, catalog, delivery/options, checkout/quote, đặt đơn COD, tra đơn và auth/API admin. Admin status dùng lại `transitionOrder`; không có route hủy đơn khách. Frontend đã nối checkout form/review/gửi/retry/xác nhận trong `/cart`, public `/orders/track`, cookie login và dashboard/orders/products/stock/delivery admin. Không đổi hợp đồng Worker/DDL khi nối Phase 5. Route API lạ trả `NOT_FOUND` JSON 404 (message `Không tìm thấy API.`); boundary admin kiểm cookie trước khi trả 404. [Hiện trạng](../PROJECT_STATUS.md) · [nghiệm thu backend Phase 4](PHASE_4_ADMIN.md) · [nghiệm thu frontend Phase 5](PHASE_5_FRONTEND.md). Phase 6 IN PROGRESS (5/7): D1 remote migration/backup PASS; deployment/API live 7/7 + public browser/10 kết quả MVP PASS, cleanup xong. Còn dữ liệu thật và xác nhận quota; không gọi đây là test đủ checkout/admin UI remote. B2/B3/M1–M9 đã cập nhật token3 form, rate-limit/cap PENDING, cancellation restock, bounded admin queries và approved image URLs như các phần dưới. [Bằng chứng và điều kiện tiếp tục](PHASE_6_DEPLOY.md).

## Quy ước chung

- **Thành công:** `{ "data": ... }`. **Lỗi:** `{ "error": { "code": "...", "message": "...", "details": ... } }`. `message` bằng tiếng Việt, ngắn, an toàn để hiển thị.
- **Tiền:** số nguyên VND (`450000`). **Ngày giao:** `YYYY-MM-DD` giờ Việt Nam. **Thời điểm:** ISO-8601 UTC có `Z` (ví dụ `2026-10-14T03:20:00Z`).
- **Số điện thoại:** server chuẩn hóa về dạng `0xxxxxxxxx` (chấp nhận `+84...`, khoảng trắng, dấu chấm). Hợp lệ: `^0\d{9}$` sau khi chuẩn hóa.
- **Tên sản phẩm:** luôn trả cả `name_vi` và `name_en`; frontend chọn theo locale.
- Không bao giờ trả `password_hash`, secret, stack trace, SQL.
- API dùng `Content-Type: application/json; charset=utf-8`, security headers và `X-Request-Id`. GET catalog thành công (categories/products/detail/delivery options) dùng `Cache-Control: public, max-age=30`; health, request ghi/admin và mọi lỗi dùng `no-store`. Lỗi `INTERNAL` chỉ có mã tham chiếu trong `error.details.request_id`; log ghi request_id/error_name và mã D1/SQLite/constraint/target thuộc allowlist nếu nhận diện được; không dump message/SQL/binds/stack/request/credential. Observability lấy mẫu 10%, invocation logs tắt; xem [hardening](../HARDENING.md).
- Frontend services dùng API client chung qua hooks; component không gọi fetch. Client phân biệt HTTP/envelope lỗi và NETWORK/TIMEOUT/BAD_RESPONSE, map mã lỗi/field sang locale EN/VI; Preference đã lưu ưu tiên, sau đó ngôn ngữ trình duyệt EN/VI; English là fallback. Currency luôn VND và timezone luôn Asia/Ho_Chi_Minh, không đổi theo locale.
- Chỉ cart version/variantId/quantity và preference locale được lưu bền ở frontend. Sender/recipient/SĐT/địa chỉ/đơn/password/JWT/idempotency intent không lưu localStorage/sessionStorage; customer-auth fixture source không active.

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
| `INTERNAL` | 503 | Thiếu rate-limit binding trên hostname ngoài loopback |
| `INTERNAL` | 500 | Lỗi không lường trước; chỉ trả mã tham chiếu `request_id` |

## Public

Rate-limit bindings chạy trước validation/D1/Siteverify: POST orders/login 6/phút/IP/route; lookup/quote và GET catalog 60/phút/IP/route. Key CF-Connecting-IP, namespace prod/staging riêng; rate limit có tính nhất quán cuối cùng theo Cloudflare location, không phải bộ đếm chính xác toàn cầu. Token Turnstile dài tối đa 2048 ký tự. [Cấu hình](../BOT_PROTECTION.md).

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
- Frontend tạo UUID v4 cho mỗi payload đặt đơn, khóa submit khi pending và giữ nguyên key khi retry cùng payload sau lỗi. Sửa payload tạo intent/key mới; không gửi giá/tổng/phí để quyết định thanh toán. Confirmation hiển thị mã/tổng/COD từ OrderSummary nhận được, không dùng giá snapshot giỏ hay mã giả. Intent chỉ ở memory; reload không tự tạo lại intent cũ.
- Replay dùng envelope `{ data: { ...OrderSummary, replayed: true } }`; UUID v4 được chuẩn hóa chữ thường. Sau validate/Turnstile, replay chỉ đọc một statement, không tính lại giá/ngày giao hay ghi tồn. Key xác định đơn đã tạo, kể cả body hợp lệ gửi lại thay đổi.
- Server **bỏ qua** mọi giá/tổng/phí từ client; tính lại từ DB.
- Giỏ 15 dòng dùng 35 statements; failed batch được tính nguyên khối, thêm một diagnostic read thành 36. Trùng mã đơn thử tối đa ba batch, nhưng dừng `CONFLICT` 409 trước retry có thể vượt 40 statements (không có đơn/tồn được ghi bởi batch thất bại).
- Khi có `TURNSTILE_SECRET`, verifier bắt buộc token hợp lệ và đúng action `checkout`/hostname; fail closed khi Siteverify lỗi. Mỗi lần gửi lại dùng token mới, không dùng UUID đơn làm idempotency của Siteverify. Token nằm ngoài fingerprint, nên thay token không đổi UUID đơn. Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 hiện local/chưa deploy.
- Tối đa 3 đơn `PENDING`/SĐT **người đặt** chuẩn hóa. COUNT được kiểm ngay trong INSERT/batch để chặn concurrent creates; vượt ngưỡng kích hoạt NOT NULL sẵn có của sender_phone và rollback. Replay cùng key vẫn trả đơn đã lưu, không chiếm thêm hạn mức; statement count giữ 35/36.
```ts
type OrderSummary = { order_number: string; status_code: string; payment_method: 'COD'; payment_status: 'UNPAID'|'PAID';
  subtotal; discount_total; delivery_fee; grand_total; placed_at: string }
```
Lỗi có thể gặp: `RATE_LIMITED`, `PENDING_ORDER_LIMIT`, `VALIDATION_ERROR`, `OUT_OF_STOCK`, `VARIANT_UNAVAILABLE`, `NO_DELIVERY_ZONE`, `INVALID_DELIVERY_SLOT`, `CART_LIMIT`, `FORBIDDEN`, `CONFLICT`, `INTERNAL`.

### `POST /api/orders/lookup`
Body `{ order_number, phone, turnstile_token? }` (khớp SĐT người đặt **hoặc** người nhận). Secret thiếu/rỗng trả503 TURNSTILE_NOT_CONFIGURED; token bắt buộc khi secret đã cấu hình; action `lookup`, đúng hostname. `data: OrderDetail`. Sai mã hoặc sai SĐT đều trả cùng `NOT_FOUND` (không lộ mã nào tồn tại).

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

**Backend Phase 4 và UI Phase 5 đã triển khai/nghiệm thu local.** AuthProvider tải `/api/admin/me`, login/logout qua cùng API client với credentials same-origin; AdminRoute chờ loading, có error/retry và guest redirect `/admin/login`. 401 từ request admin xóa state session UI. Cookie vẫn do server cấp/xóa; frontend không giữ credentials/JWT/session trong storage. Không dùng auth fixture/sessionStorage để cấp quyền backend.

Mọi route dưới `/api/admin` và `/api/admin/*` (trừ đúng `POST /api/admin/login`) yêu cầu cookie hợp lệ, kể cả route lạ và logout. Request ghi (`POST/PATCH/PUT/DELETE`), bao gồm login/logout, phải có `Content-Type: application/json` (chấp nhận charset) và `Origin` bằng origin đầy đủ của URL request: scheme/host/port. Thiếu/sai Origin → `FORBIDDEN` 403; thiếu/sai Content-Type → `VALIDATION_ERROR` 400. Thiếu cookie được trả 401 trước validate Origin/body.

Login băm SHA-256 hai giá trị và dùng Workers `crypto.subtle.timingSafeEqual`; không băm mật khẩu chậm. Sau khi qua cổng Turnstile, cấu hình thiếu/trống, ADMIN_PASSWORD <24 ký tự, JWT_SECRET <32 ký tự sau trim hoặc hai secret trùng nhau → login `INVALID_CREDENTIALS` 401, không đặt cookie. Secret ngẫu nhiên thật do [NGƯỜI] đặt, không commit. Login giới hạn body 8192 byte và password 1–1024 ký tự, giữ nguyên password (không trim). Thiếu secret trả503 trước kiểm mật khẩu (ngoại trừ controlled loopback test opt-in). Turnstile token bắt buộc khi có secret, action `admin_login`/đúng hostname, xác minh trước mật khẩu.

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
| `POST /api/admin/products` | Tạo sản phẩm + variants + 1 ảnh (URL) trong một `batch` |
| `PATCH /api/admin/products/:id` | Sửa tên/mô tả/badge/featured/status/ảnh chính (URL) |
| `PATCH /api/admin/variants/:id` | `{ price?, compare_at_price?, low_stock_threshold?, is_active?, stock_delta? | stock_quantity? }` — **ưu tiên `stock_delta`** (nguyên tử, không ghi đè lên đơn mới) |
| `GET/POST /api/admin/delivery-zones`, `PUT /api/admin/delivery-zones/:id` | Quản lý phí giao; "xóa" = `is_active = 0` |

### DTO và validation admin

- Summary dùng đúng 3 aggregate statements. today_orders đếm placed_at giữa hai mốc nửa đêm VN; orders_by_status có mọi trạng thái kể cả 0, trong 30 ngày lịch VN gần nhất (gồm hôm nay), period_days=30. Dùng raw ranges/index placed_at cho cả timestamp ISO và SQLite UTC. low_stock_count chỉ đếm variant is_active=1 thuộc product ACTIVE/category active và tồn ≤ ngưỡng, gồm 0.
- Orders list: status thuộc enum; date/placed_from/placed_to là ngày có thật YYYY-MM-DD. Cặp placed_from/to phải cùng có mặt, từ ≤ đến, tối đa 366 ngày (gồm hai đầu); bỏ cả cặp mặc định 90 ngày lịch VN gần nhất. q trim rỗng được phép; khác rỗng dài 2–100 ký tự, khớp literal ký tự LIKE. Limit mặc định20, nguyên1–50; offset mặc định0, nguyên0–10000; cần thu hẹp ngày để tra nhiều hơn. OrderRow gồm id/order_number/status_code/payment_method/payment_status/sender_name/sender_phone/recipient_name/recipient_phone/delivery_date/delivery_time_slot/grand_total/placed_at. Sắp placed_at DESC, id DESC; total tính trước phân trang trong cửa sổ đã chọn. Chi tiết theo mã đơn không giới hạn ngày.
- Admin detail = OrderDetail + admin_note nullable, stock_released boolean, timeline thêm actor_label. Không trả idempotency_key, user_id hoặc actor_id. Status PATCH trả OrderSummary; note PATCH nhận `{admin_note: string|null}` ≤500 ký tự, trả `{order_number,admin_note}`. Note chuyển trạng thái ≤500 ký tự.
- Product create (201): `{category_id,slug,name_vi,name_en,description_vi?,description_en?,badge_code?,is_featured?,status?,image:{url,alt_vi?,alt_en?},variants:[{sku,size_code,price,compare_at_price?,stock_quantity?,low_stock_threshold?,is_active?}]}`. 1–5 variants, size/SKU không trùng; create atomic một batch. Price/stock/threshold là safe integer không âm; compare_at_price nullable và ≥ price. Slug lowercase chữ/số/gạch ngang, image URL chỉ HTTPS từ res.cloudinary.com/images.unsplash.com, không credentials hoặc port tùy chỉnh (áp dụng cả PATCH). Name trim1–200; descriptions nullable ≤5000; image alt nullable ≤200.
- Products GET trả `{items}` mọi trạng thái với id/slug/category_code/category_id/tên/mô tả/badge/featured/status/archived_at/images/variants; variants có stock_quantity/low_stock_threshold/is_active và giá chính xác. Dùng 3 truy vấn, không truy vấn từng sản phẩm. Product PATCH chỉ tên/mô tả/badge/featured/status/image; ARCHIVED ghi archived_at, rời ARCHIVED xóa mốc; ảnh chính cập nhật atomic, giữ 1 ảnh chính. POST/PATCH trả `{id}`.
- Variant PATCH trả variant với id/product_id/sku/size_code/price/compare_at_price/stock_quantity/low_stock_threshold/is_active. stock_delta được cộng nguyên tử và ưu tiên khi có cả stock_quantity; stock_quantity tuyệt đối chỉ dùng khi không có delta. Không ghi đè price/compare_at_price/stock từ snapshot cũ khi client không sửa field đó. CHECK tồn âm → VALIDATION_ERROR400 "Tồn kho không thể âm"; phép cộng vượt safe integer cũng bị từ chối. compare_at_price được kiểm trước ghi và CHECK bảo vệ race. Không nhận SKU/size/product_id ở PATCH.
- `stock_delta` không có idempotency key. Frontend xử lý lỗi ghi chưa biết kết quả (NETWORK/TIMEOUT/BAD_RESPONSE/INTERNAL) bằng cách xóa delta vừa nhập, khóa dòng và yêu cầu GET tải tồn hiện tại thành công trước lần chỉnh tiếp; không retry delta tự động. Người vận hành kiểm lại tồn rồi nhập delta mới để tránh cộng/trừ hai lần khi request trước có thể đã commit.
- Delivery zones GET `{items}` gồm id/province_name/ward_name/fee/free_from_amount/eta_minutes/is_active. POST (201)/PUT full body `{province_name,ward_name?,fee,free_from_amount?,eta_minutes?,is_active?}`; ward_name mặc định `''` là mặc định tỉnh, fee/free_from_amount safe integer không âm, eta_minutes nullable hoặc nguyên dương. Trùng tỉnh/phường → CONFLICT409. POST/PUT trả zone cùng projection GET. Soft-delete is_active=false giữ dòng nhưng quote bỏ qua; quote đọc DB ngay ở request kế tiếp.
- Object schemas bỏ field ngoài contract. PATCH rỗng sau strip → VALIDATION_ERROR400. Không tạo bảng mới, không thêm dependency. Mọi giá trị input bind; chỉ ghép SQL fragments/column names do server chọn.

### Máy trạng thái đơn

Cron nội bộ đã được owner chốt: `PENDING_ORDER_TTL_HOURS=24`, `0 * * * *` (mỗi giờ). Mỗi lượt hủy toàn bộ đơn còn PENDING/stock_released=0 có placed_at quá 24 giờ; đúng mốc 24 giờ chờ lượt sau. Ba statements trong một D1 batch ghi history SYSTEM, hoàn tổng quantity theo variant còn tồn tại và chuyển CANCELLED/stock_released=1, rollback toàn bộ khi lỗi. Không sửa đơn đã xác nhận, không hoàn tồn lặp khi Cron chạy chồng. Đây là scheduled handler, không thêm public HTTP route/DDL. Staging version16/10 có TTL 24h/scheduled handler; production chưa có. Lịch0 * * * * nằm trong Wrangler, chưa kiểm tick cloud thực chạy trong lượt chỉ đọc.

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

Helper ngày/khung giờ Phase 2 đã được order service Phase 3 sử dụng; quote không kiểm ngày/slot vì body không có các trường này. Giả định config: STANDARD/EXPRESS/SAME_DAY có phụ phí 0/30000/50000; EXPRESS và SAME_DAY dùng cutoff 16:00. Mọi phương thức giao hôm nay, gồm STANDARD, yêu cầu ít nhất 120 phút đến giờ bắt đầu khung; đúng 120 phút được nhận. Sáu khung 2 giờ từ 08:00 đến 20:00. Ngày hợp lệ đến +30 ngày theo Asia/Ho_Chi_Minh, gồm kiểm tra ngày có thật trong lịch.

## Admin image upload — signed direct integration

Có code và staging deployment/config/secret names; upload provider thật chưa nghiệm thu, production còn thiếu cấu hình. [Snapshot](../PROJECT_STATUS.md).

POST /api/admin/uploads/sign dùng admin cookie, Origin cùng nguồn và JSON ≤1 KB. Input strict: mime (image/jpeg, image/png, image/webp), size (1..5242880). Output data: cloud_name/api_key/signature và params timestamp/public_id/asset_folder/upload_preset/overwrite=false/allowed_formats. Params do server quyết định; SHA-256, Cloudinary validity 1h. 503 CLOUDINARY_NOT_CONFIGURED nếu thiếu keys/config; 400 VALIDATION_ERROR nếu input sai; 401/403 theo middleware hiện có. Không ghi D1; browser upload trực tiếp Cloudinary rồi Save product qua hợp đồng image.url hiện có. Xem [Cloudinary](../CLOUDINARY.md).

UI tạo sản phẩm tự sinh slug từ tên + UUID và tiếp tục gửi slug theo adminProductCreateSchema; API vẫn yêu cầu slug, không đổi schema/route. UUID giảm trùng tên, không phải idempotency key cho tạo sản phẩm; không tự retry request tạo.
