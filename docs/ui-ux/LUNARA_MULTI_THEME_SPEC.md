# Lunara Shop — Multi-Theme Implementation Specification

> **Mục tiêu:** Website có **16 light themes** thông qua một Theme Switcher trên Header, **không thay đổi giao diện, bố cục, chức năng hay luồng vận hành hiện có**. Chỉ sửa code styling/theming thực sự cần thiết.

## 1. Quy tắc thực thi theo hiện trạng repository

1. **Đọc code trước khi sửa:** xác định nơi định nghĩa CSS/design tokens, cách quản lý theme, Theme Switcher, các route/component dùng chung và key `localStorage` hiện tại.
2. **Nếu đã có hệ thống 6 theme:** chỉ **bổ sung 10 theme mới**, tái sử dụng Theme Provider, registry, CSS variables và nút Theme. **Không tái cấu trúc hoặc tạo hệ thống thứ hai.**
3. **Nếu chưa có hệ thống theme:** triển khai tối giản bằng CSS custom properties + TypeScript theme registry + cơ chế lưu trạng thái phù hợp với kiến trúc React hiện tại; tạo đủ 16 theme và nút chọn theme trong Header.
4. **Nếu đã có một phần hoặc hơn 6 theme:** chỉ thêm/sửa những phần còn thiếu, tránh ghi đè các cấu hình đang hoạt động.
5. **Original:** lấy **chính xác** từ giao diện/code hiện tại; không dùng bảng màu ước lượng thay thế. Original là default/fallback khi chưa có theme hợp lệ.
6. Giữ nguyên ID, mã HEX, key lưu trữ và hành vi của **mọi theme hiện có**. Không tự ý đổi tên/ID hoặc reset sở thích đã lưu.

## 2. Danh sách 16 theme

Các cột màu là **base palette**, theo thứ tự `background`, `secondary`, `soft-surface`, `accent`, `foreground`. Các semantic token bổ sung được suy ra từ palette và kiểm chứng về tương phản; không mặc định dùng `accent` làm nền nút có chữ trắng nếu không đủ tương phản.

| # | Theme | ID gợi ý nếu chưa tồn tại | Background | Secondary | Soft surface | Accent | Foreground |
|---|---|---|---|---|---|---|---|
| 1 | Original | *Giữ nguyên ID hiện tại* | *Đọc từ code* | *Đọc từ code* | *Đọc từ code* | *Đọc từ code* | *Đọc từ code* |
| 2 | Sage Green | `sage-green` | `#FAFAF7` | `#F2F5EF` | `#E5EBE0` | `#5B7164` | `#37453D` |
| 3 | Champagne | `champagne` | `#FAF9F6` | `#F7F1E8` | `#EDE4D6` | `#786958` | `#4F463E` |
| 4 | Powder Blue | `powder-blue` | `#FAFBFC` | `#F0F5F9` | `#E3ECF3` | `#5B7386` | `#3B4E5C` |
| 5 | Lavender Mist | `lavender-mist` | `#FAF9FC` | `#F5F1FA` | `#EBE4F3` | `#786786` | `#4E4557` |
| 6 | Peach Cream | `peach-cream` | `#FCFAF7` | `#FFF3EA` | `#F8E5D8` | `#956E60` | `#594A44` |
| 7 | Butter Cream | `butter-cream` | `#FCFBF6` | `#FCF6DE` | `#F7EBC1` | `#776237` | `#4A4232` |
| 8 | Mint Sorbet | `mint-sorbet` | `#F8FCFA` | `#F0F9F4` | `#DDF0E6` | `#4E786B` | `#34564E` |
| 9 | Sea Glass | `sea-glass` | `#F8FBFB` | `#EBF6F5` | `#D5EAE7` | `#42766F` | `#2E514F` |
| 10 | Pistachio Milk | `pistachio-milk` | `#FBFCF8` | `#F3F7E7` | `#E6EDCC` | `#6C7950` | `#414C35` |
| 11 | Cloud Silver | `cloud-silver` | `#FAFAFB` | `#F2F4F5` | `#E6EAED` | `#5E707A` | `#39474E` |
| 12 | Oat Taupe | `oat-taupe` | `#FBF9F7` | `#F4EEE9` | `#E8DDD6` | `#78665D` | `#4C403C` |
| 13 | Dusty Mauve | `dusty-mauve` | `#FCFAFB` | `#F8F0F4` | `#EDDDE6` | `#866776` | `#51414A` |
| 14 | Periwinkle Milk | `periwinkle-milk` | `#FAFAFE` | `#F1F2FC` | `#E1E5F7` | `#626C99` | `#3E4565` |
| 15 | Coral Shell | `coral-shell` | `#FDFAF9` | `#FCF1EF` | `#F5DDD8` | `#936158` | `#5E423D` |
| 16 | Linen Olive | `linen-olive` | `#FBFAF6` | `#F4F3E9` | `#E8E7D1` | `#6E7253` | `#424637` |

