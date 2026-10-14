# Phase 2 — API nền và catalog

**Mục tiêu:** khung Hono chuẩn (lỗi, validate, middleware), các API đọc: danh mục, sản phẩm, tùy chọn giao hàng, báo giá giỏ. Hợp đồng: [API_CONTRACT.md](API_CONTRACT.md).

**Trạng thái:** DONE · 8/8 tiêu chí local, **14/10/2026**. Đây là phạm vi/nghiệm thu catalog/quote tại mốc Phase 2, chưa bao gồm order/admin. Hiện Phase 3 COD/tồn/idempotency/lookup/transition đã DONE local ([output](PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026)); auth/admin Phase 4 chưa triển khai. Preview Home/Shop/Cart/Delivery/Quote đã nối D1: [FE_AUDIT](FE_AUDIT.md). [Tiến độ chung](README.md).

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 2.1 | AGENT | Tạo `shared/constants.ts`: `TIME_SLOTS`, `DELIVERY_METHOD_CODES`, `SIZE_CODES`, `ORDER_STATUSES`, giới hạn giỏ. Dùng chung cho FE và Worker |
| 2.2 | AGENT | Tạo `worker/config.ts` (giá trị **giả định**, ghi chú để chủ shop chỉnh): phụ phí `STANDARD 0 / EXPRESS 30000 / SAME_DAY 50000`, giờ chốt same-day `16:00`, thời gian chuẩn bị tối thiểu `120` phút, `MAX_CART_LINES 15`, `MAX_QTY_PER_LINE 20`, `MAX_ADVANCE_DAYS 30`, múi giờ `Asia/Ho_Chi_Minh` |
| 2.3 | AGENT | `worker/lib/errors.ts`: lớp `AppError(code, status, message, details?)` + `app.onError` trả JSON đúng contract; lỗi lạ → `INTERNAL` kèm `request_id`, log chi tiết server-side |
| 2.4 | AGENT | `worker/lib/validate.ts`: bọc `zod` + hook của Hono trả `VALIDATION_ERROR`. Schema nằm trong `shared/schemas.ts` để FE dùng lại cho form |
| 2.5 | AGENT | Middleware: `secureHeaders()`, `request_id`, `Cache-Control: no-store` cho mọi `/api/*` ghi/admin; `public, max-age=30` cho GET catalog |
| 2.6 | AGENT | `GET /api/categories` |
| 2.7 | AGENT | `GET /api/products` và `GET /api/products/:slug`: **đúng 3 truy vấn** (products → variants `IN (...)` → images `IN (...)`), ghép trong bộ nhớ. Chỉ sản phẩm `ACTIVE`, category active, variant active. Tính `in_stock`, `low_stock`, `max_quantity = min(stock, 20)` |
| 2.8 | AGENT | `worker/services/delivery.ts`: `resolveFee(db, province, ward, subtotal, methodCode)` — tra `(province, ward)` rồi `(province, '')`, áp `free_from_amount`, cộng phụ phí phương thức; ném `NO_DELIVERY_ZONE` nếu không có |
| 2.9 | AGENT | `GET /api/delivery/options` (gom `delivery_zones` đang hoạt động theo tỉnh) |
| 2.10 | AGENT | `worker/services/pricing.ts`: `priceCart(db, items, ...)` gộp variant trùng, kiểm tra giới hạn, đọc variants bằng **một** truy vấn `IN`, trả dòng + `issues`; dùng chung cho quote và đặt đơn (Phase 3) |
| 2.11 | AGENT | `POST /api/checkout/quote` |
| 2.12 | AGENT | Unit test bằng Node runner hiện có cho `resolveFee`, `priceCart`, chuẩn hóa SĐT, kiểm tra ngày/khung giờ; không dựng framework test mới |
| 2.13 | AGENT | Mở rộng `scripts/smoke.mjs` hiện có (Phase 0: health + JSON 404 + SPA HTML) với các endpoint trên; mặc định `http://127.0.0.1:5173`, base URL positional và guard local `127.0.0.1`, in PASS/FAIL |

