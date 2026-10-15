# Sổ tay dự án Lunara Flower Shop

Tham chiếu cho chủ dự án và Codex về kiến trúc, giao diện, component và giới hạn demo. Quy tắc làm việc ở [AGENTS.md](AGENTS.md); workflow UI/nghiệp vụ ở [.agents/skills/lunara-flower-shop/SKILL.md](.agents/skills/lunara-flower-shop/SKILL.md). Cập nhật kiến trúc: **15/10/2026**. Code hiện tại là nguồn quyết định khi tài liệu khác với implementation.

## Cách sử dụng với Codex

Mở đúng repository trong một phiên Codex được trusted để nạp instructions và MCP. Mô tả kết quả muốn đạt, flow cần kiểm chứng và ngoại lệ so với quy ước. Ví dụ:

```text
Dùng $lunara-flower-shop. Thực hiện [tính năng] ở [feature/flow].
Giữ bộ nhận diện và giới hạn demo hiện tại.
Kết quả cần: [hành vi có thể kiểm chứng].
```

ChatGPT thông thường không tự đọc file trên máy. Với phiên không có workspace, đính kèm sổ tay và instructions. Các đề xuất trong roadmap không tự cho phép triển khai, commit hoặc publish.

## Hiện trạng và bản đồ dự án

UI branding là **Lunara Shop**; repository GitHub tên **Lurana**. UI có English/Tiếng Việt, mặc định/fallback English; commerce dùng VND từ D1, giờ Asia/Ho_Chi_Minh. Checkout/tra đơn/admin đã nối API; customer auth/profile/wishlist, custom request và admin customers/settings/notifications giữ source nhưng ẩn. Giao tiếp với chủ dự án bằng tiếng Việt.

| Keyword | Hiện trạng |
| --- | --- |
| Commerce | Home/Shop/Cart/Delivery/Quote, checkout COD/retry/xác nhận, tra đơn và admin dùng API D1 local; Phase 5 DONE local |
| Worker | Hono + `@cloudflare/vite-plugin`; health/catalog/delivery/quote/COD/lookup/auth/admin local; API lạ → JSON 404, admin thiếu cookie → 401 |
| Health | Worker liveness; chưa kiểm tra kết nối/bảng D1 |
| Auth | AuthProvider gọi admin me/login/logout bằng cookie; AdminRoute active, server kiểm quyền/Origin; customer auth chưa có API nên giữ ẩn |
| Success | Checkout chỉ xác nhận khi API trả mã đơn/tổng tiền; COD chỉ PAID sau DELIVERED; signup/request không giả thành công |
| Frontend pin | React/React DOM `18.3.1`; Router `7.18.4`; Vite `6.4.4`; Tailwind `4.1.12`; React plugin `4.7.0`; Recharts `2.15.2` |
| Tooling pin | TypeScript `5.7.3`; types React 18; CodeGraph `1.5.0` |
| Môi trường đã dùng | Node `24.11.1`, npm `11.6.3`; Wrangler hiện yêu cầu Node ≥22 |

### Kiến trúc MVP đã chọn

[Tech stack](docs/TECH_STACK.md) và [pipeline](docs/pipeline/README.md) ghi mục tiêu và tiến độ: **Phase 0–5 DONE local; Phase 6 IN PROGRESS (5/7 tiêu chí)**. Phase 3 có COD/tồn/idempotency/lookup/transition; Phase 4 có auth và API quản trị; Phase 5 đã nối frontend và đạt 6/6 tiêu chí. Checklist và bằng chứng: [Phase 1](docs/pipeline/PHASE_1_DATABASE.md) · [Phase 2](docs/pipeline/PHASE_2_API_CATALOG.md) · [Phase 3 lịch sử](docs/pipeline/PHASE_3_CHECKOUT_ORDERS.md) · [Phase 4 lịch sử](docs/pipeline/PHASE_4_ADMIN.md) · [Phase 5 lịch sử](docs/pipeline/PHASE_5_FRONTEND.md) · [Phase 6 đang thực hiện](docs/pipeline/PHASE_6_DEPLOY.md).

