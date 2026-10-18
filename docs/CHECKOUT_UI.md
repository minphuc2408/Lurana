# Giỏ hàng và đặt hoa theo project ref

Cập nhật 18/10/2026. Tài liệu này mô tả giao diện và state của hai trang `/cart` và `/checkout`; bố cục tham chiếu từ `D:/Download/lunara`. Trạng thái triển khai và kiểm chứng ở [PROJECT_STATUS](PROJECT_STATUS.md).

## Quyết định của chủ shop

- /cart chỉ hiện sản phẩm và tóm tắt. Bấm **Tiến hành đặt hàng** mới mở /checkout; lúc đó hiện người đặt, người nhận, lịch giao, thiệp và phương thức thanh toán.
- Chưa chọn địa chỉ thì **không hiện dòng phí giao**, không áp phí mẫu30.000đ. Tạm tính lấy giá catalog/quote; tổng trước địa chỉ ghi rõ **Tổng tạm tính**. Sau khi chọn đủ tỉnh/phường, hiển thị phí/tổng từ quote API hiện hành.
- COD mặc định. Chuyển khoản mở thông báo Sắp ra mắt; đóng bằng Escape/nút/backdrop trả COD. Không VietQR, ngân hàng thật hoặc cam kết đã thanh toán.
- Bật “Người đặt cũng là người nhận” sao chép và đồng bộ tên/SĐT người đặt; hai field người nhận chỉ đọc tới khi bỏ chọn. Điều khoản mở Dialog nội bộ “Cập nhật sau”; consent vẫn mặc định false.
- **Một thiệp cho cả đơn** theo API. Khối Thiệp nằm sau Lịch giao hoa; yêu cầu khác nhập Ghi chú. NONE ẩn/xóa message; GREETING_CARD/BANNER cần message không trắng, giữ nguyên nội dung khách.
- Giữ **xem lại → xác nhận gửi**. Không gửi trực tiếp từ form mẫu; giữ schema, consent mặc định false, quote hiện hành, Turnstile và UUID/retry.

## Giao diện

Khung1240px, padding20/32px và py24/40px, breadcrumb chỉ trên Cart, tiêu đề serif, nền cream/surface, viền mảnh, góc2px như mẫu. Màu dùng semantic tokens hiện hành của Original/16theme trong brand.css; không khóa các mã rose cũ. Giữ typography EN Fraunces/Inter và VI Lora/Be Vietnam Pro đã duyệt.

Owner18/10 chỉ yêu cầu bỏ viền/vòng nhấn khi click vào ô nhập checkout. `useCheckoutFieldFocus` phân biệt pointer/Tab; CSS chỉ tắt outline/shadow và giữ viền mảnh cho input/textarea trong form khi dùng pointer. Tab vẫn có dấu focus; validation/checkbox/radio, input ở admin/route khác giữ nguyên.

Cart desktop chia8/4trên grid12, gap40px; ảnh80×100, dòng sản phẩm6/2/2/2 cho thông tin/đơn giá/số lượng/tạm tính. Mobile xếp dọc; links ảnh/tên tới detail, quantity giữ giới hạn shared cart, xóa bằng nút. Empty/loading/error/retry dùng dữ liệu thật, không fixture.

Checkout chia7/5, gap40/56px từ1024px. Cột trái5khối: người đặt; địa chỉ người nhận; lịch giao; thiệp; thanh toán/ghi chú. Cặp field từ640px; cột phải sticky top112px trên desktop, liệt kê ảnh56×64/nội dung/size/quantity, subtotal/phí/tổng, consent và CTA. Không đưa mức phí, lịch giao, quận/huyện hoặc cam kết dịch vụ giả của mẫu vào vận hành: địa chỉ tỉnh/phường, methods/surcharge, slots/limits lấy API hiện có. Tên người đặt vẫn bắt buộc theo schema. Thông tin chưa có trong response xác nhận không được giả làm dữ liệu server.

Review đổi style theo mẫu, tiếp tục hiển thị dữ liệu nhập để kiểm, Turnstile, edit/retry và consent. Xác nhận chỉ dùng OrderSummary từ API; không tạo mã đơn bằng random hoặc hiển thị thành công trước response.

Checkout không có breadcrumb hoặc nhãn “Bước cuối cùng”; tiêu đề “Thông tin giao hoa & Thanh toán” căn giữa. Dưới CTA ở form và bước xem lại có hai dòng: “Chụp ảnh hoa thực tế gửi bạn trước khi giao.” và “Giao hoa nhẹ nhàng, giữ dáng cánh hoa nguyên vẹn.”

## Kiến trúc và dữ liệu

- App CheckoutLayout là nhóm route không path gồm /cart và /checkout. Feature CheckoutFlowProvider gọi useCodCheckout một lần; hai page mỏng dùng context và render CartView/CheckoutView. Chuyển giữa hai trang giữ draft và idempotency intent trong memory; rời nhóm route/reload sẽ mất draft. CartProvider ngoài nhóm vẫn giữ shared variant cart.
- localStorage lunara.cart.v1 vẫn chỉ version/variantId/quantity. CartItem thêm slug/sizeCode từ catalog để link và hiển thị; không lưu chúng hoặc PII/thiệp/note/intent/session vào storage.
- useQuoteCart giữ debounce350ms và chỉ quote khi chọn địa chỉ active hợp catalog. Gõ name/phone/address/message/note, đổi consent/payment hoặc chuyển cart↔checkout không tự tạo quote mới nếu dữ liệu định giá không đổi.
- Giữ cùng UUID trên retry payload không đổi; token xác minh nằm ngoài fingerprint. Response lỗi không xóa cart/không báo thành công; cart chỉ xóa sau API thành công. Hợp đồng đặt đơn ở [API_CONTRACT](pipeline/API_CONTRACT.md#post-apiorders); chức năng tra đơn có [tài liệu riêng](ORDER_TRACKING.md). `/checkout` có metadata EN/VI/noindex, không thêm sitemap.

## Kiểm chứng local

[Browser runner](../scripts/check-ui-cart-checkout.mjs) kiểm responsive EN/VI, quantity/xóa/empty, card NONE-reset/required, đồng bộ người nhận, validation/consent, bank rollback, terms, review/edit và draft qua hai route. Kiểm quote chỉ khi dữ liệu định giá đổi; các POST đặt đơn được intercept trước D1 để kiểm retry cùng UUID và chỉ xóa giỏ sau response thành công.

Chạy: `node scripts/check-ui-cart-checkout.mjs http://127.0.0.1:5173 --fonts`. Script chỉ chấp nhận loopback, dùng browser profile riêng và callback Turnstile tổng hợp; không forward order request hoặc ghi D1. Screenshot/results ở `.security-review/` ignored. Đây là kiểm UI với response giả lập; kết quả và giới hạn nghiệm thu hiện tại xem [PROJECT_STATUS](PROJECT_STATUS.md).
