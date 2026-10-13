# Sổ tay dự án Lunara Flower Shop

Tham chiếu cho chủ dự án và Codex về kiến trúc, giao diện, component và giới hạn demo. Quy tắc làm việc ở [AGENTS.md](AGENTS.md); workflow UI/nghiệp vụ ở [.agents/skills/lunara-flower-shop/SKILL.md](.agents/skills/lunara-flower-shop/SKILL.md). Cập nhật kiến trúc: **13/10/2026**. Code hiện tại là nguồn quyết định khi tài liệu khác với implementation.

## Cách sử dụng với Codex

Mở đúng repository trong một phiên Codex được trusted để nạp instructions và MCP. Mô tả kết quả muốn đạt, flow cần kiểm chứng và ngoại lệ so với quy ước. Ví dụ:

```text
Dùng $lunara-flower-shop. Thực hiện [tính năng] ở [feature/flow].
Giữ bộ nhận diện và giới hạn demo hiện tại.
Kết quả cần: [hành vi có thể kiểm chứng].
```

ChatGPT thông thường không tự đọc file trên máy. Với phiên không có workspace, đính kèm sổ tay và instructions. Các đề xuất trong roadmap không tự cho phép triển khai, commit hoặc publish.

## Hiện trạng và bản đồ dự án

UI branding là **Lunara**; repository GitHub tên **Lurana**. Copy sản phẩm dùng tiếng Anh, tiền PHP/₱, settings mặc định Asia/Manila. Giao tiếp với chủ dự án bằng tiếng Việt.

Đây là **frontend demo**, chưa có backend, database, API catalog, dịch vụ email hay thanh toán. Auth dùng tài khoản fixture; role/session trong trình duyệt chỉ điều khiển UI. Các màn hình success của signup, checkout và custom request mô tả preview, không xác nhận account/order/email thật.

Stack runtime giữ nguyên: React/React DOM `18.3.1`, React Router `7.18.4`, Vite `6.4.4`, Tailwind CSS `4.1.12`, React Vite plugin `4.7.0`, Recharts `2.15.2`. TypeScript `5.7.3`, types React 18 và CodeGraph `1.5.0` được pin trong dev dependencies. Môi trường kiểm chứng: Node `24.11.1`, npm `11.6.2`.

```text
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── providers.tsx           # AuthProvider + CartProvider
│   ├── router.tsx              # route tree duy nhất
│   └── layouts/                # MainLayout, AdminLayout, app hooks
├── pages/                      # page mỏng: ghép view và feature hooks
│   └── admin/                  # các page admin được lazy-load
├── features/
│   ├── auth/                   # context, login/signup, fixture session
│   ├── shop/                   # canonical catalog, search/filter/sort
│   ├── cart/                   # shared cart + checkout preview
│   ├── orders/                 # lịch sử khách và quản trị đơn mẫu
│   ├── custom-order/           # wizard và quản trị request mẫu
│   ├── landing/                # hero, featured, story, testimonials
│   ├── profile/                # profile, wishlist, account sections
│   ├── inventory/              # stock snapshot, table, dialog add/edit
│   └── admin/                  # dashboard, customers, settings
├── shared/
│   ├── ui/                     # button, input, dialog
│   ├── components/             # ImageWithFallback, route feedback
│   ├── hooks/                  # useIsMobile
│   └── lib/                    # cn, formatMoney, finite color classes
└── styles/                     # fonts, Tailwind entry, global theme/brand
```

### Ranh giới module

- `pages → features → shared`. Page gọi hook và truyền props cho view; không sở hữu state nghiệp vụ hoặc style.
- Feature chứa `components/`, `hooks/`, `data/`, services/types và `index.ts`. Component trình bày không gọi service hoặc giữ state nghiệp vụ; hooks quản lý state/actions và gọi service.
- Import từ feature khác đi qua `@/features/<name>` public API. Không import trực tiếp hook/data/component nội bộ của feature khác. Trong cùng feature có thể dùng import tương đối.
- `shared` không biết catalog, cart, orders hoặc auth. Nó chỉ chứa primitive, presentation helper và design palette.
- `app` ghép router/providers/layouts. Menu, location và logout của layout ở `app/layouts/hooks/`; guards vẫn thuộc UI demo.
- Alias `@/` trỏ tới `src/` trong cả Vite và `tsconfig.json`. `figma:asset/` resolver được giữ. Không có `components.json`; nếu thêm shadcn CLI sau này, dùng alias `@/shared/ui`.
- Style trong JSX dùng Tailwind; CSS giữ token/theme/focus toàn cục. Các props cấu hình chart như `contentStyle`/`tick` là API của Recharts, không phải page stylesheet.

