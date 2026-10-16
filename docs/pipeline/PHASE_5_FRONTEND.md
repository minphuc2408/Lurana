# Phase 5 — Nối frontend với API thật

> Rà soát 16/10/2026: [hiện trạng chuẩn](../PROJECT_STATUS.md), [contract hiện tại](API_CONTRACT.md). Phase 0–5 DONE local, Phase 6 IN PROGRESS5/7. Local170 tests/215 source files/40 smoke; staging đã deploy bản mới13:31 ngày 16/10, production vẫn bản 15/10. Output/checklist ghi ngày cũ bên dưới là lịch sử, không phải trạng thái cloud hiện tại.


B2/B3 sau nghiệm thu (15/10/2026, local/chưa deploy): widget Turnstile cho checkout/lookup/login, lỗi/hết hạn/thử lại/EN/VI và compact ở form hẹp; retry token mới giữ UUID đơn. Admin hủy giao thất bại có lý do và checkbox restock mặc định false. Tại mốc B2/B3:160 tests và40 smoke PASS; UI 10/10 MVP + CRUD/B3 + widget targeted PASS, nhóm responsive rộng còn báo `/shop` tràn 320px. Không thay bằng chứng lịch sử 136 tests/2 nhóm mở rộng bên dưới. Phase 6 hiện IN PROGRESS 5/7. [Evidence/cấu hình mới](../BOT_PROTECTION.md).

**Mục tiêu:** các luồng MVP trong frontend dùng API thật, hiển thị VND, không còn fixture/₱ ở luồng MVP. Tham chiếu: [API_CONTRACT.md](API_CONTRACT.md), [FRONTEND_ENTITIES.md](../FRONTEND_ENTITIES.md). Phase này lớn nhất; làm theo thứ tự dưới đây để luôn có bản chạy được.

**Trạng thái:** DONE local · **6/6 tiêu chí**, 15/10/2026. Đã hoàn thiện theo thứ tự 5.0 → 5.16: giữ catalog/variant cart/localStorage/delivery/quote/VND, nối Checkout COD, gửi/retry/xác nhận, tra đơn và admin thật từ API Phase 3–4. English mặc định/fallback và giờ Việt Nam giữ nguyên. Nghiệm thu **136/136 tests, 40/40 smoke, 10/10 kịch bản UI + 2/2 nhóm mở rộng**, không có JS exception. Nghiệm thu trên là mốc local 15/10; Phase 6 hiện IN PROGRESS5/7, snapshot deployment riêng ở PROJECT_STATUS. [Backup/audit/evidence](FE_AUDIT.md) · [Hiện trạng](../PROJECT_STATUS.md).

## Tiến độ từng phần sau nghiệm thu Phase 5

| Bước | Đã có / còn lại |
| --- | --- |
| 5.0 | DONE: cập nhật FE_AUDIT trước khi sửa; giữ backup demo local và source deferred |
| 5.1 | DONE: English mặc định/fallback; EN/VI không đổi VND/Asia/Ho_Chi_Minh hoặc dữ liệu khách |
| 5.2 | DONE: dùng lại apiRequest/ApiError, timeout 20 giây, mapping lỗi; crypto.randomUUID cho intent, cùng payload dùng lại key khi retry |
| 5.3–5.5 | DONE: giữ catalog adapter/provider, variant cart/storage; dùng chung formatter VND và ngày giờ VN, kiểm storage hỏng và giới hạn giỏ |
| 5.6 | DONE: sender/recipient, tỉnh/phường/đường, method/date/slot/card/note, ẩn danh và email tùy chọn; chỉ COD, tổng từ quote |
| 5.7–5.8 | DONE: details → review → server confirmation, chặn bấm đúp; giữ form/giỏ khi lỗi, đổi payload tạo key mới. `/orders/track` đọc API snapshot/timeline, có link footer/xác nhận |
| 5.9 | DONE: AuthProvider /me/login/logout bằng cookie; `/admin/login`, guard `/admin/*`, không session demo |
| 5.10 | DONE: filters/paging/detail/note/timeline, đúng transitions, dialog xác nhận hủy và thông báo INVALID_TRANSITION |
| 5.11 | DONE: product×variant, dirty-field price/compare/threshold/active và stock_delta; tạo S/M/L + URL ảnh; phí giao thêm/sửa/tắt. Ghi tồn chưa rõ kết quả khóa gửi lại đến khi GET đối chiếu thành công |
| 5.12 | DONE: dashboard từ summary + 10 đơn mới nhất; không chart/KPI fixture |
| 5.13–5.16 | DONE: deferred source ẩn theo cờ/API readiness; EN/VI, loading/empty/error/retry; required checks và toàn bộ kịch bản bên dưới pass |