| Phạm vi | Đã có / còn thiếu |
| --- | --- |
| Runtime MVP | Hono/Cloudflare Workers · D1/SQLite · Zod · SQL tham số hóa |
| Media MVP | API catalog trả URL ảnh từ D1; signed direct Cloudinary upload trong admin đã tích hợp local; keys/presets/upload thật/deploy chờ owner |
| Order MVP | Phase 3 COD/server pricing/tồn/idempotency/lookup; Phase 4 admin status gọi lại transitionOrder hoàn tồn một lần, DELIVERED → PAID; Phase 5 form/review/gửi/retry/xác nhận/lookup và admin đã nối |
| Admin auth | Phase 4 local: SHA-256/timingSafeEqual + HS256 JWT cookie HttpOnly/Strict 12h; kiểm quyền/Origin/JSON ở server; auth khách để sau |
| Schema | [Canonical duy nhất: 10 bảng](migrations/0001_mvp.sql), nguyên DDL v2 có `delivery_zones`, idempotency và CHECK/unique; `custom_requests` deferred. [Đối chiếu v1/v2](docs/DATABASE_DESIGN.md); hai file schema cũ chỉ dẫn về migration |
| D1 local | Worker binding `DB`; migration `0001_mvp.sql`; seed 4 categories/8 products/24 variants/8 images/4 zones; verifier 13 nhóm qua `db:verify` |
| Cloudflare remote | Phase 6 đã xác minh account/UUID và pin account_id, áp `0001`/seed remote, backup mở offline PASS; 10 bảng/0 đơn/FK sạch; đã deploy, API Production 7/7 + public browser PASS và dọn SMOKE; chưa có dữ liệu thật |
| Persistence | CartProvider + localStorage version 1, chỉ variantId/quantity; wishlist tạm ẩn |
| Thị trường | UI active VND/tỉnh-phường từ API; legacy PHP/settings ẩn. Quote lấy giá/phí DB |
| Vận hành | Worker đã deploy workers.dev, API live/cleanup PASS; đã có OPERATIONS. Còn dữ liệu thật, xác nhận đã nắm quota; Turnstile thật, custom domain, rate limit/email/payment provider chưa cấu hình |

