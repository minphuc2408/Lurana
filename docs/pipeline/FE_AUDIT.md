# Frontend Phase 5 — audit 15/10/2026

> Tra cứu đơn local17/10: OrderDetail/API DTO không đổi; OrderLookupResult tách giao diện public khỏi admin, tiến trình5mốc và nhánh hủy theo lịch sử thực. Mã đơn + điện thoại + Turnstile vẫn bắt buộc; PII chỉ memory. Browser72ca dùng API/challenge giả lập, không dữ liệu khách/ghi đơn. Xem [trạng thái](../PROJECT_STATUS.md).


> UI local17/10: /cart → /checkout → review → API confirmation; context memory-only giữ draft khi sửa giỏ, không PII storage. Phí ẩn trước chọn địa chỉ; COD/thiệp chung/API contract giữ nguyên. Browser18nhóm có mock order intercept, không thay acceptance backend/remote/Phase6(5/7). Xem [Checkout UI](../CHECKOUT_UI.md) và [trạng thái](../PROJECT_STATUS.md).


> Rà soát 16/10/2026: [hiện trạng chuẩn](../PROJECT_STATUS.md), [contract hiện tại](API_CONTRACT.md). Phase 0–5 DONE local, Phase 6 IN PROGRESS5/7. Local170 tests/215 source files/40 smoke; staging đã deploy bản mới13:31 ngày 16/10, production vẫn bản 15/10. Output/checklist ghi ngày cũ bên dưới là lịch sử, không phải trạng thái cloud hiện tại.


B2/B3 sau mốc nghiệm thu (15/10/2026, local/chưa deploy): checkout/lookup/login dùng shared Turnstile; token chỉ ở memory, ngoài fingerprint/UUID và được lấy mới mỗi lần gửi/thử lại. Không thêm PII/credentials vào storage. Hộp hủy IN_TRANSIT yêu cầu lý do, mặc định không hoàn tồn; lỗi/thử lại hiển thị ngay trong dialog. [Cấu hình và evidence hiện tại](../BOT_PROTECTION.md); các output Phase 5 dưới đây là lịch sử.

## Kiểm kê 5.0 trước khi nối phần còn lại

Đã đọc bảng tiến độ 5.0–5.16, API_CONTRACT, FRONTEND_ENTITIES và project guide trước khi sửa. Bảng dưới ghi kiểm kê lúc bắt đầu; kết quả nghiệm thu cuối ở phần kế tiếp. Giữ backup preview bên dưới, không phục hồi fixture.

| Phần | Quyết định triển khai / khoảng trống |
| --- | --- |
| 5.1–5.5 | Giữ English default/fallback, VND/Asia/Ho_Chi_Minh, apiRequest/ApiError, catalog adapter/provider, variant cart/localStorage và quote. Bổ sung lifecycle UUID cho ý định đặt đơn, dùng lại key khi retry cùng nội dung |
| 5.6–5.8 | Nối sender/recipient, tỉnh/phường, ngày/slot, thiệp/note, COD; gửi/retry/xác nhận và lookup API Phase 3. Không dùng coupon/thẻ/ví/demo reference |
| 5.9–5.12 | Backend Phase 4 đã DONE local: nối cookie /me/login/logout, guard, orders/detail/status/note, products/variant stock_delta, delivery-zones và summary/10 đơn mới nhất |
| 5.13–5.16 | Giữ source tính năng deferred nhưng ẩn menu/routes, bổ sung EN/VI và trạng thái chờ/lỗi/rỗng/retry. Chỉ nghiệm thu sau checks và đủ 10 kịch bản UI |

CodeGraph đã khảo sát router/providers/cart/auth và dependency. Quét `rg -n -e "₱" -e "PHP" -e "Asia/Manila" -e "toLocaleString" -e "name_vn" src`: PHP/₱/Asia/Manila ở source legacy inventory/orders/admin/profile/custom-order và JSON legacy; các màn MVP mới phải dùng formatter VND và API. `name_vn` là alias tương thích được giữ. Component không gọi fetch trực tiếp; service đi qua client hiện hữu. Không đổi package pin/DDL, không dùng secret thật hoặc D1 remote cho kiểm thử.

## Kết quả Phase 5 — DONE local, 15/10/2026

