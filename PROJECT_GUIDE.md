# Sổ tay dự án Lunara Flower Shop

Tham chiếu cho chủ dự án và Codex về kiến trúc, giao diện, component và giới hạn demo. Quy tắc làm việc ở [AGENTS.md](AGENTS.md); workflow UI/nghiệp vụ ở [.agents/skills/lunara-flower-shop/SKILL.md](.agents/skills/lunara-flower-shop/SKILL.md). Cập nhật kiến trúc: **14/10/2026**. Code hiện tại là nguồn quyết định khi tài liệu khác với implementation.

## Cách sử dụng với Codex

Mở đúng repository trong một phiên Codex được trusted để nạp instructions và MCP. Mô tả kết quả muốn đạt, flow cần kiểm chứng và ngoại lệ so với quy ước. Ví dụ:

```text
Dùng $lunara-flower-shop. Thực hiện [tính năng] ở [feature/flow].
Giữ bộ nhận diện và giới hạn demo hiện tại.
Kết quả cần: [hành vi có thể kiểm chứng].
```

ChatGPT thông thường không tự đọc file trên máy. Với phiên không có workspace, đính kèm sổ tay và instructions. Các đề xuất trong roadmap không tự cho phép triển khai, commit hoặc publish.

## Hiện trạng và bản đồ dự án

UI branding là **Lunara**; repository GitHub tên **Lurana**. UI có English/Tiếng Việt, mặc định English; bản preview hiện hiển thị VND từ D1; các màn settings/auth/admin legacy tạm ẩn. Giao tiếp với chủ dự án bằng tiếng Việt.

| Keyword | Hiện trạng |
| --- | --- |
| Commerce | **D1 preview**: Home/Shop/Cart/Delivery/Quote đã nối API; backend COD/tra đơn Phase 3 đã có, UI gửi đơn/auth/admin chưa nối và tạm ẩn |
| Worker | Hono + `@cloudflare/vite-plugin`; health, catalog, delivery/quote, COD và tra đơn local; API lạ → JSON 404 |
| Health | Worker liveness; chưa kiểm tra kết nối/bảng D1 |
| Auth | Demo AuthProvider không active; login/profile/admin tạm ẩn, chưa có server authorization |
| Success | Cart hiện chỉ báo giá từ DB; signup/request/order/auth/admin tạm ẩn, không giả thành công hoặc thu tiền |
| Frontend pin | React/React DOM `18.3.1`; Router `7.18.4`; Vite `6.4.4`; Tailwind `4.1.12`; React plugin `4.7.0`; Recharts `2.15.2` |
| Tooling pin | TypeScript `5.7.3`; types React 18; CodeGraph `1.5.0` |
| Môi trường đã dùng | Node `24.11.1`, npm `11.6.3`; Wrangler hiện yêu cầu Node ≥22 |

### Kiến trúc MVP đã chọn

[Tech stack](docs/TECH_STACK.md) và [pipeline](docs/pipeline/README.md) ghi mục tiêu và tiến độ: Phase 0–3 DONE local; Phase 4/6 PLANNED; Phase 5 PARTIAL. Phase 3 bổ sung COD/tồn/idempotency/tra đơn và service chuyển trạng thái. Checklist và bằng chứng: [Phase 1](docs/pipeline/PHASE_1_DATABASE.md) · [Phase 2](docs/pipeline/PHASE_2_API_CATALOG.md) · [Phase 3](docs/pipeline/PHASE_3_CHECKOUT_ORDERS.md).