## Trang và luồng nghiệp vụ

| Route | Page | Feature và hành vi hiện có |
| --- | --- | --- |
| `/` | `HomePage` | Landing sections; featured products lấy từ catalog chung |
| `/shop` | `ShopPage` | Search/category/sort, wishlist indicator, Add cập nhật shared cart |
| `/cart` | `CartPage` | Số lượng, xóa, delivery, coupon, validation delivery và checkout preview |
| `/request` | `CustomOrderPage` | Wizard 4 bước Occasion/Style/Details/Contact, preview/reset |
| `/orders` | `MyOrdersPage` | Order fixture, search/filter, expand và tracking timeline |
| `/profile` | `ProfilePage` | Login guard, profile/edit, orders/wishlist/settings |
| `/login` | `LoginPage` | Login fixture, lỗi nhập liệu, show password, redirect theo role |
| `/signup` | `SignupPage` | Form/strength/terms, account preview; không tạo account |
| `/admin`, `/admin/dashboard` | `AdminDashboardPage` | KPI/chart/top products/recent orders fixture |
| `/admin/stock` | `AdminStockPage` | Catalog snapshot + inventory metadata, filter, add/edit dialog, delete |
| `/admin/orders` | `AdminOrdersPage` | Search/status tabs, pagination, cập nhật status cục bộ |
| `/admin/customers` | `AdminCustomersPage` | Customer fixture, search/filter/VIP |
| `/admin/requests` | `AdminRequestsPage` | Expand, review/approve/decline/complete request fixture |
| `/admin/settings` | `AdminSettingsPage` | Store/settings fixture, notification switches, phản hồi save cục bộ |

Sáu page admin dùng `React.lazy`; `AdminLayout` giữ shell trong khi Suspense hiển thị loading. Route lỗi có fallback dùng chung. Không có route tree thứ hai hoặc thay đổi URL cũ.

### Ownership của catalog và cart

`features/shop/data/shop.data.ts` giữ 8 sản phẩm với ID, tên, category, ảnh và **giá numeric** thống nhất. `shop.service.ts` cung cấp snapshot và truy vấn; `useProducts` lo filter/sort/wishlist indicator. `ProductCard`, `ProductGrid`, `FilterBar` nhận props.

`CartProvider` nằm ngoài router, sở hữu một giỏ hàng dùng chung cho Shop, Cart và navbar. Cart line ID gồm **product ID + size**; thêm cùng variant tăng số lượng, size khác tạo line riêng. Số lượng trong demo nằm trong 1–99; badge navbar đếm tổng quantity. Giỏ khởi tạo bằng 3 line mẫu: Peony Medium ×1, Lavender Large ×2, Lily Small ×1. Chuyển route giữ cart; reload khôi phục fixture. Không ghi cart lên server hoặc browser storage.

- `subtotal = Σ(price × qty)`; coupon `lunara10` giảm `floor(subtotal × 0.1)`.
- Standard `₱150`, Express `₱300`, Same-day `₱500`; `total = subtotal + deliveryFee - discount`.
- Giỏ rỗng có tổng 0 và không cho tiến checkout. Thông tin giao hàng trống/email sai không hoàn tất preview.
- Checkout preview không tạo order, trừ stock, thu tiền hoặc gửi email. OrderHistory vẫn là fixture lịch sử.
- Landing/wishlist và inventory ban đầu lấy product hiện tại qua Shop public API. Stock edits giữ state riêng của trang; không cập nhật catalog hoặc cart. Historical orders giữ snapshot, không thay theo giá catalog hiện tại.

### Auth và các demo độc lập

Fixtures nằm trong `features/auth/data/demo-accounts.ts`; không chép mật khẩu mẫu vào tài liệu. Service login trả về tên/email/role, không trả password; `sessionStorage` chỉ lưu các field này dưới khóa `lunara_user`. Parse lỗi/shape không hợp lệ trả về guest. Remember me không tạo persistence lâu dài.

`AdminLayout` redirect guest về `/login`, user thường về `/`. `AdminRoute` có trong auth public API nhưng chưa được router dùng. Role/session client có thể bị sửa; đây không phải authorization production.

