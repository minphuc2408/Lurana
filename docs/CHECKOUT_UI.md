# Giỏ hàng và đặt hoa theo project ref

Cập nhật17/10/2026, **main77bdfdc đã deploy staging17/10 versionc29141be-740e-4908-b369-179d7631356e; local tại127.0.0.1:5173**. Trang mẫu đọc từ D:/Download/lunara/src/pages/CartPage.tsx và CheckoutPage.tsx; không chạy/copy ứng dụng demo. Hiện trạng remote và Phase6 xem [PROJECT_STATUS](PROJECT_STATUS.md). Mô tả checkout gộp16/10 trong lịch sử đã được thay bằng luồng dưới đây.

## Quyết định của chủ shop

- /cart chỉ hiện sản phẩm và tóm tắt. Bấm **Tiến hành đặt hàng** mới mở /checkout; lúc đó hiện người đặt, người nhận, lịch giao, thiệp và phương thức thanh toán.
- Chưa chọn địa chỉ thì **không hiện dòng phí giao**, không áp phí mẫu30.000đ. Tạm tính lấy giá catalog/quote; tổng trước địa chỉ ghi rõ **Tổng tạm tính**. Sau khi chọn đủ tỉnh/phường, hiển thị phí/tổng từ quote API hiện hành.
- COD mặc định. Chuyển khoản mở thông báo Sắp ra mắt; đóng bằng Escape/nút/backdrop trả COD. Không VietQR, ngân hàng thật hoặc cam kết đã thanh toán.
- **Một thiệp cho cả đơn** theo API. Khối Thiệp nằm sau Lịch giao hoa; yêu cầu khác nhập Ghi chú. NONE ẩn/xóa message; GREETING_CARD/BANNER cần message không trắng, giữ nguyên nội dung khách.
- Giữ **xem lại → xác nhận gửi**. Không gửi trực tiếp từ form mẫu; giữ schema, consent mặc định false, quote hiện hành, Turnstile và UUID/retry.

## Giao diện

Khung1240px, padding20/32px và py24/40px, breadcrumb chỉ trên Cart, tiêu đề serif, nền cream/surface, viền mảnh, góc2px như mẫu. Token màu riêng của hai trang lấy ink#4B2432/body#746B69/border#E7DCD3/surface#FAF7F2/blush#F3E7DF; CTA#9D586B. Giữ typography EN Fraunces/Inter và VI Lora/Be Vietnam Pro đã duyệt.

Cart desktop chia8/4trên grid12, gap40px; ảnh80×100, dòng sản phẩm6/2/2/2 cho thông tin/đơn giá/số lượng/tạm tính. Mobile xếp dọc; links ảnh/tên tới detail, quantity giữ giới hạn shared cart, xóa bằng nút. Empty/loading/error/retry dùng dữ liệu thật, không fixture.

Checkout chia7/5, gap40/56px từ1024px. Cột trái5khối: người đặt; địa chỉ người nhận; lịch giao; thiệp; thanh toán/ghi chú. Cặp field từ640px; cột phải sticky top112px trên desktop, liệt kê ảnh56×64/nội dung/size/quantity, subtotal/phí/tổng, consent và CTA. Không đưa mức phí, lịch giao, quận/huyện hoặc cam kết dịch vụ giả của mẫu vào vận hành: địa chỉ tỉnh/phường, methods/surcharge, slots/limits lấy API hiện có. Tên người đặt vẫn bắt buộc theo schema. Thông tin chưa có trong response xác nhận không được giả làm dữ liệu server.

Review đổi style theo mẫu, tiếp tục hiển thị dữ liệu nhập để kiểm, Turnstile, edit/retry và consent. Xác nhận chỉ dùng OrderSummary từ API; không tạo mã đơn bằng random hoặc hiển thị thành công trước response.

Checkout không có breadcrumb hoặc nhãn “Bước cuối cùng”; tiêu đề “Thông tin giao hoa & Thanh toán” căn giữa. Dưới CTA ở form và bước xem lại có hai dòng: “Chụp ảnh hoa thực tế gửi bạn trước khi giao.” và “Giao hoa nhẹ nhàng, giữ dáng cánh hoa nguyên vẹn.”

## Kiến trúc và dữ liệu

- App CheckoutLayout là nhóm route không path gồm /cart và /checkout. Feature CheckoutFlowProvider gọi useCodCheckout một lần; hai page mỏng dùng context và render CartView/CheckoutView. Chuyển giữa hai trang giữ draft và idempotency intent trong memory; rời nhóm route/reload sẽ mất draft. CartProvider ngoài nhóm vẫn giữ shared variant cart.
- localStorage lunara.cart.v1 vẫn chỉ version/variantId/quantity. CartItem thêm slug/sizeCode từ catalog để link và hiển thị; không lưu chúng hoặc PII/thiệp/note/intent/session vào storage.
- useQuoteCart giữ debounce350ms và chỉ quote khi chọn địa chỉ active hợp catalog. Gõ name/phone/address/message/note, đổi consent/payment hoặc chuyển cart↔checkout không tự tạo quote mới nếu dữ liệu định giá không đổi.
- Payload, shared Zod schemas, POST /api/orders, order lookup, Worker/D1 và idempotency contract **không đổi**. Giữ cùng UUID trên retry payload không đổi; response lỗi không xóa cart/không báo thành công. Cart chỉ xóa sau API thành công. /checkout có metadata EN/VI/noindex, không thêm sitemap.

## Kiểm chứng local

Typecheck, architecture229source,190tests và build PASS. [Browser runner](../scripts/check-ui-cart-checkout.mjs):18nhóm, cart EN/VI320/390/640/768/1024/1440px; checkout EN/VI320/390/768/1440px; không tràn ngang, form chỉ mở sau CTA, chỉnh quantity/xóa/empty, card NONE-reset/required, cùng người nhận, invalid phone, consent, bank rollback, terms nội bộ, review/edit, draft khi quay lại giỏ, direct checkout/reload xóa draft và noindex.1quote sau chọn địa chỉ,0quote khi gõ; hai POSTorder được intercept trước D1 (503→201) để kiểm cùng idempotency key, cart giữ khi lỗi/xóa sau response;0API order writes,0runtime exceptions. Font thật được bật ở lượt --fonts; ảnh remote vẫn bị host allowlist chặn.

Chạy: node scripts/check-ui-cart-checkout.mjs http://127.0.0.1:5173 --fonts. Script chỉ chấp nhận127.0.0.1 và dùng browser profile riêng, Turnstile callback synthetic; mọi order request bị intercept/không forward. Không đọc mật khẩu thật, không bypass server, không ghi local D1/remote. Screenshot/results ở .security-review/ ignored. Provider, đơn thật, Cron/quota và full legacy UI suite chưa được nghiệm thu lại; targeted PASS không thay lịch sử Phase5/6.

Tinh chỉnh theo owner17/10: bỏ breadcrumb Trang chủ/Giỏ hàng/Đặt hoa và nhãn Bước cuối cùng trên /checkout; căn giữa h1 cả details/review. Sidebar thêm hai dòng có icon dưới CTA (cả review và xác nhận): “Chụp ảnh hoa thực tế gửi bạn trước khi giao.” và “Giao hoa nhẹ nhàng, giữ dáng cánh hoa nguyên vẹn.”, có EN fallback. Đây là nội dung giao diện owner yêu cầu, không thêm API/chức năng tự chụp/gửi ảnh.
