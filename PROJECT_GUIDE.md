# Sổ tay dự án Lunara Flower Shop

Đây là file bắt đầu dành cho chủ dự án. Quy tắc được Codex đọc ở `AGENTS.md`; workflow riêng nằm trong `.agents/skills/lunara-flower-shop/`. Sổ tay này là nguồn tham chiếu về kiến trúc, giao diện, component và hướng phát triển, để bạn không phải mô tả lại project trong mỗi cuộc chat.

Ngày rà soát: 12/10/2026. Đã đọc và phân tích 84 file được chia sẻ trước đợt cấu hình này, gồm toàn bộ 74 file trong `src/`, manifest/lockfile, cấu hình build và tài liệu. CodeGraph ban đầu lập index 72 file TS/TSX/JS; CSS và tài liệu được kiểm tra riêng. Số file trong index sẽ thay đổi khi có code mới. Không tính `node_modules`, `dist`, database index và bằng chứng audit là mã nguồn ứng dụng.

## Cách sử dụng với Codex

1. Mở đúng thư mục repository trong Codex/IDE và bắt đầu phiên mới để nạp `AGENTS.md` cùng cấu hình MCP. Nếu thư mục chưa được đánh dấu trusted, Codex sẽ bỏ qua cấu hình project; chỉ trust bản code bạn đã xem xét.
2. Skill `lunara-flower-shop` được đặt ở `.agents/skills/` tại root, cho phép tự chọn khi yêu cầu khớp UI/nghiệp vụ Flower Shop. Trong CLI/IDE có thể gọi rõ bằng `$lunara-flower-shop`. Nếu skill chưa hiện trong danh sách, mở lại phiên/extension.
3. Bạn chỉ cần mô tả kết quả muốn đạt và ngoại lệ so với quy tắc chung. Ví dụ: “Nối nút Add ở Shop với giỏ hàng, giữ giao diện hiện tại” hoặc “Thêm bộ lọc dịp tặng hoa, dùng component sẵn có”.
4. Khi đổi thương hiệu, thị trường, kiến trúc hoặc hành vi, yêu cầu cập nhật sổ tay và `AGENTS.md` cùng code. Đây là trí nhớ trong file, không phải cam kết mọi hệ thống chat tự nhớ lịch sử.

ChatGPT thông thường trên web không tự đọc file trong máy hoặc cấu hình Codex cục bộ. Với cuộc chat không có quyền truy cập repository, đính kèm sổ tay và `AGENTS.md` hoặc đưa nội dung liên quan vào project instructions. Hướng dẫn tự nạp ở đây áp dụng cho phiên Codex có workspace này.

### Mẫu yêu cầu ngắn

```text
Dùng $lunara-flower-shop. Thực hiện [tính năng] ở [trang/luồng].
Giữ bộ nhận diện hiện tại. Kết quả cần: [hành vi có thể kiểm chứng].
Ngoại lệ/giới hạn: [nếu có].
```

Ví dụ thực tế:

- “Dùng $lunara-flower-shop: đồng bộ Shop và Cart qua state chung; số lượng và tổng tiền phải đúng khi chuyển trang.”
- “Sửa mobile menu của Layout; kiểm tra ở màn hình nhỏ và thao tác bàn phím.”
- “Brainstorm trang chi tiết bó hoa; liệt kê component tái dùng và phần còn phải xây, chưa triển khai.”
- “Rà soát việc chuẩn bị backend auth; phân biệt demo đang có với những phần cần làm để dùng thực tế.”

## Hiện trạng và bản đồ dự án

Tên thương hiệu trong UI: **Lunara**, phong cách cửa hàng hoa nhẹ nhàng, ấm và thanh lịch. Repository GitHub tên **Lurana**; khác biệt tên này là hiện trạng, chưa phải yêu cầu đổi thương hiệu.

Project hiện là **frontend demo**, không có backend, database, API sản phẩm, tích hợp thanh toán hay dịch vụ email. UI đang dùng tiếng Anh, giá PHP/₱ và dữ liệu mẫu ở Philippines; việc chủ dự án giao tiếp bằng tiếng Việt không đồng nghĩa đã chọn thị trường Việt Nam.