```text
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── providers.tsx           # I18nextProvider + AuthProvider + CatalogProvider + CartProvider
│   ├── router.tsx              # route tree duy nhất
│   └── layouts/                # MainLayout, AdminLayout, AuthLayout, app hooks
├── pages/                      # page mỏng: ghép view và feature hooks
│   └── admin/                  # các page admin được lazy-load
├── features/
│   ├── auth/                   # cookie admin session/login; customer fixture source ẩn
│   ├── shop/                   # canonical catalog, search/filter/sort
│   ├── cart/                   # variant cart/quote + checkout COD/review/confirmation
│   ├── orders/                 # tra đơn API + admin list/detail/status/note; history fixture ẩn
│   ├── custom-order/           # wizard và quản trị request mẫu
│   ├── landing/                # hero, featured, story, testimonials
│   ├── profile/                # profile, wishlist, account sections
│   ├── inventory/              # admin product/variant API, delta stock + GET recheck
│   └── admin/                  # summary/delivery API; customers/settings fixture ẩn
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
| Orders | `worker/routes/orders.ts`: POST orders/lookup; `worker/services/orders.ts`: create/lookup/transition, 35 statements cho 15 dòng và guard retry ≤40; admin status tái sử dụng transitionOrder |
| Admin | `worker/lib/auth.ts` + `worker/routes/admin-*.ts`: login/me/logout, summary/orders/products/variants/delivery-zones; middleware requireAdmin/requireSameOrigin trước API quản trị |
| Services | `worker/services/catalog.ts`: tối đa 3 truy vấn; `delivery.ts`: phường rồi mặc định tỉnh; `pricing.ts`: một truy vấn variants `IN`, gộp giỏ và báo issues, chỉ đọc |
| Validation/lỗi | Root `shared/constants.ts`, `shared/schemas.ts` và `shared/admin-*-schemas.ts`; `worker/lib/validate.ts`, `errors.ts`; INTERNAL chỉ trả request_id, log chỉ request_id/error_name |
| Middleware | Secure headers, X-Request-Id; GET catalog thành công cache public 30 giây; API khác/lỗi no-store |
| Config | `worker/config.ts`: VND, Asia/Ho_Chi_Minh; phụ phí 0/30.000/50.000, cutoff 16:00, chuẩn bị 120 phút và slot 08:00–20:00 là giả định chủ shop cần chỉnh |
| Typecheck | `tsconfig.worker.json`: `worker/`, root `shared/` và declaration; tách globals frontend |
| SPA/API routing | `wrangler.jsonc`: SPA fallback, `run_worker_first: ["/api/*"]` |
| Local bindings | Vite `remoteBindings: false`; plugin tự quản lý assets output |
| Typegen | `npm run cf:typegen` → `worker-configuration.d.ts`; `--include-runtime=false` + Workers types |
| Secrets | `.dev.vars` local; chỉ placeholder `.dev.vars.example` vào Git. [NGƯỜI] tự đặt secret thật trước real local use; production ở Phase 6 |

### Ranh giới module

- `pages → features → shared`. Page gọi hook và truyền props cho view; không sở hữu state nghiệp vụ hoặc style.
- Feature chứa `components/`, `hooks/`, `data/`, services/types và `index.ts`. Component trình bày không gọi service hoặc giữ state nghiệp vụ; hooks quản lý state/actions và gọi service.
- Import từ feature khác đi qua `@/features/<name>` public API. Không import trực tiếp hook/data/component nội bộ của feature khác. Trong cùng feature có thể dùng import tương đối.
- `src/shared` chứa primitive, presentation helper, design palette, API client và cờ tính năng chung; không sở hữu nghiệp vụ catalog/cart/order/auth. Root `shared/` riêng chứa constants/schema Zod cho hợp đồng API; frontend services dùng khi nối backend. Components không gọi fetch trực tiếp: view → hook → feature service → API client.
- `app` ghép router/providers/layouts. Menu, location và logout của layout ở `app/layouts/hooks/`; AdminRoute bảo vệ điều hướng UI, còn quyền truy cập do middleware Worker quyết định.
- Alias `@/` trỏ tới `src/` trong cả Vite và `tsconfig.json`. `figma:asset/` resolver được giữ. Không có `components.json`; nếu thêm shadcn CLI sau này, dùng alias `@/shared/ui`.
- Style trong JSX dùng Tailwind; CSS giữ token/theme/focus toàn cục. Các props cấu hình chart như `contentStyle`/`tick` là API của Recharts, không phải page stylesheet.

## Trang và luồng nghiệp vụ

Routes dưới đây cùng dùng một router. Các trang MVP đã nối API; các feature deferred tiếp tục hiện FeatureUnavailable và ẩn link menu, giữ source để phát triển sau.

| Route | Page | Feature và hành vi hiện có |
| --- | --- | --- |
| `/` | `HomePage` | Landing sections; featured products lấy từ catalog chung |
| `/shop` | `ShopPage` | Catalog D1, search/category code/sort, chọn variant S/M/L và Add shared cart; wishlist/rating ẩn |
| `/cart` | `CartPage` | Variant cart/localStorage, số lượng/xóa, delivery DB/quote; form → duyệt → gửi/retry → xác nhận COD từ API |
| `/orders/track` | `TrackOrderPage` | Mã đơn + SĐT gửi lookup; snapshot items/tổng, giao hàng và timeline từ API |
| `/admin/login` | `LoginPage` | Mật khẩu admin → API cookie, kiểm `/me`, redirect dashboard; lỗi và retry EN/VI |
| `/admin` | Redirect | Chuyển tới `/admin/dashboard` |
| `/admin/dashboard` | `AdminDashboardPage` | Summary đơn theo trạng thái/đơn hôm nay giờ VN/tồn thấp và 10 đơn mới nhất từ API; không dùng chart/revenue mẫu |
| `/admin/stock`, `/admin/products` | `AdminStockPage` / redirect | Danh sách sản phẩm/variants mọi trạng thái, tạo/sửa/ẩn/archived, giá/threshold/active và stock_delta; products redirect về stock |
| `/admin/orders` | `AdminOrdersPage` | Lọc status/ngày giao/search, pagination, detail/timeline, chuyển status hợp lệ và note qua API |
| `/admin/delivery-zones` | `AdminDeliveryZonesPage` | Danh sách/tạo/sửa/tắt khu vực và phí/ngưỡng miễn phí; quote đọc phí mới |
| `/request`, `/orders`, `/profile`, `/login`, `/signup` | `UnavailablePage` | Custom request/customer auth/profile/wishlist/history deferred; source legacy giữ lại |
| `/admin/customers`, `/admin/requests`, `/admin/settings` | `UnavailablePage` | Chưa có API MVP; source legacy và notifications giữ ẩn |

`AdminRoute` bọc `AdminLayout`; admin pages lazy-load. `/admin/login` dùng `AuthLayout` ngoài storefront/admin layout. `VITE_ENABLE_CUSTOMER_AUTH` mặc định false; kể cả bật biến này, customer API-ready gate false vẫn chặn fixture customer. Các cờ customRequests/adminCustomers/adminSettings/adminNotifications false. Route lỗi có fallback dùng chung; không có route tree thứ hai.

### Ownership của catalog và cart

CatalogProvider gọi Shop service để tải categories/products qua API cùng origin; DTO adapter thành model UI, không nhập shop.data.ts hay fallback fixture. Featured lấy is_featured từ DB; ratings/reviews/wishlist không có dữ liệu server được ẩn.

CartProvider dùng variant ID làm line identity, bắt đầu rỗng. localStorage lunara.cart.v1 chỉ lưu version/variantId/quantity, parse Zod và bỏ dữ liệu hỏng; reload dựng tên/ảnh/giá từ catalog và quote. Giỏ tối đa 15 dòng, 20 mỗi dòng và max_quantity từ API. useQuoteCart gọi delivery/options + checkout/quote, bỏ response cũ khi items/khu vực/method đổi. Giá, phí và tổng hiển thị VND từ DB; lỗi có i18n/retry, không thay bằng giá demo. Quote không giữ tồn; POST order tính lại giá/phí và kiểm tồn tại server.

Checkout giữ sender/recipient/ngày/slot/thiệp/note trong memory; validate bằng shared schemas, có bước duyệt và khóa submit khi pending. Mỗi payload tạo UUID v4; retry payload không đổi giữ key để tránh tạo hai đơn, sửa payload tạo key mới. API trả order_number/tổng thật mới xác nhận và xóa giỏ. Không lưu PII, order detail hoặc intent vào localStorage/sessionStorage; reload giữa request chưa rõ kết quả cần tra đơn, không coi reload là retry an toàn. [Backup và kiểm chứng](docs/pipeline/FE_AUDIT.md).

### Auth admin, tồn kho và các feature deferred

AuthProvider tải `/api/admin/me` để biết session server; login/logout gọi API bằng same-origin cookie. Không lưu password/JWT/session vào browser storage. 401 từ API quản trị xóa state admin và đưa về login; lỗi mạng có retry thay vì coi là logout thành công. Các response `/me` cũ được bỏ khi login/logout làm đổi session. Source fixtures và `lunara_user` legacy được giữ nhưng không active, không cấp quyền backend.

Backend Phase 4 dùng mật khẩu dài trong ADMIN_PASSWORD, SHA-256 hai phía + Workers timingSafeEqual, ký JWT HS256 bằng JWT_SECRET riêng. Cookie lunara_admin HttpOnly/SameSite=Strict/Path=/ có Max-Age=43200, Secure trên HTTPS và bỏ Secure ở HTTP loopback local. requireAdmin kiểm role/iat/exp; ghi admin cần JSON và Origin cùng origin. Thiếu/trống secret bị từ chối; auth không đọc/ghi D1 và không thêm dependency/bảng. Smoke dùng secret demo riêng, workerd dùng native crypto; Node tests có shim API timingSafeEqual của Workers. **[NGƯỜI]** tự đặt ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên và JWT_SECRET ≥32 ký tự ngẫu nhiên, khác nhau, trong .dev.vars trước real local use; agent không đặt secret thật, production thuộc Phase 6. CPU cloud 10 ms chưa được đo/xác nhận.

`AdminRoute` chờ session, hiện loading/error/retry, guest redirect `/admin/login`, role không hợp lệ về `/`. Worker `requireAdmin` vẫn kiểm mỗi request; role/session client không thay authorization server.

Admin product/variant dùng dữ liệu thật từ API, chỉnh tồn bằng stock_delta để tránh ghi đè các đơn mới. Nếu PATCH tồn bị NETWORK/TIMEOUT/BAD_RESPONSE/INTERNAL, kết quả ghi chưa xác định: UI xóa delta vừa nhập, khóa dòng và yêu cầu GET tải tồn hiện tại thành công trước lần chỉnh tiếp. Người vận hành kiểm lại số thực tế rồi nhập delta mới; không tự gửi lại delta cũ. Tạo/sửa sản phẩm và delivery có loading/error/retry; tắt/ẩn dùng API, không xóa dữ liệu mẫu trong client để giả thành công.

| Flow | Khoảng trống hiện tại |
| --- | --- |
| Profile | Edit chưa đồng bộ AuthProvider |
| Signup | Preview, chưa đăng ký thật |
| Request | Wizard chưa nối AdminRequests; model budget chưa có input |
| Customer history | Fixture cũ ẩn; public lookup và admin orders dùng API thật |
| Dashboard nâng cao | Chỉ summary MVP đã nối; revenue/chart/top products chờ API riêng |
| Settings | Save local, chưa đổi cấu hình/currency toàn app |
| Form checkout/lookup | Dữ liệu nhạy cảm chỉ giữ memory và mất khi reload; giỏ variant/quantity vẫn còn |

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

EN/VI nằm ở mép phải header storefront/admin và góc phải trên màn hình admin login. Mặc định English, nhớ preference `lunara_language` ở localStorage; khi storage bị chặn vẫn đổi được trong phiên. `document.documentElement.lang` cập nhật theo locale. Tiếng Việt thiếu key fallback English. Navbar chuyển sang menu mobile ở dưới breakpoint lg để chứa nhãn Việt và language switch. Signup/customer auth source giữ ẩn.

Footer storefront được tách thành `app/layouts/components/StorefrontFooter.tsx`: giữ khối thương hiệu và tiêu đề Lunara, hiển thị các địa chỉ/map URL hiện có, cùng các liên kết nội bộ theo luồng đang hỗ trợ. Chưa có liên kết chính sách/mạng xã hội chính thức của Lunara nên không hiển thị link ngoài hoặc pháp nhân/MST chưa được xác nhận. Tên cửa hàng, địa chỉ và URL bản đồ cấu hình trong `shared/i18n/locales/en/common.json` và `vi/common.json`: các khóa `Main Store`/`HCMC Store`/`Hanoi Branch`, cùng hậu tố `address` và `map URL`. `shared/config/storefront-footer.ts` giữ ID/thứ tự/khóa locale của cửa hàng; các mảng link ngoài để trống đến khi chủ shop cung cấp nguồn chính thức. English là fallback; địa danh giữ tên riêng, phần mô tả địa chỉ hiển thị theo locale. Các link mở tab mới. Desktop từ 1024px dùng 4 cột; mobile/tablet đặt chăm sóc khách hàng và mạng xã hội cạnh nhau, khối thương hiệu và địa chỉ chiếm toàn hàng. `tailwind.css` đăng ký rõ thư mục layout components để Vite theo dõi cả file mới. `ZaloContact.tsx` portal vào body, dùng icon tự vẽ (đã rollback asset logo widget theo yêu cầu), mặc định chỉ hiện icon ở góc dưới phải, nâng lên trên CTA giỏ hàng dưới 1024px. Viền xanh của summary chuyển trực tiếp chiều rộng 60→208px về bên trái khi hover/focus hoặc bấm mở, rồi thu ngược khi đóng/rời nút: 400ms, giảm còn 200ms trong reduced motion. Chữ không có fade/slide riêng; popup căn phải và nằm trong viewport. Chưa có tài khoản Zalo: bấm nút chỉ mở thông báo sẽ cập nhật sớm, chưa mở chat hoặc hiển thị số tin nhắn. Kiểm trình duyệt EN/VI cho vị trí, hover/focus, hit-test, popup và nội dung JSON ở 320/390/768/1024/1440px.

Catalog có `name_en/name_vi`; `name` giữ compatibility. `name_vn` là alias tiếng Việt tương thích dữ liệu legacy; API hiện trả `name_vi/name_en`. `getLocalizedName` ưu tiên vi → vn → en → legacy cho tiếng Việt; English ưu tiên en → legacy → vi → vn. Cart/order item giữ tên snapshot song ngữ; source inventory legacy có tên Anh và Việt riêng. Search catalog/stock/order mẫu chấp nhận tên Việt và bỏ dấu. Đổi ngôn ngữ không đổi ID, state cart, giá, VND hoặc Asia/Ho_Chi_Minh; tên khách, contact, notes và dữ liệu nhập giữ nguyên.

Thống kê dữ liệu hiện có ở [docs/FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md); stack ở [docs/TECH_STACK.md](docs/TECH_STACK.md); thiết kế D1, canonical và quyết định schema ở [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md). Phase 0–3 có health/catalog/phí giao/quote, COD/lookup và transition hoàn tồn một lần/DELIVERED→PAID. Phase 4 có auth/admin summary/đơn/sản phẩm/tồn/phí giao, dùng nguyên 10 bảng canonical; stock_delta cập nhật tồn nguyên tử và quote mới dùng phí mới. Phase 5 đã nối UI checkout/lookup/admin và nghiệm thu local. GLOB SQL chỉ kiểm dạng ngày; service order kiểm ngày lịch/slot giờ VN. Không đổi Worker/DDL/pinned packages hoặc truy cập D1 remote khi nối frontend.

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
npm run check:ui:phase5
```

