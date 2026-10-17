# Hướng dẫn thiết kế Lunarra

Đối chiếu source ngày **17/10/2026**. Đây là chỉ mục quy ước UI; quy tắc làm việc nằm ở [AGENTS.md](../AGENTS.md), hướng dẫn chi tiết ở [PROJECT_GUIDE.md](../PROJECT_GUIDE.md).

Khi xây UI/nghiệp vụ, dùng skill [lunara-flower-shop](../.agents/skills/lunara-flower-shop/SKILL.md).

| Keyword | Quy ước |
| --- | --- |
| Palette | `src/styles/brand.css`, utility `lunara-*` |
| Typography | `font-display` / `font-body`; EN: Fraunces 500, kể cả italic / Inter; VI: Lora Regular 400, kể cả italic / Be Vietnam Pro. Font theo locale từ `html`, gồm cả portal |
| Primitive | `src/shared/ui/`: Button, Input, Dialog, Dropdown và Combobox; tái sử dụng trước khi thêm primitive |
| Trạng thái UI | Có loading/error/empty/success, label và focus bàn phím; không mô phỏng thành công cho tính năng chưa có API |
| Khả năng tiếp cận | CTA chữ trắng dùng `lunara-rose-strong`; kiểm độ tương phản, responsive và reduced motion khi đổi giao diện |

Code hiện tại và yêu cầu của chủ dự án là căn cứ quyết định. Trạng thái tính năng và triển khai xem [PROJECT_STATUS.md](../docs/PROJECT_STATUS.md).