| Vị trí | Vai trò |
| --- | --- |
| `src/main.tsx` | Mount React và import CSS |
| `src/app/App.tsx` | `AuthProvider` bao `RouterProvider` |
| `src/app/routes.ts` | Cây route dùng `createBrowserRouter` |
| `src/app/components/Layout.tsx` | Navbar, menu mobile, footer của storefront |
| `src/app/components/AdminLayout.tsx` | Sidebar, top bar, Outlet quản trị; kiểm tra role trong UI |
| `src/app/components/AdminRoute.tsx` | Guard bổ sung đã có, chưa được router sử dụng |
| `src/app/context/AuthContext.tsx` | Tài khoản demo, login/logout và `useAuth` |
| `src/app/pages/` | 15 trang sản phẩm/khách hàng/quản trị |
| `src/app/components/ui/` | 46 module UI, cộng `utils.ts` và `use-mobile.ts` |
| `src/app/components/figma/ImageWithFallback.tsx` | Component ảnh dự phòng đã có, chưa được page import |
| `src/styles/index.css` | Import font, Tailwind, theme và brand tokens |
| `src/styles/theme.css` | Token shadcn mặc định và base typography; chưa chuyển hết sang màu thương hiệu |
| `src/styles/brand.css` | Token Lunara và utility màu/font để dùng cho code mới |
| `vite.config.ts` | React/Tailwind plugins, alias `@`, resolver `figma:asset/`, bundle splitting, localhost |
| `codegraph.json` | Loại dependency, build, audit, local config và secret khỏi index |
| `scripts/codegraph.mjs` | Chạy CLI local với root cố định, telemetry/download fallback bị tắt |
| `scripts/setup-assistant.mjs` | Tạo cấu hình MCP cục bộ và init/sync graph |

Stack được giữ: React/React DOM `18.3.1`, React Router `7.18.4`, Vite `6.4.4`, Tailwind `4.1.12`, `@vitejs/plugin-react` `4.7.0`, Recharts `2.15.2`. CodeGraph là dev dependency được pin `1.5.0`, cùng phiên bản CLI đã có trên máy; cấu hình này không nâng cấp bản global. Node `24.11.1` và npm `11.6.2` đã dùng cho kiểm tra.

Ứng dụng sử dụng Recharts trực tiếp ở Dashboard và Lucide cho icon. Các thư viện như MUI, React Hook Form, Motion có trong manifest không đồng nghĩa đã được áp dụng cho mọi page; kiểm tra import trước khi chọn giải pháp. Không thêm thư viện trùng chức năng chỉ vì chưa thấy component trong trang hiện tại.

## Trang và luồng nghiệp vụ

| Route | File trang | Có gì hiện tại | Giới hạn cần nhớ |
| --- | --- | --- | --- |
| `/` | `Landing.tsx` | Hero, 4 sản phẩm nổi bật, đánh giá mẫu, CTA Shop/Custom Orders | Product/price riêng trong file, giá là chuỗi hiển thị |
| `/shop` | `Shop.tsx` | 8 sản phẩm, search, danh mục, sort giá/rating, like/add indicators | Like/Add chỉ đổi state cục bộ; không cập nhật Cart |
| `/cart` | `Cart.tsx` | 3 fixture item, +/-/xóa, coupon, chọn giao hàng, checkout, confirmation | Giỏ độc lập; confirmation không tạo order/email/thanh toán |
| `/request` | `Request.tsx` | Wizard 4 bước: Occasion, Style, Details, Contact | Chỉ state và màn hình success; chưa gửi request ra server |
| `/profile` | `Profile.tsx` | Profile/edit, orders/wishlist/settings UI, logout | Yêu cầu login trong component; profile mẫu riêng, chỉnh sửa không đồng bộ AuthContext |
| `/orders` | `OrderHistory.tsx` | 4 order mẫu, search/filter, expand, timeline | Không tải order theo user; route chưa được guard như Profile |
| `/login` | `Login.tsx` | Login qua `useAuth`, lỗi nhập liệu, show password, redirect theo role | Tài khoản fixture; Remember me không tạo persistence lâu dài |
| `/signup` | `Signup.tsx` | Form, strength indicator, terms checkbox, success | Chưa đăng ký tài khoản; chưa có xác thực hoàn chỉnh |
| `/admin`, `/admin/dashboard` | `Dashboard.tsx` | KPI, chart revenue/category, top products, recent orders | Chart/metrics/date mẫu; chọn period chưa tính lại dữ liệu |
| `/admin/stock` | `Stock.tsx` | 8 fixture product, search/filter, modal add/edit, xóa, low stock | Chỉ sửa state trang; chưa nối catalog/giỏ/đơn |
| `/admin/orders` | `AdminOrders.tsx` | 10 fixture order, search/status tabs, phân trang, cập nhật status | Chỉ state; chưa có máy trạng thái/order service server |
| `/admin/customers` | `AdminCustomers.tsx` | 10 customer mẫu, search/filter/VIP | Không phải customer database |
| `/admin/requests` | `AdminRequests.tsx` | 5 request mẫu, expand, review/approve/decline/complete | Không nối wizard khách hàng |
| `/admin/settings` | `AdminSettings.tsx` | Store/contact/currency/timezone, notification toggles, Saved indicator | Save chỉ phản hồi UI; không đổi config chung hoặc lưu server |