Dev `http://127.0.0.1:5173`, preview `http://127.0.0.1:4173`; Vite có thể chọn port kế nếu bận (nghiệm thu cuối dùng preview 4175). Build frontend ở `dist/client/`, Worker và Wrangler config sinh tự động ở `dist/lunara/`. Browser test dùng **Edge headless trên Windows** và Node 24; `check:ui` kiểm 17 routes cùng EN/VI và layout 320/390/768/1024px. `check:ui:phase5` kiểm checkout/lookup/admin bằng HTTP loopback + workerd D1 cô lập/secret synthetic, 10 kịch bản bắt buộc và 2 mở rộng. Snapshot D1 persisted trước/sau giữ nguyên. Mạng ngoài bị chặn mặc định; test không chứng minh ảnh/font remote tải được. Bằng chứng/screenshot/profile browser nằm trong `.security-review/`, không vào Git.

`typecheck` kiểm frontend và `tsconfig.worker.json`; `check:architecture` kiểm chiều import/public API, presentation state và inline styles. Bằng chứng tại mốc Phase 5 **15/10/2026**: **136/136 tests**, architecture **207 source files**, typecheck/build pass; smoke local **40/40** = 16 nhóm catalog + 10 ca order + đối chiếu tồn/query budget + 12 nhóm admin + kiểm snapshot persisted. UI kiểm **17 routes, 0 JS exceptions**; Phase 5 đạt **6/6 tiêu chí**, **10/10 kịch bản bắt buộc +2/2 mở rộng**, persisted D1 logical snapshot không đổi. Test ghi dùng workerd D1 `persist:false`, `remoteBindings:false` và secret demo riêng; không dùng ambient secrets. Guard local 127.0.0.1 giữ nguyên; nhánh deployment --base-url HTTPS mặc định chỉ đọc, ghi cần --allow-remote-writes/--confirm-origin/--variant-id/--exclusive-test-window và credential stdin ẩn. Smoke API Production đã 7/7, public browser EN/VI/VND/cart reload PASS; kết quả 10/10 MVP tách phạm vi API/public UI trong Phase 6. Credential do owner nhập prompt ẩn, không đọc/reuse password local. [Output tại mốc Phase 5](docs/pipeline/PHASE_5_FRONTEND.md); kết quả hiện tại **143/143 tests** cùng bằng chứng Phase 6 tại [PHASE_6_DEPLOY](docs/pipeline/PHASE_6_DEPLOY.md); **125 tests/178 files của Phase 4 và 92 tests/27 smoke của Phase 3 là lịch sử**. cf:typegen sinh binding types với --include-runtime=false; các npm script migrate/seed local dùng --local; lệnh remote chỉ theo phạm vi được duyệt ở Phase 6; db:verify kiểm 13 nhóm D1 local/cô lập. db:reset:local xóa local, deploy cần yêu cầu riêng; chưa có ESLint, build không thay typecheck.

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
| Validation form deferred | Checkout/lookup/admin MVP đã dùng shared schemas; signup/request giữ ẩn đến khi có API |
| Product detail và filter theo dịp | Dùng catalog/ProductCard hiện có; bổ sung description, variants, occasion tags |
| Cart/wishlist persistence | Cart variant/localStorage đã có; wishlist server/hợp nhất Shop/Profile ngoài MVP |
| Delivery/message/gift options | Form/options/quote/order đã nối ngày/slot/thiệp; còn chốt policy và cấu hình thật trước mở bán |
| Customer auth/requests | Admin cookie auth và orders đã có backend/UI; customer auth/custom requests deferred cần API riêng |
| Checkout COD production | Form/gửi/retry/xác nhận/tra đơn đã nghiệm thu local; cấu hình production và remote acceptance thuộc Phase 6 |
| Inventory nâng cao | Order trừ tồn/admin hủy hoàn một lần/UI stock_delta đã có; sổ cái tồn và capacity theo ngày là backlog |
| Reviews và payment online | Làm sau MVP khi có chính sách/provider phù hợp |
| SEO/performance | Admin đã lazy-load; còn metadata, ảnh/font tối ưu và rendering strategy |

