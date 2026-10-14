# Frontend D1 preview — 14/10/2026

Chủ dự án yêu cầu sao lưu frontend/ảnh demo, rồi dùng D1 local để kiểm tra. Đã nối Home/Shop/Cart/Delivery/Quote, tạm ẩn features ngoài preview. Đây là phần đầu Phase 5, thực hiện trước Phase 3; toàn Phase 5 vẫn PARTIAL. **Phase 3 backend đã DONE local; backend Phase 4 auth/admin đã DONE local (9/9 tiêu chí)**, nhưng UI gửi/tra đơn/login/admin chưa nối. [Tiến độ hiện tại](README.md) · [nghiệm thu Phase 4](PHASE_4_ADMIN.md).

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

## Dữ liệu đang hiển thị

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

Menu còn Home/Shop/Cart. Source legacy được giữ trong repo và backup; AppProviders hiện I18nextProvider → CatalogProvider → CartProvider, không khởi động demo AuthProvider. Lượt preview không thêm API ghi; Phase 3–4 tiếp theo đã thêm COD/tồn/lookup/transition và auth/admin backend, giữ frontend này. Hiện chưa có nút gửi đơn hoặc UI tra đơn/admin thật; báo giá không tạo đơn hoặc giữ tồn.

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