Admin được `AdminLayout` chuyển về `/login` khi chưa login, về `/` khi role không phải admin. Role/user đọc từ `sessionStorage` khóa `lunara_user`; dữ liệu này có thể bị người dùng sửa. `AdminRoute` tồn tại nhưng chưa được nối vào route tree. Đây là điều khiển hiển thị demo, không phải ranh giới bảo mật production.

### Quy ước dữ liệu đang có

- Danh mục: `Bouquets`, `Arrangements`, `Dried Flowers`, `Gift Sets`; `All` chỉ là bộ lọc.
- Giá sản phẩm chủ yếu là số; Landing có giá dạng chuỗi. ID cùng số có thể chỉ sản phẩm khác giữa Shop/Cart/Landing; không nối các list bằng ID hiện tại mà chưa chuẩn hóa.
- Giỏ demo: `subtotal = Σ(price × qty)`; coupon `lunara10` giảm `floor(subtotal × 0.1)`; `total = subtotal + deliveryFee - discount`.
- Giao hàng mẫu: Standard `₱150`, Express `₱300`, Same-day `₱500`. Các lời hứa thời gian trong UI là demo, chưa được kiểm tra với lịch vận hành.
- Order admin: `Pending`, `Processing`, `In Transit`, `Delivered`, `Cancelled`. OrderHistory có tập trạng thái riêng; không mặc định hai file đã chung một model.
- Custom request admin: `Pending`, `In Review`, `Approved`, `Declined`, `Completed`; form khách có occasion/colors/flowers/size/budget/date/recipient/message/contact, nhưng field `budget` chưa có input trong UI.
- Mọi local state có thể mất khi remount/reload. Auth session là ngoại lệ dùng `sessionStorage`; không lưu mật khẩu vào session này. Không đưa thông tin đăng nhập demo vào tài liệu công khai.

## Bộ nhận diện và token thiết kế

Các màu cơ sở dưới đây được lấy từ source hiện tại, không suy đoán từ tên project. Màu rose chính xuất hiện 159 lần trong source trước khi bổ sung token; border 125 lần, ink 117 lần. Số lần này là snapshot khảo sát, không phải chỉ tiêu cần duy trì.

| Vai trò | Màu | Token CSS / utility |
| --- | --- | --- |
| Rose thương hiệu, điểm nhấn | `#C17B8A` | `--lunara-rose` / `bg-lunara-rose` |
| Rose CTA có chữ trắng nhỏ | `#9D586B` | `--lunara-rose-strong` / `bg-lunara-rose-strong` |
| Rose nhạt, chart/chi tiết | `#D4A0AC` | `--lunara-rose-light` / `text-lunara-rose-light` |
| Nền kem storefront | `#FDF6F0` | `--lunara-cream` / `bg-lunara-cream` |
| Nền gần trắng | `#FDFBF9` | `--lunara-surface` / `bg-lunara-surface` |
| Nền blush nhạt | `#F9EDE9` | `--lunara-blush` / `bg-lunara-blush` |
| Viền nhẹ | `#F0DDD5` | `--lunara-border` / `border-lunara-border` |
| Chữ tiêu đề/chính | `#3D2228` | `--lunara-ink` / `text-lunara-ink` |
| Chữ body | `#6B4C55` | `--lunara-body` / `text-lunara-body` |
| Chữ muted cũ | `#9A7080` | `--lunara-muted` / `text-lunara-muted` |
| Sidebar admin tối | `#1A0D12` | `--lunara-sidebar` / `bg-lunara-sidebar` |
| Nền main admin | `#F8F4F2` | `--lunara-admin-background` / `bg-lunara-admin-background` |
| Success/sage | `#7A9E7E` | `--lunara-success` / `text-lunara-success` |
| Warning | `#D4A020` | `--lunara-warning` / `text-lunara-warning` |
| Info | `#5B8DD9` | `--lunara-info` / `text-lunara-info` |
| Danger | `#E8453C` | `--lunara-danger` / `text-lunara-danger` |