Backend/media đã chọn; auth admin secret + JWT cookie/API Phase 4 và checkout/lookup/login/admin frontend Phase 5 đã nghiệm thu local. EN mặc định/fallback, VND/giờ VN và cart persistence giữ nguyên. Máy trạng thái/hoàn tồn Phase 3 được admin API dùng lại; policy vận hành, delivery cutoff/phí/khu vực/secret production thật vẫn cần chủ shop chốt. Auth khách, multi-store, subscription, loyalty hay chatbot ngoài MVP. Chỉ hỏi quyết định thực sự ảnh hưởng task đang được yêu cầu.

### Thông tin chủ dự án cần bổ sung theo phase

Checklist hiện trạng/đầu vào ở [PROJECT_STATUS.md](docs/PROJECT_STATUS.md): catalog/ảnh/giá VND/tồn, khu vực/phí/cutoff giao hàng, policy đơn, Zalo/liên hệ, Cloudinary/domain và cấu hình production theo phase.

Phase 6 hiện 5/7 tiêu chí: D1 remote migrate/seed/backup, deploy/secrets, API live 7/7 và public browser đã pass. Đã dọn 3 SMOKE orders; tồn variant 1 = 20, 24 variant khớp baseline, FK sạch. Còn dữ liệu mở bán thật và xác nhận người vận hành đã nắm cách xem quota. Xem [bằng chứng Phase 6](docs/pipeline/PHASE_6_DEPLOY.md) và [runbook](docs/OPERATIONS.md). Phase 0–5 DONE local; không suy ra đã mở bán hoặc đạt cổng remote. Không làm lại auth/admin API/UI, COD/tồn/idempotency, catalog adapters, cart storage hoặc VND đã nghiệm thu local. Schema/seed local không thay dữ liệu thật trước mở bán. Các tài khoản hoặc credentials thật không đưa vào source, docs hay VITE_*.

