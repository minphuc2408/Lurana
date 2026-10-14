# Phase 2 — API nền và catalog

**Mục tiêu:** khung Hono chuẩn (lỗi, validate, middleware), các API đọc: danh mục, sản phẩm, tùy chọn giao hàng, báo giá giỏ. Hợp đồng: [API_CONTRACT.md](API_CONTRACT.md).

**Trạng thái:** PLANNED · hiện chỉ health/JSON 404. [Hiện trạng](../PROJECT_STATUS.md). Bắt đầu sau nghiệm thu schema/seed Phase 1.

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

- [ ] `GET /api/categories` trả 4 danh mục; `GET /api/products` trả 8 sản phẩm, mỗi sản phẩm 3 variant S/M/L và 1 ảnh chính.
- [ ] Ẩn sản phẩm (`UPDATE products SET status='HIDDEN'`) → biến mất khỏi API; `GET /api/products/<slug>` trả 404.
- [ ] Số truy vấn D1 của `GET /api/products` ≤ 3 (kiểm chứng bằng log hoặc test đếm).
- [ ] `GET /api/delivery/options` liệt kê tỉnh/phường/phí từ DB.
- [ ] `POST /api/checkout/quote`: giá lấy từ DB dù body có thêm `price`; phí đúng theo phường; phường lạ nhưng tỉnh có mặc định → dùng mặc định; tỉnh lạ → `NO_DELIVERY_ZONE`.
- [ ] Giỏ 16 dòng → `CART_LIMIT`; số lượng 0 hoặc 21 → `VALIDATION_ERROR`/`CART_LIMIT` đúng contract.
- [ ] Mọi lỗi trả JSON theo contract, không lộ stack trace.
- [ ] Unit test pass; `npm run typecheck` pass.

## Goal prompt (dán vào `/goal`)

```text
Đọc docs/pipeline/README.md, API_CONTRACT.md và PHASE_2_API_CATALOG.md rồi thực hiện Phase 2.
Xây khung Hono (lỗi, validate Zod, middleware) và các endpoint đọc: categories, products, products/:slug, delivery/options, checkout/quote, theo đúng contract.
Ràng buộc: tối đa 3 truy vấn D1 cho danh sách sản phẩm; không tin giá từ client; dùng hono, zod và Node test runner đã có; chưa làm đặt đơn/admin.
Viết unit test + scripts/smoke.mjs. Xong khi mọi "Tiêu chí nghiệm thu" Phase 2 pass, kèm output lệnh làm bằng chứng.
```
