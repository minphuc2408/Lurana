# Lunarra

> Tiến trình Tra đơn17/10/2026 (local): chỉ chỉnh section tiến trình theo ảnh owner — tiêu đề serif/gạch rose,5icon tròn/đường nối/số bước, nhấn riêng bước hiện tại; nhãn Tiếp nhận/Dưỡng hoa/Cắm hoa & chép thiệp/Đang vận chuyển/Đã trao tận tay và EN tương ứng. Giữ mapping trạng thái API và lịch sử đơn hủy; desktop ngang/mobile dọc. Typecheck, architecture234source,191/191tests, build và72ca browser EN/VI PASS (API/challenge giả lập,0exceptions/0order writes). Không đổi phần tra cứu khác/API/Worker/DB/dependency. Owner cho phép commit/push lên nhánh feature trong lượt này; chưa deploy.


Lunarra là website bán hoa với giao diện mua sắm và trang quản trị dành cho cửa hàng. Dự án hỗ trợ tiếng Việt và tiếng Anh, hiển thị giá bằng VND.

## Chức năng chính

- Xem danh mục, tìm kiếm sản phẩm và chọn kích thước hoa.
- Quản lý giỏ hàng, nhập thông tin giao hoa, chọn thiệp và đặt hàng COD.
- Tra cứu tiến trình đơn hàng bằng mã đơn và số điện thoại.
- Giới thiệu thương hiệu qua trang Câu chuyện.
- Quản trị sản phẩm, hình ảnh, tồn kho, đơn hàng và phí giao theo khu vực.

## Công nghệ

React, TypeScript, Vite, Tailwind CSS và React Router cho giao diện; Hono trên Cloudflare Workers cùng D1 cho API và dữ liệu. Cloudinary quản lý ảnh, Turnstile xác minh bảo mật.

Phiên bản, kiến trúc và cấu hình chi tiết: [Tech stack](docs/TECH_STACK.md).

## Chạy local

Yêu cầu Node.js 22 trở lên và npm. Trước lần chạy đầu tiên, làm theo [hướng dẫn thiết lập](PROJECT_GUIDE.md), bao gồm cấu hình môi trường và khởi tạo D1 local.

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, mặc định [127.0.0.1:5173](http://127.0.0.1:5173). Checkout, tra cứu đơn và đăng nhập quản trị cần cấu hình Turnstile; xem [hướng dẫn xác minh](docs/BOT_PROTECTION.md).

## Tài liệu

| Nội dung | Tài liệu |
| --- | --- |
| Tổng quan code, thiết lập và quy ước phát triển | [Sổ tay dự án](PROJECT_GUIDE.md) |
| Hiện trạng, kết quả kiểm tra và các việc còn lại | [Trạng thái dự án](docs/PROJECT_STATUS.md) |
| Phạm vi và các giai đoạn triển khai | [Pipeline](docs/pipeline/README.md) |
| Giao diện và luồng giỏ hàng–đặt hoa | [Checkout UI](docs/CHECKOUT_UI.md) |
| Cấu trúc dữ liệu | [Database](docs/DATABASE_DESIGN.md) · [Frontend entities](docs/FRONTEND_ENTITIES.md) |
| API | [API contract](docs/pipeline/API_CONTRACT.md) |
| Triển khai và vận hành | [Staging](docs/STAGING.md) · [Operations](docs/OPERATIONS.md) |

## Người thực hiện

- [@minphuc2408](https://github.com/minphuc2408)
- [@minphuc8042](https://github.com/minphuc8042)

## Ghi nhận nguồn

Thiết kế Figma gốc: [Flower Shop Website Design](https://www.figma.com/design/0YRitOqUypqP0K0esw8sXL/Flower-Shop-Website-Design--Copy---Community-). Nguồn ảnh và thư viện: [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
