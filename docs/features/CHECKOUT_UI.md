# Giỏ hàng và đặt hoa Lunarra

Explanation cho frontend/QA về UX `/cart` → `/checkout`; quyết định trình bày được duyệt 18/10, hợp nhất tài liệu 19/10/2026. Hệ màu/typography/a11y thuộc [DESIGN_SYSTEM](../ui-ux/DESIGN_SYSTEM.md), state/storage thuộc [FRONTEND_ENTITIES](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu), mức nghiệm thu thuộc [PROJECT_STATUS](../PROJECT_STATUS.md).

## Quyết định của chủ shop

- Cart chỉ có sản phẩm và tóm tắt; **Tiến hành đặt hàng** mới mở form checkout. Cart có breadcrumb, checkout không có breadcrumb/nhãn Bước cuối cùng.
- Chưa chọn địa chỉ: ẩn dòng phí giao, không áp phí mẫu 30000; tổng ghi **Tổng tạm tính**. Chọn đủ tỉnh/phường active mới hiện phí/tổng từ quote server.
- COD mặc định. Chuyển khoản mở notice Sắp ra mắt; đóng bằng Escape/nút/backdrop trả COD. Không có VietQR hoặc xác nhận đã thanh toán.
- Chọn Người đặt cũng là người nhận đồng bộ tên/SĐT; field người nhận chỉ đọc đến khi bỏ chọn. Tên người đặt luôn bắt buộc. Điều khoản mở dialog Cập nhật sau; consent mặc định false.
- **Một thiệp cho cả đơn**, sau lịch giao. NONE ẩn/xóa message; GREETING_CARD/BANNER cần nội dung không trắng; yêu cầu khác ở Ghi chú, giữ nguyên nội dung khách.
- Giữ **form → xem lại → xác nhận gửi → response API**. Form mẫu không gửi thẳng hoặc giả thành công; quote/validation/consent/Turnstile/UUID vẫn là điều kiện gửi.

## Bố cục và tương tác

Cart có links ảnh/tên tới detail, số lượng theo giới hạn giỏ và nút xóa; desktop tách bảng/tóm tắt, mobile xếp dọc. Empty/loading/error/retry dùng dữ liệu thật.

Checkout có năm khối: người đặt, địa chỉ người nhận, lịch giao, thiệp, thanh toán/ghi chú. Từ 1024 px có cột tóm tắt sticky; các field cặp từ 640 px. Tiêu đề Thông tin giao hoa & Thanh toán căn giữa; tóm tắt có ảnh/size/quantity, subtotal/phí/tổng, consent và CTA. Dưới CTA form/review giữ hai dòng copy owner duyệt: Chụp ảnh hoa thực tế gửi bạn trước khi giao; Giao hoa nhẹ nhàng, giữ dáng cánh hoa nguyên vẹn. Đây là copy trình bày đã duyệt, không thay lịch/phí/coverage API.

Refinement 20/10: input/textarea/Combobox 16px, nhãn/helper quan trọng 14px; lỗi chỉ rõ tên, SĐT, địa chỉ hoặc lời nhắn cần nhập. Tên hoa summary xuống dòng; nút quantity 44px. Sticky lấy chiều cao Header đo thực tế cộng 16px, không dùng `top-28` cố định; không đổi form → review → API, consent hoặc UUID retry.

Địa chỉ chỉ tỉnh/phường, không thêm quận/huyện hoặc cam kết từ mẫu. Methods/surcharge/slots/limits lấy API theo [Delivery](DELIVERY_ADDRESS.md). Gõ contact/địa chỉ/thiệp/ghi chú, đổi payment/consent hoặc chuyển Cart↔Checkout không tự tạo quote mới khi dữ liệu định giá không đổi.

Ngày 20/10 owner bỏ viền field checkout ở cả trạng thái nghỉ và focus, gồm input/textarea/Combobox/Dropdown; pointer không outline/shadow, Tab vẫn có focus 2px qua shared `useFieldFocus`. Labels/lỗi/validation/checkbox/radio/admin giữ nguyên. Breadcrumb chung đặt trước nội dung, checkout có link về Giỏ hàng. Chi tiết trình bày thuộc [design owner](../ui-ux/DESIGN_SYSTEM.md#interaction-và-accessibility); giữ các palette hiện có.

Thông báo chuyển khoản và điều khoản dùng `FeatureUnavailableDialog` chung với footer/header, có icon hoa bốn cánh từ favicon và copy EN/VI theo ngữ cảnh; [mẫu thông báo](../ui-ux/DESIGN_SYSTEM.md#thông-báo-tính-năng-chung) thuộc design system. Giữ callback đóng chuyển khoản về COD, không thay consent hoặc bước review.

## Gửi, retry và xác nhận

Review hiện lại dữ liệu khách để kiểm, có edit/consent/Turnstile và khóa submit khi pending. Retry payload không đổi giữ UUID; token xác minh lấy mới ngoài fingerprint. Response lỗi giữ giỏ/form; chỉ API thành công mới xóa giỏ và hiển thị OrderSummary, không random mã đơn hoặc giả thêm field response.

Draft/intent ở memory qua hai route, rời nhóm hoặc reload mất; reload khi request chưa rõ kết quả cần tra đơn, không tự coi là retry an toàn. [Vòng đời dữ liệu](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu) và [contract gửi đơn](../reference/API_CONTRACT.md#post-apiorders) là owner chi tiết. Checkout có metadata EN/VI/noindex, không thêm sitemap.

## Kiểm chứng local

[Browser runner](../../scripts/check-ui-cart-checkout.mjs) kiểm EN/VI/responsive, quantity/xóa/empty, card reset/required, đồng bộ người nhận, validation/consent, bank rollback/terms, review/edit/draft hai route và quote chỉ khi input định giá đổi. POST order bị intercept để kiểm UUID/retry và thời điểm xóa giỏ; challenge tổng hợp, không ghi D1.

Lệnh và điều kiện chạy thuộc [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md#build-preview-và-kiểm-tra); screenshot/results ignored. UI mock PASS không thay nghiệm thu challenge/order cloud thật.
