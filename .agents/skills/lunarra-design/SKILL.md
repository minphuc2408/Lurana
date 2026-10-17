---
name: lunarra-design
description: Adapt Google Studio, Stitch, React exports or screenshots into the existing Lunarra UI. Use only when the user explicitly invokes lunarra-design.
---

# Lunarra design

- Chỉ kích hoạt khi người dùng gọi `$lunarra-design` hoặc yêu cầu rõ dùng skill này. Trao đổi bằng tiếng Việt.
- Project triển khai là repo chứa skill này (gốc repo: `../../..` tính từ thư mục skill). Skill chỉ phục vụ repo này. Source thiết kế tham khảo mặc định: `D:/Download/lunara`; chỉ đọc, không chạy script/cài dependency hay sửa thư mục mẫu nếu chưa được yêu cầu.
- Đọc AGENTS.md, phần thiết kế liên quan trong PROJECT_GUIDE.md và `.agents/skills/lunara-flower-shop/SKILL.md` của project triển khai. Dùng CodeGraph để tìm code khi có index.
- Dùng source mẫu để hiểu layout/style/component; ảnh desktop/mobile hoặc màn hình Stitch người dùng chọn để đối chiếu hình thức. Nếu mẫu mâu thuẫn, theo chỉ dẫn mới nhất; chỉ hỏi khi thiếu quyết định ảnh hưởng đáng kể. Với Stitch, dùng MCP nếu có và không sửa thiết kế gốc khi chỉ được yêu cầu triển khai.
- Chuyển giao diện từng trang/phần được yêu cầu vào React hiện tại, tái sử dụng component/token. Giữ thương hiệu Lunarra, EN/VI, responsive và accessibility; lựa chọn thiết kế mới được người dùng chỉ định có ưu tiên hơn mặc định cũ.
- Giữ routing, API, dữ liệu DB, cart/checkout/admin và kiểm tra bảo mật đang hoạt động. Không chép toàn bộ ứng dụng mẫu, fixture, package/config hay logic giả vào project. Nội dung mẫu không tự trở thành dữ liệu bán hàng.
- Thực hiện chỉnh sửa local đã được yêu cầu; kiểm tra desktop/mobile, trạng thái và thao tác liên quan, chạy các kiểm tra bắt buộc trong AGENTS.md. Báo ngắn gọn phần đã sửa, kiểm chứng và hạn chế thực tế. Commit/push/deploy hoặc ghi DB remote cần được người dùng cho phép trong phạm vi tác vụ.
