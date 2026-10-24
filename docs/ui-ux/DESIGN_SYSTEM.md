# Design system Lunarra

Reference dành cho người làm UI và QA, sở hữu hierarchy, semantic roles, typography, compatibility và accessibility hiện hành. Cập nhật quyết định/source **21/10/2026**; phạm vi kiểm chứng từng lượt ở [hồ sơ lịch sử](../archive/VERIFICATION_HISTORY.md#kiểm-chứng-local). Palette đã duyệt ở [spec 16 theme](LUNARA_MULTI_THEME_SPEC.md) và [5 creative palettes](Extend_Lunara_Multi_Theme.md); registry/styles là nguồn giá trị triển khai.

## Nhận diện và phân cấp thị giác

- UI dùng thương hiệu **Lunarra**; tên repository `Lurana` và identifier legacy `Lunara` không tự rename. Giữ phong cách flower storefront sáng, editorial: ảnh hoa, khoảng thở, surface nhẹ, CTA rõ; layout chỉ thay khi được yêu cầu.
- Có **22 light themes**. Theo owner20/10, bảng Monochrome đen/trắng/xám/hồng hiện tại mang tên **Original**, là mặc định và đứng đầu picker. Original xanh/trắng sương cũ đổi nhãn **Green Mist**, vẫn chọn như các theme khác. Chỉ đổi nhãn/thứ tự picker: ID lưu `monochrome`→Original và `original`→Green Mist giữ nguyên, không đổi palette. Trong các mục mapping bên dưới, “Monochrome” chỉ bảng màu/ID của Original mới. `rose/cream/blush` là alias; [themes.ts](../../src/shared/theme/themes.ts) sở hữu palette/semantic, [brand.css](../../src/styles/brand.css) giữ fallback Green Mist; không branch màu JSX theo ID.
- Nền/giấy sáng và photography chiếm ưu thế; primary dẫn CTA, selected navigation và tương tác quan trọng. Secondary/tertiary là chi tiết nhỏ ở logo/nét minh họa; không bắt mỗi accent phủ một dải lớn. Mỗi component giữ một màu nhấn chính, tránh nhiều accent mạnh cạnh nhau. Hướng khoảng 90% cảm nhận nền sáng/ảnh cho creative là định hướng thị giác, không phải quota pixel.
- Status success/warning/error giữ ý nghĩa. Admin có sidebar/background riêng; creative có active/header-border tokens theo theme. Không coi mọi admin token là bất biến hoặc ép admin dùng toàn bộ surface storefront. Generic shadcn palette trong `theme.css` vẫn tách brand; chưa có flow storefront dark hoàn chỉnh.

## Semantic roles hiện hành

| Vùng / vai trò | Token và cách dùng |
| --- | --- |
| Nền Featured | `--lunara-featured-background`; Mono hồng25, theme khác fallback cream |
| Đầu trang Shop | `--lunara-shop-intro`; Mono hồng25 riêng phần tiêu đề/mô tả, danh sách vẫn trắng0; separator chỉ rộng theo khung nội dung bên dưới |
| Hero toàn viewport | `--lunara-hero-backdrop`, `--lunara-hero-overlay`, `--lunara-hero-foreground`; ảnh JPEG full bleed, lớp phủ giữ chữ rõ |
| Hero CTA | `--lunara-hero-button-background`, `--lunara-hero-button-foreground`, `--lunara-hero-button-hover` |
| Search navbar | Cùng `--lunara-header-background` trắng0 với cả hai hàng nav trong Monochrome |
| Story Home | `--lunara-story-background`; Mono hồng25, theme khác fallback card-surface |
| Menu con, card | `--lunara-card-surface`; Mono Home xám50, card tại Shop trắng0 |
| Nền header/navbar trên và dưới | `--lunara-header-background`; Monochrome trắng bậc0 (`monochromeScale[0]` = `#FFFFFF`), gồm menu mobile; theme khác giữ fallback cream/Home card-surface |
| Chữ header/navbar | `--lunara-header-ink/body`, `--lunara-nav-ink/active`; Monochrome thường xám900, tab active và chữ hover/focus-visible cùng underline hồng400 |
| Icon/search storefront | `--lunara-icon-foreground/hover`: nét xám900→950; ô search giữ một kính lúp bên trái ở mọi viewport, không có nút submit bên phải; Enter vẫn tìm |
| Badge header / giỏ nổi Shop | `--lunara-header-count-background/foreground`: hồng400/trắng0; `--lunara-floating-cart-background/foreground`: hồng50/xám900 (`monochromeScale[900]` = `#1B1B1B`), chữ và icon dùng chung biến foreground theo owner 21/10/2026 |
| Preferences dùng chung | `--lunara-preference-surface/border`: trắng0/xám100; `--lunara-preference-active/active-foreground`: hồng400/trắng0, hover hồng50. Dùng cho EN/VI pill và theme trigger đang mở tại storefront, admin và login |
| Dải dịch vụ Home/About values | `--lunara-services-background`, `--lunara-service-icon-background/hover`, `--lunara-service-icon-foreground/hover`; Monochrome nền trắng, vòng tròn hồng 50→100, nét hồng 400 |
| Tim và thêm sản phẩm | `--lunara-product-favorite/hover/active`, nhóm `--lunara-product-action-*`; tách màu thường, hover và đã thêm |
| Tra đơn | `--lunara-lookup-panel`, `--lunara-lookup-button/hover`, `--lunara-lookup-button-foreground/hover`; Monochrome panel và nền đến Footer trắng0, nút 200→300, nét/chữ 900→950 |
| Section phụ | `--lunara-section-secondary`; creative utility/Journey dùng secondary background sáng |
| Nền ảnh | `--lunara-blush`; ảnh chụp không đổi màu theo theme |
| CTA/chữ nhấn/focus | `--lunara-rose-strong`, `--lunara-primary-hover`, `--lunara-focus-ring`; on-primary phải đủ tương phản |
| Chữ/viền/control | `--lunara-ink`, `--lunara-body`, `--lunara-border`, `--lunara-control-border`; không dùng màu muted nhạt cho thông tin thiết yếu |
| Creative category label | Campaign surface transparent, chữ primary; Hero không còn kicker |
| Creative Journey | Surface secondary sáng; icon surface transparent, nét secondary-strong; không chia ba màu theo thứ tự bước |
| Creative quick-add/link quan trọng | Card trắng/primary; hover primary và on-primary đủ tương phản |
| Creative Footer/Story/Featured | Heading ink, footer link body/hover primary, divider chuẩn; không phủ secondary lên mọi heading/link |

`themeTokens()` ánh xạ semantic một lần. Accessible variants có thể đậm hơn base accent để đạt contrast; không sửa sáu HEX creative hoặc 16 palette trước đó chỉ để che lỗi tương phản. ImageWithFallback lấy màu từ token, giữ `<img>`, alt và kích thước; không nhúng HEX hồng cố định vào asset dự phòng. Riêng logo cạnh tên Lunarra ở Header dùng trực tiếp asset favicon owner chọn, giữ artwork/màu gốc của file.

Monochrome có trắng **0 (`#FFFFFF`) ở đầu `monochromeScale`**, sau đó giữ nguyên 11 bước owner cung cấp: `50/100/200/300/400/500/600/700/800/900/950` = kênh RGB xám `242/219/196/173/150/128/105/82/59/27/13`. `themes.ts` là nguồn duy nhất, xuất CSS `--color-0`/`--color-*`; `--lunara-white` là alias bước 0. Không có bảng giảm tông toàn cục; component dùng semantic utilities, 21 palette cũ và màu trạng thái nghiệp vụ giữ nguyên.

### Quy tắc màu Monochrome

- Owner làm rõ: hoàn tác việc giảm toàn bộ màu ngoài Footer. Chữ chính/nét icon về **900 (`#1B1B1B`)**, hover **950 (`#0D0D0D`)**, chữ phụ **700 (`#525252`)**; viền/placeholder 200, control border 600, focus 800. Accent hồng về 400, các ngoại lệ cụ thể ở dưới.
- **Owner24/10:** Featured, Story Home, Footer và intro Shop (tiêu đề/mô tả) dùng hồng25 (`#FFF5F8`), mỗi vùng có semantic role riêng. Nền chung vẫn xám50, dịch vụ/Journey trắng0. Search dùng trực tiếp `--lunara-header-background`; `--lunara-page-background` alias cùng biến này cho About, catalog Shop và tra đơn. CSS scope đồng bộ wrapper/breadcrumb, card và khung giờ About; intro Shop giữ role riêng. Tra đơn trắng0 đến sát Footer, ô nhập vẫn xám50. Separator Shop giữ trong gutter20/32px.
- Footer giữ heading/icon 900, chữ phụ/link 700, viền 200, hover 950, focus 800. Hero giữ chữ/nền CTA trắng, chữ CTA 900, overlay 950 ở 65%. Admin dùng mapping sáng riêng theo [quyết định Mono](#áp-dụng-mono-cho-admin); màu nằm trong theme layer.

| Vùng Home — Monochrome | Background / token |
| --- | --- |
| Header/navbar trên và dưới | `#FFFFFF` — header-background, bậc0 |
| Ô tìm kiếm | `#FFFFFF` — header-background, cùng biến navbar |
| Hero | Ảnh full bleed + `#0D0D0D` 65% — hero-overlay |
| Dải bốn dịch vụ | `#FFFFFF` — services-background |
| Vòng tròn icon dịch vụ | `#FBEAF0` → hover `#F4C3D5` — service-icon-background/hover |
| Featured | `#FFF5F8` — featured-background, hồng25 |
| Journey / ba bước | `#FFFFFF` — journey-surface |
| Story | `#FFF5F8` — story-background, hồng25 |
| Footer | `#FFF5F8` — footer-background, hồng25 |
| Nền chung | `#F2F2F2` — cream |

Radio bộ lọc Mono giữ native input/keyboard: vòng viền control-border600 trên trắng0, selected viền/chấm `--lunara-filter-selected` hồng400 và khoảng trắng inset3px; hover viền ink900, Tab giữ focus800, forced-colors trả native appearance. Không dùng trắng làm dấu chọn.

Mapping nằm trong nhánh Monochrome của `themeTokens()`; đổi Journey không đổi section-secondary hoặc palette các theme khác.

### Điểm nhấn hồng Home

- `monochromePinkScale` trong `themes.ts`: **25/50/100/200/300/400** = **`#FFF5F8` / `#FBEAF0` / `#F4C3D5` / `#EC9CBA` / `#E5769F` / `#DE4F83`**, xuất CSS `--lunara-pink-*`. Bậc25 mới nhạt nhất theo owner24/10; năm bậc cũ và dải xám giữ nguyên. Featured/Story dùng role nền riêng, không đổi cream/card-surface toàn cục hoặc mapping21 theme khác.
- `--lunara-editorial-label` dùng hồng **400**: ba nhãn Home và About us/The Lunarra space/Visit the shop. Journey icon/số bước cũng 400; vòng tròn đúng **50** theo owner. Dịch vụ Home và ba About values dùng service roles: nét 400, vòng tròn 50; hover dịch vụ nền 100.
- Số màu owner gọi **1/2/3/4/5** tương ứng bước50/100/200/300/400. Header badge giỏ/yêu thích, tab active/underline, EN/VI active và theme trigger đang mở dùng **5** theo quyết định mới; đã bỏ nút search trùng kính lúp. Giỏ nổi nền1/chữ và icon900; không coi các cặp màu owner chốt là bằng chứng contrast AA. MapPin địa chỉ About khi có dữ liệu dùng editorial-label400, miễn quy tắc icon trung tính qua `data-theme-icon`.
- Journey theo ảnh: Flower2, CardNotePen (notepad/pen Lucide), HandHeart; icon 32px, vòng tròn 90px desktop/80px mobile. Giữ heading/copy EN/VI; Journey/Story không border/divider, nền từng vùng theo bảng trên.
- `data-journey-icon` và `data-theme-icon` miễn quy tắc nét trung tính chung để giữ accent/state. Màu thuộc theme layer; 21 palette trước giữ mapping cũ. Các HEX owner chốt không phải nghiệm thu contrast/WCAG toàn theme.

## Typography theo locale

| Locale | `font-display` — heading/logo | `font-body` — body/form |
| --- | --- | --- |
| EN | Fraunces 500 / 500 Italic, optical sizing auto | Inter |
| VI | Lora Regular 400 / 400 Italic, optical sizing auto | Be Vietnam Pro |

Font được link trong `index.html`, preconnect Google APIs/Gstatic và `display=swap`. CSS `html[lang='vi']` đổi alias; html, font-sans/font-serif và dialog portal cùng kế thừa locale. Fraunces có opsz 9–144; Lora được tải range 400–700 nhưng display VI hiện chuẩn hóa 400. Không override font riêng từng component nếu chưa có yêu cầu thiết kế. Nguồn/giấy phép font thuộc [ATTRIBUTIONS](../../ATTRIBUTIONS.md#fonts).

Theo owner20/10, breadcrumb/tiêu đề trang storefront căn giữa; **detail là ngoại lệ: breadcrumb và tên căn trái trong cột thông tin**, breadcrumb ngay trên danh mục rồi tới tên. Breadcrumb dùng `--lunara-breadcrumb-font-weight:550`, body font theo locale và ink; không tăng weight toàn bộ heading. Giỏ hàng chỉ dùng breadcrumb MainLayout, không lặp trail cục bộ.

Ngôn ngữ, tên sản phẩm song ngữ và dữ liệu khách có [vòng đời riêng](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu); đổi theme không đổi locale/font/currency/timezone hoặc nội dung khách nhập.

Sau refinement 20/10, checkout/tra đơn dùng control 16px, label/helper/dữ liệu quan trọng 14px, heading khối 20px; tổng tiền vẫn display 24–30px. Placeholder dùng body token đủ tương phản, tên hoa trong summary được xuống dòng. Giữ typography Hero và bốn font theo locale; tăng chữ không thay validation hoặc dữ liệu khách.

## Bootstrap, persistence và compatibility

Registry giữ một bộ ID và Radix picker, preview năm màu cho palette nền/sáu cho creative; có check/scroll/keyboard. `ThemeSwitcher` đưa `defaultThemeId` lên đầu, không đổi thứ tự registry hoặc màu. **Tên hiển thị khác ID:** Original=`monochrome` mặc định, Green Mist=`original` trước đây. `lunara.theme.v1` và marker `lunara.theme.default.v1=monochrome` giữ nguyên; đổi nhãn không di chuyển/reset preference. [theme-store.ts](../../src/shared/theme/theme-store.ts) áp trước `createRoot`, giữ route/reload/storage event; ID sai/storage lỗi về Original mới. Bootstrap chuyển mặc định đúng một lần, sau đó giữ lựa chọn.

Trước khi áp theme, store xóa inline override cũ. **Green Mist (ID `original`)** trả mapping rỗng để về `:root`; Original mới (ID `monochrome`) giữ semantic mapping xám/hồng. Không đổi selector CSS theo tên hiển thị. Token creative được bỏ khỏi16 palette cũ để giữ appearance; snapshot palette/token bảo vệ màu, tên mới cần cập nhật assertions riêng. Không tạo registry/provider/theme CSS thứ hai.

## Interaction và accessibility

- Phân biệt hover, checked/selected, active route và keyboard focus-visible. Radix `data-highlighted` bao gồm pointer focus, nên không thể dùng riêng nó để kết luận người dùng đang dùng bàn phím.
- Sau refactor creative, Dropdown ghi input method cục bộ: pointer dùng surface nhẹ không viền focus; checked dùng check + primary text; keyboard có outline primary 2px. Navbar dùng Link, route active dùng primary và Tab giữ focus-visible. Nguồn: `dropdown.tsx`, `StorefrontNavigation.tsx` và creative interaction rules trong `brand.css`.
- WCAG AA: chữ thường ≥4.5:1, chữ lớn ≥3:1; control/focus thiết yếu ≥3:1 khi áp dụng. Kiểm foreground/background thật ở hover/checked/active/focus, đặc biệt CTA chữ trắng; không suy từ swatch hoặc bỏ keyboard outline toàn cục.
- Có loading/error/empty/success, labels, alt, accessible name cho icon buttons, keyboard/Escape/focus restoration, reduced motion và layout không overflow. Dùng primitives sẵn trước khi tạo mới.
- Focus chung, Dropdown trigger và nút đóng Dialog dùng `--lunara-focus-ring`; Green Mist không dùng rose-light cho outline. Menu admin mobile dùng shared Dialog để chuyển/giữ/trả focus, Escape/backdrop đóng và resize lên desktop giải phóng modal. Tiêu đề trang admin vẫn hiện trên mobile; utility/EN-VI và các nút quantity/đóng có vùng bấm tối thiểu44px.

Theo owner ngày 20/10, field trong form tra đơn/checkout không viền ở trạng thái nghỉ hoặc focus, gồm input, textarea, Combobox và Dropdown trigger; checkbox/radio và admin giữ nguyên. `useFieldFocus` phân biệt pointer/Tab: pointer không outline/shadow, Tab vẫn outline 2px. Giữ labels/lỗi/validation; không bỏ focus bàn phím toàn cục. Flow/consent/payment thuộc [CHECKOUT_UI](../features/CHECKOUT_UI.md).

## Bố cục storefront và component reuse

Home có Hero → dải dịch vụ → Featured → Journey → Story → [FAQ](#faq-home); behavior/variant/search/scroll ở [ARCHITECTURE](../ARCHITECTURE.md#catalog-và-cuộn-trang). Owner 20/10 thay Hero: bỏ kicker/copy cũ, dùng “Fresh Blooms, Delivered Daily”, mô tả handcrafted/seasonal và “Shop now” → `/shop`, có bản VI trong `landing.json`. Dải dịch vụ giữ copy EN/VI, mỗi mục xếp dọc: vòng tròn nền nhẹ 64px chứa icon → heading → mô tả; desktop bốn cột, mobile hai cột, không viền. Featured bỏ viền trên section/divider dưới heading; Journey thay nét minh họa cũ bằng ba icon trong vòng tròn theo [điểm nhấn hồng](#điểm-nhấn-hồng-home). Source: `Benefits.tsx`, `FeaturedCollection.tsx`.

Hero nằm ngoài content container, ảnh full bleed, copy căn giữa hai chiều; min-height bằng `100svh - --lunara-storefront-header-height`, tự nở khi viewport quá thấp để không cắt chữ. Dải dịch vụ ở dưới fold. Các phần còn lại giữ khung Home 1240–1600px, Header 1440–1600px và gutter 20/32px; grid sản phẩm hai/bốn cột tại 1024px. Hero/Story dùng JPEG local responsive đã có; Hero thêm overlay semantic, không sửa file ảnh. [ATTRIBUTIONS](../../ATTRIBUTIONS.md) giữ provenance.

Detail theo ảnh owner, có size radio kèm giá và quantity; xem mục [bố cục chi tiết](#chi-tiết-sản-phẩm-theo-ảnh-owner). Placeholder editorial giữ một notice dưới Chi tiết & Hướng dẫn chăm sóc, chưa thêm thành phần/kích thước/story. Hai dòng dịch vụ giữ copy, không thay coverage/phí/lịch API. About vẫn là article tĩnh; thông tin kinh doanh cần xác minh trước mở bán.

- `BreadcrumbTrail` shared render EN/VI/Link/aria-current dùng chung: MainLayout đặt qua `StorefrontBreadcrumb` dưới Header cho các trang con, **trừ detail**. `ProductDetailView` tự ghép Home→Khám phá→tên từ model, đặt ngay trên danh mục/tên trong cột thông tin; loading/error dùng trail dự phòng trong khung detail, không lặp band toàn trang. Home giữ Hero ở đầu; checkout thêm Giỏ hàng. Chuẩn hóa trailing slash; không đưa query/dữ liệu khách vào trail. Admin không đổi.
- Shop từ1024px chia hai cột **1:4**: FilterBar trái, count/sort và ProductGrid phải. Chỉ có separator dưới intro, rộng bằng phần nội dung catalog gồm hai cột; không viền dọc/giữa nhóm lọc. Dưới1024px, danh mục/giá trong disclosure Bộ lọc, sort luôn hiện. Radio dùng danh mục API và bốn khoảng giá VND, có xóa lọc; Colour/Material/Length chỉ tham khảo vì chưa có field tương ứng. Giữ URL/filter và quy tắc variant nhỏ nhất.
- `ProductPagination` dưới lưới có đầu/trước, số trang/ellipsis, sau/cuối (`<< < 1 2 3 … n > >>`), aria-current/nhãn EN–VI và disabled ở biên. Dùng metadata API 40/trang; một trang vẫn hiện pager, rỗng ẩn pager. Mobile rút các số giữa khi nhiều trang, giữ đầu/hiện tại/cuối và bốn nút; Link giữ query, Back/Forward/reload. Role pagination chọn nền hồng50/viền400 trong Monochrome, hover hồng50; không nhúng màu tại JSX.

- Header gồm hàng logo/search/actions và navbar bên dưới; utility bar đã bỏ. Theo owner ngày 20/10/2026, actions có thứ tự Theme → EN/VI → icon tài khoản → yêu thích → giỏ hàng; controls không còn ở footer. Dưới 640px, actions thành hàng riêng và search xuống hàng tiếp theo để giữ vùng bấm; wishlist vẫn chỉ hiện từ 768px. Giữ badge/accessible name; tài khoản mở FeatureUnavailable, chưa bật đăng nhập khách hàng.
- Theme trigger chỉ Palette20px/vùng bấm44px, không chữ/chấm/mũi tên; `Dropdown showChevron=false` riêng trigger này. Giữ aria-label,22 lựa chọn/swatches và keyboard/Escape/trả focus. EN/VI `appearance=storefront` đã thu gọn: cả nhóm **102×44px desktop,94×44px dưới640px**; mỗi nút bấm48×44/44×44px. Pill màu ở span con cao36px, rộng44/40px, font14/12px; active hồng400/chữ trắng, nền nhóm trắng viền mảnh. Không thu vùng bấm cùng phần màu; Admin/Auth tái sử dụng cùng controls và preference theme/locale.
- Logo cạnh Lunarra trong hàng search dùng đúng `public/favicon.svg` bằng `<img>` (32px mobile/40px desktop), ghép `import.meta.env.BASE_URL` để hoạt động trên basename. Không dùng SVG nhành hoa LunarraMark tại Header; asset favicon giữ nguyên.
- Navbar theo thứ tự Trang chủ (`/`), Khám phá (`/shop`), Giới thiệu (`/about`), Tra cứu đơn (`/orders/track`), Liên hệ (**`/#contact` của Home**). Navbar/footer dùng chung `storefrontContactPath` trong `storefront-footer.ts`: về Home rồi cuộn/focus cột Liên hệ và đóng menu mobile. Chỉ Home có hash contact mới active Liên hệ (`aria-current=location`), không active đồng thời Trang chủ; không tạo `/contact`.
- Navbar không có border phân cách; giữ shadow header và chiều cao link 56px. Nhãn căn giữa hàng, active indicator bám ngay dưới `data-navigation-label` (cách chữ 4px, còn 10px tới đáy navbar desktop), không bám đáy cả hàng. Active Motion span và hover span có key/type riêng: trước đây React tái sử dụng span khiến opacity/scale active còn trên tab cũ. Hover dùng CSS hover/focus-visible, active vẫn chuyển vị trí bằng Motion; pointer focus không giữ nét trên tab đã rời.
- Search luôn hiện, chỉ một icon kính lúp trang trí bên trái, không nút submit; nhập rồi Enter vẫn qua `submitSearch` trim/encode URL, `enterKeyHint=search` cho bàn phím mobile. Nav desktop từ1024px; menu mobile absolute giữ containing block là sticky Header để trừ đúng chiều cao. Giữ Escape/outside click/focus và danh mục tại Shop.

`useMainLayout` đo Header trước paint bằng useLayoutEffect, sau đó cập nhật bằng ResizeObserver; `--lunara-storefront-header-height` dùng cho Hero và sticky summary checkout (cộng 16px). Query/pagination Shop thuộc `useProducts`; contract server ở [API](../reference/API_CONTRACT.md#get-apiproductspage1qcategorycodepriceallsortfeaturedfeatured1).

Footer sáng bốn cột desktop, mobile thương hiệu/liên hệ toàn hàng và hai nhóm link cạnh nhau. **Theo dõi xếp dọc**, mỗi social có Lucide logo16px bên trái, kế thừa màu icon/footer như Hotline, không màu thương hiệu riêng. Hotline ở Liên hệ; Theme/EN-VI ở header. Đích chưa có href dùng FeatureUnavailableDialog, giữ Escape/X/Đóng trả focus. ID/thứ tự/href và dữ liệu địa chỉ/maps ở `storefront-footer.ts`; nhãn/copy ở common.json EN/VI. [Địa chỉ chưa công bố](#địa-chỉ-shop-chưa-công-bố) đang ẩn; không tự đặt URL/số thật. `featureFlags.zaloContact=false`; nội dung cần duyệt ở [PROJECT_STATUS](../PROJECT_STATUS.md#việc-còn-cần-chủ-shop).

Primitives giữ tại `src/shared/ui/`: Button, Input, Dialog, Dropdown, Combobox. Dùng `cn`, ImageWithFallback, Lucide, formatter chung và feature ProductCard/ProductGrid/FilterBar. Không phục hồi toàn bộ wrapper đã bỏ hoặc tạo StatusBadge chung khi chưa có nhu cầu. `color-classes.ts` giữ class Tailwind literal cho màu fixture; không dựng `bg-[${color}]` lúc runtime.

### FAQ Home

- **Behavior24/10:** `HomeFAQ` sau Story/trước Footer; VI “Một chút giải đáp”, EN “A Few Things You May Wonder”. Từ1024px chia5/7 cột intro/list, nhỏ hơn xếp dọc; kế thừa nền/font/tokens hiện có. Nhãn nhỏ dùng role body để đạt AA, không đổi accent/theme khác.
- **Content:** `home-faq.ts` giữ8ID theo thứ tự guest/gifting/lịch/khu vực/thiệp/ẩn tên/thanh toán/tra đơn; câu hỏi/trả lời ở `landing.json` EN/VI, giữ English fallback. Copy đối chiếu [Checkout](../features/CHECKOUT_UI.md) và [Tracking](../features/ORDER_TRACKING.md): một thiệp/đơn, COD; bank chưa khả dụng, tra đơn cần mã + SĐT người đặt/nhận + xác minh. Không công bố phí/thời gian/chính sách mới.
- **Interaction:** Radix Accordion đã cài, `single/collapsible`, mặc định đóng hết; h3/button +/−, aria-controls/labelledby, hidden panel, Enter/Space/Arrow/Home/End. ID ổn định giữ câu mở qua locale/theme; không tự cuộn khi disclosure đổi.
- **Motion:** dùng `faqReveal` từ hệ Home cho intro/list, không stagger8hàng. CSS `home-faq.css` chỉ scope FAQ, height/opacity220ms; Reduce Motion bỏ animation. Không thêm provider/dependency/API/CMS/JSON-LD hoặc CTA quảng cáo.
- **Anchor:** chỉ link FAQ footer đổi sang `/#faq`; section `id=faq`, `tabIndex=-1`. Giữ `useRouteScroll`; scroll-margin dùng header height đo thực tế +24px để native hash sau load không che heading. Các footer notice khác giữ nguyên.

### Tim và hành động sản phẩm

- `ProductCard` mọi appearance và detail dùng tim không nền/viền nút/khối vuông, vùng bấm 44px; hiện cả mobile. Monochrome: nét tim chưa chọn và tim đã chọn đều hồng **400 (`#DE4F83`)**, kể cả hover; `aria-pressed` và fill phân biệt trạng thái. Wishlist vẫn memory-only.
- Add card dùng `--lunara-product-action-*`: icon riêng `--lunara-product-action-icon` luôn trắng 0 khi chưa/đã thêm hoặc hover. **Nền/viền thường, đã thêm và hover đều hồng 400 (`#DE4F83`)**, chữ xám 900; chọn trạng thái qua check/feedback, không đổi sang nền tối. Detail dùng slot icon hồng cùng quy tắc trong nút outline theo ảnh (mục dưới). Palette khác giữ mapping/fallback icon `currentColor`; không đổi variant/quantity.
- Lỗi overlay Xem chi tiết bị giữ sau bấm tim do `group-focus-within` của cả article. Nay hover/`focus-visible` chỉ theo link ảnh (`group/image`), overlay không nhận pointer; tim giữ focus không làm overlay hiện. Keyboard focus vào link ảnh vẫn hiển thị. Source: `ProductCard.tsx`, `ProductDetailView.tsx`, `themes.ts`, `brand.css`.
- Theo yêu cầu mới, nút overlay “Xem chi tiết” khi hover card không có border; thumbnail detail nghỉ/hover cũng không thêm viền trang trí, chỉ ảnh đang chọn giữ viền trạng thái. Keyboard focus-visible vẫn giữ.

### Chi tiết sản phẩm theo ảnh owner

- Desktop từ1024px: gallery:thông tin **1.2:1**; rail thumbnail72/80px dọc trái, ảnh chính portrait **0.93:1**, cột thông tin căn trái. Mobile ảnh trên/thumbnail ngang/thông tin dưới; 0ảnh dùng fallback, 1ảnh không chừa rail, tối đa8ảnh vẫn scroll/zoom. `useThumbnailRail` giữ thumbnail được chọn trong rail, có nút xuống/về đầu khi tràn và reduced motion; scrollbar dùng token.
- Nền detail trắng0; breadcrumb trái nằm trên danh mục/tên trong cột thông tin. Title display theo locale, giá sans28–30px hồng400; SKU12px, mô tả14px. Selected size nền hồng50/viền400; hover thumbnail nền100, chỉ ảnh đang chọn có viền400. Buy nền400/hover300, chữ ink900. Semantic `--lunara-detail-*` trong theme layer; theme khác có fallback hiện hành.
- Add detail là viền400/nền trắng, hover50, nhãn ink; icon trắng trong slot tròn hồng400, giữ check/slot khi đã thêm. Card Add vẫn tròn hồng như yêu cầu trước. Tim chỉ icon400/fill khi chọn, không phục hồi khối vuông. Giữ size/quantity/stock/loading/error/cart limit/zoom/keyboard; dịch vụ dùng Truck/Camera như ảnh, không sửa claim.
- Ảnh/tên/mô tả vẫn từ API, không tạo ảnh/sản phẩm để ép giống tham chiếu. Nguồn: `ProductGallery.tsx`, `ProductDetailView.tsx`, `useThumbnailRail.ts`, `themes.ts`, `brand.css`.

### Thông báo tính năng chung

- `src/shared/components/FeatureUnavailableDialog.tsx` là khung chung cho footer chưa có đích/hotline, tài khoản header và thông báo chuyển khoản/điều khoản checkout. FAQ đã có [section Home](#faq-home), không mở notice. Theo mẫu chuyển khoản owner chọn: góc 2px, không border, nội dung căn giữa, nút Đóng đầy chiều rộng; chỉ body/title thay theo ngữ cảnh EN/VI.
- `FeatureUnavailable` giữ nội dung dùng lại cho dialog hoặc trang chờ chức năng, dùng `LunarraMark.tsx` rộng 48px từ lựa chọn trước. Yêu cầu mới thay favicon chỉ áp dụng logo Header; notice giữ SVG/theme tokens hiện có. Heading mặc định “Sắp ra mắt / Coming soon”; DialogTitle/Description hiện trực tiếp, không lặp bản ẩn.
- Dùng Radix Dialog cho focus trap, Escape/backdrop/X/nút Đóng; caller giữ trigger/focus restoration và state nghiệp vụ. Đóng thông báo chuyển khoản vẫn trả COD qua model checkout, không tự bật bank transfer. Không dựng dialog riêng cho thông báo cùng loại.

## Áp dụng Mono cho admin

- **Owner22/10:** Mono riêng admin/login; sidebar/header/panel trắng0, nền50, chữ900/phụ700, nav hồng50, CTA400→300/chữ900. Header64px, breadcrumb và tên trang cùng body14px/400; bỏ H1/mô tả lặp. Input/button không border hoặc ring khi click; keyboard vẫn outline800/2px. Giữ typography locale và theme/storage storefront.
- **Workspace:** toolbar/tab và pager nằm ngoài `.admin-records` cuộn; footer luôn hiện, chuyển trang về đầu. Mọi collection có pager, kể cả variants/gallery/items/timeline. Kho giữ accordion; main pager5 sản phẩm, zone10, nay lấy trang từ server. Chọn số dòng/trang và số trang điều khiển chung limit/offset; child variants/gallery vẫn phân trang local. Orders10/dashboard5 từ server; tab status dùng [metadata API](../reference/API_CONTRACT.md), đổi filter/size về trang1, reconcile trang cuối sau mutation.
- **Popup ngang (owner24/10):** chi tiết đơn và danh sách Xem tất cả từ dashboard rộng80vw/cao85dvh chia Tổng quan/Sản phẩm/Ghi chú/Lịch sử, rail tổng/thao tác cố định; mobile mở rail bằng tab Thao tác. Product1080×640 chia Thông tin/Ảnh/Kích thước, mỗi cỡ một trang; zone900×500. Kích thước clamp viewport, header/tab/footer cố định; nội dung dài/màn thấp chỉ cuộn trong vùng con. Validation mở trường lỗi đầu tiên, không mất draft/gallery khi đổi phần.
- **Dòng kho/phí24/10:** Hai cột đầu tách riêng **STT / No.** chỉ có số và **Thao tác / Actions** chứa icon xóa/sửa. Size/SKU căn giữa, bỏ giá lặp dưới SKU. SKU mở sửa mới nhập được; check lưu/X hủy, draft chưa lưu có nhãn. Xóa mở xác nhận; giữ state/error/recheck. Phí mobile có nhãn STT/Thao tác riêng, cùng hàng với switch → địa chỉ → phí/ngưỡng → ETA; Excel hai màn giữ kiểm file → xem trước → xác nhận.
- **Lịch:** DayPicker8 + Radix Popover đã cài, custom Mono và portal, tháng/năm, chọn ngày/Today/Clear và keyboard; EN/VI, thứ Hai đầu tuần, Today theo giờ Việt Nam. Không input date native hoặc dependency mới.
- **Source:** `AdminLayout`, views API, `AdminOrderData`, `AdminProductForm`; `AdminPagination`/`AdminDatePicker` và `useAdminPresentation` dùng chung. `brand.css` chỉ scope admin/portal; giữ auth, API ghi, delta/recheck và Save gallery. [Entity](../reference/FRONTEND_ENTITIES.md) sở hữu vòng đời draft; [lịch sử](../archive/VERIFICATION_HISTORY.md#kiểm-chứng-local) giữ bằng chứng.

## Địa chỉ shop chưa công bố

Owner21/10 yêu cầu để trống ba địa chỉ minh họa. `storeLocations` tại `src/shared/config/storefront-footer.ts` giữ `id`/`label`, là nơi owner nhập một lần `address`/`mapUrl` đã duyệt; hiện cả ba rỗng. `StorefrontFooter` và `StoryView` lọc địa chỉ trống; có địa chỉ chưa có Maps thì render text. Địa chỉ giữ nguyên nội dung, chỉ nhãn chi nhánh dịch theo locale. Đã bỏ địa chỉ/Maps mẫu khỏi common.json EN/VI; hotline/pháp nhân/giờ mở cửa vẫn chờ xác minh riêng.

## Motion storefront

- Entrance mới chỉ thuộc Home `/`; giữ `LazyMotion/domMax` và `MotionConfig` trong MainLayout. `landing/landing-motion.ts` dùng ease `[0.16,1,0.3,1]` chung: text600ms, section450ms, card500ms, Story image750ms, Hero image850ms; stagger65–100ms, delay tối đa300ms. Feedback160ms/navigation-layout280ms dùng chung giữ nguyên.
- Hero hiện ảnh đầy đủ, scale1.035→1; heading/body/CTA fade + y18→0, cách100ms. Copy không chờ ảnh; listener load/observer/controls được dọn khi unmount. Bỏ crop/blur, không parallax hay intro che nội dung.
- Services y12/stagger65ms; Featured heading y14 và card y18/stagger75ms; Journey y14/stagger90ms; Story copy y16/stagger80ms, ảnh scale1.025/stagger90ms. Observer theo từng item, chạy một lần mỗi mount; key sản phẩm đánh thức observer khi tải muộn, cart/locale/theme không replay. Không đổi DOM layout/keys.
- Nội dung mặc định hiển thị, thiếu observer vẫn đọc được. Reduce Motion hiển thị trực tiếp; `useLandingReducedMotion` theo dõi đổi preference đang mở (hook Motion12 chỉ snapshot lúc mount). Cleanup `complete()` trước `stop()` rồi xóa inline opacity/transform: `stop()` đơn lẻ có thể ghi lại giá trị dở dang ở frame kế tiếp. Giữ native scroll/focus.
- Featured riêng bỏ FLIP để entrance sở hữu transform; hover ảnh1.025/350ms chỉ cho chuột fine/hover, overlay fade có focus bàn phím. Giữ feedback tim/giỏ và appearance default/recommendation. Source: `useHeroMotion`, `useLandingReveal`, `ProductCard`; bằng chứng/phạm vi ở [lịch sử kiểm chứng](../archive/VERIFICATION_HISTORY.md#kiểm-chứng-local).

## Kiểm chứng thiết kế

- Các runner toàn theme/storefront cũ vẫn tạm dừng theo owner; motion Home có runner riêng24/10. Suite runtime225test đã chạy lại theo yêu cầu motion; phạm vi/giới hạn ở [Status](../PROJECT_STATUS.md#code-và-kiểm-chứng-local), evidence lịch sử ở archive. Khi nối lại runner toàn theme cũ, cập nhật assertions default/count/controls, DOM indicator và responsive theo contract hiện hành. Kết quả21theme cũ không nghiệm thu thay đổi mới.
- So target/current/result với cùng ảnh/copy/content, kiểm computed styles ở trạng thái tương tác. Kết quả mock/local không chứng minh provider hoặc thiết bị thật; record ngày/scope ở [PROJECT_STATUS](../PROJECT_STATUS.md), evidence cũ ở [archive](../archive/VERIFICATION_HISTORY.md).
- Lệnh runner/prerequisite và giới hạn cache local thuộc [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md#kiểm-theme-và-font), không copy lại log hoặc danh sách theme tại đây.