**Lưu ý:** Các ID của theme 2–6 trong bảng chỉ là **gợi ý**; nếu code hiện hành dùng ID khác thì phải **giữ nguyên ID đã triển khai**. Theme 7–16 dùng ID đã chỉ định ở bảng nếu chưa có.

## 3. Quy tắc phối màu và kỹ thuật

- Tất cả là **light themes**: nền off-white/trắng ngà khoảng 70–80%, pastel khoảng 15–25%, màu đậm chỉ 5–10% ở CTA hoặc điểm nhấn (tỷ lệ định hướng, không phải đo lường pixel bắt buộc).
- Không dùng `#FFFFFF` làm **nền chính toàn trang**; có thể dùng trắng cho chữ trên nút nếu đủ tương phản.
- Không thêm mảng tối lớn, gradient mạnh, màu bão hòa hoặc shadow nặng; ưu tiên phân cấp surface/card/section bằng các sắc độ nhẹ.
- Sử dụng **semantic design tokens** (tái dùng hệ thống hiện có): `background`, `foreground`, `surface`, `surface-muted`, `card`, `border`, `primary`, `primary-hover`, `primary-foreground`, `secondary`, `muted-text`, `input`, `focus-ring` và các token mà code đang phụ thuộc. Không hardcode HEX tại component khi đã có token.
- Bổ sung hover/active/disabled/focus đủ rõ, đảm bảo **WCAG AA**: chữ thường tối thiểu 4.5:1, chữ lớn tối thiểu 3:1, ranh giới control/focus thiết yếu tối thiểu 3:1 khi áp dụng. **Nếu accent gốc không đủ cho CTA**, tạo biến thể semantic đậm hơn **chỉ cho theme mới**, giữ năm base HEX đã cung cấp.
- Màu `success`, `warning`, `error` tiếp tục biểu thị đúng trạng thái; không đổi ngẫu nhiên theo màu thương hiệu.
- Không sao chép 16 bộ component/CSS riêng. Không thêm dependency lớn khi React + CSS đã đáp ứng.

## 4. Theme Switcher trong Header

- Chỉ **một** nút `Theme` trên Header hiện có (nếu đã có thì **giữ và mở rộng**, không tạo nút thứ hai).
- Dropdown/popover hiển thị đủ 16 tên theme, kèm 3–5 ô màu preview và dấu check của lựa chọn hiện tại.
- Giữ bố cục header; với 16 mục, thêm chiều cao tối đa + cuộn hoặc phân nhóm `Existing` / `New` khi cần, đảm bảo desktop/mobile.
- Chọn theme đổi màu ngay, không reload. Hỗ trợ keyboard, Escape, click ngoài, accessible name và focus indicator.
- Giữ key `localStorage` hiện tại; chỉ khởi tạo key mới nếu repository chưa có; fallback về Original nếu dữ liệu không hợp lệ.
- Đồng nhất theme khi đổi route, refresh và quay lại website; hạn chế flash sai theme khi tải lần đầu.