## File chia sẻ và cách duy trì

`.gitignore` là default-deny allowlist: source, manifest/lockfile, docs, verification scripts/tests và skill được xét duyệt có exact paths và parent exceptions. Không dùng `git add -f`. Nó không quét secrets hoặc thay branch protection.

Giữ local: `node_modules`, `dist`, `.codegraph`, `.codex`, `.security-review`, `.env`, keys/logs/cache. Trước commit/push kiểm tra status, file inclusion và `git diff --check`. Commit/push/deploy chỉ khi yêu cầu hiện tại hoặc standing authorization bao gồm hành động đó.

Khi thay route/component/model hoặc ownership, cập nhật mục liên quan ở đây, AGENTS và skill. Báo cáo kiểm chứng thực tế trong bàn giao; không coi số liệu của lượt kiểm tra cũ là bảo đảm cho source mới.

Staging: `env.staging` dùng Worker `lunara-staging`, D1 riêng và secrets riêng; `scripts/staging.mjs` chọn môi trường lúc build và kiểm UUID trước ghi/deploy. Hiện mới cấu hình local, chưa nghiệm thu remote. Xem [STAGING](docs/STAGING.md).

Tên hiển thị website từ 15/10/2026 là **Lunara Shop** (tab, header/footer, admin, EN/VI); giữ Worker/D1 và repo GitHub hiện có. Typecheck/build/architecture và 143 tests PASS; kiểm branding EN/VI 320/390/1440px PASS. UI tổng quát dừng ở bước quote chưa chọn khu vực giao; chi tiết deploy tại [Phase 6](docs/pipeline/PHASE_6_DEPLOY.md).

