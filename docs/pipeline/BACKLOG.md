# Backlog sau MVP và rủi ro đã biết

Rà soát **17/10/2026**. Chỉ ghi phần chưa triển khai hoặc chưa nghiệm thu; hành vi đang có tra ở [API_CONTRACT](API_CONTRACT.md), phiên bản remote và acceptance ở [PROJECT_STATUS](../PROJECT_STATUS.md). Các đề xuất không tự cho phép triển khai hay phát sinh chi phí.

## Ưu tiên cao (tuần đầu sau khi mở bán)

| Hạng mục | Ghi chú |
| --- | --- |
| **Thông báo đơn mới cho chủ shop** | Hiện chỉ có danh sách admin nên dễ bỏ sót đơn. Worker gọi webhook trong `ctx.waitUntil()` sau khi tạo đơn; lỗi gửi không làm hỏng đơn. Chọn provider và kiểm tra quota/chi phí khi triển khai |
| Trạng thái `DELIVERY_FAILED` riêng | Đã xử lý bằng IN_TRANSIT → CANCELLED, bắt buộc lý do, restock mặc định false/opt-in true; không cần migration. Trạng thái riêng/thống kê nâng cao vẫn deferred |
| Trang chính sách | Quyền riêng tư (thu thập tên/SĐT/địa chỉ), đổi/trả hoa tươi, liên hệ. Nội dung pháp lý/kinh doanh chưa được chủ shop duyệt; footer hiện mở thông báo Sắp ra mắt, chưa có trang chính sách |
| Upload ảnh từ admin | Signed direct upload và gallery tối đa 8 ảnh đã có; Save lưu URL/public ID, sắp thứ tự/chọn cover/gỡ liên kết. Còn nghiệm thu preset/upload thật và cấu hình production; xóa asset tại provider chưa triển khai. Không dùng unsigned preset; [hướng dẫn](../CLOUDINARY.md) |
| Chống bot và vận hành COD | Code đã có Turnstile checkout/lookup/login, rate-limit bindings, cap 3 PENDING/SĐT và Cron TTL 24 giờ/mỗi giờ. Còn nghiệm thu provider/hostname/Cron cloud, đo quota/CPU và cập nhật production; WAF/custom domain/bảo vệ route admin mở rộng theo nhu cầu. [Hướng dẫn](../BOT_PROTECTION.md) |

## Ưu tiên trung bình

| Hạng mục | Ghi chú |
| --- | --- |
| Đặt hoa theo yêu cầu (wizard) | Dùng `docs/sql/deferred/0002_custom_requests.sql` làm tài liệu tham khảo, chọn số migration mới sau các migration đã áp; không dùng lại số 0002. Thêm API công khai + admin; gộp `AdminRequests` với dữ liệu thật; cân nhắc bảng ảnh tham khảo |
| Đăng ký/đăng nhập khách | `users`/`user_addresses` đã nằm trong canonical 10 bảng và migrate local Phase 1, nhưng chưa có customer auth/profile API; chưa có bảng `wishlist`. Source customer giữ ẩn bằng cờ; `VITE_ENABLE_CUSTOMER_AUTH` mặc định false và customer API-ready gate false ngăn bật fixture. Admin cookie auth đã nối thật ở Phase 5. Chọn customer auth/provider sau, đối chiếu schema riêng và CPU/quota thật trước triển khai |
| Lọc theo dịp / loại hoa | Thêm `occasions`, `flower_types`, `product_occasions`, `product_flower_types` (đề xuất ở thiết kế trước); dùng chung với wizard |
| Coupon thật | Bảng/rules `coupons` chưa có; `orders.coupon_code`/`discount_total` đã migrate local. Phase 3 không nhận coupon client, discount_total luôn 0; coupon thật làm sau MVP |
| Sổ cái tồn kho | `inventory_movements` (restock/sale/cancel/adjust) để đối soát; hiện chỉ có `stock_quantity` |
| Ảnh duyệt trước khi giao / ảnh giao | `order_media` + R2 hoặc Cloudinary; kiểm tra chi phí/phương thức thanh toán/hạn mức trước khi chọn provider |
| Review/rating | Bảng `reviews` có kiểm duyệt; hiển thị trung bình tính từ review được duyệt |
| Dashboard nâng cao | Phase 4 có API và Phase 5 có UI summary đơn theo trạng thái/đơn hôm nay VN/tồn thấp; doanh thu ngày/tuần và sản phẩm bán chạy làm sau, cẩn thận hạn mức đọc hàng D1 |