Profile/edit chưa đồng bộ AuthProvider. Signup chưa có đăng ký thật. Request wizard chưa nối AdminRequests; trường budget có trong model nhưng chưa có input. Order fixture khách và admin dùng model riêng. Dashboard period chưa tính lại metrics. Settings Save chỉ phản hồi trong phiên page và không đổi cấu hình/currency toàn app. Form/stock/order/request state có thể mất khi remount/reload.

## Bộ nhận diện và token thiết kế

| Vai trò | Token/utility | Giá trị |
| --- | --- | --- |
| Rose trang trí | `lunara-rose` | `#C17B8A` |
| CTA chữ trắng/nhãn rose nhỏ | `lunara-rose-strong` | `#9D586B` |
| Rose nhạt | `lunara-rose-light` | `#D4A0AC` |
| Nền kem | `lunara-cream` | `#FDF6F0` |
| Surface | `lunara-surface` | `#FDFBF9` |
| Blush | `lunara-blush` | `#F9EDE9` |
| Viền | `lunara-border` | `#F0DDD5` |
| Chữ chính | `lunara-ink` | `#3D2228` |
| Chữ body | `lunara-body` | `#6B4C55` |
| Sidebar admin | `lunara-sidebar` | `#1A0D12` |
| Nền admin | `lunara-admin-background` | `#F8F4F2` |

Headings/logo dùng `font-display` (Cormorant Garamond); body/forms dùng `font-body` (Jost). Font Google được import trong `fonts.css`. Token trong `brand.css` tách riêng token shadcn `theme.css`; không có dark-mode product flow hoàn chỉnh.

Giữ cream/rose floral, rounded cards, pill CTAs, shadow nhẹ, ảnh hoa và Lucide icons. Chữ trắng trên rose gốc không đủ contrast cho normal text; dùng rose-strong. Status labels nhỏ dùng màu tối hơn màu icon/chart. Giữ focus visible, labels, keyboard access và reduced motion khi thêm animation.

`shared/lib/color-classes.ts` ánh xạ palette hữu hạn thành **class Tailwind đầy đủ** để các màu động của fixture được scan. Khi thêm màu mới, bổ sung class literal; không tạo `bg-[${color}]` lúc runtime. `shared/lib/format.ts` định dạng tiền tại ranh giới hiển thị.

## Component có sẵn

`shared/ui` giữ **Button, Input, Dialog** và các subcomponent của Dialog. Các module không được app import đã loại bỏ, gồm calendar/menubar/input-otp/resizable và các wrapper khác. Không cần khôi phục cả bộ UI để thêm một primitive.

Customize Button/Input bằng Lunara classes; default shadcn primary vẫn là màu dark generic. Dialog inventory hỗ trợ focus trapping, Escape, title/description. `cn` dùng clsx/tailwind-merge; `useIsMobile` ở shared/hooks. `ImageWithFallback` giữ img/alt/dimensions và hiển thị placeholder khi ảnh lỗi.

Các domain component nằm trong feature tương ứng: Shop cards/filter/grid; CartItemList/CartSummary/CheckoutForm/Confirmation; các bước custom order; landing sections; profile tabs; bảng order/customer/inventory; dashboard widgets; settings sections. Chưa có generic domain StatusBadge.

## Tiêu chuẩn khi phát triển

Giữ route boundaries, public API của feature, catalog/cart source chung và URL cũ. Tách state/actions sang hook/service; fixture vào `data/`; presentation nhận props. Không thêm UI stack, backend giả hoặc feature roadmap ngoài yêu cầu.

Giá numeric, currency PHP và timezone Asia/Manila là mặc định demo. Đổi thị trường, delivery cutoff, business policy, payment/provider hoặc backend cần quyết định sản phẩm riêng. Không mô tả demo success thành account/order/email/payment bền vững.

Giữ labels, focus, keyboard, empty/error/success/loading states và responsive layout. Test logic có thể hồi quy. Không viết test mirror implementation hoặc dựng framework mới cho sửa tài liệu.

Không đưa secrets, customer data thật hoặc password thật vào source/docs/screenshots/`VITE_*`. `.npmrc` giữ HTTPS registry chính thức và `ignore-scripts=true`. Chỉ instruction files đã được allowlist trong `.agents` được chia sẻ; cấu hình `.codex` và database `.codegraph` ở local.

## Lệnh cài, chạy và kiểm tra

```bash
npm ci
npm run dev
npm run typecheck
npm run check:architecture
npm test
npm run build
npm audit
npm run preview
# Trong terminal khác khi preview đang chạy:
npm run check:ui -- http://127.0.0.1:4173
```

