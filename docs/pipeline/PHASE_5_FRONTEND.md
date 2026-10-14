# Phase 5 — Nối frontend với API thật

**Mục tiêu:** các luồng MVP trong frontend dùng API thật, hiển thị VND, không còn fixture/₱ ở luồng MVP. Tham chiếu: [API_CONTRACT.md](API_CONTRACT.md), [FRONTEND_ENTITIES.md](../FRONTEND_ENTITIES.md). Phase này lớn nhất; làm theo thứ tự dưới đây để luôn có bản chạy được.

**Trạng thái:** PLANNED · FE hiện giữ PHP/₱, Asia/Manila, English mặc định/fallback và fixtures. [Hiện trạng / đầu vào chủ shop](../PROJECT_STATUS.md). Phase 0 không đổi thị trường, auth hoặc persistence.

> Tài liệu này mô tả theo cấu trúc `src/features/*` trong [FRONTEND_ENTITIES.md](../FRONTEND_ENTITIES.md). Tên file thực tế có thể khác: bước 5.0 là kiểm kê trước khi sửa.

## Nguyên tắc

- Mỗi feature có service gọi API + adapter chuyển DTO → model UI. Component không gọi `fetch` trực tiếp.
- Giữ API công khai giữa các feature (import qua `index.ts`), không nhập chéo vào nội bộ feature khác.
- Frontend không quyết định giá, tồn, phí, quyền. Mọi số tiền hiển thị đến từ server (quote/order).
- Mọi chuỗi UI qua i18n (vi/en); thêm khóa mới vào cả hai file.
- "Thành công" chỉ hiện khi server trả 2xx.

## Việc cần làm (theo thứ tự)