Token `rose-strong` là bổ sung mới cho code mới, không phải màu CTA cũ đã được thay toàn project. Trắng trên rose gốc có contrast dưới 4.5:1; không dùng cặp này cho chữ nhỏ cần đọc. Các màu success/warning/info dùng làm icon, nền hoặc điểm nhấn với nhãn tối; không mặc định đủ contrast khi làm chữ nhỏ. Bộ token mới chưa tự động sửa toàn bộ vấn đề accessibility trong UI cũ.

Font lấy từ Google Fonts trong `src/styles/fonts.css`:

- **Cormorant Garamond**: logo, hero, tiêu đề; `font-display`. Giữ cảm giác serif mềm, editorial; hero đang dùng `clamp`, font weight khoảng 500–600.
- **Jost**: body, navbar, form, bảng; `font-body`. Có fallback `sans-serif`; không thay toàn bộ font khi thêm một page.

Phong cách bố cục: storefront `max-w-7xl`, wizard `max-w-3xl`, auth card gọn; pill buttons/filter, card `rounded-2xl`/`rounded-3xl`, viền nhạt, shadow nhẹ, hoa là trọng tâm ảnh. Sidebar admin hiện rộng 240px, top bar 62px, ẩn sidebar desktop dưới `md`. Đó là baseline, không phải giới hạn cứng khi người dùng yêu cầu thay đổi layout.

### Dùng token khi viết UI mới

```tsx
import { Button } from "../components/ui/button";

<section className="bg-lunara-cream font-body text-lunara-body">
  <h2 className="font-display text-lunara-ink">A bouquet for your moment</h2>
  <Button className="rounded-full bg-lunara-rose-strong text-white hover:bg-lunara-ink focus-visible:ring-lunara-ink">
    Explore flowers
  </Button>
</section>
```

Ví dụ import trên áp dụng từ file trong `pages/`. Có thể dùng `var(--lunara-rose)` trong inline style khi component cần giá trị động. `theme.css` vẫn có `--primary: #030213` cho shadcn; token Lunara được tách tên để không đổi giao diện hiện tại ngoài phạm vi task. Dark tokens có trong theme mặc định nhưng ứng dụng chưa có trải nghiệm dark mode hoàn chỉnh.

## Component có sẵn

Pages hiện dùng HTML native và inline style, chưa import trực tiếp các primitive trong `ui/`. Vì vậy “component có sẵn” nghĩa là có file tái sử dụng, không đồng nghĩa toàn bộ page đã dùng nó. Dashboard dùng Recharts trực tiếp; icon `Calendar` trong Request là Lucide, không phải date-picker đã tích hợp.