Đã thực hiện 5.0 → 5.16, đủ **6/6 tiêu chí** trong [PHASE_5_FRONTEND](PHASE_5_FRONTEND.md). Đây là nghiệm thu toàn UI local sau backend Phase 3–4; không suy ra từ preview cũ hoặc coi là remote acceptance. Phase 6 hiện IN PROGRESS5/7; xem PROJECT_STATUS.

| Luồng hiện tại | Nguồn/hành vi đã kiểm |
| --- | --- |
| Catalog/cart/delivery/quote | Giữ provider/adapter D1, variant identity, `lunara.cart.v1` chỉ ID/số lượng, Zod và quote server; không fixture fallback |
| Checkout `/cart` | Sender/recipient/tỉnh/phường/đường, method/date/slot/card/note, COD; details → review → response server rồi confirmation/xóa giỏ |
| Intent/retry | UUID v4 tạo khi review, payload không đổi giữ key kể cả mất response sau commit; payload đổi tạo key mới; ref khóa bấm đúp; lỗi giữ giỏ/form |
| Lookup `/orders/track` | Mã + SĐT trong POST body; snapshots/totals/timeline API; abort/version guard khi đổi input; không để kết quả cũ khi tra sai |
| Auth/admin | AuthProvider `/me/login/logout`, cookie thật, guard `/admin/*`; login ở `/admin/login`; không đọc session demo |
| Orders | Bộ lọc/status/date/search/paging, detail/internal note, đúng transitions, dialog hủy; PAID/hoàn tồn từ server |
| Products/stock | Product×variant giá/compare/tồn/ngưỡng/active, tạo S/M/L + URL ảnh, chỉ dirty fields và atomic stock_delta; ghi chưa rõ kết quả reset delta/khóa gửi lại đến GET Recheck thành công |
| Fees/dashboard | Phí giao thêm/sửa/tắt; summary API + 10 đơn mới nhất; không chart/KPI fixture |
| Locale/deferred | EN mặc định/fallback, VI đầy đủ; VND/giờ VN và dữ liệu khách không đổi theo locale. Customer auth/profile/wishlist/request/settings/customers/notifications giữ source và ẩn bằng cờ/API readiness |

