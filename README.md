# Lunarra

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

Chuẩn bị Node.js/npm, cấu hình môi trường và khởi tạo D1 local theo [hướng dẫn phát triển local](docs/LOCAL_DEVELOPMENT.md) trước lần chạy đầu tiên.

```bash
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, mặc định [127.0.0.1:5173](http://127.0.0.1:5173). Checkout, tra cứu đơn và đăng nhập quản trị cần cấu hình Turnstile; xem [hướng dẫn xác minh](docs/operations/BOT_PROTECTION.md).

## Môi trường

[Staging](https://lunara-staging.minphuc2408.workers.dev) · [Production](https://lunara.minphuc2408.workers.dev). Hai URL có mốc xác minh trong [trạng thái dự án](docs/PROJECT_STATUS.md#môi-trường-được-ghi-nhận); đối chiếu phạm vi nghiệm thu và việc còn thiếu ở đó trước khi sử dụng.

## Tài liệu

| Nội dung | Tài liệu |
| --- | --- |
| Tìm tài liệu sở hữu từng chủ đề | [Chỉ mục dự án](PROJECT_GUIDE.md) |
| Kiến trúc, module và ownership | [Kiến trúc](docs/ARCHITECTURE.md) |
| Cài đặt, chạy và kiểm tra local | [Phát triển local](docs/LOCAL_DEVELOPMENT.md) |
| Typography, semantic tokens, theme và accessibility | [Design system](docs/ui-ux/DESIGN_SYSTEM.md) |
| Hiện trạng từng môi trường, blocker và việc tiếp theo | [Trạng thái dự án](docs/PROJECT_STATUS.md) |
| Đối chiếu các mốc kiểm chứng và triển khai cũ ngoài nghiệm thu phase | [Lịch sử kiểm chứng](docs/archive/VERIFICATION_HISTORY.md) |
| Phạm vi và các giai đoạn triển khai | [Pipeline](docs/pipeline/README.md) |
| Giao diện và luồng giỏ hàng–đặt hoa | [Checkout UI](docs/features/CHECKOUT_UI.md) |
| Cấu trúc dữ liệu | [Database](docs/reference/DATABASE_DESIGN.md) · [Frontend entities](docs/reference/FRONTEND_ENTITIES.md) |
| Tra đơn: chức năng và endpoint | [Tra đơn](docs/features/ORDER_TRACKING.md) |
| API | [API contract](docs/reference/API_CONTRACT.md) |
| Triển khai và vận hành | [Staging](docs/operations/STAGING.md) · [Operations](docs/operations/OPERATIONS.md) |

## Người thực hiện

- [@minphuc2408](https://github.com/minphuc2408)
- [@minphuc8042](https://github.com/minphuc8042)

## Ghi nhận nguồn

Thiết kế Figma gốc: [Flower Shop Website Design](https://www.figma.com/design/0YRitOqUypqP0K0esw8sXL/Flower-Shop-Website-Design--Copy---Community-). Nguồn ảnh và thư viện: [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