> Tài liệu này mô tả theo cấu trúc `src/features/*` trong [FRONTEND_ENTITIES.md](../FRONTEND_ENTITIES.md). Tên file thực tế có thể khác: bước 5.0 là kiểm kê trước khi sửa.

## Nguyên tắc

- Mỗi feature có service gọi API + adapter chuyển DTO → model UI. Component không gọi `fetch` trực tiếp.
- Giữ API công khai giữa các feature (import qua `index.ts`), không nhập chéo vào nội bộ feature khác.
- Frontend không quyết định giá, tồn, phí, quyền. Mọi số tiền hiển thị đến từ server (quote/order).
- Mọi chuỗi UI qua i18n (vi/en); thêm khóa mới vào cả hai file.
- "Thành công" chỉ hiện khi server trả 2xx.

## Nội dung đã thực hiện (theo thứ tự)

| # | Ai | Việc |
| --- | --- | --- |
| 5.0 | AGENT — DONE | **Cập nhật kiểm kê đã có:** CodeGraph trước để tìm services/hooks; sau đó `rg -n -e "₱" -e "PHP" -e "Asia/Manila" -e "toLocaleString" -e "name_vn" src`. Cập nhật `docs/pipeline/FE_AUDIT.md` cho các flow còn lại; giữ backup demo local |
| 5.1 | ĐÃ CHỐT | Giữ **English** mặc định/fallback và EN/VI theo chỉ dẫn chủ dự án; VND/Asia/Ho_Chi_Minh không đổi theo locale. Không hỏi lại hoặc tự đổi thành `vi` |
| 5.2 | AGENT — DONE | Dùng `src/shared/api/client.ts` đã có: apiRequest `/api`, credentials same-origin, đọc `{data}`/`{error}`, `ApiError(code, message, status, details)`. Bổ sung helper/lifecycle `Idempotency-Key` bằng crypto.randomUUID cho gửi đơn, không tạo wrapper thứ hai |
| 5.3 | AGENT — DONE | Dùng formatter VND hiện có trong `src/shared/lib/format.ts` cho phần checkout/admin còn lại, tránh thêm helper trùng chức năng. Preview đã format EN/VI với currency VND không có số lẻ; ngày giao giữ Asia/Ho_Chi_Minh |
| 5.4 | AGENT — DONE (giữ preview) | **Shop:** giữ Shop service/CatalogProvider và adapter DTO D1 hiện có: giá variant thấp nhất, ảnh chính, badge, chọn variant_id, disable hết hàng, ratings/reviews ẩn. Giữ filter/search/category code/sort (≤100 products); không tạo lại fixture hoặc adapter song song |
| 5.5 | AGENT — DONE (giữ preview) | **Giỏ hàng:** giữ variant identity và localStorage lunara.cart.v1 `{ version: 1, lines: [{variantId, quantity}] }`, validate Zod, giới hạn 15/20 và max_quantity; catalog hydrate/quote làm mới giá/tổng/phí. Khi nối checkout, dùng cùng CartProvider/quote/issues thay vì tạo giỏ riêng |
| 5.6 | AGENT — DONE | **Checkout:** dựng form từ `/api/delivery/options`: người gửi (tên, SĐT, email tùy chọn, ẩn danh), người nhận (tên, SĐT, **tỉnh/thành → phường/xã** từ danh sách khu vực, số nhà/đường), phương thức giao, ngày, khung giờ, loại thiệp + lời chúc, ghi chú. Hiện phí giao + tổng từ quote. Thanh toán: chỉ hiển thị "Thanh toán khi nhận hàng (COD)". **Gỡ ô coupon và UI thẻ/ví** |
| 5.7 | AGENT — DONE | **Gửi đơn:** giữ một `Idempotency-Key` cho mỗi "ý định đặt hàng" (tạo khi vào bước xác nhận; dùng lại khi retry cùng nội dung; tạo mới khi nội dung đổi). Chặn bấm đúp (disable + trạng thái đang gửi). 201/200 → xóa giỏ → trang xác nhận với `order_number`. `OUT_OF_STOCK` → báo từng món, làm mới giỏ. `NO_DELIVERY_ZONE`, `INVALID_DELIVERY_SLOT`, lỗi mạng → thông báo rõ, **giữ nguyên giỏ và dữ liệu form** |
| 5.8 | AGENT — DONE | **Tra đơn (khách vãng lai):** trang `/orders/track` (mã đơn + SĐT) → hiện đơn, danh sách món, timeline từ `/api/orders/lookup`. Thêm liên kết ở footer/trang xác nhận. Ẩn "My Orders/Profile/Wishlist" theo cờ `VITE_ENABLE_CUSTOMER_AUTH` (mặc định `false`); **không xóa code** |
| 5.9 | AGENT — DONE | **Auth admin:** `AuthProvider` dùng `/api/admin/me` khi khởi động, form đăng nhập gọi `/api/admin/login`, nút đăng xuất gọi `/api/admin/logout`; route guard cho `/admin/*`. Bỏ session demo trong `sessionStorage` cho admin. Ẩn đăng ký/đăng nhập khách theo cờ trên |
| 5.10 | AGENT — DONE | **Admin đơn hàng:** danh sách (lọc trạng thái/ngày/tìm kiếm), chi tiết (món, người gửi/nhận, địa chỉ, giờ giao, thiệp, ghi chú, timeline), nút chuyển trạng thái **chỉ hiện bước hợp lệ tiếp theo + Hủy**, xác nhận trước khi hủy, hiển thị lỗi `INVALID_TRANSITION` |
| 5.11 | AGENT — DONE | **Admin sản phẩm/tồn kho:** bảng sản phẩm × variant (giá, giá gốc, tồn, ngưỡng, bật/tắt), sửa nhanh giá và `stock_delta` (+/−/nhập số), cảnh báo tồn thấp; form tạo sản phẩm tối thiểu (tên vi/en, danh mục, 3 variant, URL ảnh). Trang **phí giao**: bảng `delivery_zones` thêm/sửa/tắt |
| 5.12 | AGENT — DONE | **Admin dashboard:** dùng `/api/admin/summary` (đơn theo trạng thái, đơn hôm nay, tồn thấp) + 10 đơn mới nhất. **Gỡ/ẩn biểu đồ & KPI lấy từ fixture**; ẩn trang Customers, Custom Requests, Settings, Notifications cho tới khi có dữ liệu thật |
| 5.13 | AGENT — DONE | Gỡ import tới các fixture không còn dùng ở luồng MVP; fixture của tính năng bị ẩn có thể giữ, nhưng không được hiển thị ở UI MVP |
| 5.14 | AGENT — DONE | i18n: bổ sung toàn bộ khóa mới (form giao hàng, lỗi theo `code`, trạng thái đơn, admin) vào `vi` và `en`; ánh xạ `error.code` → thông điệp i18n (không hiển thị `message` thô trừ khi thiếu khóa) |
| 5.15 | AGENT — DONE | Trạng thái chờ/rỗng/lỗi cho mọi màn gọi API (skeleton hoặc spinner, thông báo thử lại). Xử lý API không phản hồi |
| 5.16 | AGENT — DONE | Test: unit cho adapter, `formatVND`, cart storage (đọc dữ liệu hỏng), ánh xạ lỗi; chạy `npm run smoke` vẫn pass; chạy kịch bản thủ công dưới đây |

