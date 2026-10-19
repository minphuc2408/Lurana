# Lunara Shop — Multi-Theme Implementation Specification

> **Hiện tại:** Website có **21 light themes** qua một Theme Switcher trên Header:16palette nền trong tài liệu này và5creative theo [Extend Lunara Multi Theme](Extend_Lunara_Multi_Theme.md). Phần mở rộng giữ nguyên16palette cũ; quy tắc/mapping3accent thuộc tài liệu Extend. Owner ngày18/10 yêu cầu Home/ảnh/Original theo ref, sau đó yêu cầu bỏ tình trạng UI xanh trộn hồng. Footer giữ bố cục/copy, màu đi theo theme; logo và placeholder cũng dùng token của theme.

## 1. Quy tắc thực thi theo hiện trạng repository

1. **Đọc code trước khi sửa:** xác định nơi định nghĩa CSS/design tokens, cách quản lý theme, Theme Switcher, các route/component dùng chung và key `localStorage` hiện tại.
2. **Nếu đã có hệ thống 6 theme:** chỉ **bổ sung 10 theme mới**, tái sử dụng Theme Provider, registry, CSS variables và nút Theme. **Không tái cấu trúc hoặc tạo hệ thống thứ hai.**
3. **Nếu chưa có hệ thống theme:** triển khai tối giản bằng CSS custom properties + TypeScript theme registry + cơ chế lưu trạng thái phù hợp với kiến trúc React hiện tại; tạo đủ 16 theme và nút chọn theme trong Header.
4. **Nếu đã có một phần hoặc hơn 6 theme:** chỉ thêm/sửa những phần còn thiếu, tránh ghi đè các cấu hình đang hoạt động.
5. **Original:** theo quyết định mới18/10, dùng base palette của `D:/Download/lunara`, đồng bộ registry/`:root`; vẫn là default/fallback. Semantic CTA/body có biến thể đủ tương phản.
6. Giữ16ID,15palette còn lại, key lưu trữ và hành vi; không reset sở thích đã lưu.

## 2. Danh sách 16 theme

Các cột màu là **base palette**, theo thứ tự `background`, `secondary`, `soft-surface`, `accent`, `foreground`. Các semantic token bổ sung được suy ra từ palette và kiểm chứng về tương phản; không mặc định dùng `accent` làm nền nút có chữ trắng nếu không đủ tương phản.

| # | Theme | ID gợi ý nếu chưa tồn tại | Background | Secondary | Soft surface | Accent | Foreground |
|---|---|---|---|---|---|---|---|
| 1 | Original | `original` | `#F8FBFA` | `#F1F7F5` | `#EDF4F6` | `#527E75` | `#344B49` |
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
- Bổ sung hover/active/disabled/focus đủ rõ, đảm bảo **WCAG AA**: chữ thường tối thiểu 4.5:1, chữ lớn tối thiểu 3:1, ranh giới control/focus thiết yếu tối thiểu 3:1 khi áp dụng. Nếu accent/body gốc không đủ tương phản trên các surface, dùng biến thể semantic đậm hơn, giữ năm base HEX.
- Màu `success`, `warning`, `error` tiếp tục biểu thị đúng trạng thái; không đổi ngẫu nhiên theo màu thương hiệu.
- Không sao chép 16 bộ component/CSS riêng. Không thêm dependency lớn khi React + CSS đã đáp ứng.

## 4. Theme Switcher trong Header

- Chỉ **một** nút `Theme` trên Header hiện có (nếu đã có thì **giữ và mở rộng**, không tạo nút thứ hai).
- Dropdown/popover hiển thị đủ21tên theme, kèm5ô màu preview cho palette cũ/6ô cho creative và dấu check của lựa chọn hiện tại.
- Giữ bố cục header, chiều cao tối đa + cuộn của Radix, đảm bảo desktop/mobile.
- Chọn theme đổi màu ngay, không reload. Hỗ trợ keyboard, Escape, click ngoài, accessible name và focus indicator.
- Giữ key `localStorage` hiện tại; chỉ khởi tạo key mới nếu repository chưa có; fallback về Original nếu dữ liệu không hợp lệ.
- Đồng nhất theme khi đổi route, refresh và quay lại website; hạn chế flash sai theme khi tải lần đầu.

## 5. Phạm vi, giới hạn thay đổi

**Áp dụng các trang/khối hiện có:** Header, Home/Hero, Catalog, Product Detail, Cart, Checkout, Form/Input, Footer, Modal, Toast, Dropdown và các route liên quan. Admin chỉ áp dụng nếu **đang dùng chung design system**; không ép admin dùng theme shop nếu đang tách biệt.

**Không chỉnh sửa:** ảnh sản phẩm DB, routing, APIs, Cloudflare Workers, D1, Cloudinary, Turnstile, authentication, validation, checkout, business logic. UI Home/Header theo ngoại lệ owner18/10 bên dưới; các layout khác giữ hiện có.

## 6. Kiểm thử và kết quả bàn giao

