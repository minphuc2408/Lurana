# Tra cứu đơn hàng

Cập nhật 17/10/2026: chức năng đã hoàn thiện giao diện EN/VI tại `/orders/track`. Tiêu đề căn giữa trên nền blush; form, lỗi và kết quả cùng khung tối đa 1240px, xếp lại theo màn hình.

- Trang: [local /orders/track](http://127.0.0.1:5173/orders/track) · [staging /orders/track](https://lunara-staging.minphuc2408.workers.dev/orders/track).
- API: `POST /api/orders/lookup`; [payload, response và lỗi](pipeline/API_CONTRACT.md#post-apiorderslookup). Mở URL API trong trình duyệt không thực hiện được yêu cầu POST.

Người dùng nhập mã đơn và SĐT người đặt hoặc người nhận, hoàn tất xác minh rồi bấm Tra đơn. Tham số `?order=` chỉ điền sẵn mã từ màn hình xác nhận; không tự tra cứu. Kết quả hiển thị trạng thái, thông tin người nhận, lịch/phương thức giao, thanh toán COD, thiệp/ghi chú, dòng sản phẩm và tổng tiền từ API.

Tiến trình gồm `PENDING → CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED`: màn hình nhỏ xếp dọc, từ 768px có 5 cột. Đơn `CANCELLED` chỉ đánh dấu mốc xuất hiện trong lịch sử, không có bước hiện tại; thời điểm/lý do hủy lấy từ sự kiện hủy gần nhất. Lịch sử đầy đủ có thể mở bên dưới kết quả.

Dữ liệu khách và token chỉ ở memory. Đổi mã/SĐT xóa kết quả cũ, hủy request đang đọc và bỏ response về trễ; reload/rời trang không giữ thông tin tra cứu. Có trạng thái loading, không tìm thấy và lỗi; người dùng gửi lại sau khi xác minh mới. Không dùng đơn mẫu hoặc polling. Nút liên hệ dùng số cố định `0987656789` trong component; chưa xác minh đây là hotline kinh doanh thực tế.

[Runner giao diện](../scripts/check-ui-order-lookup.mjs) kiểm các trạng thái, EN/VI, bố cục 320–1440px, lỗi, response trễ và privacy bằng API/challenge giả lập; không tạo đơn. Kết quả kiểm chứng và bản staging đã triển khai nằm tại [PROJECT_STATUS](PROJECT_STATUS.md). Thành công với challenge thật và đơn cloud cần nghiệm thu riêng.
