# TASK: Extend Lunara Multi-Theme — 5 Creative Multicolor Brand Themes

## 1. Mục tiêu

Tôi đã triển khai hệ thống Theme Switcher cho Lunara Shop và hiện hài lòng với thiết kế giao diện, bố cục, component và UX.

Tôi muốn bổ sung 5 theme mới theo phong cách **Creative Floral Branding / Multicolor Editorial**.

Các theme trước chủ yếu sử dụng màu đơn sắc với các sắc độ từ nhạt đến đậm. Lần này tôi muốn mỗi theme kết hợp nhiều họ màu khác nhau, có tính tương phản và cá tính thương hiệu mạnh hơn.

Đây là nhiệm vụ mở rộng hệ thống màu sắc, KHÔNG phải redesign giao diện.

## 2. Năm bảng màu mới

Mỗi theme gồm 6 màu theo thứ tự:

`background / secondary-background / primary-accent / secondary-accent / tertiary-accent / foreground`

### Theme A — Wildflower Pop
ID: `wildflower-pop`

- Background: `#FBFAF6`
- Secondary background: `#FFF3ED`
- Primary accent: `#B94E66`
- Secondary accent: `#7DB9C4`
- Tertiary accent: `#D4D877`
- Foreground: `#383943`

Kết hợp hồng berry, xanh biển pastel và vàng chanh. Trẻ trung, tươi vui, giàu năng lượng.

### Theme B — Cobalt Citrus
ID: `cobalt-citrus`

- Background: `#FAFAF7`
- Secondary background: `#EEF0FF`
- Primary accent: `#3D57AB`
- Secondary accent: `#F4B65B`
- Tertiary accent: `#A8CFA0`
- Foreground: `#293250`

Kết hợp xanh cobalt, cam quýt và xanh lá nhạt. Hiện đại, có tính tương phản và nhận diện cao.

### Theme C — Orchid Picnic
ID: `orchid-picnic`

- Background: `#FCFAF9`
- Secondary background: `#F2EBF8`
- Primary accent: `#954F9D`
- Secondary accent: `#E47558`
- Tertiary accent: `#D8DD8B`
- Foreground: `#4A3A4F`

Kết hợp tím orchid, cam san hô và vàng olive nhạt. Nghệ thuật, sáng tạo, mềm mại.

### Theme D — Ocean Confetti
ID: `ocean-confetti`

- Background: `#F8FBFA`
- Secondary background: `#E9F5F3`
- Primary accent: `#147A81`
- Secondary accent: `#F18EAD`
- Tertiary accent: `#F3CF70`
- Foreground: `#27464B`

Kết hợp xanh teal, hồng kẹo và vàng nắng. Tươi mới, mát mẻ nhưng vẫn nổi bật.

### Theme E — Folk Bloom
ID: `folk-bloom`

- Background: `#FBF9F3`
- Secondary background: `#F3E6D7`
- Primary accent: `#A64740`
- Secondary accent: `#8EA7D2`
- Tertiary accent: `#96B06A`
- Foreground: `#4B3736`

Kết hợp đỏ gạch, xanh periwinkle và xanh olive. Có tính thủ công, nghệ thuật và cá tính boutique.

## 3. Quy tắc sử dụng màu

Đây là MULTICOLOR THEME, không phải MONOCHROMATIC THEME.

Tuyệt đối không biến 3 màu accent thành 3 sắc độ của một màu duy nhất.

Mỗi màu phải có vai trò rõ ràng:

- Background: nền tổng thể, ưu tiên off-white.
- Secondary background: section, banner hoặc khối nền phụ.
- Primary accent: CTA chính, active state và các tương tác ưu tiên.
- Secondary accent: điểm nhấn phụ, tag, icon, chi tiết thương hiệu hoặc các section có chủ đích.
- Tertiary accent: badge, chip, yếu tố trang trí nhỏ, điểm nhấn chiến dịch.
- Foreground: tiêu đề, văn bản và nội dung cần đọc.

Không chia đều diện tích cho tất cả màu.

Theo quyết định refactor19/10, ưu tiên khoảng90% cảm nhận là nền/giấy sáng và ảnh hoa; primary dẫn hướng tương tác, secondary/tertiary là chi tiết nhỏ. Đây là hướng dẫn thị giác, không áp tỷ lệ pixel cứng.

Không dùng nhiều màu mạnh cạnh nhau trong những khu vực chứa nhiều thông tin.

Một component chỉ nên có một màu nhấn chính; không phối màu ngẫu nhiên giữa các button, icon và border.

Trong toàn bộ website, các màu accent phải được sử dụng có chủ đích để tạo nhận diện thương hiệu đồng nhất.

## 4. Kiến trúc theme

Trước khi sửa code, hãy đọc và kiểm tra hệ thống theme thực tế đang có.

Yêu cầu:

1. Tái sử dụng Theme Provider và CSS Variables hiện tại.
2. Bổ sung 5 theme vào theme registry.
3. Giữ nguyên mọi theme cũ, bao gồm Original.
4. Không đổi theme IDs hoặc localStorage key đang sử dụng.
5. Nếu design tokens hiện chỉ hỗ trợ một accent, hãy mở rộng hợp lý với secondary-accent và tertiary-accent.
6. Các theme cũ phải có fallback tương thích, không bị đổi màu ngoài ý muốn.
7. Hoàn thiện các semantic tokens cho text, card, border, input, hover, focus và button.
8. Kiểm tra độ tương phản WCAG AA cho văn bản và nút quan trọng.
9. Không dùng secondary/tertiary accent nhạt với chữ trắng nếu không đủ tương phản.
10. Không làm sai ý nghĩa các màu success, warning, error.