Cập nhật staging 15/10/2026: đã xác minh remote lunara-staging-db / ed391b18-0bcf-41b3-8315-389807ace7f2 và áp 0001_mvp.sql thành công (25 commands). Đã kiểm đủ 10 bảng nghiệp vụ, lịch sử 0001, không còn migration chờ, foreign_key_check rỗng, orders=0. db:verify local cô lập PASS 13/13 nhóm, 46 assertions. Chưa seed, đặt secrets hoặc deploy staging; production không được truy cập/ghi trong lượt sửa này.

Cloudinary 15/10/2026: đã tích hợp local signed direct upload (SHA-256, cookie admin/same-origin, JPEG/PNG/WebP, client 5 MB, prefix local/staging/prod). Typecheck/build/architecture 208 source files PASS; tests 148/148, smoke local 40/40 PASS. Browser mock EN/VI 390px PASS: file sai, thành công/preview, Save URL, thiếu config giữ URL; 0 JS exceptions. Chưa tạo preset/đặt keys/upload thật/deploy tính năng, không ghi D1 remote; Phase 6 vẫn 5/7. Không thêm migration/dependency hoặc tự xóa asset. [Cấu hình Cloudinary](docs/CLOUDINARY.md).

Staging categories fix — 15/10/2026: API public ban đầu categories=[] và products=[]; nút Save product khóa vì thiếu danh mục, không phải vì tồn 0. Owner chọn thêm đúng 4 danh mục mẫu từ canonical seed, giữ sản phẩm trống. Đã INSERT OR IGNORE chỉ categories vào lunara-staging-db (UUID ed391b18-0bcf-41b3-8315-389807ace7f2). D1/API xác nhận categories=4, products=variants=orders=delivery_zones=0, FK sạch; production không truy cập/ghi. UI local thêm giải thích thiếu danh mục + Reload categories EN/VI; chưa deploy thay đổi thông báo này. Typecheck/architecture 208 files/tests 148/build PASS; db:verify 13/13, 46 assertions. Browser mock EN/VI 390px xác nhận khóa khi trống, reload mở khóa, submit tồn 0; backend in-memory lưu đủ 3 variant tồn 0. Chưa tạo đơn/sản phẩm test remote hoặc nạp toàn bộ seed; staging thiếu delivery zones nên checkout chưa được nghiệm thu.

Form sản phẩm 15/10/2026: chọn/upload ảnh là mặc định; Image URL nằm trong tùy chọn phụ thu gọn. Không còn ô nhập slug; khi tạo, client sinh slug từ tên EN (fallback VI), bỏ dấu/ký tự đặc biệt + UUID v4, tối đa 200 ký tự; giữ slug đã sinh trong draft khi thử lưu lại, không đổi slug sản phẩm cũ. Chưa chọn ảnh hiển thị lỗi EN/VI; upload thành công xóa lỗi cũ. Backend contract/DDL không đổi, slug vẫn được API yêu cầu và unique DB kiểm tra. Typecheck/architecture/build, 150 tests và browser mock form EN/VI 390px PASS; không upload thật/ghi remote/deploy trong lượt này. Verifier Phase 5 tổng quát dừng ở ca 3 do chờ tổng quote trước khi chọn khu vực (2/10, 0/2 mở rộng, persisted D1 không đổi); không coi là suite UI PASS.
