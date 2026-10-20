# Design system Lunarra

Reference dành cho người làm UI và QA, sở hữu hierarchy, semantic roles, typography, compatibility và accessibility hiện hành. Đối chiếu source **19/10/2026**; đây là review tĩnh, không phải lượt nghiệm thu UI mới. Palette đã duyệt ở [spec 16 theme](LUNARA_MULTI_THEME_SPEC.md) và [5 creative palettes](Extend_Lunara_Multi_Theme.md); registry/styles là nguồn giá trị triển khai.

## Nhận diện và phân cấp thị giác

- UI dùng thương hiệu **Lunarra**; tên repository `Lurana` và identifier legacy `Lunara` không tự rename. Giữ phong cách flower storefront sáng, editorial: ảnh hoa, khoảng thở, surface nhẹ, CTA rõ; layout chỉ thay khi được yêu cầu.
- Có **21 light themes**. Original dùng xanh/trắng sương đã được owner duyệt; `rose`, `cream`, `blush` là tên tương thích, không phải chỉ thị tô hồng/kem. Palette HEX và semantic mapping ở [themes.ts](../../src/shared/theme/themes.ts), mặc định ở [brand.css](../../src/styles/brand.css); component dùng semantic variables/`lunara-*` utilities, không branch JSX theo theme ID.
- Nền/giấy sáng và photography chiếm ưu thế; primary dẫn CTA, selected navigation và tương tác quan trọng. Secondary/tertiary là chi tiết nhỏ ở logo/nét minh họa; không bắt mỗi accent phủ một dải lớn. Mỗi component giữ một màu nhấn chính, tránh nhiều accent mạnh cạnh nhau. Hướng khoảng 90% cảm nhận nền sáng/ảnh cho creative là định hướng thị giác, không phải quota pixel.
- Status success/warning/error giữ ý nghĩa. Admin có sidebar/background riêng; creative có active/header-border tokens theo theme. Không coi mọi admin token là bất biến hoặc ép admin dùng toàn bộ surface storefront. Generic shadcn palette trong `theme.css` vẫn tách brand; chưa có flow storefront dark hoàn chỉnh.

## Semantic roles hiện hành

| Vùng / vai trò | Token và cách dùng |
| --- | --- |
| Nền Hero/Featured | `--lunara-cream`; không suy màu từ tên alias |
| Navbar chính/search/menu, Story, card | `--lunara-card-surface`; surface trắng của hệ light hiện tại |
| Section phụ | `--lunara-section-secondary`; creative utility/Journey dùng secondary background sáng |
| Nền ảnh | `--lunara-blush`; ảnh chụp không đổi màu theo theme |
| CTA/chữ nhấn/focus | `--lunara-rose-strong`, `--lunara-primary-hover`, `--lunara-focus-ring`; on-primary phải đủ tương phản |
| Chữ/viền/control | `--lunara-ink`, `--lunara-body`, `--lunara-border`, `--lunara-control-border`; không dùng màu muted nhạt cho thông tin thiết yếu |
| Creative Hero/category label | Campaign surface transparent, chữ primary; không còn tertiary fill toàn nhãn |
| Creative Journey | Surface secondary sáng; icon surface transparent, nét secondary-strong; không chia ba màu theo thứ tự bước |
| Creative quick-add/link quan trọng | Card trắng/primary; hover primary và on-primary đủ tương phản |
| Creative Footer/Story/Featured | Heading ink, footer link body/hover primary, divider chuẩn; không phủ secondary lên mọi heading/link |

`themeTokens()` ánh xạ semantic một lần. Accessible variants có thể đậm hơn base accent để đạt contrast; không sửa sáu HEX creative hoặc 16 palette trước đó chỉ để che lỗi tương phản. Logo và ImageWithFallback lấy màu từ token; fallback giữ `<img>`, alt và kích thước. Không nhúng HEX hồng cố định vào asset dự phòng.

## Typography theo locale

| Locale | `font-display` — heading/logo | `font-body` — body/form |
| --- | --- | --- |
| EN | Fraunces 500 / 500 Italic, optical sizing auto | Inter |
| VI | Lora Regular 400 / 400 Italic, optical sizing auto | Be Vietnam Pro |