Required checks: **typecheck PASS; architecture 207 files PASS; tests 136/136; build client + Worker PASS; smoke 40/40** trên preview mới `127.0.0.1:4175`. `check:ui`: **17 routes, 0 exceptions**, catalog/cart/storage/quote/EN-VI/responsive/error-retry. `check:ui:phase5`: **10/10 kịch bản bắt buộc + 2/2 nhóm mở rộng PASS**, 0 exceptions. [Bảng đầy đủ 10 kết quả và lệnh](PHASE_5_FRONTEND.md#kết-quả-10-kịch-bản--15102026).

Edge/CDP thực thi checklist thao tác trình duyệt với frontend đã build + current Worker source và D1 workerd `persist:false`, `remoteBindings:false`; admin dùng credentials tổng hợp. Test xác minh số order/stock thật sau bấm đúp, mất response sau commit và stock_delta chưa rõ kết quả; CRUD product/zones/dashboard đối chiếu D1. Snapshot SQL readonly của schema/bảng persisted giữ nguyên; WAL/cache/observability không dùng làm chỉ báo thay đổi dữ liệu. Bridge Node dùng shim timingSafeEqual, bằng chứng native workerd auth Phase 4 giữ riêng. Không đo CPU cloud/Turnstile thật, không đổi DDL/dependency/lockfile hoặc D1 remote.

Evidence local/ignored: `.security-review/phase5-ui-results.json` (15/10/2026 14:34 giờ VN), `phase5-*.png`, `phase5-tests.txt`, `phase5-build.txt`, `phase5-smoke.txt`, `phase5-preview-ui.txt`. Scan **74 file runtime active sạch**; **40 hits legacy** của toàn src ghi riêng theo file/dòng, gồm fixture và khóa JSON deferred được giữ. Fetch duy nhất trong frontend ở shared API client; checker kiến trúc chặn fetch trong component/page.

## Bằng chứng preview lịch sử

> Các mục dưới đây lưu mốc preview 14/10 và checkpoint giữa lượt triển khai, không mô tả tiến độ hoặc routes hiện tại. Kết quả toàn Phase 5 nằm ở phần trên.

Checkpoint lượt hoàn thiện: **5.1–5.8 đã triển khai**. `apiRequest` thêm timeout 20 giây và mapping lỗi; helper intent UUID v4 giữ key theo payload; formatter ngày cố định Asia/Ho_Chi_Minh. Checkout COD dùng cùng cart/quote, giữ form khi lỗi và chỉ xóa giỏ sau response thành công. Tra đơn `/orders/track` có guard response cũ khi đổi mã/SĐT. Targeted checkout/commerce **14/14 pass** tại checkpoint này. Bước 5.9 auth cookie đã nối, đang tiếp admin; 5.10–5.16 còn triển khai/kiểm chứng. Số liệu này không phải nghiệm thu toàn Phase 5.

Chủ dự án yêu cầu sao lưu frontend/ảnh demo, rồi dùng D1 local để kiểm tra. Đã nối Home/Shop/Cart/Delivery/Quote, tạm ẩn features ngoài preview. Đây là phần đầu Phase 5, thực hiện trước Phase 3; tại thời điểm preview đó Phase 5 còn PARTIAL; Phase 5 hiện đã DONE local. **Phase 3 backend đã DONE local; backend Phase 4 auth/admin đã DONE local (9/9 tiêu chí)**, nhưng UI gửi/tra đơn/login/admin chưa nối. [Tiến độ hiện tại](README.md) · [nghiệm thu Phase 4](PHASE_4_ADMIN.md).

## Backup local trước khi sửa

Thư mục: `temp/fe-demo-2026-10-14-1791974270315/`, giữ local/ignored, không đưa vào Git.

| File | Nội dung |
| --- | --- |
| `frontend-source.zip` | Toàn bộ source frontend/config public ở commit `c33104f801ee07d6932b4c35a12bbd0c97e1ba0b`, đủ phục hồi thiết kế và fixture ban đầu |
| `frontend-data.json` | Snapshot 8 sản phẩm PHP và source của 18 file fixture, gồm cart/auth/profile/orders/admin/custom request/inventory/landing |
| `demo-images.zip` | 15 ảnh gốc frontend đã tải xuống, các kích thước khác nhau được giữ riêng |
| `manifest.json` | Ánh xạ URL → tên ảnh, file sử dụng ảnh, SHA-256 và số byte; 15/15 tải thành công |
| `README.txt` | Cách nhận diện backup; không nhập demo accounts/fixture vào D1 |

Cloudinary chưa đăng ký và không cần để dùng API Phase 2. Catalog hiện lấy `product_images.image_url` từ D1, seed vẫn là placeholder. Ảnh hero/story là nội dung trang trí sẵn có; ảnh sản phẩm, tên, size, giá và khả dụng tồn lấy từ DB. Chưa thay seed/DDL/remote.

## Dữ liệu hiển thị tại mốc preview

| Luồng | Nguồn hiện tại / hành vi |
| --- | --- |
| Home / Featured | CatalogProvider → `/api/categories`, `/api/products`; featured theo cờ DB, không gán tag hoặc ID từ fixture |
| Shop | DTO → adapter trong shop service; tìm kiếm EN/VI, category code, sort giá, chọn S/M/L theo variant ID, disable hết hàng |
| Cart | Ban đầu rỗng; shared CartProvider; line identity theo variant ID. `localStorage` khóa `lunara.cart.v1`, version 1, chỉ lưu variantId/quantity; parse Zod và bỏ dữ liệu hỏng |
| Delivery | `/api/delivery/options`; province/ward DB, nhập phường ngoài danh sách để quote áp mặc định tỉnh; methods/surcharges từ Worker |
| Quote | `/api/checkout/quote`; frontend chỉ gửi IDs/quantity/địa chỉ/method. Tổng/phí từ response, kết quả cũ không dùng khi lựa chọn đổi, requests cũ bị abort |
| Money/locale | VND từ DB, format theo EN/VI; mặc định/fallback vẫn English. Locale không đổi currency hoặc province/ward nhập bởi khách |
| API lỗi | Loading/error/empty/retry, thông điệp i18n theo mã lỗi; không fallback về sản phẩm/giá frontend demo |
| Features ngoài preview | Login/signup/profile/orders/custom request/admin/wishlist/reviews/coupon/đặt đơn bị ẩn. API tạo/lookup đơn Phase 3 và auth/admin Phase 4 đã có local, UI chưa nối; customer/profile/request APIs chưa có. URL cũ hiện sắp ra mắt, không render fixture hoặc giả thành công |

Menu còn Home/Shop/Cart. Source legacy được giữ trong repo và backup; AppProviders tại mốc preview là I18nextProvider → CatalogProvider → CartProvider, không khởi động demo AuthProvider. Lượt preview không thêm API ghi; Phase 3–4 tiếp theo đã thêm COD/tồn/lookup/transition và auth/admin backend, giữ frontend này. Tại mốc preview này chưa có nút gửi đơn hoặc UI tra đơn/admin thật; báo giá không tạo đơn hoặc giữ tồn.

Chỉnh storefront trước khi kết Phase 4 (15/10/2026): Zalo giữ icon tự vẽ góc phải sau rollback logo widget; viền xanh animate width 60→208px khi hover/focus/click trong 400ms, reduced motion 200ms; bỏ fade/slide riêng của chữ; tên/địa chỉ/map URL footer lấy từ EN/VI `common.json`. Giữ thông báo chờ khi bấm Zalo vì chưa có link thật. Các UI checkout/lookup/admin vẫn chưa nối.

## Kiểm chứng lịch sử tại mốc nối preview

Số liệu 54 tests/16 smoke và output bên dưới thuộc source tại lượt preview, giữ nguyên làm bằng chứng lịch sử. Mốc Phase 3 có **92/92 tests**, **10/10 ca order**, smoke tổng **27/27** và typecheck/architecture/build pass; [output lịch sử Phase 3](PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026). Số đếm source hiện tại và nghiệm thu auth/admin backend ghi ở [Phase 4](PHASE_4_ADMIN.md). Các kiểm chứng backend mới không thay thế nghiệm thu đủ checkout/admin UI Phase 5.

`npm test`: 54 pass, 0 fail. Bao gồm adapter từ schema/seed trên SQLite cô lập, giá variant/ảnh chính, clone snapshot, giỏ theo variant, giới hạn 15/20 và tồn, storage bị hỏng/bị chặn, payload quote không có giá client, API envelope/network errors, VND/locale. Server giữ test D1 thật cô lập và đếm catalog ≤3 statements.

`npm run typecheck` pass; `npm run check:architecture`: 178 source files pass; `npm run smoke` trên dev 5173 và preview 4173: 16/16 pass. Edge kiểm 15 route, 0 JS exceptions, chọn size M, cart reload/storage hỏng, phí phường/mặc định tỉnh, Express, EN/VI, responsive 320/390/768/1024, 8 route không có API được ẩn và network error/retry không fallback fixture. Build frontend + Worker pass, không đổi dependency.

Output trích từ lệnh chạy trên bản cuối:

```text
> npm run typecheck
> tsc --noEmit && tsc -p tsconfig.worker.json --noEmit
[exit 0]
> npm run check:architecture
Architecture checked: 178 source files; layer boundaries, public APIs, presentation state, and Tailwind page styles.
> npm test
ℹ tests 54
ℹ pass 54
ℹ fail 0
> npm run build
✓ 142 modules transformed.
✓ 1816 modules transformed.
✓ built in 3.10s
> npm run smoke -- http://127.0.0.1:4173
Phase 2 smoke: 16/16 PASS, 0 FAIL at http://127.0.0.1:4173.
> npm run check:ui -- http://127.0.0.1:4173
routes: 15; products: 8; variants: 24; cartPersistence/wardFallback/surcharge/apiFailureRetry: true; exceptions: 0
> npm run graph:sync
Already up to date
```

`[exit 0]` và dòng UI rút gọn là chú thích/trích output; JSON đầy đủ và screenshot giữ local ở `.security-review/verification-ui-results.json`, `verification-d1-shop-desktop.png`, `verification-d1-cart-vi.png`. Backup kiểm SHA-256 15/15 ảnh, 18 fixture files; kiểm đường dẫn docs và `git diff --check` pass. Các thông báo Rollup bỏ PURE comments trong Zod và Node SQLite experimental không làm thất bại checks.

Chạy `npm run dev` để mở `http://127.0.0.1:5173`; backend Worker và frontend cùng process Vite. Cart ban đầu rỗng: chọn size tại Shop → Add → Cart → thay tỉnh/phường/method. Reload giữ giỏ, quote làm mới giá/phí theo DB. Các phép test ghi DB chỉ chạy trong DB cô lập, không thay seed local đang dùng.
