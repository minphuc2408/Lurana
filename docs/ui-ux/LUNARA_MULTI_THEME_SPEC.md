# Lunarra — palette của 16 theme nền

Reference dành cho UI/maintainer, giữ các base HEX đã được owner duyệt trước phần creative. **Đã triển khai**; không phải prompt thêm theme. Registry hiện có 21 light themes: 16 palette dưới và [5 creative](Extend_Lunara_Multi_Theme.md). Mapping/hierarchy/typography/persistence/a11y hiện hành thuộc [DESIGN_SYSTEM](DESIGN_SYSTEM.md).

## Danh sách 16 theme

Các cột là base palette `background / secondary / soft-surface / accent / foreground`; accessible semantic variants có thể khác base để đạt contrast. ID trong bảng khớp registry hiện tại, phải giữ khi thay đổi thông thường.

| # | Theme | ID | Background | Secondary | Soft surface | Accent | Foreground |
| --- | --- | --- | --- | --- | --- | --- | --- |
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

## Quyết định và compatibility

- Original đổi theo reference owner duyệt ngày 18/10: xanh/trắng sương, đồng bộ registry/`:root`; sau đó bỏ tình trạng trộn hồng ở utility/footer/logo/ảnh lỗi. Giữ default/fallback và provenance ảnh tại [ATTRIBUTIONS](../../ATTRIBUTIONS.md).
- Giữ 16 ID, 15 palette còn lại và appearance đã duyệt; không reset preference hoặc dựng theme system thứ hai. Registry/styles là nguồn giá trị triển khai; bảng này giữ quyết định palette, không sao chép toàn bộ semantic registry.
- Định hướng palette nền: off-white khoảng 70–80%, pastel 15–25%, màu đậm 5–10% tại CTA/điểm nhấn; đây là hướng thị giác, không kiểm quota pixel. Không lấy accent gốc làm nền nút chữ trắng nếu thiếu contrast. Creative có hierarchy riêng dẫn từ design owner.

## Navigation theo yêu cầu mới — 18/10/2026

Home/Header theo reference đã duyệt; layout và vai trò màu hiện hành nằm ở [design system](DESIGN_SYSTEM.md#bố-cục-storefront-và-component-reuse). Footer giữ nội dung, màu theo theme; danh mục/navigation dùng catalog thật. Không cần thư mục thiết kế riêng trên máy để hiểu contract.

## Kiểm chứng

[Quy trình theme/font](../LOCAL_DEVELOPMENT.md#kiểm-theme-và-font) dẫn runners/prerequisites; [PROJECT_STATUS](../PROJECT_STATUS.md) giữ current acceptance và link evidence có ngày. Bộ palette không chứng minh toàn bộ provider/cloud đã nghiệm thu.