## Kịch bản thủ công (checklist nghiệm thu)

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

- [x] 10 kịch bản thủ công pass (thực thi thao tác bằng Edge/CDP, kết quả ghi bên dưới).
- [x] Không còn `₱`, `PHP`, `Asia/Manila` trong luồng MVP; mọi số tiền dùng helper VND dùng chung trong `src/shared/lib/format.ts`.
- [x] Không có dữ liệu fixture hiển thị ở shop, giỏ, checkout, tra đơn, admin đơn/sản phẩm/phí giao/dashboard.
- [x] Không có `fetch` trực tiếp trong component; mọi lỗi API có thông điệp i18n.
- [x] `npm run typecheck`, `npm run check:architecture`, `npm test`, `npm run build` pass.
- [x] Các tính năng ẩn (khách đăng nhập, wishlist, profile, custom request, settings) không để lại liên kết chết trong menu.

## Kết quả 10 kịch bản — 15/10/2026

Checklist thủ công ở trên được thực thi bằng thao tác trình duyệt Edge headless/CDP trên frontend đã build, Worker source hiện tại và D1 workerd cô lập. Đây là kiểm chứng UI local, không phải một lượt người kiểm thử thủ công hoặc nghiệm thu remote.

| # | Kết quả | Bằng chứng |
| --- | --- | --- |
| 1 | PASS | Home → Shop có 8 sản phẩm/24 variants; EN mặc định, chuyển VI/EN vẫn VND, VI có `450.000 ₫` |
| 2 | PASS | Chọn M, reload giữ variant ID/số lượng; storage hỏng → giỏ rỗng, app không vỡ |
| 3 | PASS | Hoàn Kiếm phí 20.000; phường chưa có dòng riêng áp mặc định Hà Nội 35.000; không chọn được tỉnh ngoài delivery options |
| 4 | PASS | Hai lần click nhanh → đúng một đơn D1 và đúng một lần giảm tồn |
| 5 | PASS | 500 trước ghi và mất phản hồi sau commit đều giữ giỏ/form; retry cùng UUID/body không sinh đơn thứ hai; đổi nội dung tạo key mới |
| 6 | PASS | Confirmation có mã đơn/tổng từ server; lookup đúng món/tổng/timeline; sai SĐT hợp lệ → NOT_FOUND và ẩn kết quả cũ |
| 7 | PASS | Sai mật khẩu báo lỗi; đúng vào admin; cookie HttpOnly giữ phiên qua tab mới/reload; logout và hết cookie bị guard chặn |
| 8 | PASS | PENDING → CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED/PAID; hủy đơn khác hoàn tồn một lần, terminal không có action sai |
| 9 | PASS | Admin nhập delta hạ size M về 0; Shop chọn đúng variant hiển thị hết hàng và disable Add |
| 10 | PASS | Scan 74 file runtime active không có tiền/múi giờ legacy; 40 hits của toàn src thuộc code/JSON deferred được ghi riêng; menu không có liên kết feature ẩn |