| Phạm vi | Đã có / còn thiếu |
| --- | --- |
| Runtime MVP | Hono/Cloudflare Workers · D1/SQLite · Zod · SQL tham số hóa |
| Media MVP | API catalog trả URL ảnh từ D1; seed dùng placeholder, Cloudinary upload chưa nối |
| Order MVP | Phase 3: COD, server tính tiền, batch trừ tồn/CHECK rollback, UUID idempotency, tra đơn bằng mã/SĐT; transitionOrder hoàn tồn một lần, DELIVERED → PAID; UI gửi đơn/admin thuộc Phase 4–5 |
| Admin auth | Secret + JWT cookie dự kiến Phase 4; auth khách để sau |
| Schema | [Canonical duy nhất: 10 bảng](migrations/0001_mvp.sql), nguyên DDL v2 có `delivery_zones`, idempotency và CHECK/unique; `custom_requests` deferred. [Đối chiếu v1/v2](docs/DATABASE_DESIGN.md); hai file schema cũ chỉ dẫn về migration |
| D1 local | Worker binding `DB`; migration `0001_mvp.sql`; seed 4 categories/8 products/24 variants/8 images/4 zones; verifier 13 nhóm qua `db:verify` |
| Cloudflare remote | Chủ dự án đã đăng nhập Wrangler và tạo `lunara-db`; Phase 0–3 không truy cập hoặc thay đổi remote |
| Persistence | CartProvider + localStorage version 1, chỉ variantId/quantity; wishlist tạm ẩn |
| Thị trường | UI active VND/tỉnh-phường từ API; legacy PHP/settings ẩn. Quote lấy giá/phí DB |
| Vận hành | Turnstile server verifier có điều kiện secret, đã kiểm mock; chưa deploy/domain, cấu hình Turnstile thật, rate limit, email hoặc payment provider |

```text
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── providers.tsx           # I18nextProvider + CatalogProvider + CartProvider
│   ├── router.tsx              # route tree duy nhất
│   └── layouts/                # MainLayout, AdminLayout, AuthLayout, app hooks
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
│   ├── lib/                    # cn, formatMoney, finite color classes
│   └── i18n/                   # config/hooks/switch + JSON en/vi theo feature
└── styles/                     # fonts, Tailwind entry, global theme/brand
```

| Backend keyword | File / cấu hình |
| --- | --- |
| Entry + env | `worker/index.ts`; `worker/env.ts`: DB, ADMIN_PASSWORD, JWT_SECRET, TURNSTILE_SECRET tùy chọn |
| Public routes | `worker/routes/public.ts`: categories/products/product detail, delivery options, checkout quote |
| Orders | `worker/routes/orders.ts`: POST orders/lookup; `worker/services/orders.ts`: create/lookup/transition, 35 statements cho 15 dòng và guard retry ≤40; chưa expose transition qua API |
| Services | `worker/services/catalog.ts`: tối đa 3 truy vấn; `delivery.ts`: phường rồi mặc định tỉnh; `pricing.ts`: một truy vấn variants `IN`, gộp giỏ và báo issues, chỉ đọc |
| Validation/lỗi | Root `shared/constants.ts` và `shared/schemas.ts`; `worker/lib/validate.ts`, `errors.ts`; JSON lỗi tiếng Việt, INTERNAL chỉ trả request_id |
| Middleware | Secure headers, X-Request-Id; GET catalog thành công cache public 30 giây; API khác/lỗi no-store |
| Config | `worker/config.ts`: VND, Asia/Ho_Chi_Minh; phụ phí 0/30.000/50.000, cutoff 16:00, chuẩn bị 120 phút và slot 08:00–20:00 là giả định chủ shop cần chỉnh |
| Typecheck | `tsconfig.worker.json`: `worker/`, root `shared/` và declaration; tách globals frontend |
| SPA/API routing | `wrangler.jsonc`: SPA fallback, `run_worker_first: ["/api/*"]` |
| Local bindings | Vite `remoteBindings: false`; plugin tự quản lý assets output |
| Typegen | `npm run cf:typegen` → `worker-configuration.d.ts`; `--include-runtime=false` + Workers types |
| Secrets | `.dev.vars` local; chỉ placeholder `.dev.vars.example` vào Git |

### Ranh giới module

- `pages → features → shared`. Page gọi hook và truyền props cho view; không sở hữu state nghiệp vụ hoặc style.
- Feature chứa `components/`, `hooks/`, `data/`, services/types và `index.ts`. Component trình bày không gọi service hoặc giữ state nghiệp vụ; hooks quản lý state/actions và gọi service.
- Import từ feature khác đi qua `@/features/<name>` public API. Không import trực tiếp hook/data/component nội bộ của feature khác. Trong cùng feature có thể dùng import tương đối.
- `src/shared` không biết catalog, cart, orders hoặc auth. Nó chỉ chứa primitive, presentation helper và design palette. Root `shared/` riêng chứa constants/schema Zod cho hợp đồng API; frontend dùng các schema này khi nối backend ở Phase 5.
- `app` ghép router/providers/layouts. Menu, location và logout của layout ở `app/layouts/hooks/`; guards vẫn thuộc UI demo.
- Alias `@/` trỏ tới `src/` trong cả Vite và `tsconfig.json`. `figma:asset/` resolver được giữ. Không có `components.json`; nếu thêm shadcn CLI sau này, dùng alias `@/shared/ui`.
- Style trong JSX dùng Tailwind; CSS giữ token/theme/focus toàn cục. Các props cấu hình chart như `contentStyle`/`tick` là API của Recharts, không phải page stylesheet.

