# Checkout: giỏ hàng và form gộp

Cập nhật 16/10/2026: checkout gộp và địa chỉ đã deploy staging version `27c3d24e-f3df-42e1-8d18-8b8299427062`, owner đã yêu cầu commit/push source sau deploy; production không đổi. Hiện trạng ở đây thay cho bố cục checkout trước đó cùng ngày.

## Luồng và bố cục

Mở /cart có hàng sẽ thấy ngay sản phẩm, form, tổng tiền và phương thức thanh toán. Không cần chọn thành phố/phường rồi bấm tiếp để mở form. Hook bắt đầu ở details, sau đó review → API confirmation; vẫn có bước xem lại trước khi tạo đơn thật. Giỏ trống/loading/error giữ trạng thái riêng.

Ba khối thông tin luôn xếp theo một cột dọc:

1. Người đặt: tên và SĐT cùng hàng từ640px; hai checkbox cùng người nhận và ẩn tên người gửi cùng hàng, nhãn tự xuống dòng khi hẹp.
2. Người nhận: tên và SĐT cùng hàng từ640px, địa chỉ riêng, thành phố và phường cùng hàng từ640px. Mobile hẹp xếp trường dọc để nhập liệu dễ. Nhãn phường chỉ **Phường / Xã**, không thêm quận/huyện. Chỉ hiện tỉnh/phường đang active trong delivery-zones và thuộc danh mục D1 Hà Nội; xem [địa chỉ và phạm vi giao](DELIVERY_ADDRESS.md).
3. Thiệp và yêu cầu giao: ngày/slot, loại thiệp, phương thức giao, thông điệp có điều kiện và ghi chú.

Bật cùng người nhận sao chép tên/SĐT và tiếp tục sync khi sửa người đặt; hai ô nhận read-only. Tắt giữ nội dung và cho sửa riêng. Không sao chép/thay địa chỉ. Email optional còn tương thích model/API nhưng không có ô nhập trong layout này.

Mặc định NONE (không dùng thiệp) ẩn nội dung thông điệp. Chọn GREETING_CARD/BANNER mới hiện textarea bắt buộc. Chọn lại NONE xóa nội dung, ẩn textarea và không gửi message trong payload. Không còn tự chọn loại thiệp khi nhập nội dung ẩn.

## Thanh toán và điều khoản

Payment nằm dưới Total từ lần mở form đầu tiên. COD mặc định, ghi chú chỉ “Thanh toán khi nhận hàng”; không cọc50%, không thông tin tài khoản hoặc hạn chế COD cho cùng người nhận.

Chọn chuyển khoản mở Dialog + FeatureUnavailable inline. Trong lúc thông báo mở, BANK_TRANSFER không đủ điều kiện đi tiếp. Khi đóng bằng Escape, nút đóng hoặc backdrop, hook trả payment về COD. Không tạo đơn/khởi tạo thanh toán chuyển khoản; state form/consent giữ nguyên.

Điều khoản là button mở Dialog nội bộ với tiêu đề “Điều khoản & Điều kiện” và nội dung **“Cập nhật sau”** (EN: To be updated). Không link/navigate đến Trạm Hoa hoặc website khác. Không tự viết điều khoản; chờ owner gửi. Mở/đóng popup không tự tích hoặc bỏ tích đồng ý; checkbox mặc định false.

Review chỉ bật khi schema chi tiết hợp lệ, ngày trong khoảng, slot thuộc options, quote mới không vấn đề, COD và đã đồng ý. Submit kiểm cùng điều kiện, token Turnstile sẵn sàng và không đang gửi. Bỏ tích tại review khóa gửi ngay; UUID/retry và response server vẫn là nguồn xác nhận.

Consent/cùng người nhận/payment/popups chỉ ở memory; không field thanh toán/consent API hoặc D1 mới. Lượt địa chỉ bổ sung migration0003 cho hai bảng danh mục và cập nhật Worker kiểm phạm vi giao. Quote vẫn debounce350ms, chỉ khi chọn đủ địa chỉ hợp lệ hoặc đổi giỏ/phương thức giao; gõ liên hệ/ghi chú và mở popup/đổi consent/payment không gọi quote. Staging zones0 nên hiện trạng thái chưa cấu hình giao và khóa review cho đến khi có địa chỉ hợp lệ.

## Kiểm chứng hiện tại

Typecheck, architecture225source, build và190tests PASS. Lượt checkout trước có186tests; lượt mới bổ sung coverage/CRUD/validation server, giữ test thiệp/consent/payment.

- check-ui-checkout-layout.mjs:12nhóm PASS,0exceptions, EN/VI,320/390/768/1440px. Kiểm form có trước địa chỉ,3khối dọc, cặp field/checkbox đúng hàng, sync/tắt sync, invalid phone, consent/review/edit, NONE→GREETING_CARD→NONE→BANNER, terms popup không navigate/đổi consent, bank rollback COD bằng Escape/nút đóng. Chỉ1quote khi chọn địa chỉ;0quote khi gõ form/thiệp/consent/payment;0POST order.
- check-ui-delivery.mjs:8nhóm PASS,0exceptions, cùng locale/viewport; city/ward search, reset, keyboard, debounce số lượng vẫn đạt.
- Browser profile riêng dùng Turnstile callback synthetic; order POST bị chặn trước local D1. Không coi đây là nghiệm thu provider hoặc tạo đơn thật. Runner browser không ghi D1 hoặc remote; migration danh mục được thực hiện riêng có authorization.

Full UI legacy còn assumptions quote-before-zone/datalist/checkout-start và chưa được nghiệm thu lại; targeted PASS không thay full suite hoặc kết quả Phase5 lịch sử. Phase6 vẫn5/7. Staging đã deploy; production không đổi. Evidence/screenshot ở .security-review/ và không vào Git; kết quả chạy mới nhất ghi tại [PROJECT_STATUS](PROJECT_STATUS.md).