## Gợi ý triển khai

- Tiền xử lý một lần: `normalizePhone()`, `todayInVN()` (dùng `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })`), `toIso(sqliteTs)` (`'YYYY-MM-DD HH:MM:SS'` → `...T...Z`).
- Truy vấn `IN`: tạo placeholder `?,?,?` theo số phần tử; giữ ≤ 100 tham số.
- Không trả cột nội bộ (`stock_quantity` chính xác, `archived_at`, `cloudinary_public_id`) ở endpoint public.
- Đặt `Content-Type: application/json; charset=utf-8`. Chỉ `Hono` + `zod`; không thêm framework khác.
- Ghi ngay chú thích trong `config.ts` cho các giá trị mang tính nghiệp vụ để tránh nhầm là đã chốt.

## Tiêu chí nghiệm thu

- [x] `GET /api/categories` trả 4 danh mục; `GET /api/products` trả 8 sản phẩm, mỗi sản phẩm 3 variant S/M/L và 1 ảnh chính.
- [x] Ẩn sản phẩm (`UPDATE products SET status='HIDDEN'`) → biến mất khỏi API; `GET /api/products/<slug>` trả 404.
- [x] Số truy vấn D1 của `GET /api/products` ≤ 3 (kiểm chứng bằng log hoặc test đếm).
- [x] `GET /api/delivery/options` liệt kê tỉnh/phường/phí từ DB.
- [x] `POST /api/checkout/quote`: giá lấy từ DB dù body có thêm `price`; phí đúng theo phường; phường lạ nhưng tỉnh có mặc định → dùng mặc định; tỉnh lạ → `NO_DELIVERY_ZONE`.
- [x] Giỏ 16 dòng → `CART_LIMIT`; số lượng 0 hoặc 21 → `VALIDATION_ERROR`/`CART_LIMIT` đúng contract.
- [x] Mọi lỗi trả JSON theo contract, không lộ stack trace.
- [x] Unit test pass; `npm run typecheck` pass.

## Triển khai và phạm vi kiểm chứng

- Hằng số/schema dùng chung: [constants.ts](../../shared/constants.ts), [schemas.ts](../../shared/schemas.ts). Hono dùng validator hook + Zod, secureHeaders, request ID, cache theo route/status, lỗi AppError/INTERNAL an toàn. Middleware đọc hết payload bị bỏ qua bằng stream để chuỗi POST 404 → GET tiếp theo không gặp lỗi socket của proxy Miniflare.
- [Catalog](../../worker/services/catalog.ts): sản phẩm có dữ liệu dùng 3 statements; rỗng/404 dùng 1. Danh sách tối đa 100, bind mỗi truy vấn con ≤100, không N+1. Lọc sản phẩm/category/variant inactive và chỉ trả DTO trong contract.
- [Delivery](../../worker/services/delivery.ts)/[pricing](../../worker/services/pricing.ts): một query variants và một query phí; ưu tiên phường rồi mặc định tỉnh đang active; miễn phí phần base, giữ surcharge. Bỏ mọi giá/tổng client gửi; gộp ID trùng, kiểm raw lines và quantity sau gộp. Quote luôn read-only, issue không tạo đơn hoặc giữ tồn.
- [Config](../../worker/config.ts): phụ phí 0/30000/50000, cutoff 16:00, chuẩn bị 120 phút; TIME_SLOTS 08:00–20:00, giỏ 15/20, ngày +30, Asia/Ho_Chi_Minh. Các chính sách/phí/khung giờ là giả định cần chủ shop chỉnh trước mở bán. Helper ngày/SĐT dựng sẵn để Phase 3 sử dụng; quote không có ngày/slot.
- Node runner tại mốc Phase 2: 35 test mới (catalog 8, delivery/pricing 14, validation 6, Hono 6, D1 thật 1), tổng repo 53. Ca thay trạng thái/tồn chỉ ghi vào SQLite in-memory hoặc workerd D1 `persist:false`, `remoteBindings:false`; seed persisted không bị sửa. Không thêm dependency/framework hay sửa DDL. Source sau Phase 3 đã nghiệm thu 92 tests; giữ output 53 bên dưới làm lịch sử.
- [smoke.mjs](../../scripts/smoke.mjs) tại Phase 2: 16 nhóm HTTP, health/JSON 404/SPA; URL positional, local-only và không redirect. Source sau Phase 3 giữ 16 nhóm catalog, đổi assertion deferred orders thành validation 400, thêm 10 ca order qua HTTP/D1 cô lập + đối chiếu tồn/query budget; tổng 27/27.