| # | Ai | Việc |
| --- | --- | --- |
| 5.0 | AGENT | **Kiểm kê:** CodeGraph trước để tìm services/hooks; sau đó `rg -n -e "₱" -e "PHP" -e "Asia/Manila" -e "toLocaleString" -e "name_vn" src`. Liệt kê fixture từng flow vào `docs/pipeline/FE_AUDIT.md` (tạo ở Phase 5) |
| 5.1 | NGƯỜI | Quyết định ngôn ngữ mặc định: TECH_STACK hiện ghi mặc định/fallback **English**; thị trường VN nên mặc định **Việt** (đổi ở `src/shared/i18n/language.ts`). Mặc định đề xuất: `vi` |
| 5.2 | AGENT | `src/shared/api/client.ts`: wrapper `fetch` (`/api`, `credentials: 'same-origin'`), đọc envelope `{data}`/`{error}`, ném `ApiError(code, message, details, status)`; helper tạo `Idempotency-Key` bằng `crypto.randomUUID()` |
| 5.3 | AGENT | Bổ sung `formatVND(n, locale)` vào `src/shared/lib/format.ts` hiện có bằng `Intl.NumberFormat` (`vi-VN` / `en-US`, `currency: 'VND'`, `maximumFractionDigits: 0`). Thay định dạng tiền ở luồng MVP; ngày giao theo locale, múi giờ `Asia/Ho_Chi_Minh` |
| 5.4 | AGENT | **Shop:** `shop.service.ts` gọi `/api/categories`, `/api/products`; cập nhật `normalizeProduct` cho DTO mới (giá hiển thị "từ" = giá variant thấp nhất; ảnh = ảnh chính; `tag` ← `badge_code`; chọn size = chọn `variant_id`; hết hàng → vô hiệu hóa nút). **Ẩn rating/reviews** cho tới khi có bảng review. Bộ lọc/tìm kiếm hiện có giữ nguyên (dữ liệu ≤ 100 sản phẩm) |
| 5.5 | AGENT | **Giỏ hàng:** dòng hàng khóa theo `variant_id`; lưu `localStorage` khóa `lunara.cart.v1` dạng `{ version: 1, lines: [{variantId, quantity}] }` + kiểm tra bằng Zod khi đọc (sai/cũ → bỏ qua). Giới hạn 15 dòng, 20 sản phẩm/dòng, không vượt `max_quantity`. Khi mở giỏ/checkout gọi `/api/checkout/quote` để làm mới giá, tên, ảnh và hiện `issues` |
| 5.6 | AGENT | **Checkout:** dựng form từ `/api/delivery/options`: người gửi (tên, SĐT, email tùy chọn, ẩn danh), người nhận (tên, SĐT, **tỉnh/thành → phường/xã** từ danh sách khu vực, số nhà/đường), phương thức giao, ngày, khung giờ, loại thiệp + lời chúc, ghi chú. Hiện phí giao + tổng từ quote. Thanh toán: chỉ hiển thị "Thanh toán khi nhận hàng (COD)". **Gỡ ô coupon và UI thẻ/ví** |
| 5.7 | AGENT | **Gửi đơn:** giữ một `Idempotency-Key` cho mỗi "ý định đặt hàng" (tạo khi vào bước xác nhận; dùng lại khi retry cùng nội dung; tạo mới khi nội dung đổi). Chặn bấm đúp (disable + trạng thái đang gửi). 201/200 → xóa giỏ → trang xác nhận với `order_number`. `OUT_OF_STOCK` → báo từng món, làm mới giỏ. `NO_DELIVERY_ZONE`, `INVALID_DELIVERY_SLOT`, lỗi mạng → thông báo rõ, **giữ nguyên giỏ và dữ liệu form** |
| 5.8 | AGENT | **Tra đơn (khách vãng lai):** trang `/orders/track` (mã đơn + SĐT) → hiện đơn, danh sách món, timeline từ `/api/orders/lookup`. Thêm liên kết ở footer/trang xác nhận. Ẩn "My Orders/Profile/Wishlist" theo cờ `VITE_ENABLE_CUSTOMER_AUTH` (mặc định `false`); **không xóa code** |
| 5.9 | AGENT | **Auth admin:** `AuthProvider` dùng `/api/admin/me` khi khởi động, form đăng nhập gọi `/api/admin/login`, nút đăng xuất gọi `/api/admin/logout`; route guard cho `/admin/*`. Bỏ session demo trong `sessionStorage` cho admin. Ẩn đăng ký/đăng nhập khách theo cờ trên |
| 5.10 | AGENT | **Admin đơn hàng:** danh sách (lọc trạng thái/ngày/tìm kiếm), chi tiết (món, người gửi/nhận, địa chỉ, giờ giao, thiệp, ghi chú, timeline), nút chuyển trạng thái **chỉ hiện bước hợp lệ tiếp theo + Hủy**, xác nhận trước khi hủy, hiển thị lỗi `INVALID_TRANSITION` |
| 5.11 | AGENT | **Admin sản phẩm/tồn kho:** bảng sản phẩm × variant (giá, giá gốc, tồn, ngưỡng, bật/tắt), sửa nhanh giá và `stock_delta` (+/−/nhập số), cảnh báo tồn thấp; form tạo sản phẩm tối thiểu (tên vi/en, danh mục, 3 variant, URL ảnh). Trang **phí giao**: bảng `delivery_zones` thêm/sửa/tắt |
| 5.12 | AGENT | **Admin dashboard:** dùng `/api/admin/summary` (đơn theo trạng thái, đơn hôm nay, tồn thấp) + 10 đơn mới nhất. **Gỡ/ẩn biểu đồ & KPI lấy từ fixture**; ẩn trang Customers, Custom Requests, Settings, Notifications cho tới khi có dữ liệu thật |
| 5.13 | AGENT | Gỡ import tới các fixture không còn dùng ở luồng MVP; fixture của tính năng bị ẩn có thể giữ, nhưng không được hiển thị ở UI MVP |
| 5.14 | AGENT | i18n: bổ sung toàn bộ khóa mới (form giao hàng, lỗi theo `code`, trạng thái đơn, admin) vào `vi` và `en`; ánh xạ `error.code` → thông điệp i18n (không hiển thị `message` thô trừ khi thiếu khóa) |
| 5.15 | AGENT | Trạng thái chờ/rỗng/lỗi cho mọi màn gọi API (skeleton hoặc spinner, thông báo thử lại). Xử lý API không phản hồi |
| 5.16 | AGENT | Test: unit cho adapter, `formatVND`, cart storage (đọc dữ liệu hỏng), ánh xạ lỗi; chạy `npm run smoke` vẫn pass; chạy kịch bản thủ công dưới đây |

