# Phase 5 — Nối frontend với API thật

**Mục tiêu:** các luồng MVP trong frontend dùng API thật, hiển thị VND, không còn fixture/₱ ở luồng MVP. Tham chiếu: [API_CONTRACT.md](API_CONTRACT.md), [FRONTEND_ENTITIES.md](../FRONTEND_ENTITIES.md). Phase này lớn nhất; làm theo thứ tự dưới đây để luôn có bản chạy được.

**Trạng thái:** PARTIAL · bản preview nối sớm Home/Shop/Cart/Delivery/Quote D1/VND và variant cart localStorage đã có; giữ English default/fallback. Hiện API COD/lookup và transition service Phase 3 đã DONE local, nhưng UI gửi/tra đơn chưa nối; API auth/admin Phase 4 chưa có. Features ngoài preview vẫn ẩn. [Backup/audit/evidence](FE_AUDIT.md) · [Hiện trạng](../PROJECT_STATUS.md). Toàn Phase 5 chưa nghiệm thu.

## Tiến độ từng phần sau Phase 3

| Bước | Đã có / còn lại |
| --- | --- |
| 5.0 | Audit/backup preview đã có; khi nối phần còn lại cập nhật FE_AUDIT thay vì tạo lại hoặc phục hồi fixtures |
| 5.1 | Đã chốt English mặc định/fallback; không đổi locale mặc định hay currency/timezone theo locale |
| 5.2 | apiRequest/ApiError và error-key mapping đã có; helper/lifecycle Idempotency-Key cho gửi đơn chưa có |
| 5.3–5.5 | Catalog adapter/provider, variant cart/localStorage và VND formatter đã có ở Home/Shop/Cart; còn kiểm khi mở rộng checkout/admin |
| 5.6 | Delivery options/quote/khu vực/method đã nối; form sender/recipient/date/slot/card/note COD chưa nối |
| 5.7–5.8 | API create/lookup Phase 3 sẵn sàng; UI gửi/retry/xác nhận/tra đơn chưa có, `/orders/track` chưa active |
| 5.9–5.12 | Chưa làm; phải có API auth/admin Phase 4 trước khi nối UI quản trị |
| 5.13–5.16 | Preview đã ẩn fixture, có EN/VI, loading/error/retry, tests/UI evidence; checkout/lookup/admin và đủ 10 kịch bản Phase 5 chưa nghiệm thu |

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
| 5.0 | AGENT | **Cập nhật kiểm kê đã có:** CodeGraph trước để tìm services/hooks; sau đó `rg -n -e "₱" -e "PHP" -e "Asia/Manila" -e "toLocaleString" -e "name_vn" src`. Cập nhật `docs/pipeline/FE_AUDIT.md` cho các flow còn lại; giữ backup demo local |
| 5.1 | ĐÃ CHỐT | Giữ **English** mặc định/fallback và EN/VI theo chỉ dẫn chủ dự án; VND/Asia/Ho_Chi_Minh không đổi theo locale. Không hỏi lại hoặc tự đổi thành `vi` |
| 5.2 | AGENT — PARTIAL | Dùng `src/shared/api/client.ts` đã có: apiRequest `/api`, credentials same-origin, đọc `{data}`/`{error}`, `ApiError(code, message, status, details)`. Bổ sung helper/lifecycle `Idempotency-Key` bằng crypto.randomUUID cho gửi đơn, không tạo wrapper thứ hai |
| 5.3 | AGENT — PARTIAL | Dùng formatter VND hiện có trong `src/shared/lib/format.ts` cho phần checkout/admin còn lại, tránh thêm helper trùng chức năng. Preview đã format EN/VI với currency VND không có số lẻ; ngày giao giữ Asia/Ho_Chi_Minh |
| 5.4 | AGENT — ĐÃ CÓ PREVIEW | **Shop:** giữ Shop service/CatalogProvider và adapter DTO D1 hiện có: giá variant thấp nhất, ảnh chính, badge, chọn variant_id, disable hết hàng, ratings/reviews ẩn. Giữ filter/search/category code/sort (≤100 products); không tạo lại fixture hoặc adapter song song |
| 5.5 | AGENT — ĐÃ CÓ PREVIEW | **Giỏ hàng:** giữ variant identity và localStorage lunara.cart.v1 `{ version: 1, lines: [{variantId, quantity}] }`, validate Zod, giới hạn 15/20 và max_quantity; catalog hydrate/quote làm mới giá/tổng/phí. Khi nối checkout, dùng cùng CartProvider/quote/issues thay vì tạo giỏ riêng |
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
- [ ] Không còn `₱`, `PHP`, `Asia/Manila` trong luồng MVP; mọi số tiền dùng helper VND dùng chung trong `src/shared/lib/format.ts`.
- [ ] Không có dữ liệu fixture hiển thị ở shop, giỏ, checkout, tra đơn, admin đơn/sản phẩm/phí giao/dashboard.
- [ ] Không có `fetch` trực tiếp trong component; mọi lỗi API có thông điệp i18n.
- [ ] `npm run typecheck`, `npm run check:architecture`, `npm test`, `npm run build` pass.
- [ ] Các tính năng ẩn (khách đăng nhập, wishlist, profile, custom request, settings) không để lại liên kết chết trong menu.

## Goal prompt (dán vào `/goal`)

```text
Đọc docs/pipeline/README.md, API_CONTRACT.md, docs/FRONTEND_ENTITIES.md và PHASE_5_FRONTEND.md rồi thực hiện Phase 5 theo đúng thứ tự 5.0 → 5.16.
Bắt đầu bằng cập nhật FE_AUDIT và đọc bảng tiến độ từng phần. Giữ catalog/variant cart/localStorage/delivery/quote/VND đã có. Nối phần còn lại: Checkout COD, gửi/retry/xác nhận đơn, Tra đơn từ API Phase 3, Admin (đăng nhập, đơn, sản phẩm/tồn, phí giao, dashboard tóm tắt) sau khi API Phase 4 hoàn tất.
Ràng buộc: không đổi phiên bản gói đã pin; không tin giá/tồn từ client; không xóa code của tính năng chưa làm (ẩn bằng cờ); mọi chuỗi UI có vi và en; không gọi fetch trực tiếp trong component.
English mặc định/fallback đã chốt, không hỏi lại hoặc đổi sang vi; locale không đổi VND/giờ VN. Xong khi mọi "Tiêu chí nghiệm thu" Phase 5 pass, kèm kết quả 10 kịch bản thủ công. Không tự đánh dấu toàn Phase 5 xong từ nghiệm thu preview hoặc backend Phase 3.
```