Dev `http://127.0.0.1:5173`, preview `http://127.0.0.1:4173`; Vite có thể chọn port kế nếu bận. Build ở `dist/`. Browser test hiện dùng **Edge headless trên Windows** và Node 24, chạy 15 route rồi kiểm tra commerce, wizard, profile/orders, admin, auth guards và mobile storefront. Nó chặn mạng ngoài để ổn định; không chứng minh ảnh/font remote tải được. Bằng chứng/screenshot/profile browser nằm trong `.security-review/`, không vào Git.

`typecheck` dùng compiler project được pin; `check:architecture` kiểm tra chiều import/public API, presentation state và inline styles; `npm test` dùng Node test runner cho commerce/auth/contrast. Chưa cấu hình ESLint. Vite build chỉ kiểm tra bundle và không thay semantic typecheck.

Trên Windows, Vite/CodeGraph đang chạy có thể khóa native binaries trong `node_modules`, làm `npm ci` báo EPERM. Dừng đúng process của workspace trước khi cài, rồi khởi động lại server; không bật dependency scripts để xử lý lỗi.

## CodeGraph và cấu hình trợ lý

Dependency local pin `@colbymchenry/codegraph@1.5.0`; graph ở `.codegraph/`. Wrapper cố định root, tắt telemetry và fallback download, không đổi global settings. Exclusions ở `codegraph.json` giữ dependency/build/audit/secret ngoài index.

```bash
# Bản clone mới:
npm run assistant:setup
# Hằng ngày:
npm run graph:status -- --json
npm run graph:sync
npm run graph:explore -- "useProducts useCartState useCheckout"
node scripts/codegraph.mjs node --file src/features/shop/hooks/useProducts.ts --offset 1 --limit 100
```

PowerShell có thể dùng `npm.cmd` để giữ đối số sau `--`. Reach for CodeGraph trước khi tìm/đọc code; dùng node/offset/limit khi explore thiếu target. File mới phải được review và có exact allowlist path trước khi sync.

Setup tạo `.codex/config.toml` local cho CodeGraph STDIO và OpenAI Docs MCP, giữ settings khác ngoài block quản lý. Mở phiên trusted mới để nạp cấu hình; không cấu hình global/repository khác. MCP OpenAI Docs chỉ đọc docs, không tích hợp OpenAI API vào storefront.

## Brainstorm và thứ tự phát triển

| Hướng tiếp theo | Cơ sở và việc còn thiếu |
| --- | --- |
| Validation form đầy đủ | Checkout đã có kiểm tra cơ bản; signup/request cần validation nghiệp vụ theo quyết định sản phẩm |
| Product detail và filter theo dịp | Dùng catalog/ProductCard hiện có; bổ sung description, variants, occasion tags |
| Wishlist/reviews thật | Shop/Profile/testimonials vẫn là demo độc lập |
| Delivery/message/gift options | Phải chốt khu vực, cutoff và policy; delivery hiện là fixture |
| Backend auth/catalog/orders/requests | Cần API/database và server authorization; browser role guards chưa đủ |
| Payment | Chọn provider/thị trường; server tính tổng, xác minh confirmation/webhooks |
| Inventory vận hành | Stock edits chưa nối shared catalog, checkout không trừ stock |
| SEO/performance | Admin đã lazy-load; còn metadata, ảnh/font tối ưu và rendering strategy |

Chưa chốt VND/thị trường Việt Nam, đổi thương hiệu, provider, delivery cutoff, refund/cancel policy, multi-store, subscription, loyalty hay chatbot. Chỉ hỏi quyết định thực sự ảnh hưởng task đang được yêu cầu.

## File chia sẻ và cách duy trì

`.gitignore` là default-deny allowlist: source, manifest/lockfile, docs, verification scripts/tests và skill được xét duyệt có exact paths và parent exceptions. Không dùng `git add -f`. Nó không quét secrets hoặc thay branch protection.

Giữ local: `node_modules`, `dist`, `.codegraph`, `.codex`, `.security-review`, `.env`, keys/logs/cache. Trước commit/push kiểm tra status, file inclusion và `git diff --check`. Commit/push/deploy chỉ khi yêu cầu hiện tại hoặc standing authorization bao gồm hành động đó.

Khi thay route/component/model hoặc ownership, cập nhật mục liên quan ở đây, AGENTS và skill. Báo cáo kiểm chứng thực tế trong bàn giao; không coi số liệu của lượt kiểm tra cũ là bảo đảm cho source mới.
