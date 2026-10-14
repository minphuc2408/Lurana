# Hướng dẫn thiết kế Lunara

Quy tắc chung nằm ở [AGENTS.md](../AGENTS.md). Bản đồ project, palette, component hiện có, giới hạn demo và đề xuất phát triển nằm ở [PROJECT_GUIDE.md](../PROJECT_GUIDE.md).

Khi xây UI/nghiệp vụ, dùng skill [lunara-flower-shop](../.agents/skills/lunara-flower-shop/SKILL.md).

| Keyword | Quy ước |
| --- | --- |
| Palette | `src/styles/brand.css`, utility `lunara-*` |
| Typography | `font-display` / `font-body`; EN: Cormorant Garamond / Jost; VI: Lora / Be Vietnam Pro |
| Primitive | `src/shared/ui/`: Button, Input, Dialog |
| Commerce | Preview Home/Shop/Cart/Delivery/Quote dùng D1/VND, cart localStorage; API COD/tra đơn đã có, UI gửi/tra đơn chưa nối; auth/admin và features ngoài preview ẩn |
| Worker | Phase 0–3 DONE local: health/catalog/delivery/quote/orders/lookup, transitionOrder nội bộ hoàn tồn một lần; Phase 4 auth/admin và Phase 6 deploy PLANNED, Phase 5 PARTIAL |

Code hiện tại và yêu cầu mới của chủ dự án là căn cứ quyết định. Cập nhật sổ tay khi thay đổi kiến trúc hoặc tiêu chuẩn; không duy trì một bản rule mâu thuẫn trong thư mục này.