| Nhóm | Module có sẵn trong `src/app/components/ui/` |
| --- | --- |
| Nút/trạng thái | `button`, `badge`, `alert`, `progress`, `skeleton` |
| Input/form | `input`, `textarea`, `label`, `form`, `checkbox`, `radio-group`, `select`, `switch`, `slider`, `input-otp`, `calendar` |
| Overlay/phản hồi | `dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `tooltip`, `hover-card`, `sonner` |
| Navigation | `breadcrumb`, `navigation-menu`, `menubar`, `dropdown-menu`, `context-menu`, `command`, `pagination`, `tabs`, `sidebar` |
| Nội dung/bố cục | `card`, `table`, `avatar`, `aspect-ratio`, `accordion`, `collapsible`, `scroll-area`, `resizable`, `carousel`, `chart`, `toggle`, `toggle-group` |
| Helper | `utils.ts`: `cn` ghép class bằng clsx/tailwind-merge; `use-mobile.ts`: `useIsMobile` |

Các wrapper UI có named exports: ví dụ `Button`, `Card`/`CardHeader`/`CardContent`, `Dialog`/`DialogContent`/`DialogTitle`, `FormField`, `Table`, `Calendar`, `Toaster`. `form` dùng React Hook Form, `calendar` dùng React Day Picker, `carousel` dùng Embla, `chart` dùng Recharts, `sonner` dùng Sonner/next-themes. Kiểm tra yêu cầu provider của component trước khi tích hợp; chưa có Toaster hoặc ThemeProvider trong cây App hiện tại.

Những component nghiệp vụ **chưa có**: `ProductCard` chung, `ProductDetail`, `Price`/formatter chung, `StatusBadge` chung, `PageHeader` chung, `EmptyState` chung, `CartContext`, catalog/order/request service. Card sản phẩm và status badge hiện viết lặp trong pages. Hãy tách khi tính năng cần dùng ở nhiều nơi, không tạo hàng loạt component trống trước khi có use case.

## Tiêu chuẩn khi phát triển

### Code và kiến trúc

- Component dùng PascalCase, hook dùng `use...`, props/domain types viết rõ. Giữ TypeScript/TSX và code style của file đang sửa; không thêm `any` để bỏ qua lỗi dữ liệu.
- Route mới đặt ở `routes.ts`, đi qua layout đúng vai trò. Giữ alias `@` trỏ về `src` và resolver Figma; chưa có tsconfig/typecheck đầy đủ, không coi alias Vite là cấu hình TypeScript hoàn chỉnh.
- UI state ngắn hạn để tại component. Dữ liệu cần nối Shop/Cart/Stock/Orders phải có cùng model/source of truth; fixture và real service phải phân biệt rõ.
- Giữ giá dạng số, số lượng là số nguyên dương, xử lý giới hạn stock khi có flow dùng stock. Định dạng tiền tại điểm render và giữ currency thống nhất.
- Khi thêm file dùng chung, cập nhật allowlist Git và guide/component inventory phù hợp. Khi đổi schema/luồng, xem dependents qua CodeGraph rồi sync lại.

### UI, accessibility và trải nghiệm

- Giữ tone thương hiệu và component đang có. Mỗi thao tác có phản hồi rõ; trạng thái loading/error/empty/success áp dụng khi tính năng có nhu cầu thực tế.
- Label/input nối đúng; icon button có tên truy cập, ảnh có alt phù hợp, focus nhìn thấy, dialog có title và xử lý bàn phím. Form quan trọng dùng submit/validation thực sự thay vì chỉ đổi màn hình.
- Kiểm tra layout nhỏ khoảng 375px và desktop khoảng 1440px khi sửa responsive; bảng có chiến lược overflow, menu mobile có đường đóng dễ dùng. Không tuyên bố đã kiểm tra những viewport chưa mở.
- Với ảnh sản phẩm, giữ tỉ lệ/crop nhất quán và dùng fallback khi cần. Unsplash/Google Fonts là nguồn ngoài; file attribution phải giữ. Tự host/tối ưu ảnh/font là hướng cải tiến, chưa được làm trong cấu hình này.
- Chữ thường cần contrast tối thiểu 4.5:1, chữ lớn 3:1; kiểm tra cặp màu thực tế, không chỉ tên token. Animation mới tôn trọng reduced motion.

### Bảo mật và sự thật về demo

- Fixture auth và client-side guard không bảo vệ dữ liệu thật. Production cần xác thực/phân quyền server, dữ liệu theo user và xử lý phiên phù hợp; chưa có các phần này.
- Không lưu bí mật thật trong frontend, `VITE_*`, docs hay Git. Không đưa thông tin khách hàng thật vào fixture/screenshot. Không coi hidden button là authorization.
- Không xác nhận đã nhận tiền/tạo đơn/gửi email khi chỉ đổi UI state. Khi làm demo, ghi rõ giới hạn trong báo cáo thay đổi; khi làm production, chỉ xác nhận sau kết quả backend/provider.
- `.npmrc` giữ registry npm HTTPS chính thức và `ignore-scripts=true`. Không bật script dependency hàng loạt, thêm remote executable hoặc đổi sandbox/approval để xử lý một lỗi cài đặt.
- `node_modules`, `dist`, cache, `.security-review`, `.codegraph` và `.codex` không được đưa lên Git. Chỉ hai file instruction đã xét duyệt trong `.agents/skills/lunara-flower-shop/` được cho phép; phần khác của `.agents/` vẫn bị chặn.
- `.gitignore` không ngăn `git add -f`, không quét nội dung file đã cho phép, và không phải branch protection. File đã được Git track cũng không bị xóa khỏi lịch sử bởi `.gitignore`.

### Kiểm tra và báo cáo

- Code/style/build thay đổi: `npm run build` và kiểm tra trang/flow ảnh hưởng. Sửa dependency: thêm `npm audit`; 0 lỗ hổng đã biết không chứng minh không còn mọi rủi ro.
- Project chưa có script lint/typecheck/test. Vite build kiểm tra bundling, không thay thế TypeScript semantic checking hoặc kiểm tra nghiệp vụ.
- Thêm test khi có logic có thể hồi quy, ví dụ tính tổng tiền, thao tác cart, validation hoặc quyền truy cập; không dựng framework mới chỉ để kiểm tra sửa tài liệu.
- Báo cáo tiếng Việt: kết quả cụ thể, file thay đổi, kiểm tra đã thực hiện và giới hạn còn lại. Không cần nhắc lại toàn bộ sổ tay trong mỗi lần giao việc.
- Commit/push chỉ khi task có yêu cầu; lần push khởi tạo trước đó không tự cho phép mọi thay đổi sau này lên `main`.

## CodeGraph và cấu hình trợ lý

CodeGraph đã được cài **local trong project** bằng dev dependency pin `@colbymchenry/codegraph@1.5.0`. Index nằm tại **`.codegraph/` ở root**. Tool này lập graph code để tìm symbol/call path; không phải antivirus, không tự sửa lỗi và không index CSS/tài liệu như TypeScript.

Lần đầu trên bản clone mới:

```bash
npm ci
npm run assistant:setup
```

`assistant:setup` init nếu chưa có DB, sync nếu đã có. Script tạo `.codex/config.toml` cục bộ cho CodeGraph STDIO và OpenAI Docs MCP (`https://developers.openai.com/mcp`). Đường dẫn Node/root riêng máy được ghi vào file ignored này, không hardcode trong file chia sẻ. Script quản lý một block riêng, giữ các setting khác; nếu trùng tên MCP bên ngoài block, dừng với thông báo để tránh ghi đè.

