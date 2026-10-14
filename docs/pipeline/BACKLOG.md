# Backlog sau MVP và rủi ro đã biết

**Trạng thái:** PLANNED · Phase 0–2 DONE local, MVP chưa chạy thật. [Hiện trạng](../PROJECT_STATUS.md). Bảng dưới mô tả việc sau MVP/giảm thiểu dự kiến; không xác nhận các controls đã có. Quota/giá/cloud policy cần kiểm tra lại trước deploy.

## Ưu tiên cao (tuần đầu sau khi mở bán)

| Hạng mục | Ghi chú |
| --- | --- |
| **Thông báo đơn mới cho chủ shop** | MVP dự kiến chỉ có admin nên dễ bỏ sót đơn. Worker gọi webhook trong `ctx.waitUntil()` sau khi tạo đơn; lỗi gửi không làm hỏng đơn. Chọn provider và kiểm tra quota/chi phí khi triển khai |
| Trạng thái `DELIVERY_FAILED` | Giao thất bại/khách không nhận: cần migration đổi `CHECK` của `orders.status_code` (SQLite phải tạo bảng mới + chép dữ liệu) và cập nhật máy trạng thái |
| Trang chính sách | Quyền riêng tư (thu thập tên/SĐT/địa chỉ), đổi/trả hoa tươi, liên hệ. Là yêu cầu vận hành, không phải code |
| Upload ảnh từ admin | Cloudinary Unsigned Upload Preset **giới hạn định dạng/dung lượng/thư mục**; lưu `image_url` + `cloudinary_public_id`. Xóa ảnh phải ký request ở Worker (secret không để ở trình duyệt) |
| Rate limit / Turnstile cho toàn bộ route ghi | Nếu chưa làm ở Phase 6 |

## Ưu tiên trung bình

| Hạng mục | Ghi chú |
| --- | --- |
| Đặt hoa theo yêu cầu (wizard) | Áp `docs/sql/deferred/0002_custom_requests.sql` làm migration `0002`; thêm API công khai + admin; gộp `AdminRequests` với dữ liệu thật; cân nhắc bảng ảnh tham khảo |
| Đăng ký/đăng nhập khách | `users`/`user_addresses` mới có trong SQL draft, chưa migrate; chưa có bảng `wishlist`. Chọn auth/provider sau, đối chiếu schema riêng và CPU/quota thật trước triển khai |
| Lọc theo dịp / loại hoa | Thêm `occasions`, `flower_types`, `product_occasions`, `product_flower_types` (đề xuất ở thiết kế trước); dùng chung với wizard |
| Coupon thật | Bảng/rules `coupons` + tính ở server; `orders.coupon_code`/`discount_total` hiện chỉ có trong SQL draft |
| Sổ cái tồn kho | `inventory_movements` (restock/sale/cancel/adjust) để đối soát; hiện chỉ có `stock_quantity` |
| Ảnh duyệt trước khi giao / ảnh giao | `order_media` + R2 hoặc Cloudinary; kiểm tra chi phí/phương thức thanh toán/hạn mức trước khi chọn provider |
| Review/rating | Bảng `reviews` có kiểm duyệt; hiển thị trung bình tính từ review được duyệt |
| Dashboard thật | Tổng hợp doanh thu theo ngày/tuần, sản phẩm bán chạy; cẩn thận hạn mức đọc hàng của D1 |

## Ưu tiên thấp / khi quy mô lớn

- Thanh toán online (PayOS/VNPay/MoMo): bảng `payments` + `payment_events`, webhook idempotent, ký HMAC.
- Hóa đơn VAT cho doanh nghiệp (`order_invoices`).
- Ngày cao điểm (14/2, 8/3, 20/10, 20/11): bảng `special_days` giới hạn số đơn/khung giờ/phụ thu.
- Nhiều chi nhánh (`stores`, `orders.store_id`).
- Tìm kiếm không dấu bằng FTS5; phân trang catalog khi vượt 100 sản phẩm.
- Nguyên liệu/công thức/nhà cung cấp (`materials`, `product_recipe_items`, `suppliers`).
- SEO: SPA khó lập chỉ mục tốt; cân nhắc prerender/SSR cho trang sản phẩm, sitemap, meta/Open Graph.
- CI/CD: GitHub Actions hoặc Workers Builds với API token phân quyền tối thiểu.
- Giám sát lỗi/log; đưa dữ liệu sang PostgreSQL (Supabase/Neon) nếu cần truy vấn phức tạp.

## Rủi ro đã biết

| Rủi ro | Mức | Giảm thiểu trong MVP |
| --- | --- | --- |
| Hết hạn mức Free → API lỗi đến nửa đêm UTC | Trung bình | Xem dashboard hằng ngày; Turnstile; không quét bảng; nâng gói trả phí tối thiểu nếu cần |
| Dò mật khẩu admin (không băm chậm) | Trung bình | Mật khẩu ≥ 24 ký tự ngẫu nhiên; Turnstile/rate limit ở đăng nhập; đổi `JWT_SECRET` để thu hồi phiên |
| Giá trị nghiệp vụ trong `worker/config.ts` chỉ là giả định (phụ phí, giờ chốt, khung giờ) | Cao nếu quên | Chủ shop rà soát ở Phase 6.10 trước khi mở bán |
| `delivery_zones` seed chỉ là ví dụ | Cao nếu quên | Nhập khu vực thật, tắt dòng ví dụ (Phase 6.10) |
| Ảnh seed dùng dịch vụ placeholder bên thứ ba | Thấp | Thay bằng ảnh thật trước khi bán |
| Hoa tươi làm theo đơn nhưng tồn kho theo số lượng | Trung bình | Dùng tồn như "số suất nhận mỗi size"; chỉnh bằng `stock_delta` hằng ngày; cân nhắc sức chứa theo ngày ở giai đoạn sau |
| Không có thông báo đơn mới | Cao | Làm hạng mục "Thông báo đơn mới" ngay sau MVP |
| Lộ dữ liệu khách qua file backup | Trung bình | Không commit; lưu riêng tư; mã hóa ổ lưu trữ |
| Sai khác tên tỉnh/phường giữa danh sách giao và địa chỉ khách nhập | Trung bình | FE chỉ cho **chọn** từ danh sách `delivery_zones`; dữ liệu hành chính nên rà soát định kỳ |