## Test thủ công trên host 5173

Chạy `npm run dev`, dùng đúng URL `http://127.0.0.1:5173` Vite in ra; nếu port bận thì dùng port thực tế. Server chỉ bind loopback, không phải hosting public. `npm run smoke` hiện chạy 16 nhóm catalog trên server đó và 11 nhóm Phase 3 trên HTTP + D1 cô lập (`persist:false`); không ghi seed persisted. URL khác dùng `npm.cmd run smoke -- http://127.0.0.1:<port>` trên PowerShell.

| Cách test | Chức năng đã xong / kết quả seed |
| --- | --- |
| Mở `/api/health` | Worker liveness, `data.ok = true`; không phải check DB |
| Mở `/api/categories` | 4 danh mục song ngữ đang active |
| Mở `/api/products` | 8 sản phẩm, mỗi sản phẩm S/M/L và 1 ảnh chính, giá VND, thông tin khả dụng tồn |
| Mở `/api/products?category=bouquets&featured=1` | Lọc theo category code và featured |
| Mở `/api/products/blush-peony-bouquet` | Chi tiết sản phẩm; slug thiếu hoặc sản phẩm ẩn → JSON 404 |
| Mở `/api/delivery/options` | 2 tỉnh, 2 phường riêng và phí mặc định, methods/surcharges/slots/limits |
| POST `/api/checkout/quote` qua PowerShell/Postman | Giá DB, gộp variant trùng, phí phường/mặc định tỉnh, ngưỡng miễn phí, issues khi thiếu tồn/variant không bán, lỗi validate/cart limit |
| Mở `/`, `/shop`, `/cart`, `/admin` | Hiện chỉ Home/Shop/Cart active, dùng catalog/quote D1 và VND; route chưa có API hiện sắp ra mắt. Xem FE_AUDIT.md cho preview nối sớm một phần Phase 5 |

Ví dụ PowerShell lấy variant ID thực từ catalog và cố gửi giá 1 để kiểm server không tin giá client:

```powershell
$catalog = Invoke-RestMethod 'http://127.0.0.1:5173/api/products'
$product = $catalog.data.items | Where-Object slug -eq 'blush-peony-bouquet'
$variant = $product.variants | Where-Object size_code -eq 'S'
$body = @{
  items = @(@{ variant_id = $variant.id; quantity = 1; price = 1 })
  province_name = 'Thành phố Hà Nội'
  ward_name = 'Phường Hoàn Kiếm'
  delivery_method_code = 'STANDARD'
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:5173/api/checkout/quote' -ContentType 'application/json; charset=utf-8' -Body $body | ConvertTo-Json -Depth 8
```

Seed cho kết quả `unit_price = subtotal = 450000`, `delivery_fee = 20000`, `grand_total = 470000`, `issues = []`. Quote không tạo đơn hoặc trừ tồn. Preview hiện lưu giỏ variant/quantity trong localStorage; reload giữ số lượng và lấy lại giá/phí qua API.

## Bằng chứng lệnh — 14/10/2026

Output dưới đây trích từ lệnh chạy thực tế trên source Phase 2 cuối; mọi lệnh kiểm tra kết thúc exit 0. `[exit 0]` là chú thích kết quả.