Không chạy `codegraph install` toàn máy vì project đã được kết nối bằng cấu hình riêng; không sửa MCP/global preferences của repository khác. Không thay đổi quyền sandbox hoặc approval policy. Khi phiên Codex mới mở repository trusted, cấu hình local có hiệu lực; phiên đang chạy có thể cần mở lại để nhận MCP mới.

Trong lần cấu hình này, đúng thư mục repository hiện tại đã được đăng ký trusted trong config cá nhân của Codex để MCP project thực sự được nạp. Chỉ entry của thư mục này được thêm; sandbox, approval và setting của project khác được giữ. Entry trust là riêng máy, không đưa lên Git và không tự áp dụng cho bản clone ở vị trí mới.

Các lệnh dùng hằng ngày:

| Lệnh | Mục đích |
| --- | --- |
| `node scripts/codegraph.mjs status --json` | Tình trạng index, số file/symbol, pending changes |
| `npm run graph:sync` | Đồng bộ thay đổi source |
| `npm run graph:init` | Khởi tạo graph local |
| `npm run graph:explore -- "Shop toggleAdd Cart"` | Tra luồng giữa các symbol |
| `node scripts/codegraph.mjs node --file src/app/pages/Shop.tsx --offset 1 --limit 100` | Đọc đúng đoạn source khi explore chưa trả target |
| `node scripts/codegraph.mjs index` | Rebuild khi schema/exclusion đổi |

CLI wrapper và MCP local đều tắt telemetry (`CODEGRAPH_TELEMETRY=0`, `DO_NOT_TRACK=1`) và tắt tải fallback (`CODEGRAPH_NO_DOWNLOAD=1`). Đây là cấu hình của project; lựa chọn telemetry của CodeGraph global không bị đổi. Lệnh global `codegraph ...` chạy trực tiếp sẽ dùng setting global, nên dùng wrapper/npm scripts ở đây.