1. Đúng **21 theme**, không trùng ID; Original theo ref,15palette cũ khác và hành vi giữ nguyên;5creative theo tài liệu Extend.
2. Đủ semantic tokens ở mọi theme; creative có secondary/tertiary riêng, palette cũ dùng fallback; không sót override khi đổi theme/route hoặc quay về Original.
3. Dropdown usable trên desktop/mobile; chọn/check, Escape, click ngoài, keyboard hoạt động.
4. Refresh/điều hướng vẫn giữ lựa chọn đã lưu; fallback đúng; hạn chế flash màu khi boot.
5. Kiểm tra Home, các route chính, card, button, input, modal, footer và các trạng thái tương tác; kiểm tương phản thực tế trên UI, đặc biệt chữ trên primary button.
6. Chạy typecheck, build, test hiện có; nêu rõ PASS/FAIL và các bước chưa kiểm chứng nếu có. Không deploy production trừ khi được yêu cầu rõ ràng.
7. Báo cáo ngắn: **file đã sửa**, **đã thêm/sửa gì**, **kết quả test**, **vấn đề còn lại**. Không chỉnh tài liệu hoặc file ngoài phạm vi nếu không cần thiết.

## Hiện trạng triển khai — 17/10/2026

- Source trước thay đổi chưa có registry/switcher hoặc preference theme; đã triển khai Original + 15 palette trong bảng, không phải mở rộng một bộ 6 theme có sẵn. Registry: `src/shared/theme/themes.ts`; state/bootstrap: `theme-store.ts`, gọi trước `createRoot`.
- Preference mới `lunara.theme.v1` chỉ lưu ID. ID không hợp lệ/storage bị chặn về Original; đổi theme vẫn dùng được trong bộ nhớ. Theme đi theo route và đồng bộ storage event; không thay key giỏ hàng/ngôn ngữ.
- Header dùng lại `Dropdown`/Radix với preview5màu, check, scroll và keyboard. Theme ánh xạ Lunara/generic/editorial/footer/control; status và token riêng admin giữ nguyên. Original xóa override về `:root` xanh/trắng sương. Footer sáng dùng nhóm token của theme, không khóa palette rose riêng cho Original.
- Base HEX của 15 palette mới được giữ. CTA/body/control/focus được suy ra có kiểm tương phản; footer của theme mới dùng secondary sáng. Bằng chứng kiểm tra và giới hạn nằm tại [PROJECT_STATUS](../PROJECT_STATUS.md).

## Navigation theo yêu cầu mới — 18/10/2026

Owner yêu cầu Home/Header theo ref cho cả16theme; sau đó xác nhận lấy cả ảnh và màu Original của ref. Original được đổi trong registry/`:root`, thay quyết định giữ cream/rose trước đó;16ID/15palette khác/`lunara.theme.v1` giữ nguyên. Header dùng minh họa hoa từ ref, wordmark Lunarra và menu catalog thật. [Sổ tay](../../PROJECT_GUIDE.md#bộ-nhận-diện-và-token-thiết-kế) sở hữu bố cục/mapping; [ATTRIBUTIONS](../../ATTRIBUTIONS.md) sở hữu ảnh; bằng chứng tại [PROJECT_STATUS](../PROJECT_STATUS.md).

- Header dùng search cùng nền/không viền, shadow dưới, EN/VI compact và underline150ms; top36px/chữ10–12px. Footer sáng4cột giữ bố cục/dữ liệu, màu đồng bộ theme.
- Home theo vai trò màu ref: Hero/Featured dùng page background; navbar chính/search/menu và Story dùng card-surface; Journey16theme nền dùng section-secondary; khung ảnh dùng soft surface.5creative theo [mapping Extend](Extend_Lunara_Multi_Theme.md#phân-bổ-màu-và-kiểm-chứng): utility/Journey dùng nền secondary sáng, nhãn Hero transparent, quick-add/link dùng primary; secondary/tertiary chỉ ở logo và nét icon nhỏ. Card-surface vẫn trắng; component không chốt HEX theo theme. Story dùng chung ink/body với Hero/navbar, khác nền Journey; bố cục/font/spacing giữ nguyên.
- Original lấy xanh/trắng sương của ref; theo yêu cầu mới, top bar dùng soft surface thay hồng, footer bỏ rose cũ, logo/ảnh lỗi dùng accent tokens. Giữ ảnh chụp, layout và copy đã duyệt. Runner kiểm độc lập màu top/footer, toàn bộ fill/stroke logo, ảnh lỗi/alt/kích thước và16lượt về Original/reload. Ma trận responsive rộng vẫn ở `check-ui-storefront.mjs --responsive`; bằng chứng từng lượt tại PROJECT_STATUS.

## Prompt gọi AI (ngắn)

> Đọc spec, PROJECT_GUIDE và code hiện tại trước khi sửa. Giữ16ID/key preference; Original theo ref đã được owner duyệt18/10,15palette khác giữ nguyên. Dùng kiến trúc theme hiện có và semantic surface roles; Home theo ref trong phạm vi yêu cầu, giữ copy owner chỉ định, footer và toàn bộ API/business logic. Kiểm responsive, ảnh, persistence, accessibility; chạy các check bắt buộc và báo cáo bằng chứng cùng giới hạn. Không deploy khi chưa được yêu cầu.