## Kịch bản thủ công (ghi kết quả vào PR)

1. Mở trang chủ → shop: 8 sản phẩm, giá dạng `450.000 ₫`; đổi vi/en vẫn hiển thị VND.
2. Chọn size M, thêm giỏ, tải lại trang → giỏ còn nguyên; sửa `localStorage` thành giá trị hỏng → app không vỡ, giỏ rỗng.
3. Checkout với phường có phí riêng và phường chỉ có mặc định tỉnh → phí đúng; chọn tỉnh ngoài danh sách → không đặt được (hoặc báo rõ).
4. Bấm "Đặt hàng" hai lần liên tiếp nhanh → chỉ có một đơn.
5. Tắt mạng/giả lỗi 500 → giỏ và form vẫn còn, có thể bấm thử lại; thử lại cùng nội dung không tạo đơn thứ hai.
6. Đặt đơn thành công → trang xác nhận có mã đơn; tra đơn bằng mã + SĐT thấy đúng món/tổng/timeline; sai SĐT → "không tìm thấy".
7. Đăng nhập admin sai mật khẩu → thông báo lỗi; đúng → vào được; đóng/mở tab vẫn đăng nhập; đăng xuất → bị chặn.
8. Admin: đi hết các trạng thái; sau `DELIVERED` thấy `PAID`; hủy đơn khác → tồn tăng lại ở trang sản phẩm.
9. Admin hạ tồn một size xuống 0 → trang shop hiện hết hàng và không thêm được vào giỏ.
10. `rg -n -e "₱" -e "Asia/Manila" src` không còn kết quả trong code thuộc luồng MVP; fixture/code của tính năng ẩn có thể giữ nguyên.

## Tiêu chí nghiệm thu

- [ ] 10 kịch bản thủ công pass (có ghi lại).
- [ ] Không còn `₱`, `PHP`, `Asia/Manila` trong luồng MVP; mọi số tiền dùng `formatVND`.
- [ ] Không có dữ liệu fixture hiển thị ở shop, giỏ, checkout, tra đơn, admin đơn/sản phẩm/phí giao/dashboard.
- [ ] Không có `fetch` trực tiếp trong component; mọi lỗi API có thông điệp i18n.
- [ ] `npm run typecheck`, `npm run check:architecture`, `npm test`, `npm run build` pass.
- [ ] Các tính năng ẩn (khách đăng nhập, wishlist, profile, custom request, settings) không để lại liên kết chết trong menu.

## Goal prompt (dán vào `/goal`)

```text
Đọc docs/pipeline/README.md, API_CONTRACT.md, docs/FRONTEND_ENTITIES.md và PHASE_5_FRONTEND.md rồi thực hiện Phase 5 theo đúng thứ tự 5.0 → 5.16.
Bắt đầu bằng kiểm kê (FE_AUDIT.md). Nối Shop, Giỏ hàng, Checkout COD, Tra đơn, Admin (đăng nhập, đơn, sản phẩm/tồn, phí giao, dashboard tóm tắt) với API thật; chuyển toàn bộ hiển thị tiền sang VND.
Ràng buộc: không đổi phiên bản gói đã pin; không tin giá/tồn từ client; không xóa code của tính năng chưa làm (ẩn bằng cờ); mọi chuỗi UI có vi và en; không gọi fetch trực tiếp trong component.
Dừng hỏi tôi ([NGƯỜI]) ở bước 5.1 nếu chưa rõ ngôn ngữ mặc định. Xong khi mọi "Tiêu chí nghiệm thu" Phase 5 pass, kèm kết quả 10 kịch bản thủ công.
```