Trên Windows PowerShell, nếu `npm.ps1` làm mất đối số sau `--`, dùng `npm.cmd run graph:status -- --json` hoặc lệnh Node trực tiếp trong bảng. Các script graph vẫn chạy được khi gọi từ root hoặc khi wrapper được gọi bằng đường dẫn tuyệt đối từ thư mục con.

`codegraph.json` và `.gitignore` giữ build/dependency/audit/secret khỏi index. Default-deny Git có hệ quả: file mới chưa được cho phép sẽ chưa vào graph. Sau khi xem xét file mới, bổ sung đúng đường dẫn vào allowlist, rồi sync. Database graph không được push và có thể rebuild trên máy khác.

OpenAI Docs MCP chỉ đọc tài liệu chính thức; việc cấu hình URL không phải tích hợp OpenAI API vào app và không cần API key. Mạng/tài khoản/chính sách host có thể ảnh hưởng MCP; CLI local vẫn là đường tra CodeGraph dự phòng.

## Lệnh cài, chạy và build

```bash
npm ci
npm run dev
npm run build
npm run preview
```

Dev thường ở `http://127.0.0.1:5173`; preview thường ở `http://127.0.0.1:4173`; output production trong `dist/`. Vite có thể chọn port kế tiếp khi port bận. Host localhost là mặc định đã cấu hình. Nếu triển khai server SPA sau này, cần rewrite route sâu về `index.html`; task này chưa triển khai hosting.

## Brainstorm và thứ tự phát triển

Các mục sau là **đề xuất từ hiện trạng**, chưa được triển khai và không tự cho phép Codex làm thêm. Ưu tiên theo luồng mua hoa có thể dùng được, thay vì xây mọi màn hình cùng lúc.

| Ưu tiên | Hướng phát triển | Cơ sở hiện tại / dependency | Dấu hiệu hoàn thành |
| --- | --- | --- | --- |
| 1 | Chuẩn hóa catalog và kết nối giỏ hàng | Product/ID đang lặp, Shop không nối Cart; tận dụng Card/Button | Add/remove/qty phản ánh ở Shop, navbar và Cart; tổng tiền nhất quán |
| 1 | Hoàn thiện validation và phản hồi | Signup/Checkout/Request đang báo success trước khi có xử lý thật | Dữ liệu sai không tiến bước; trạng thái demo hoặc kết quả xử lý đúng |
| 1 | Chuẩn hóa component và accessibility | Đã có primitives nhưng pages dùng HTML/inline; contrast/focus cần cải thiện | Tái dùng những phần thực sự trùng, thao tác keyboard và mobile dùng được |
| 2 | Trang chi tiết bó hoa | Catalog hiện mới có grid; có carousel/dialog/accordion | Mô tả, loại hoa, size, giá, ảnh, care guide và CTA cùng product model |
| 2 | Tìm theo dịp và ý nghĩa hoa | Wizard đã có 10 occasion, nhưng catalog chưa có occasion tags | Filter/search không thay đổi dữ liệu gốc; no-result rõ ràng |
| 2 | Giao hàng, lời nhắn và gói quà | Cart có recipient/contact, Request có date/message | Chính sách khu vực/cutoff do chủ dự án chọn; phí và ngày khả dụng được tính đúng |
| 3 | Backend auth/catalog/order/request | Hiện toàn fixture, chưa có server | Session/quyền kiểm tra server, user chỉ thấy dữ liệu của mình, trạng thái bền vững |
| 3 | Thanh toán qua provider phù hợp thị trường | Chưa chọn provider, currency hiện PHP | Tổng tiền server, kết quả provider/webhook xác minh, không tạo đơn thành công giả |
| 3 | Quản trị tồn kho và vận hành florist | Stock/Orders/Requests hiện tách rời | Đặt đơn/trừ stock, nhập thêm, báo thiếu hoa và request review theo cùng dữ liệu |
| 4 | Wishlist/reviews/loyalty thực | Profile/Shop/testimonials hiện là demo | Dữ liệu theo user, quy tắc review/điểm do chủ dự án chọn |
| 4 | SEO và hiệu năng | SPA, ảnh/font ngoài, bundle charts | Metadata sản phẩm, ảnh tối ưu, đo tải và chiến lược render phù hợp hosting |