## Ưu tiên thấp / khi quy mô lớn

- Thanh toán online (PayOS/VNPay/MoMo): bảng `payments` + `payment_events`, webhook idempotent, ký HMAC.
- Hóa đơn VAT cho doanh nghiệp (`order_invoices`).
- Ngày cao điểm (14/2, 8/3, 20/10, 20/11): bảng `special_days` giới hạn số đơn/khung giờ/phụ thu.
- Nhiều chi nhánh (`stores`, `orders.store_id`).
- Tìm kiếm không dấu bằng FTS5; phân trang catalog khi vượt 100 sản phẩm.
- Nguyên liệu/công thức/nhà cung cấp (`materials`, `product_recipe_items`, `suppliers`).
- SEO: metadata Home/Shop, robots/sitemap/OG và staging noindex đã có. Trang `/shop/:slug` và metadata client đã có; còn prerender/SSR nội dung catalog, product sitemap và tối ưu ảnh/font theo đo đạc; không làm lại phần metadata đã triển khai.
- CI/CD: GitHub Actions hoặc Workers Builds với API token phân quyền tối thiểu.
- Observability/log D1 allowlist đã có trong code; mở rộng cảnh báo/truy vấn lỗi khi cần, đưa dữ liệu sang PostgreSQL (Supabase/Neon) nếu cần truy vấn phức tạp.

## Rủi ro đã biết

| Rủi ro | Mức | Giảm thiểu trong MVP |
| --- | --- | --- |
| Hết hạn mức Free → API lỗi đến nửa đêm UTC | Trung bình | Xem dashboard hằng ngày; Turnstile; không quét bảng; nâng gói trả phí tối thiểu nếu cần |
| Dò mật khẩu admin (không băm chậm) | Trung bình | Mật khẩu ≥ 24 ký tự ngẫu nhiên; Turnstile/rate limit ở đăng nhập; đổi `JWT_SECRET` để thu hồi phiên |
| Giá trị nghiệp vụ trong `worker/config.ts` chỉ là giả định (phụ phí, giờ chốt, khung giờ) | Cao nếu quên | Chủ shop rà soát ở Phase 6.10 trước khi mở bán |
| `delivery_zones` seed chỉ là ví dụ | Cao nếu quên | Nhập khu vực thật, tắt dòng ví dụ (Phase 6.10) |
| Ảnh seed dùng dịch vụ placeholder bên thứ ba | Thấp | Thay bằng ảnh thật trước khi bán |
| Hoa tươi làm theo đơn nhưng tồn kho theo số lượng | Trung bình | Dùng tồn như "số suất nhận mỗi size"; chỉnh bằng `stock_delta` hằng ngày; khi ghi mất phản hồi, UI xóa delta/khóa dòng và yêu cầu GET tải tồn trước lần chỉnh tiếp. Không tự retry delta; cân nhắc sức chứa theo ngày ở giai đoạn sau |
| Không có thông báo đơn mới | Cao | Làm hạng mục "Thông báo đơn mới" ngay sau MVP |
| Lộ dữ liệu khách qua file backup | Trung bình | Không commit; lưu riêng tư; mã hóa ổ lưu trữ |
| Sai khác tên tỉnh/phường giữa danh sách giao và địa chỉ khách nhập | Trung bình | Admin chọn tỉnh/phường từ danh mục D1; checkout/quote/order chỉ nhận phường có zone active thuộc danh mục, không fallback tỉnh. Rà soát danh mục định kỳ và nhập phí/khu vực thật trước mở bán |