## Trang và luồng nghiệp vụ

Preview hiện chỉ active /, /shop và /cart; URL khác hiện sắp ra mắt. Các dòng legacy dưới đây mô tả source được giữ, không phải chức năng đang hiển thị.

| Route | Page | Feature và hành vi hiện có |
| --- | --- | --- |
| `/` | `HomePage` | Landing sections; featured products lấy từ catalog chung |
| `/shop` | `ShopPage` | Catalog D1, search/category code/sort, chọn variant S/M/L và Add shared cart; wishlist/rating ẩn |
| `/cart` | `CartPage` | Variant cart/localStorage, số lượng/xóa, delivery DB và quote; coupon/đặt đơn ẩn |
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

Preview router hiện chỉ ghép Home/Shop/Cart và UnavailablePage, chưa nối các page admin legacy. Source AdminLayout/guards được giữ cho Phase 5 sau khi API Phase 4 có authorization; không coi chúng đang bảo vệ route quản trị vận hành. Route lỗi có fallback dùng chung; không có route tree thứ hai.

### Ownership của catalog và cart

CatalogProvider gọi Shop service để tải categories/products qua API cùng origin; DTO adapter thành model UI, không nhập shop.data.ts hay fallback fixture. Featured lấy is_featured từ DB; ratings/reviews/wishlist không có dữ liệu server được ẩn.

CartProvider dùng variant ID làm line identity, bắt đầu rỗng. localStorage lunara.cart.v1 chỉ lưu version/variantId/quantity, parse Zod và bỏ dữ liệu hỏng; reload dựng tên/ảnh/giá từ catalog và quote. Giỏ tối đa 15 dòng, 20 mỗi dòng và max_quantity từ API. useQuoteCart gọi delivery/options + checkout/quote, bỏ response cũ khi items/khu vực/method đổi. Giá, phí và tổng hiển thị VND từ DB; lỗi có i18n/retry, không thay bằng giá demo. Chưa có đặt đơn/trừ tồn/thu tiền.

Preview chỉ active Home/Shop/Cart. Login/signup/profile/orders/custom request/admin hiện FeatureUnavailable; source legacy giữ để nối các phase sau. [Backup và kiểm chứng](docs/pipeline/FE_AUDIT.md).

### Auth và các demo độc lập

Fixtures nằm trong `features/auth/data/demo-accounts.ts`; không chép mật khẩu mẫu vào tài liệu. Service login trả về tên/email/role, không trả password; `sessionStorage` chỉ lưu các field này dưới khóa `lunara_user`. Parse lỗi/shape không hợp lệ trả về guest. Remember me không tạo persistence lâu dài.

`AdminLayout` redirect guest về `/login`, user thường về `/`. `AdminRoute` có trong auth public API nhưng chưa được router dùng. Role/session client có thể bị sửa; đây không phải authorization production.

| Flow | Khoảng trống hiện tại |
| --- | --- |
| Profile | Edit chưa đồng bộ AuthProvider |
| Signup | Preview, chưa đăng ký thật |
| Request | Wizard chưa nối AdminRequests; model budget chưa có input |
| Orders | Fixture/model khách và admin riêng |
| Dashboard | Period chưa tính lại metrics |
| Settings | Save local, chưa đổi cấu hình/currency toàn app |
| Form/stock/order/request | State có thể mất khi remount/reload |

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

| Locale | `font-display` — heading/logo | `font-body` — body/form |
| --- | --- | --- |
| EN | Cormorant Garamond | Jost |
| VI | Lora | Be Vietnam Pro |

Google Fonts ở `fonts.css`, `display=swap`; `brand.css` đổi biến font qua `html[lang='vi']`, kể cả dialog portal. Lora: weight 400–700; heading weight 300 dùng 400 gần nhất. Brand tokens tách `theme.css`; dark-mode product flow chưa hoàn chỉnh.

