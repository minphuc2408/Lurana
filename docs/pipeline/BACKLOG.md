# Backlog sau MVP của Lunarra

Roadmap cho chủ dự án/developer, hợp nhất ngày **19/10/2026**. Chỉ giữ đề xuất chưa triển khai; phần đã có nhưng chưa nghiệm thu provider/cloud hoặc dữ liệu mở bán thuộc [PROJECT_STATUS](../PROJECT_STATUS.md). Các đề xuất không cấp quyền triển khai hoặc phát sinh chi phí.

## Ưu tiên cao sau khi mở bán

| Đề xuất | Phạm vi cần quyết định |
| --- | --- |
| Thông báo đơn mới | Chọn webhook/provider, quota/chi phí; đề xuất gửi trong ctx.waitUntil sau tạo đơn, lỗi thông báo không làm hỏng đơn. Hiện chỉ có danh sách admin. |
| DELIVERY_FAILED riêng | Trạng thái/thống kê lý do riêng vẫn deferred; hành vi hủy IN_TRANSIT hiện có tra ở [API](../reference/API_CONTRACT.md#máy-trạng-thái-đơn), không làm lại như feature chưa có. |
| Trang chính sách | Privacy cho contact/địa chỉ, đổi/trả hoa tươi, liên hệ; owner duyệt nội dung pháp lý/kinh doanh, footer hiện mở notice. |
| Quản lý asset provider | Xóa ảnh/dọn orphan tự động chưa có. Signed upload/gallery đã tích hợp; lifecycle và tránh xóa ảnh snapshot đơn thuộc [CLOUDINARY](../operations/CLOUDINARY.md). |

## Ưu tiên trung bình

| Đề xuất | Ghi chú |
| --- | --- |
| Đặt hoa theo yêu cầu | SQL deferred/0002_custom_requests chỉ tham khảo; khi triển khai chọn số migration mới, API public/admin, nối AdminRequests và cân nhắc ảnh tham khảo. |
| Customer auth/profile | users/user_addresses đã có nhưng chưa có customer API hoặc wishlist table. Chọn auth/provider sau; giữ customerApiReady=false dù env opt-in. Đối chiếu schema và CPU/quota trước triển khai. |
| Lọc dịp/loại hoa | Đề xuất occasions/flower_types/product_occasions/product_flower_types, dùng chung wizard. |
| Coupon thật | Chưa có coupons/rules/redemption; orders có coupon_code/discount_total, MVP không nhận coupon client và discount=0. |
| Inventory ledger | inventory_movements cho restock/sale/cancel/adjust; hiện chỉ stock_quantity. |
| Ảnh duyệt/giao hàng | order_media cùng R2 hoặc Cloudinary; chọn quota/chi phí/phương thức thanh toán trước. |
| Review/rating | reviews và moderation; chỉ công khai trung bình từ review được duyệt. |
| Dashboard nâng cao | Revenue ngày/tuần, top products sau summary hiện có; kiểm D1 rows-read. |

## Khi quy mô lớn

- Thanh toán PayOS/VNPay/MoMo: payments/payment_events, webhook idempotent/ký HMAC; hóa đơn doanh nghiệp order_invoices.
- Ngày cao điểm 14/2, 8/3, 20/10, 20/11: special_days cho sức chứa/khung/phụ thu; nhiều chi nhánh stores/orders.store_id.
- FTS5 không dấu, phân trang catalog khi vượt giới hạn 100; materials/product_recipe_items/suppliers.
- SEO prerender/SSR catalog, product sitemap và tối ưu ảnh/font theo đo đạc. Metadata Home/Shop/product-client, robots/sitemap/OG/staging noindex đã có.
- CI/CD Worker bằng GitHub Actions/Workers Builds với token quyền tối thiểu; không coi workflow Pages static đã có là pipeline deploy Worker.
- Mở rộng observability/alerting; cân nhắc PostgreSQL/Supabase/Neon khi nhu cầu query phức tạp.
- WAF/custom domain/bảo vệ route admin upstream theo nhu cầu và điều kiện gói; cơ chế rate limit/Turnstile hiện có thuộc [BOT_PROTECTION](../operations/BOT_PROTECTION.md).

## Rủi ro và nơi xử lý

| Rủi ro | Mức | Hướng xử lý |
| --- | --- | --- |
| Hết quota Free hoặc lộ backup khách | Trung bình | Theo [OPERATIONS](../operations/OPERATIONS.md): metrics/account limits, backup riêng tư/mã hóa; không xóa dữ liệu để chữa daily quota. |
| Dò mật khẩu admin | Trung bình | Giữ mật khẩu ngẫu nhiên/Turnstile/rate limit và rotate phiên theo [runbook secrets](../operations/OPERATIONS.md#6-secrets-mật-khẩu-và-phiên-admin). |
| Config/zone/ảnh/tồn mẫu bị dùng mở bán | Cao | Owner chốt dữ liệu/chính sách, ẩn/tắt mẫu và kiểm quote; điều kiện hiện tại ở Status, không lặp checklist deployment ở backlog. |
| Hoa tươi nhưng tồn theo số lượng | Trung bình | Diễn giải tồn như số suất mỗi size, chỉnh delta hằng ngày; ghi mơ hồ phải GET đối soát, không retry. Sức chứa theo ngày/ledger là phần mở rộng. |
| Không có thông báo đơn mới | Cao | Triển khai đề xuất ưu tiên cao sau MVP. |
| Sai khác tên hành chính/coverage | Trung bình | Rà danh mục định kỳ và cấu hình từng phường theo [DELIVERY_ADDRESS](../features/DELIVERY_ADDRESS.md), không fallback tỉnh. |
