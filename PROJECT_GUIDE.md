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

UI branding là **Lunara**; repository GitHub tên **Lurana**. UI có English/Tiếng Việt, mặc định English; tiền PHP/₱ và settings Asia/Manila giữ nguyên khi đổi ngôn ngữ. Giao tiếp với chủ dự án bằng tiếng Việt.

| Keyword | Hiện trạng |
| --- | --- |
| Commerce | **Frontend demo**; fixture/local UI, chưa có API catalog/checkout/auth/order |
| Worker | Hono + `@cloudflare/vite-plugin`; `GET /api/health` → `{ data: { ok: true, time } }`; API khác → JSON 404 |
| Health | Worker liveness; chưa kiểm tra kết nối/bảng D1 |
| Auth | Fixture + role/session browser; chưa có server authorization |
| Success | Signup/checkout/request là preview; chưa tạo account/order, gửi email hay thu tiền |
| Frontend pin | React/React DOM `18.3.1`; Router `7.18.4`; Vite `6.4.4`; Tailwind `4.1.12`; React plugin `4.7.0`; Recharts `2.15.2` |
| Tooling pin | TypeScript `5.7.3`; types React 18; CodeGraph `1.5.0` |
| Môi trường đã dùng | Node `24.11.1`, npm `11.6.3`; Wrangler hiện yêu cầu Node ≥22 |

### Kiến trúc MVP đã chọn

[Tech stack](docs/TECH_STACK.md) và [pipeline](docs/pipeline/README.md) ghi mục tiêu; Phase 0 có Worker/health, Phase 1 có database local. [Checklist và bằng chứng Phase 1](docs/pipeline/PHASE_1_DATABASE.md).

| Phạm vi | Đã có / còn thiếu |
| --- | --- |
| Runtime MVP | Hono/Cloudflare Workers · D1/SQLite · Zod · SQL tham số hóa |
| Media MVP | Cloudinary; chưa nối upload/catalog |
| Order MVP | COD khách vãng lai; server tính tổng/tồn/ghi đơn chưa triển khai |
| Admin auth | Secret + JWT cookie dự kiến Phase 4; auth khách để sau |
| Schema | [Canonical duy nhất: 10 bảng](migrations/0001_mvp.sql), nguyên DDL v2 có `delivery_zones`, idempotency và CHECK/unique; `custom_requests` deferred. [Đối chiếu v1/v2](docs/DATABASE_DESIGN.md); hai file schema cũ chỉ dẫn về migration |
| D1 local | Worker binding `DB`; migration `0001_mvp.sql`; seed 4 categories/8 products/24 variants/8 images/4 zones; verifier 13 nhóm qua `db:verify` |
| Cloudflare remote | Chủ dự án đã đăng nhập Wrangler và tạo `lunara-db`; Phase 0–1 không truy cập hoặc thay đổi remote |
| Persistence | Cart hiện in-memory, wishlist riêng từng flow; localStorage là mục tiêu MVP |
| Thị trường | Schema backend VND/tỉnh-phường; UI hiện PHP/Asia/Manila, chuyển ở Phase 5 |
| Vận hành | Chưa deploy/domain, Turnstile, rate limit, email hoặc payment provider |

```text
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── providers.tsx           # AuthProvider + CartProvider
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
| Typecheck | `tsconfig.worker.json`: `worker/`, root `shared/` dự kiến và declaration; tách globals frontend |
| SPA/API routing | `wrangler.jsonc`: SPA fallback, `run_worker_first: ["/api/*"]` |
| Local bindings | Vite `remoteBindings: false`; plugin tự quản lý assets output |
| Typegen | `npm run cf:typegen` → `worker-configuration.d.ts`; `--include-runtime=false` + Workers types |
| Secrets | `.dev.vars` local; chỉ placeholder `.dev.vars.example` vào Git |

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

Catalog có `name_en/name_vi`; `name` giữ compatibility. `name_vn` chỉ là alias tiếng Việt cho DTO từ backend tương lai. `getLocalizedName` ưu tiên vi → vn → en → legacy cho tiếng Việt; English ưu tiên en → legacy → vi → vn. Cart/historical item giữ tên snapshot song ngữ; thêm/sửa inventory có tên Anh và Việt riêng. Search catalog/stock/order mẫu chấp nhận tên Việt và bỏ dấu. Đổi ngôn ngữ không đổi ID, state cart, giá, PHP hoặc Asia/Manila; tên khách, contact, notes và dữ liệu nhập giữ nguyên.

Thống kê dữ liệu hiện có ở [docs/FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md); stack ở [docs/TECH_STACK.md](docs/TECH_STACK.md); thiết kế D1, canonical và quyết định schema ở [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md). Health API có trong Phase 0; Phase 1 bổ sung migration/seed/verifier D1 local, chưa có API commerce hoặc thay đổi D1 remote. Schema chỉ kiểm dạng ngày bằng GLOB, dùng SQLite affinity; validation ngày lịch/số nguyên, transition và hoàn tồn đúng một lần thuộc API các phase sau.

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

Dev `http://127.0.0.1:5173`, preview `http://127.0.0.1:4173`; Vite có thể chọn port kế nếu bận. Build frontend ở `dist/client/`, Worker và Wrangler config sinh tự động ở `dist/lunara/`. Browser test hiện dùng **Edge headless trên Windows** và Node 24, chạy 15 route rồi kiểm tra commerce, wizard, profile/orders, admin, auth guards, ngôn ngữ và mobile storefront/admin. Kiểm tra i18n gồm reload persistence, shared cart và request state, cùng layout 320/390/768/1024px. Nó chặn mạng ngoài để ổn định; không chứng minh ảnh/font remote tải được. Bằng chứng/screenshot/profile browser nằm trong `.security-review/`, không vào Git.

