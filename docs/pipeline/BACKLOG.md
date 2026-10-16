# Backlog sau MVP và rủi ro đã biết

**Trạng thái backlog (15/10/2026):** PLANNED · Phase 0–5 DONE local: backend Phase 4 đạt 9/9 và frontend Phase 5 đạt 6/6 tiêu chí, 10/10 kịch bản bắt buộc +2/2 mở rộng. Phase 6 PLANNED; MVP chưa deploy/nghiệm thu remote. [Hiện trạng](../PROJECT_STATUS.md) · [Bằng chứng frontend](PHASE_5_FRONTEND.md). Bảng dưới mô tả việc sau MVP/giảm thiểu dự kiến; không xác nhận các controls đã có. Quota/giá/cloud policy cần kiểm tra lại trước deploy.

## Ưu tiên cao (tuần đầu sau khi mở bán)

B2/B3 cập nhật local 15/10/2026 bên dưới chưa deploy. Phase 6 hiện IN PROGRESS (5/7), đã deploy phiên bản trước và nghiệm thu API/browser; các số/mô tả đầu trang là mốc lịch sử trước triển khai. Xem [chống bot và COD](../BOT_PROTECTION.md).

| Hạng mục | Ghi chú |
| --- | --- |
| **Thông báo đơn mới cho chủ shop** | MVP dự kiến chỉ có admin nên dễ bỏ sót đơn. Worker gọi webhook trong `ctx.waitUntil()` sau khi tạo đơn; lỗi gửi không làm hỏng đơn. Chọn provider và kiểm tra quota/chi phí khi triển khai |
| Trạng thái `DELIVERY_FAILED` riêng | B3 đã xử lý local bằng IN_TRANSIT → CANCELLED, bắt buộc lý do, restock mặc định false/opt-in true; không cần migration. Trạng thái riêng/thống kê nâng cao vẫn deferred |
| Trang chính sách | Quyền riêng tư (thu thập tên/SĐT/địa chỉ), đổi/trả hoa tươi, liên hệ. Là yêu cầu vận hành, không phải code |
| Upload ảnh từ admin | Cloudinary Unsigned Upload Preset **giới hạn định dạng/dung lượng/thư mục**; lưu `image_url` + `cloudinary_public_id`. Xóa ảnh phải ký request ở Worker (secret không để ở trình duyệt) |
| Chống bot và vận hành COD | B2 local đã có Turnstile checkout/lookup/login, rate-limit bindings, 3 PENDING/SĐT và Cron TTL 24 giờ, chạy mỗi giờ trong cấu hình local. Owner cấu hình khóa/deploy; Cron đã chốt 24 giờ/mỗi giờ; WAF/custom domain và bảo vệ các route admin mở rộng còn chờ nhu cầu. [Hướng dẫn](../BOT_PROTECTION.md) |

## Ưu tiên trung bình

| Hạng mục | Ghi chú |
| --- | --- |
| Đặt hoa theo yêu cầu (wizard) | Áp `docs/sql/deferred/0002_custom_requests.sql` làm migration `0002`; thêm API công khai + admin; gộp `AdminRequests` với dữ liệu thật; cân nhắc bảng ảnh tham khảo |
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
| Hoa tươi làm theo đơn nhưng tồn kho theo số lượng | Trung bình | Dùng tồn như "số suất nhận mỗi size"; chỉnh bằng `stock_delta` hằng ngày; khi ghi mất phản hồi, UI xóa delta/khóa dòng và yêu cầu GET tải tồn trước lần chỉnh tiếp. Không tự retry delta; cân nhắc sức chứa theo ngày ở giai đoạn sau |
| Không có thông báo đơn mới | Cao | Làm hạng mục "Thông báo đơn mới" ngay sau MVP |
| Lộ dữ liệu khách qua file backup | Trung bình | Không commit; lưu riêng tư; mã hóa ổ lưu trữ |
| Sai khác tên tỉnh/phường giữa danh sách giao và địa chỉ khách nhập | Trung bình | Form Phase 5 chọn tỉnh/ward DB và cho nhập ward khác để dùng mặc định tỉnh; server khớp ward trước, fallback tỉnh sau. Rà soát dữ liệu hành chính định kỳ và nhập khu vực thật trước mở bán |