## 5. Theme Switcher

Thêm 5 lựa chọn mới vào Theme Switcher hiện tại.

Mỗi lựa chọn cần hiển thị:
- Tên theme.
- Preview các màu trong palette.
- Trạng thái đang chọn.

Giữ nguyên chức năng chuyển theme, lưu localStorage, khôi phục sau refresh và đồng bộ giữa các route.

Không cần xây dựng lại Theme Switcher.

## 6. Phạm vi

Các theme mới phải hoạt động đồng nhất trên:

- Storefront và Homepage.
- Product Cards và Product Details.
- Cart và Checkout.
- Header và Footer.
- Forms, Modals, Dropdowns.
- Khu vực Admin nếu đang sử dụng chung hệ thống theme.

Đối với Admin, ưu tiên sự rõ ràng và dễ đọc hơn yếu tố trang trí nhiều màu.

Chỉ thay đổi màu sắc và các style trực tiếp liên quan đến theme.

KHÔNG thay đổi layout, typography, router, responsive, business logic, API, database, authentication hoặc các chức năng hiện tại.

## 7. Kiểm thử

- Kiểm tra đủ 5 theme mới.
- Kiểm tra không trùng ID.
- Các theme cũ giữ nguyên.
- Không xảy ra lỗi đổi theme khi chuyển route.
- Không xuất hiện màu cũ bị hardcode trong theme mới.
- Button, bảng dữ liệu và form dễ đọc.
- Kiểm tra desktop/mobile.
- Build và typecheck thành công.

## Kết quả mong muốn

Tôi muốn 5 theme mới mang bản sắc thương hiệu Lunara rõ ràng hơn: phá cách, nhiều màu, trẻ trung và giàu tính nghệ thuật nhưng vẫn gọn gàng, nhẹ nhàng và dễ sử dụng.

**Hãy tạo sự khác biệt bằng cách phối nhiều màu có chủ đích, không phải bằng cách tăng độ bão hòa hoặc làm giao diện trở nên lòe loẹt.**

Giữ nguyên toàn bộ thiết kế tôi đang hài lòng; chỉ mở rộng khả năng biểu đạt màu sắc của thương hiệu.

## Hiện trạng triển khai — 19/10/2026

- **Behavior:**21theme,16palette/semantic snapshot cũ và6HEX của mỗi creative giữ nguyên; `lunara.theme.v1`, bootstrap/persistence và6swatches không đổi. Surface sáng → primary cho tương tác → secondary/tertiary ở logo/nét minh họa nhỏ.
- **Decision:** Mapping cũ tô secondary lên utility, tertiary lên nhãn Hero/icon và nền Journey; Radix highlight bao gồm pointer focus nên CSS outline theo `data-highlighted` tạo viền thừa. Mapping mới và trạng thái bên dưới thay audit18/10; không sửa layout/font/ảnh hay nghiệp vụ.
- **Source:** `themeTokens()` trong `src/shared/theme/themes.ts`, `brand.css`; menu dùng `dropdown.tsx`/`StorefrontNavigation.tsx`. Menu ghi phương thức pointer/keyboard cục bộ; CSS chỉ override5creative, giữ nguyên trạng thái16theme cũ. Pointer dùng surface nhạt; checked dùng check + primary text; keyboard có outline primary2px; route active dùng primary.

## Phân bổ màu và kiểm chứng

| Vùng | Trước refactor | Hiện tại |
| --- | --- | --- |
| Utility | Secondary gốc toàn dải | Secondary background sáng, ink/body, divider chuẩn |
| Hero/category | Tertiary gốc phủ nhãn | Transparent, chữ primary |
| Journey | Tertiary-soft +3ô tertiary | Secondary background sáng, icon transparent/nét secondary-strong |
| Quick-add/link quan trọng | Secondary-soft/strong | Card trắng, primary; hover primary/on-primary |
| Footer/Story/Featured | Heading/link secondary; divider secondary/tertiary | Heading ink, footer link body/hover primary, divider chuẩn |
| Cá tính3accent | Mảng section khác màu | Primary CTA; secondary/tertiary gốc ở logo, secondary-strong ở icon nhỏ |

- **Checks:** `scripts/check-ui-creative-colors.mjs <loopback preview> before|after` tạo baseline, computed states và ảnh5theme ×1440/390px ×7vùng, cộng10ảnh ghép trong `.security-review/creative-hierarchy-audit/`; `index.html` chọn theme/kích thước/vùng. So geometry/type/content và96ca computed styles legacy Home/Admin; kiểm text≥4.5:1, control/focus≥3:1 trên surface thực. [PROJECT_STATUS](../PROJECT_STATUS.md) ghi kết quả đã chạy và giới hạn.
- **Review:** Dùng cùng catalog/admin tổng hợp, ảnh hoa mẫu local và font cache trước/sau; không ghi API hoặc suy ra nghiệm thu provider/cloud/thiết bị vật lý. [Spec16theme](LUNARA_MULTI_THEME_SPEC.md) giữ palette nền.