Font được link trong `index.html`, preconnect Google APIs/Gstatic và `display=swap`. CSS `html[lang='vi']` đổi alias; html, font-sans/font-serif và dialog portal cùng kế thừa locale. Fraunces có opsz 9–144; Lora được tải range 400–700 nhưng display VI hiện chuẩn hóa 400. Không override font riêng từng component nếu chưa có yêu cầu thiết kế. Nguồn/giấy phép font thuộc [ATTRIBUTIONS](../../ATTRIBUTIONS.md#fonts).

Ngôn ngữ, tên sản phẩm song ngữ và dữ liệu khách có [vòng đời riêng](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu); đổi theme không đổi locale/font/currency/timezone hoặc nội dung khách nhập.

Sau refinement 20/10, checkout/tra đơn dùng control 16px, label/helper/dữ liệu quan trọng 14px, heading khối 20px; tổng tiền vẫn display 24–30px. Placeholder dùng body token đủ tương phản, tên hoa trong summary được xuống dòng. Giữ typography Hero và bốn font theo locale; tăng chữ không thay validation hoặc dữ liệu khách.

## Bootstrap, persistence và compatibility

Registry có một bộ ID và một Theme Switcher dùng lại Radix Dropdown: preview năm màu cho palette nền, sáu màu cho creative; có check, scroll và keyboard. `lunara.theme.v1` chỉ lưu ID. [theme-store.ts](../../src/shared/theme/theme-store.ts) áp dụng trước `createRoot`, duy trì qua route/reload và đồng bộ storage event; ID sai/storage lỗi fallback Original, vẫn đổi theme trong memory được.

Trước khi áp theme, store xóa toàn bộ inline override cũ. Original trả mapping rỗng để về `:root`; token creative được bỏ khỏi 16 palette cũ để CSS fallback giữ appearance đã duyệt. Giữ ID/key/bootstrap và snapshot 16 theme trước creative trừ khi owner yêu cầu đổi. Không dựng registry/provider/theme CSS thứ hai.

## Interaction và accessibility

- Phân biệt hover, checked/selected, active route và keyboard focus-visible. Radix `data-highlighted` bao gồm pointer focus, nên không thể dùng riêng nó để kết luận người dùng đang dùng bàn phím.
- Sau refactor creative, menu ghi input method cục bộ: pointer dùng surface nhẹ không viền focus; checked dùng check + primary text; keyboard có outline primary 2px; route active dùng primary. CSS scope riêng năm creative, giữ trạng thái 16 theme cũ. Nguồn: `dropdown.tsx`, `StorefrontNavigation.tsx` và creative interaction rules trong `brand.css`.
- WCAG AA: chữ thường ≥4.5:1, chữ lớn ≥3:1; control/focus thiết yếu ≥3:1 khi áp dụng. Kiểm foreground/background thật ở hover/checked/active/focus, đặc biệt CTA chữ trắng; không suy từ swatch hoặc bỏ keyboard outline toàn cục.
- Có loading/error/empty/success, labels, alt, accessible name cho icon buttons, keyboard/Escape/focus restoration, reduced motion và layout không overflow. Dùng primitives sẵn trước khi tạo mới.
- Focus chung, Dropdown trigger và nút đóng Dialog dùng `--lunara-focus-ring`; Original không còn dùng rose-light cho outline. Menu admin mobile dùng shared Dialog để chuyển/giữ/trả focus, Escape/backdrop đóng và resize lên desktop giải phóng modal. Tiêu đề trang admin vẫn hiện trên mobile; utility/EN-VI và các nút quantity/đóng có vùng bấm tối thiểu 44px.

Checkout có ngoại lệ pointer-focus do owner yêu cầu: chỉ form checkout input/textarea dùng pointer mới bỏ outline/shadow và giữ viền mảnh; Tab vẫn có focus. Không áp sang validation/checkbox/radio hoặc admin. Flow/consent/payment thuộc [CHECKOUT_UI](../features/CHECKOUT_UI.md).

## Bố cục storefront và component reuse

Home có Hero → dải dịch vụ → Featured → Journey → Story; behavior/variant/search/scroll ở [ARCHITECTURE](../ARCHITECTURE.md#catalog-và-cuộn-trang). Giữ copy Hero/tám dòng dịch vụ đã được owner duyệt và CTA Chọn hoa. Featured/Journey dùng line art nhẹ; chỉ giữ divider full viewport trên Featured, không thêm đường chia/khoảng hở giữa Featured và Journey. Story và Journey có nền full viewport, nội dung cùng khung.

Khung Home co giãn 1240–1600px, Header 1440–1600px, gutter 20/32px. Hero dưới 1024px xếp ảnh dưới chữ; desktop chia 5/7; grid sản phẩm hai cột dưới 1024px/bốn cột từ 1024px. Hero và ba ảnh Story là JPEG local responsive từ reference, không gradient hoặc recolor; WebP Hero cũ chỉ còn asset giữ lại. [ATTRIBUTIONS](../../ATTRIBUTIONS.md) giữ provenance, không yêu cầu có thư mục reference riêng trên máy.

Detail giữ gallery vuông/thumbnail phía dưới, size radio kèm giá và quantity. Refinement 20/10 gom năm placeholder editorial lặp thành một notice dưới tiêu đề Chi tiết & Hướng dẫn chăm sóc; chưa tự thêm thành phần/kích thước/story. Hai dòng dịch vụ giữ nguyên, không thay coverage/phí/lịch API. Trang About là article tĩnh không breadcrumb/CMS; thông tin kinh doanh vẫn cần xác minh trước mở bán.

Header có search luôn hiện, nav desktop từ 1024px; theme/EN-VI ở utility bar. Menu mobile absolute phải giữ containing block là sticky Header trực tiếp để `max-height:calc(100dvh - 100%)` trừ đúng chiều cao; kiểm landscape thấp và focus tới mục cuối. Search trim/encode URL, category từ catalog; thông tin chưa có destination dùng dialog hiện có, không chép dữ liệu mẫu vào vận hành.

`useMainLayout` đo Header bằng ResizeObserver và cung cấp `--lunara-storefront-header-height` trong layout; sticky summary checkout dùng chiều cao này cộng 16px thay offset cố định. Shop mobile bỏ nhãn dẫn trùng, thu khoảng dẫn và gộp giá/sort vào disclosure dưới 640px; state đóng/mở thuộc `useProducts`, không đổi filter/search/URL.

Footer sáng bốn cột desktop, mobile thương hiệu/địa chỉ toàn hàng và hai nhóm link cạnh nhau. Giữ thông tin/maps/copy hiện hữu cho tới khi owner xác minh; đích chưa có href mở FeatureUnavailable, Escape/X/Đóng trả focus. ID/thứ tự/href ở `src/shared/config/storefront-footer.ts`, copy/maps ở common.json EN/VI. `featureFlags.zaloContact=false` ẩn widget nổi chưa có kênh thật để tránh che nội dung; chỉ bật cùng việc nối đích liên hệ đã xác minh. Source portal/notice được giữ lại. Nội dung kinh doanh minh họa và việc còn thiếu thuộc [PROJECT_STATUS](../PROJECT_STATUS.md#việc-còn-cần-chủ-shop).

Primitives giữ tại `src/shared/ui/`: Button, Input, Dialog, Dropdown, Combobox. Dùng `cn`, ImageWithFallback, Lucide, formatter chung và feature ProductCard/ProductGrid/FilterBar. Không phục hồi toàn bộ wrapper đã bỏ hoặc tạo StatusBadge chung khi chưa có nhu cầu. `color-classes.ts` giữ class Tailwind literal cho màu fixture; không dựng `bg-[${color}]` lúc runtime.

## Kiểm chứng thiết kế

- Khi đổi theme chung, kiểm regression 21 theme, xem cả năm creative ở 390px và 1440px, EN/VI và surface ảnh hưởng gồm detail/cart/checkout/admin. Giữ snapshot legacy; chỉ thay assertions cũ khi contract thiết kế được chủ động sửa.
- So target/current/result với cùng ảnh/copy/content, kiểm computed styles ở trạng thái tương tác. Kết quả mock/local không chứng minh provider hoặc thiết bị thật; record ngày/scope ở [PROJECT_STATUS](../PROJECT_STATUS.md), evidence cũ ở [archive](../archive/VERIFICATION_HISTORY.md).
- Lệnh runner/prerequisite và giới hạn cache local thuộc [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md#kiểm-theme-và-font), không copy lại log hoặc danh sách theme tại đây.