**Hai nhóm mở rộng PASS:** tạo sản phẩm đủ S/M/L, sửa giá/ngưỡng/active, phí giao thêm/sửa/tắt, dashboard đối chiếu số D1 và bộ lọc đơn; lỗi/chờ/retry EN/VI cùng responsive 320/390/768/1024. PATCH tồn đã commit nhưng mất phản hồi + GET lỗi: chỉ áp delta một lần, khóa Save, GET Recheck thành công reset delta, Save không đổi không gửi thêm PATCH. Chuyển locale giữ thông tin khách.

```text
npm run typecheck                         PASS
npm run check:architecture                PASS — 207 source files
npm test                                 PASS — 136/136, 0 fail
npm run build                            PASS — dist/client + dist/lunara
npm run smoke -- http://127.0.0.1:4175      PASS — 40/40, persisted seed untouched
npm run check:ui -- http://127.0.0.1:4175   PASS — 17 routes, 0 exceptions
npm run check:ui:phase5                    PASS — 10/10 + 2/2, 0 exceptions
```

Evidence local/ignored: `.security-review/phase5-ui-results.json` (07:34:46Z / 14:34 VN), `phase5-*.png`, `phase5-tests.txt`, `phase5-build.txt`, `phase5-smoke.txt`, `phase5-preview-ui.txt`. Guard đọc SQL readonly xác nhận nội dung schema/bảng D1 persisted không đổi; không so byte WAL/cache/observability có thể đổi do runtime. Mọi ghi UI/API dùng `persist:false`, `remoteBindings:false`, `.dev.vars.example` và secret tổng hợp; không đọc secret thật cho tests. Bridge Node dùng shim timingSafeEqual; bằng chứng auth native workerd Phase 4 được giữ riêng. Không đổi pin/dependency/lockfile/DDL, không deploy hoặc đổi D1 remote; Turnstile thật, dữ liệu/policy bán hàng và CPU cloud thuộc Phase 6.

M1–M9 local 15/10/2026: locale chọn preference rồi browser EN/VI (English fallback); metadata theo route, public HTML SEO, staging noindex, CSP và Zod jitless. UI 10/10 MVP +CRUD/B3/mock widget PASS dưới CSP mới; không chạy lại nhóm responsive rộng. Native preview SDK thật bằng test key nhận token, fonts/images tải thành công,0CSP/JS errors. [Bằng chứng hiện tại](../HARDENING.md); không thay nghiệm thu cloud.
