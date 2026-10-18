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

Ưu tiên khoảng 65–75% off-white, 15–20% surface trung tính/pastel và phần diện tích còn lại dành cho các accent có kiểm soát.

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

## Hiện trạng triển khai — 18/10/2026

- **Behavior:** Registry có21theme:16palette cũ +5creative ở trên. Menu hiện có giữ preview5màu cho palette cũ, hiển thị đủ6màu cho creative; preference vẫn `lunara.theme.v1`, áp dụng trước render và đi theo route/reload.
- **Decision:** Giữ nguyên6HEX của mỗi creative. CTA/active/focus dùng primary đủ tương phản; secondary tô cánh logo, bản đậm dành cho icon dịch vụ/Home/chi tiết; tertiary tô lá logo và nền số bước Journey với chữ tối. Soft surface là12%secondary-accent +88%background; card trắng, section/footer dùng secondary-background. Không đổi layout/font/status/token riêng admin.
- **Compatibility:** Token mới có fallback về màu cũ; theme cũ không thêm override. Snapshot16palette/semantic colors trước mở rộng được khóa trong `tests/themes.test.mjs`; về Original xóa mọi override, kể cả accent mới.
- **Source:** `src/shared/theme/themes.ts`, `src/styles/brand.css`, `ThemeSwitcher`, `MainLayout`, `Benefits`, `ProductDetailView`. [Spec nền](LUNARA_MULTI_THEME_SPEC.md); kiểm chứng local và giới hạn tại [PROJECT_STATUS](../PROJECT_STATUS.md).
