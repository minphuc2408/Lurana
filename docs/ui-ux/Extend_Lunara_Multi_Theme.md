# Lunarra — 5 creative multicolor palettes

Reference dành cho UI/maintainer, giữ sáu base HEX đã được owner duyệt cho mỗi creative theme. Năm palette mở rộng [16 theme nền](LUNARA_MULTI_THEME_SPEC.md) thành 21 light themes. Mapping/hierarchy/interaction hiện hành có một owner tại [DESIGN_SYSTEM](DESIGN_SYSTEM.md); đây không phải yêu cầu triển khai lại theme system.

## Năm palette đã triển khai

| Theme | ID | Background | Secondary background | Primary accent | Secondary accent | Tertiary accent | Foreground |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Wildflower Pop | `wildflower-pop` | `#FBFAF6` | `#FFF3ED` | `#B94E66` | `#7DB9C4` | `#D4D877` | `#383943` |
| Cobalt Citrus | `cobalt-citrus` | `#FAFAF7` | `#EEF0FF` | `#3D57AB` | `#F4B65B` | `#A8CFA0` | `#293250` |
| Orchid Picnic | `orchid-picnic` | `#FCFAF9` | `#F2EBF8` | `#954F9D` | `#E47558` | `#D8DD8B` | `#4A3A4F` |
| Ocean Confetti | `ocean-confetti` | `#F8FBFA` | `#E9F5F3` | `#147A81` | `#F18EAD` | `#F3CF70` | `#27464B` |
| Folk Bloom | `folk-bloom` | `#FBF9F3` | `#F3E6D7` | `#A64740` | `#8EA7D2` | `#96B06A` | `#4B3736` |

## Quyết định thiết kế

- Đây là multicolor: giữ ba họ accent khác nhau và đủ sáu màu preview; không biến thành ba sắc độ đơn sắc hoặc thay HEX tùy ý. Primary tạo trọng tâm tương tác, secondary/tertiary giữ cá tính nhỏ ở logo/nét minh họa.
- Mở rộng màu giữ layout, typography, ảnh, router, API, DB, auth và business behavior. Giữ 16 palette/semantic snapshot trước creative cùng ID/key/bootstrap; chỉ thay những bề mặt được owner yêu cầu.
- Quyết định hierarchy ngày 19/10 thay mapping trước đó: không tô secondary/tertiary nguyên bản phủ utility, Hero label hoặc Journey. Tránh phối accent tùy sản phẩm/thứ tự bước; status colors tiếp tục biểu thị đúng trạng thái.

## Phân bổ màu và kiểm chứng

[Semantic roles hiện hành](DESIGN_SYSTEM.md#semantic-roles-hiện-hành) và [interaction/a11y](DESIGN_SYSTEM.md#interaction-và-accessibility) định nghĩa mapping mới. Lỗi viền thừa trước đó do coi Radix highlighted là keyboard focus dù pointer cũng kích hoạt; design owner giữ rationale và trạng thái đã sửa.

Kiểm cả năm creative ở 390/1440px, regression 21 theme và snapshot 16 theme cũ; giữ ảnh/copy/content khi so trước/sau. Lệnh và giới hạn cache của creative runner tại [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md#kiểm-theme-và-font); current acceptance tại [PROJECT_STATUS](../PROJECT_STATUS.md), bằng chứng cũ tại [archive](../archive/VERIFICATION_HISTORY.md). Không nhân bản kết quả test hoặc suy provider/cloud success từ mock/local screenshots.