Nguồn font: [Lora](https://github.com/google/fonts/tree/main/ofl/lora), [Be Vietnam Pro](https://github.com/google/fonts/tree/main/ofl/bevietnampro). Cả hai được phát hành theo SIL Open Font License. Kiểm tra typography bằng `node scripts/check-ui.mjs http://127.0.0.1:4173 --i18n-only --fonts` sau khi mở preview; chế độ `--fonts` cho phép tải Google Fonts để xác nhận font thật và dấu tiếng Việt, thay vì chỉ kiểm tra fallback offline.

Giữ cream/rose floral, rounded cards, pill CTAs, shadow nhẹ, ảnh hoa và Lucide icons. Chữ trắng trên rose gốc không đủ contrast cho normal text; dùng rose-strong. Status labels nhỏ dùng màu tối hơn màu icon/chart. Giữ focus visible, labels, keyboard access và reduced motion khi thêm animation.

`shared/lib/color-classes.ts` ánh xạ palette hữu hạn thành **class Tailwind đầy đủ** để các màu động của fixture được scan. Khi thêm màu mới, bổ sung class literal; không tạo `bg-[${color}]` lúc runtime. `shared/lib/format.ts` định dạng tiền tại ranh giới hiển thị.

## Component có sẵn

### Localization

`shared/i18n/config.ts` tạo i18next instance; `AppProviders` gắn I18nextProvider. Resources JSON được bundle tại `shared/i18n/locales/en|vi/`, tách namespace common/admin/auth/cart/custom-order/inventory/landing/orders/profile/shop. Không gọi dịch vụ dịch hoặc backend để đổi UI. English text hiện tại được giữ làm key/value; keySeparator/nsSeparator tắt để copy có dấu chấm/dấu hai chấm hoạt động. Message có count dùng các suffix plural của i18next và interpolation, không nối hậu tố English `s` trong JSX.

EN/VI nằm ở mép phải header storefront/admin và góc phải trên màn hình auth (kể cả signup preview). Mặc định English, nhớ preference `lunara_language` ở localStorage; khi storage bị chặn vẫn đổi được trong phiên. `document.documentElement.lang` cập nhật theo locale. Tiếng Việt thiếu key fallback English. Navbar chuyển sang menu mobile ở dưới breakpoint lg để chứa nhãn Việt và language switch.

Footer storefront được tách thành `app/layouts/components/StorefrontFooter.tsx`: giữ khối thương hiệu Lunara bên trái, thêm chăm sóc khách hàng, mạng xã hội và địa chỉ/công ty FlowerCorner theo nội dung chủ website cung cấp. Các đích liên kết ngoài nằm trong `shared/config/storefront-footer.ts`, mở tab mới; nhãn hỗ trợ EN/VI, tên công ty và địa chỉ giữ nguyên. Desktop từ 1024px dùng 4 cột; mobile/tablet đặt chăm sóc khách hàng và mạng xã hội cạnh nhau, khối thương hiệu và địa chỉ chiếm toàn hàng. `tailwind.css` đăng ký rõ thư mục layout components để Vite theo dõi cả file mới. `ZaloContact.tsx` portal vào body, hiển thị biểu tượng Zalo cố định góc dưới trái, nâng lên trên CTA giỏ hàng dưới 1024px. Chưa có tài khoản Zalo: bấm nút chỉ mở thông báo sẽ cập nhật sớm, chưa mở chat hoặc hiển thị số tin nhắn. UI checks kiểm tra số cột, vị trí và hit-test nút Zalo ở 320–1440px.

Catalog có `name_en/name_vi`; `name` giữ compatibility. `name_vn` là alias tiếng Việt tương thích dữ liệu legacy; API hiện trả `name_vi/name_en`. `getLocalizedName` ưu tiên vi → vn → en → legacy cho tiếng Việt; English ưu tiên en → legacy → vi → vn. Cart/order item giữ tên snapshot song ngữ; source inventory legacy có tên Anh và Việt riêng. Search catalog/stock/order mẫu chấp nhận tên Việt và bỏ dấu. Đổi ngôn ngữ không đổi ID, state cart, giá, VND hoặc Asia/Ho_Chi_Minh; tên khách, contact, notes và dữ liệu nhập giữ nguyên.

Thống kê dữ liệu hiện có ở [docs/FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md); stack ở [docs/TECH_STACK.md](docs/TECH_STACK.md); thiết kế D1, canonical và quyết định schema ở [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md). Phase 0 có health; Phase 1 có migration/seed/verifier D1 local; Phase 2 có catalog/phí giao/quote. Phase 3 đã có endpoint đặt/tra đơn, UUID idempotency, server pricing và batch trừ tồn/CHECK rollback; transitionOrder hoàn tồn một lần và DELIVERED → PAID. GLOB trong SQL chỉ kiểm dạng ngày, service đặt đơn kiểm ngày lịch và slot theo giờ VN. Chưa thay đổi D1 remote hoặc nối UI checkout/admin.

`shared/ui` giữ **Button, Input, Dialog** và các subcomponent của Dialog. Các module không được app import đã loại bỏ, gồm calendar/menubar/input-otp/resizable và các wrapper khác. Không cần khôi phục cả bộ UI để thêm một primitive.

Customize Button/Input bằng Lunara classes; default shadcn primary vẫn là màu dark generic. Dialog inventory hỗ trợ focus trapping, Escape, title/description. `cn` dùng clsx/tailwind-merge; `useIsMobile` ở shared/hooks. `ImageWithFallback` giữ img/alt/dimensions và hiển thị placeholder khi ảnh lỗi.

Các domain component nằm trong feature tương ứng: Shop cards/filter/grid; CartItemList/CartSummary/CheckoutForm/Confirmation; các bước custom order; landing sections; profile tabs; bảng order/customer/inventory; dashboard widgets; settings sections. Chưa có generic domain StatusBadge.

## Tiêu chuẩn khi phát triển

Giữ route boundaries, public API của feature, catalog/cart source chung và URL cũ. Tách state/actions sang hook/service; fixture vào `data/`; presentation nhận props. Không thêm UI stack, backend giả hoặc feature roadmap ngoài yêu cầu.

Giá numeric, currency VND và timezone Asia/Ho_Chi_Minh đã được chủ dự án chốt; preview active dùng giá/phí D1. PHP/Asia/Manila chỉ còn ở source legacy ẩn. Delivery cutoff/phí/khu vực thật vẫn cần chủ shop chốt trước mở bán. Không mô tả demo success thành account/order/email/payment bền vững; COD chỉ PAID khi transition sang DELIVERED.

Giữ labels, focus, keyboard, empty/error/success/loading states và responsive layout. Test logic có thể hồi quy. Không viết test mirror implementation hoặc dựng framework mới cho sửa tài liệu.

Không đưa secrets, customer data thật hoặc password thật vào source/docs/screenshots/`VITE_*`. `.npmrc` giữ HTTPS registry chính thức và `ignore-scripts=true`. Chỉ instruction files đã được allowlist trong `.agents` được chia sẻ; cấu hình `.codex` và database `.codegraph` ở local.

## Lệnh cài, chạy và kiểm tra

```bash
npm ci
npm run dev
# Terminal khác trên PowerShell:
curl.exe http://127.0.0.1:5173/api/health
npm run smoke
npm run cf:typegen
npm run db:migrate:local
npm run db:seed:local
npm run db:verify
npm run typecheck
npm run check:architecture
npm test
npm run build
npm audit
npm run preview
# Trong terminal khác khi preview đang chạy:
npm run check:ui -- http://127.0.0.1:4173
```

Dev `http://127.0.0.1:5173`, preview `http://127.0.0.1:4173`; Vite có thể chọn port kế nếu bận. Build frontend ở `dist/client/`, Worker và Wrangler config sinh tự động ở `dist/lunara/`. Browser test dùng **Edge headless trên Windows** và Node 24, chạy 15 route: Home/Shop/Cart active, các route legacy auth/customer/admin hiện sắp ra mắt. Kiểm tra commerce gồm chọn variant, cart reload/storage hỏng, phí phường/mặc định tỉnh, surcharge, EN/VI, network error/retry và layout 320/390/768/1024px. Không coi source wizard/profile/admin ẩn là flow vận hành đã nghiệm thu. Mạng ngoài bị chặn mặc định; test không chứng minh ảnh/font remote tải được. Bằng chứng/screenshot/profile browser nằm trong `.security-review/`, không vào Git.

`typecheck` kiểm frontend và `tsconfig.worker.json`; `check:architecture` kiểm chiều import/public API, presentation state và inline styles. Node test runner đã nghiệm thu 92/92 ở Phase 3, gồm Worker/schema/pricing/orders/lookup/transitions/Turnstile mock, concurrent last-stock/same-key/cancel và rollback/query budget. Test Worker dùng SQLite in-memory hoặc workerd D1 `persist:false`, `remoteBindings:false` với canonical migration/seed; không sửa seed persisted. `smoke` giữ 16 nhóm catalog trên URL local positional, rồi chạy 10 ca order qua HTTP loopback + D1 cô lập và một nhóm đối chiếu tồn/query budget; tổng 27/27. Guard host `127.0.0.1`, chưa có smoke remote. [Output](docs/pipeline/PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026). `cf:typegen` sinh binding types với `--include-runtime=false`; D1 migrate/seed chỉ `--local`; `db:verify` kiểm 13 nhóm ràng buộc bằng D1 local/cô lập. `db:reset:local` xóa trạng thái local, chỉ dùng khi cần reset; `deploy` cần yêu cầu riêng. Chưa có ESLint. Vite build không thay semantic typecheck.

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
| Validation form đầy đủ | Server order/lookup và shared Zod schemas đã có; form gửi/nhận/ngày/slot/thiệp theo contract còn phải nối ở Phase 5; signup/request deferred |
| Product detail và filter theo dịp | Dùng catalog/ProductCard hiện có; bổ sung description, variants, occasion tags |
| Cart/wishlist persistence | Cart variant/localStorage đã có; wishlist server/hợp nhất Shop/Profile ngoài MVP |
| Delivery/message/gift options | Options/quote từ D1 đã có; order API kiểm ngày/slot và lưu thiệp; form checkout và policy thật còn cần hoàn thiện |
| Backend auth/orders/requests | Catalog/quote/COD/tra đơn và transition service đã có local; auth/admin thuộc Phase 4, UI còn lại thuộc Phase 5, requests deferred |
| Checkout COD | Backend Phase 3 đã nghiệm thu; tiếp theo nối form, gửi/retry cùng key, xác nhận mã đơn và tra đơn theo contract ở Phase 5 |
| Inventory vận hành | Đặt đơn đã trừ tồn, hủy bằng service đã hoàn một lần; API admin chỉnh tồn thuộc Phase 4, UI vận hành thuộc Phase 5 |
| Reviews và payment online | Làm sau MVP khi có chính sách/provider phù hợp |
| SEO/performance | Admin đã lazy-load; còn metadata, ảnh/font tối ưu và rendering strategy |

Backend/media đã chọn; auth admin secret + JWT cookie còn thuộc Phase 4. VND/múi giờ Việt Nam và cart persistence đã có ở preview; checkout/lookup/admin UI chưa nối. Máy trạng thái và hoàn tồn Phase 3 đã chốt theo contract; policy vận hành, delivery cutoff/phí/khu vực thật vẫn cần chủ shop chốt. Auth khách, multi-store, subscription, loyalty hay chatbot ngoài MVP. Chỉ hỏi quyết định thực sự ảnh hưởng task đang được yêu cầu.

### Thông tin chủ dự án cần bổ sung theo phase

Checklist hiện trạng/đầu vào ở [PROJECT_STATUS.md](docs/PROJECT_STATUS.md): catalog/ảnh/giá VND/tồn, khu vực/phí/cutoff giao hàng, policy đơn, Zalo/liên hệ, Cloudinary/domain và cấu hình production theo phase.

Việc kỹ thuật còn lại: Phase 4 auth/admin → hoàn thiện Phase 5 checkout/lookup/admin UI → Phase 6 khi được yêu cầu. Không làm lại COD/tồn/idempotency, catalog adapters, cart storage hoặc VND đã nghiệm thu. Schema/seed local không thay dữ liệu thật trước mở bán. Các tài khoản hoặc credentials thật không đưa vào source, docs hay `VITE_*`.

## File chia sẻ và cách duy trì

`.gitignore` là default-deny allowlist: source, manifest/lockfile, docs, verification scripts/tests và skill được xét duyệt có exact paths và parent exceptions. Không dùng `git add -f`. Nó không quét secrets hoặc thay branch protection.

Giữ local: `node_modules`, `dist`, `.codegraph`, `.codex`, `.security-review`, `.env`, keys/logs/cache. Trước commit/push kiểm tra status, file inclusion và `git diff --check`. Commit/push/deploy chỉ khi yêu cầu hiện tại hoặc standing authorization bao gồm hành động đó.

Khi thay route/component/model hoặc ownership, cập nhật mục liên quan ở đây, AGENTS và skill. Báo cáo kiểm chứng thực tế trong bàn giao; không coi số liệu của lượt kiểm tra cũ là bảo đảm cho source mới.