`typecheck` dùng compiler project được pin, kiểm tra frontend và `tsconfig.worker.json`; `check:architecture` kiểm tra chiều import/public API, presentation state và inline styles; `npm test` dùng Node test runner cho commerce/auth/contrast. `smoke` gọi health và API 404 trên server local đang chạy. `cf:typegen` sinh types bindings với `--include-runtime=false`, runtime types dùng `@cloudflare/workers-types`. D1 migrate/seed chỉ chạy `--local`; `db:verify` tự động kiểm 13 nhóm ràng buộc trên D1 local, dùng database tạm cho phép thử ghi/xóa. `db:reset:local` xóa trạng thái D1 local, chỉ dùng khi cần reset; `deploy` chỉ chạy khi có yêu cầu deploy. Chưa cấu hình ESLint. Vite build chỉ kiểm tra bundle và không thay semantic typecheck.

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
| Cart/wishlist persistence | MVP lưu localStorage cho khách vãng lai, hợp nhất wishlist Shop/Profile; hiện vẫn demo |
| Delivery/message/gift options | Phải chốt khu vực, cutoff và policy; delivery hiện là fixture |
| Backend auth/catalog/orders/requests | Worker/health và schema/seed D1 local đã có; catalog/auth/orders chưa nối API, requests deferred |
| Checkout COD | Server tính tổng, trừ tồn và ghi đơn nguyên tử; thanh toán online nằm ngoài MVP |
| Inventory vận hành | D1 lưu tồn theo product variant; stock edits và checkout cần nối cùng API |
| Reviews và payment online | Làm sau MVP khi có chính sách/provider phù hợp |
| SEO/performance | Admin đã lazy-load; còn metadata, ảnh/font tối ưu và rendering strategy |

Backend/media đã chọn; pipeline dự kiến auth admin secret + JWT cookie, chuyển frontend sang VND/múi giờ Việt Nam ở Phase 5. Auth khách, delivery cutoff/phí giao thật và refund/cancel policy còn cần chốt khi triển khai. Multi-store, subscription, loyalty hay chatbot nằm ngoài MVP. Chỉ hỏi quyết định thực sự ảnh hưởng task đang được yêu cầu.

### Thông tin chủ dự án cần bổ sung theo phase

Checklist hiện trạng/đầu vào ở [PROJECT_STATUS.md](docs/PROJECT_STATUS.md): catalog/ảnh/giá VND/tồn, khu vực/phí/cutoff giao hàng, policy đơn, Zalo/liên hệ, Cloudinary/domain và cấu hình production theo phase.

Việc kỹ thuật còn lại: API catalog/order → auth admin → nối UI/persistence/thị trường → deploy khi được yêu cầu. Schema/seed local không thay dữ liệu thật trước mở bán. Các tài khoản hoặc credentials thật không đưa vào source, docs hay `VITE_*`.

## File chia sẻ và cách duy trì

`.gitignore` là default-deny allowlist: source, manifest/lockfile, docs, verification scripts/tests và skill được xét duyệt có exact paths và parent exceptions. Không dùng `git add -f`. Nó không quét secrets hoặc thay branch protection.

Giữ local: `node_modules`, `dist`, `.codegraph`, `.codex`, `.security-review`, `.env`, keys/logs/cache. Trước commit/push kiểm tra status, file inclusion và `git diff --check`. Commit/push/deploy chỉ khi yêu cầu hiện tại hoặc standing authorization bao gồm hành động đó.

Khi thay route/component/model hoặc ownership, cập nhật mục liên quan ở đây, AGENTS và skill. Báo cáo kiểm chứng thực tế trong bàn giao; không coi số liệu của lượt kiểm tra cũ là bảo đảm cho source mới.