## 5. Phạm vi, giới hạn thay đổi

**Áp dụng các trang/khối hiện có:** Header, Home/Hero, Catalog, Product Detail, Cart, Checkout, Form/Input, Footer, Modal, Toast, Dropdown và các route liên quan. Admin chỉ áp dụng nếu **đang dùng chung design system**; không ép admin dùng theme shop nếu đang tách biệt.

**Không chỉnh sửa:** bố cục, kích thước, spacing, typography, responsive behavior, ảnh sản phẩm, logo, routing, APIs, Cloudflare Workers, D1, Cloudinary, Turnstile, authentication, validation, checkout, business logic; ngoại trừ sửa styling trực tiếp cần để các theme hoạt động đúng.

## 6. Kiểm thử và kết quả bàn giao

1. Đúng **16 theme**, không trùng ID. Original và mọi theme có sẵn giữ nguyên palette và hành vi.
2. Đủ semantic tokens ở 10 theme mới; không trộn màu khi đổi theme/route hoặc quay về Original.
3. Dropdown usable trên desktop/mobile; chọn/check, Escape, click ngoài, keyboard hoạt động.
4. Refresh/điều hướng vẫn giữ lựa chọn đã lưu; fallback đúng; hạn chế flash màu khi boot.
5. Kiểm tra Home, các route chính, card, button, input, modal, footer và các trạng thái tương tác; kiểm tương phản thực tế trên UI, đặc biệt chữ trên primary button.
6. Chạy typecheck, build, test hiện có; nêu rõ PASS/FAIL và các bước chưa kiểm chứng nếu có. Không deploy production trừ khi được yêu cầu rõ ràng.
7. Báo cáo ngắn: **file đã sửa**, **đã thêm/sửa gì**, **kết quả test**, **vấn đề còn lại**. Không chỉnh tài liệu hoặc file ngoài phạm vi nếu không cần thiết.

## Hiện trạng triển khai — 17/10/2026

- Source trước thay đổi chưa có registry/switcher hoặc preference theme; đã triển khai Original + 15 palette trong bảng, không phải mở rộng một bộ 6 theme có sẵn. Registry: `src/shared/theme/themes.ts`; state/bootstrap: `theme-store.ts`, gọi trước `createRoot`.
- Preference mới `lunara.theme.v1` chỉ lưu ID. ID không hợp lệ/storage bị chặn về Original; đổi theme vẫn dùng được trong bộ nhớ. Theme đi theo route và đồng bộ storage event; không thay key giỏ hàng/ngôn ngữ.
- Header dùng lại `Dropdown`/Radix với preview 5 màu, check, scroll và keyboard. Theme mới ánh xạ token Lunara/generic, editorial, footer và control; màu trạng thái và token riêng của admin giữ nguyên. Original xóa override, giữ cả màu footer cũ cùng các hạn chế tương phản sẵn có.
- Base HEX của 15 palette mới được giữ. CTA/body/control/focus được suy ra có kiểm tương phản; footer của theme mới dùng secondary sáng. Bằng chứng kiểm tra và giới hạn nằm tại [PROJECT_STATUS](../PROJECT_STATUS.md).

## Prompt gọi AI (ngắn)

> Đọc kỹ file `LUNARA_MULTI_THEME_SPEC.md` và code thực tế của dự án Lunara trước khi sửa. Triển khai/hoàn thiện Theme Switcher trên Header để hỗ trợ tổng cộng 16 light themes đúng bảng màu và yêu cầu trong file. Nếu đã có 6 theme thì chỉ mở rộng thêm 10, giữ nguyên hoàn toàn 6 theme cũ, key localStorage, UI/UX, routing và business logic. Tái sử dụng kiến trúc theme hiện có, tránh refactor ngoài phạm vi. Sau khi sửa, kiểm tra responsive, persistence, accessibility; chạy typecheck/build/tests và báo cáo file thay đổi, kết quả kiểm thử. Không deploy.
