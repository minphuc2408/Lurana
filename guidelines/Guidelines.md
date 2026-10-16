# Hướng dẫn thiết kế Lunara Shop

Đối chiếu16/10/2026; trạng thái cloud và các mốc kiểm chứng ở [PROJECT_STATUS](../docs/PROJECT_STATUS.md).

Quy tắc chung nằm ở [AGENTS.md](../AGENTS.md). Bản đồ project, palette, component hiện có, giới hạn demo và đề xuất phát triển nằm ở [PROJECT_GUIDE.md](../PROJECT_GUIDE.md).

Khi xây UI/nghiệp vụ, dùng skill [lunara-flower-shop](../.agents/skills/lunara-flower-shop/SKILL.md).

| Keyword | Quy ước |
| --- | --- |
| Palette | `src/styles/brand.css`, utility `lunara-*` |
| Typography | `font-display` / `font-body`; EN: Cormorant Garamond / Jost; VI: Lora / Be Vietnam Pro |
| Primitive | `src/shared/ui/`: Button, Input, Dialog |
| Commerce | Home/Shop/Cart/Delivery/Quote, checkout COD/retry/xác nhận/lookup và cookie admin đã nối API; localStorage chỉ cart IDs/quantity và locale. Customer auth/profile/wishlist/request/admin customers/settings/notifications source giữ ẩn |
| Worker | Phase 0–5 DONE local; Phase 6 IN PROGRESS5/7. Local có Turnstile/rate-limit/cap PENDING/Cron24h; staging đã deploy bản mới, production còn bản cũ; cả hai thiếu TURNSTILE_SECRET |

Code hiện tại và yêu cầu mới của chủ dự án là căn cứ quyết định. Cập nhật sổ tay khi thay đổi kiến trúc hoặc tiêu chuẩn; không duy trì một bản rule mâu thuẫn trong thư mục này.