```text
> npm run typecheck
> tsc --noEmit && tsc -p tsconfig.worker.json --noEmit
[exit 0]

> npm run check:architecture
Architecture checked: 170 source files; layer boundaries, public APIs, presentation state, and Tailwind page styles.

> npm test
Catalog D1 evidence: products=8, variants=24, primary_images=8, executed_statements=3.
Catalog D1 evidence: stored_products=118, returned_products=100, child_bind_parameters=100, executed_statements=3.
D1 LOCAL API evidence: categories=4 products=8 variants=24 primary_images=8 GET /api/products statements=3.
D1 LOCAL API evidence: HIDDEN -> list=7/detail=404; DB price=450000; ward_fee=20000; fallback_fee=35000; unknown_province=422/NO_DELIVERY_ZONE.
D1 LOCAL API evidence: cart16=422/CART_LIMIT qty0=400/VALIDATION_ERROR qty21=422/CART_LIMIT; stock unchanged; orders=0; persist=false.
ℹ tests 53
ℹ pass 53
ℹ fail 0
```

```text
> npm run dev
➜ Local: http://127.0.0.1:5173/
> npm run smoke
D1 LOCAL ONLY smoke at http://127.0.0.1:5173; requests do not create orders or mutate persisted data.
PASS health + security headers
PASS API JSON 404 with normal/navigation headers
PASS home + SPA /shop return HTML
PASS categories: four seeded active categories
PASS products: eight products, S/M/L variants, primary image, safe DTO
PASS product detail matches catalog; unknown slug is JSON 404
PASS category/featured filters match catalog
PASS delivery options: DB provinces/wards/fees + configured limits
PASS quote ignores forged client price/totals; ward fee uses DB
PASS quote unknown ward falls back to province default; unknown province is 422
PASS quote free-delivery threshold preserves EXPRESS/SAME_DAY surcharge
PASS quote merges duplicate variants; merged quantity above 20 is CART_LIMIT
PASS quote returns 200 issues for unknown variant and insufficient stock
PASS cart limits: 16 lines / quantity 0 / quantity 21
PASS malformed JSON / empty cart / invalid method are safe validation errors
PASS deferred orders/admin return JSON 404 and no-store
Phase 2 smoke: 16/16 PASS, 0 FAIL at http://127.0.0.1:5173.
```

Build source cuối và smoke artifact preview:

```text
> npm run build
vite v6.4.4 building SSR bundle for production...
✓ 142 modules transformed.
dist/lunara/index.js             252.97 kB
✓ built in 1.02s
vite v6.4.4 building for production...
✓ 2492 modules transformed.
✓ built in 10.50s

> npm run preview
➜ Local: http://127.0.0.1:4173/
> npm run smoke -- http://127.0.0.1:4173
Phase 2 smoke: 16/16 PASS, 0 FAIL at http://127.0.0.1:4173.

> npm run graph:sync
* Synced 16 changed files
• Added: 16 - 148 nodes in 671ms
— Done

> git diff --check
[exit 0]
```

Stress HTTP độc lập trên preview: 25 cặp POST `/api/orders` body `{}` → GET `/api/admin/products` đều 404 JSON UTF-8/no-store; 25 cặp POST quote `text/plain` → GET health đều 400 `VALIDATION_ERROR` rồi 200 JSON UTF-8. Tổng 100 request không gặp 500/fetch failed. Đây là kiểm tra hồi quy lỗi socket do payload không đọc, không triển khai các API đặt đơn/admin.

Rollup bỏ chú thích PURE trong dependency Zod; Node báo SQLite experimental. Các thông báo này không làm thất bại kiểm tra. Không đổi dependency nên không cần chạy lại audit. Bằng chứng Phase 2 ở trên ghi trước lượt nối FE. Hiện preview Home/Shop/Cart dùng D1/VND/localStorage; vẫn chỉ báo giá, chưa checkout thật. Nghiệm thu này không deploy hoặc truy cập D1 remote. Commit/push chỉ thực hiện theo yêu cầu của chủ dự án.
