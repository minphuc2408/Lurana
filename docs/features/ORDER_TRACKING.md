# Tra cứu đơn hàng Lunarra

Explanation cho frontend/QA và chủ shop về UX tại `/orders/track`, quyết định giao diện 18/10, hợp nhất tài liệu 19/10/2026. [API_CONTRACT](../reference/API_CONTRACT.md#post-apiorderslookup) sở hữu POST payload/DTO/lỗi; mở URL API trong browser không gửi POST. [PROJECT_STATUS](../PROJECT_STATUS.md) giữ mức triển khai/nghiệm thu.

## Nhập và nhận kết quả

Người dùng nhập mã đơn và SĐT người đặt hoặc người nhận, hoàn tất xác minh rồi bấm Tra đơn. `?order=` chỉ điền sẵn mã từ confirmation, không tự tra cứu hoặc đưa SĐT lên URL. Kết quả hiện trạng thái, người nhận, lịch/phương thức giao, COD, thiệp/ghi chú, items và tổng từ API.

Tiến trình PENDING → CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED xếp dọc trên màn hình nhỏ, năm cột từ 768 px. CANCELLED chỉ đánh dấu mốc có trong history, không có bước hiện tại; thời điểm/lý do hủy lấy sự kiện hủy gần nhất. Có thể mở lịch sử đầy đủ bên dưới.

## Lỗi và quyền riêng tư

Đổi mã/SĐT xóa kết quả cũ, hủy read đang chạy và bỏ response trễ. Reload/rời trang mất dữ liệu tra cứu; memory/storage ownership tại [FRONTEND_ENTITIES](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu). Loading/not-found/error có thông báo và cho gửi lại với xác minh mới; không polling hoặc dùng đơn mẫu.

Nút liên hệ hiện chứa số cố định `0987656789` trong component, **chưa được owner xác minh là hotline kinh doanh**. Việc xác minh nội dung shop vẫn pending trong Status.

## Thiết kế và kiểm chứng

Ngày 20/10 owner thay tiêu đề/divider bằng breadcrumb chung ở đầu trang; giữ h1 ẩn cho accessibility. Panel nhập không border, nền tràn toàn viewport; form bên trong và kết quả vẫn căn theo content container. Monochrome panel dùng trắng bước 0 (`#FFFFFF`), nút 200→300 khi hover, chữ/icon 900→950 để không chìm vào nền. Input không viền khi nghỉ/focus, pointer bỏ outline còn Tab giữ focus; [design system](../ui-ux/DESIGN_SYSTEM.md#interaction-và-accessibility) sở hữu tokens và input rules. Không đổi payload, Turnstile, lỗi hay dữ liệu kết quả.

[Runner lookup](../../scripts/check-ui-order-lookup.mjs) kiểm trạng thái/timeline, EN/VI, 320–1440 px, response trễ/lỗi/privacy bằng API/challenge giả lập, không tạo đơn. Nghiệm thu challenge thật/đơn cloud là phạm vi riêng; [cách chạy](../LOCAL_DEVELOPMENT.md#build-preview-và-kiểm-tra).