Các quyết định chưa được người dùng chốt: đổi sang VND hay giữ PHP; đổi tên thương hiệu; backend/provider; khu vực giao hàng và giờ cắt đơn; refund/cancel policy; booking wedding/event; multi-store, subscriptions, loyalty hoặc chatbot. Khi task cần các quyết định này, hỏi đúng phần ảnh hưởng, vẫn tiếp tục phần độc lập.

## File nào chia sẻ, file nào giữ local

Chia sẻ cùng repository: `AGENTS.md`, `PROJECT_GUIDE.md`, skill `SKILL.md`/`agents/openai.yaml`, `codegraph.json`, hai script setup/wrapper, `brand.css`, source và manifest/lockfile. Các file này được bổ sung chính xác vào `.gitignore` allowlist.

Giữ local: `.codex/config.toml`, `.codegraph/`, `.security-review/`, `SECURITY_REVIEW.md`, `.npm-cache/`, `node_modules/`, `dist/`, `.env`, khóa và log. Bằng chứng kiểm tra chi tiết có thể chứa đường dẫn máy; không đưa vào tài liệu chia sẻ. Bộ tài liệu/cấu hình mới chưa tự commit hoặc push.

## Kiểm chứng sau cấu hình

- Lượt rà soát cuối bao phủ đủ 92 file được Git nhận, gồm 75 file trong `src/`; manifest và lockfile khớp dependency pin.
- `npm run build` thành công; 6 utility màu/font mẫu của Lunara được biên dịch riêng để kiểm tra token.
- Preview trả HTTP 200 cho HTML và 5 asset; Edge headless render được trang chủ và login. Lần kiểm tra này chặn tài nguyên ngoài nên không xác minh việc tải ảnh/font từ mạng.
- Skill qua validator của `skill-creator`. `codex debug prompt-input` xác nhận cả rule project và metadata skill được nạp vào context, không cần gọi model.
- MCP CodeGraph local trả source cho luồng Shop/Cart; OpenAI Docs MCP trả kết quả tìm kiếm AGENTS.md. Setup chạy lại giữ nguyên cấu hình.
- Index cuối có 74 file code, 784 node, 1.308 edge, không còn pending changes. `npm audit` sau cài CodeGraph báo 0 lỗ hổng đã biết.
- Các file instruction mới được Git nhận, còn database/index, config riêng máy, file môi trường và nội dung agent khác vẫn bị ignore.

Bằng chứng chi tiết nằm trong `.security-review/` và không được push. Các con số này là kết quả lần cấu hình ngày 12/10/2026, cần kiểm tra lại khi code/dependency thay đổi.

## Nguồn tài liệu và cách duy trì

Bộ rule/skill được thiết kế dựa trên source đã khảo sát và các trang OpenAI Docs đã đọc ngày 12/10/2026:

- [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): hướng dẫn project theo cây thư mục, nạp ở đầu phiên; giữ file ngắn và đưa nội dung dài vào tham chiếu.
- [Build skills](https://learn.chatgpt.com/docs/build-skills): metadata `name`/`description`, discovery `.agents/skills/`, explicit/implicit invocation và tài nguyên đọc theo nhu cầu.
- [Config basics](https://learn.chatgpt.com/docs/config-file/config-basic): project `.codex/config.toml` chỉ nạp cho repository trusted.
- [Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) và [OpenAI Docs MCP](https://developers.openai.com/resources/docs-mcp): STDIO/HTTP config và endpoint đọc tài liệu.
- [CodeGraph README](https://github.com/colbymchenry/codegraph/blob/main/README.md): init/index, graph local, exclusions và telemetry. Lệnh/behavior của bản pin được đối chiếu thêm với CLI/README `1.5.0` đã cài, không mặc định mọi option mới của upstream có trong bản pin.

Khi thêm route/component/domain model, cập nhật mục tương ứng trong sổ tay. `AGENTS.md` giữ các quy tắc dùng thường xuyên; skill giữ cách thực hiện theo task; tránh copy toàn bộ sổ tay vào mọi file để không làm context phình lên. Kết quả build, audit và kiểm tra MCP thực tế được ghi trong báo cáo bàn giao; tài liệu nguồn không thay thế kiểm chứng ở máy hiện tại.
