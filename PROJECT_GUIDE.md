# Sổ tay dự án Lunara Flower Shop

Tham chiếu cho chủ dự án và Codex về kiến trúc, giao diện, component và giới hạn demo. Quy tắc làm việc ở [AGENTS.md](AGENTS.md); workflow UI/nghiệp vụ ở [.agents/skills/lunara-flower-shop/SKILL.md](.agents/skills/lunara-flower-shop/SKILL.md). Đối chiếu source: **18/10/2026**. Code hiện tại là nguồn quyết định khi tài liệu khác với implementation.

## Cách sử dụng với Codex

Mở đúng repository trong một phiên Codex được trusted để nạp instructions và MCP. Mô tả kết quả muốn đạt, flow cần kiểm chứng và ngoại lệ so với quy ước. Ví dụ:

```text
Dùng $lunara-flower-shop. Thực hiện [tính năng] ở [feature/flow].
Giữ bộ nhận diện và giới hạn demo hiện tại.
Kết quả cần: [hành vi có thể kiểm chứng].
```

ChatGPT thông thường không tự đọc file trên máy. Với phiên không có workspace, đính kèm sổ tay và instructions. Các đề xuất trong roadmap không tự cho phép triển khai, commit hoặc publish.

## Hiện trạng và bản đồ dự án

Trạng thái triển khai, nghiệm thu và bằng chứng được ghi riêng tại [PROJECT_STATUS](docs/PROJECT_STATUS.md). Sổ tay này mô tả kiến trúc và cách phát triển theo source hiện tại.

UI branding là **Lunarra**; repository GitHub tên **Lurana**. UI có English/Tiếng Việt, mặc định/fallback English; commerce dùng VND từ D1, giờ Asia/Ho_Chi_Minh. Checkout/tra đơn/admin đã nối API; customer auth/profile/wishlist tài khoản, custom request và admin customers/settings/notifications giữ source nhưng ẩn. Hoa yêu thích storefront dùng memory riêng theo quyết định owner bên dưới. Giao tiếp với chủ dự án bằng tiếng Việt.

| Keyword | Hiện trạng |
| --- | --- |
| Commerce | Home/Shop/Cart/Delivery/Quote, checkout COD/retry/xác nhận, tra đơn và admin dùng API D1 local |
| Worker | Hono + `@cloudflare/vite-plugin`; health/catalog/delivery/quote/COD/lookup/auth/admin local; API lạ → JSON 404, admin thiếu cookie → 401 |
| Health | Worker liveness; chưa kiểm tra kết nối/bảng D1 |
| Auth | AuthProvider gọi admin me/login/logout bằng cookie; AdminRoute active, server kiểm quyền/Origin; customer auth chưa có API nên giữ ẩn |
| Success | Checkout chỉ xác nhận khi API trả mã đơn/tổng tiền; COD chỉ PAID sau DELIVERED; signup/request không giả thành công |
| Phiên bản và tooling | Xem [TECH_STACK](docs/TECH_STACK.md); cài đúng lockfile bằng `npm ci` |

### Kiến trúc MVP đã chọn

Chi tiết công nghệ ở [TECH_STACK](docs/TECH_STACK.md); scope/tiêu chí phase ở [pipeline](docs/pipeline/README.md). Sổ tay giữ quyết định kiến trúc và cách tìm source, không lặp checklist nghiệm thu.

| Phạm vi | Đã có / còn thiếu |
| --- | --- |
| Runtime MVP | Hono/Cloudflare Workers · D1/SQLite · Zod · SQL tham số hóa |
| Media MVP | Signed direct Cloudinary upload và gallery admin đã có trong source; [quy trình và giới hạn](docs/CLOUDINARY.md) |
| Order MVP | Phase 3 COD/server pricing/tồn/idempotency/lookup; Phase 4 admin status gọi lại transitionOrder hoàn tồn một lần, DELIVERED → PAID; Phase 5 form/review/gửi/retry/xác nhận/lookup và admin đã nối |
| Admin auth | Phase 4 local: SHA-256/timingSafeEqual + HS256 JWT cookie HttpOnly/Strict 12h; kiểm quyền/Origin/JSON ở server; auth khách để sau |
| Schema | [Base bất biến: 10 bảng](migrations/0001_mvp.sql), thêm0002ảnh category + [0003danh mục Hà Nội](migrations/0003_hanoi_administrative_areas.sql) thành12bảng trong chuỗi source migrations; có `delivery_zones`, idempotency và CHECK/unique; `custom_requests` deferred. [Đối chiếu v1/v2](docs/DATABASE_DESIGN.md); hai file schema cũ chỉ dẫn về migration |
| D1 local | Binding `DB`; migrations0001–0003, danh mục Hà Nội; seed mẫu và `db:verify` không đại diện dữ liệu mở bán |
| Cloudflare remote | Target tách biệt; [STAGING](docs/STAGING.md) hướng dẫn build/deploy, [PROJECT_STATUS](docs/PROJECT_STATUS.md) ghi mốc kiểm chứng |
| Persistence | CartProvider + localStorage version 1, chỉ variantId/quantity; wishlist tạm ẩn |
| Thị trường | UI active VND/tỉnh-phường từ API; legacy PHP/settings ẩn. Quote lấy giá/phí DB |
| Vận hành | Quy trình smoke, backup, rollback và quota tại [OPERATIONS](docs/OPERATIONS.md); quyền thao tác theo yêu cầu hiện tại |

```text
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── providers.tsx           # I18nextProvider + AuthProvider + CatalogProvider + CartProvider
│   ├── router.tsx              # route tree duy nhất
│   └── layouts/                # MainLayout, AdminLayout, AuthLayout, MetadataLayout, app hooks
├── pages/                      # page mỏng: ghép view và feature hooks
│   └── admin/                  # các page admin được lazy-load
├── features/
│   ├── auth/                   # cookie admin session/login; customer fixture source ẩn
│   ├── shop/                   # canonical catalog, search/filter/sort
│   ├── cart/                   # variant cart/quote + checkout COD/review/confirmation
│   ├── orders/                 # public lookup API + snapshot/timeline; customer history fixture ẩn
│   ├── custom-order/           # source wizard/request mẫu deferred, chưa active
│   ├── landing/                # hero, featured, story, testimonials
│   ├── profile/                # profile, wishlist, account sections
│   ├── inventory/              # source inventory legacy ẩn; active admin stock thuộc features/admin
│   └── admin/                  # order/product/variant/summary/delivery API; fixture quản trị deferred ẩn
├── shared/
│   ├── ui/                     # button, input, dialog, dropdown, combobox
│   ├── components/             # ImageWithFallback, route feedback, TurnstileChallenge
│   ├── hooks/                  # useIsMobile, useTurnstile
│   ├── lib/                    # cn, formatMoney, finite color classes
│   └── i18n/                   # config/hooks/switch + JSON en/vi theo feature
└── styles/                     # fonts, Tailwind entry, global theme/brand
```

| Backend keyword | File / cấu hình |
| --- | --- |
| Entry + env | `worker/index.ts`; `worker/env.ts`: DB, admin/Turnstile/Cloudinary config, RateLimit bindings và TTL; xem `worker/env.ts` và runbook tương ứng |
| Public routes | `worker/routes/public.ts`: categories/products/product detail, delivery options, checkout quote |
| Orders | `worker/routes/orders.ts`: POST orders/lookup; `worker/services/orders.ts`: create/lookup/transition, 35 statements cho 15 dòng và guard retry ≤40; admin status tái sử dụng transitionOrder |
| Admin | `worker/lib/auth.ts` + `worker/routes/admin-*.ts`: login/me/logout, summary/orders/products/variants/delivery-zones; middleware requireAdmin/requireSameOrigin trước API quản trị |
| Services | `worker/services/catalog.ts`: tối đa 3 truy vấn; `delivery.ts`: chỉ phường có zone active thuộc danh mục D1, không fallback tỉnh; `pricing.ts`: một truy vấn variants `IN`, gộp giỏ và báo issues, chỉ đọc |
| Validation/lỗi | Root `shared/constants.ts`, `shared/schemas.ts` và `shared/admin-*-schemas.ts`; `worker/lib/validate.ts`, `errors.ts`; INTERNAL chỉ trả request_id, log request_id/error_name và diagnostic D1/SQLite/constraint/target thuộc allowlist, không raw message/SQL/binds |
| Middleware | Secure headers, X-Request-Id, IP/route rate-limit bindings trước D1/Siteverify; GET catalog thành công cache public 30 giây; API khác/lỗi no-store |
| Config | `worker/config.ts`: VND, Asia/Ho_Chi_Minh; phụ phí 0/30.000/50.000, cutoff 16:00, chuẩn bị 120 phút và slot 08:00–20:00 là giả định chủ shop cần chỉnh |
| Typecheck | `tsconfig.worker.json`: `worker/`, root `shared/` và declaration; tách globals frontend |
| SPA/API routing | `src/app/router.tsx` dùng Vite `BASE_URL` làm basename; `wrangler.jsonc` có SPA fallback và chuyển `/api/*` tới Worker. GitHub Pages chỉ preview UI tĩnh với base `/Lurana/`, noindex và `404.html` (deep link vẫn HTTP404), không có Worker/API; [cấu hình và giới hạn](docs/STAGING.md#github-pages--static-ui-preview). |
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
| `/` | `HomePage` | Landing sections; featured products lấy từ catalog chung; section Câu chuyện ngay sau featured, CTA /about |
| `/about` | `StoryPage` | Article tĩnh theo ref, không breadcrumb; bài/ảnh/giờ minh họa được owner duyệt, địa chỉ chung footer; static/noindex, chưa có CMS |
| `/shop` | `ShopPage` | Catalog D1, search qua Header, danh mục/khoảng giá/sort; card Featured chọn size nhỏ nhất và Add shared cart; chọn size khác ở chi tiết |
| `/shop/:slug` | `ProductDetailPage` | Gallery/zoom, size kèm giá và quantity; Thêm vào giỏ giữ trang, Mua ngay thêm rồi tới giỏ; yêu thích memory-only và gợi ý, loading/retry/404, EN/VI |
| `/cart` | `CartPage` | Bảng sản phẩm/số lượng/xóa + tóm tắt; Tiến hành đặt hàng → /checkout |
| `/checkout` | `CheckoutPage` | Thông tin người đặt/người nhận/lịch giao/thiệp chung/thanh toán → review → gửi/retry → xác nhận API; draft memory-only dùng chung với /cart |
| `/orders/track` | `TrackOrderPage` | [Tra đơn](docs/ORDER_TRACKING.md) qua API, dữ liệu chỉ ở memory |
| `/admin/login` | `LoginPage` | Mật khẩu admin → API cookie, kiểm `/me`, redirect dashboard; lỗi và retry EN/VI |
| `/admin` | Redirect | Chuyển tới `/admin/dashboard` |
| `/admin/dashboard` | `AdminDashboardPage` | Summary trạng thái30 ngày/đơn hôm nay giờ VN/tồn thấp chỉ variant đang bán và 10 đơn mới nhất từ API; không dùng chart/revenue mẫu |
| `/admin/stock`, `/admin/products` | `AdminStockPage` / redirect | Danh sách sản phẩm/variants mọi trạng thái, tạo/sửa/ẩn/archived, giá/threshold/active và stock_delta; products redirect về stock |
| `/admin/orders` | `AdminOrdersPage` | Lọc status/ngày giao/ngày đặt (mặc định90/tối đa366 ngày)/search2–100 ký tự, pagination, detail/timeline, chuyển status hợp lệ và note qua API |
| `/admin/delivery-zones` | `AdminDeliveryZonesPage` | Danh sách/tạo/sửa/tắt khu vực và phí/ngưỡng miễn phí; quote đọc phí mới |
| `/request`, `/orders`, `/profile`, `/login`, `/signup` | `UnavailablePage` | Custom request/customer auth/profile/wishlist/history deferred; source legacy giữ lại |
| `/admin/customers`, `/admin/requests`, `/admin/settings` | `UnavailablePage` | Chưa có API MVP; source legacy và notifications giữ ẩn |

`AdminRoute` bọc `AdminLayout`; admin pages lazy-load. `/admin/login` dùng `AuthLayout` ngoài storefront/admin layout. `VITE_ENABLE_CUSTOMER_AUTH` mặc định false; kể cả bật biến này, customer API-ready gate false vẫn chặn fixture customer. Các cờ customRequests/adminCustomers/adminSettings/adminNotifications false. Route lỗi có fallback dùng chung; không có route tree thứ hai.

### Ownership của catalog và cart

CatalogProvider gọi Shop service để tải categories/products qua API cùng origin; DTO adapter thành model UI, không nhập shop.data.ts hay fallback fixture. Featured lấy is_featured từ DB; ratings/reviews/wishlist không có dữ liệu server được ẩn.

CartProvider dùng variant ID làm line identity, bắt đầu rỗng. localStorage lunara.cart.v1 chỉ lưu version/variantId/quantity, parse Zod và bỏ dữ liệu hỏng; reload dựng tên/ảnh/giá từ catalog và quote. Giỏ tối đa 15 dòng, 20 mỗi dòng và max_quantity từ API. useQuoteCart gọi delivery/options + checkout/quote, bỏ response cũ khi items/khu vực/method đổi. Giá, phí và tổng hiển thị VND từ DB; lỗi có i18n/retry, không thay bằng giá demo. Quote không giữ tồn; POST order tính lại giá/phí và kiểm tồn tại server.

Checkout giữ sender/recipient/ngày/slot/thiệp/note trong memory; validate bằng shared schemas, có bước duyệt và khóa submit khi pending. Mỗi payload tạo UUID v4; retry payload không đổi giữ key để tránh tạo hai đơn, sửa payload tạo key mới. API trả order_number/tổng thật mới xác nhận và xóa giỏ. Không lưu PII, order detail hoặc intent vào localStorage/sessionStorage; reload giữa request chưa rõ kết quả cần tra đơn, không coi reload là retry an toàn. [Backup và kiểm chứng](docs/pipeline/FE_AUDIT.md).

### Catalog và cuộn trang

- Shop bỏ breadcrumb/search nội bộ; giữ nhãn Bộ sưu tập hoa tươi và tiêu đề/mô tả căn trái. Danh mục và2Dropdown Mức giá/Sắp xếp cùng hàng khi đủ chỗ, wrap trên mobile. Khoảng VND: [0,500k),[500k,1m),[1m,2m),[2m,+∞). `smallestVariant` chọn S trước M/L hoặc STANDARD trước DELUXE; `catalogCardPrice` dùng giá đó cho lọc/sort. DTO/API và `Product.price` adapter giữ nguyên.
- `MetadataLayout` gọi `useRouteScroll`: route/search từ Header và Back/Forward về đầu, hash giữ đích trừ sticky header. Tắt native history scroll restoration và chạy lại sau1frame để focus menu không kéo xuống. Shop cập nhật category/q bằng URL REPLACE với `state.preserveScroll` để giữ vị trí; POP về URL đã lọc vẫn về đầu; modal/theme/locale không reset route.
- Chỉ giữ border-top1px full viewport phía trên Tuyển chọn hôm nay. Featured và Hành trình trao gửi nối liền, không đường phân cách/khoảng hở; Journey và Story có nền full viewport, nội dung cùng khung co giãn1240–1600px.

### Chi tiết sản phẩm và hoa yêu thích

- Detail theo ảnh owner: gallery vuông/thumbnail phía dưới, size radio hiện giá, số lượng giới hạn theo variant trừ lượng đã có trong giỏ. `addItem(productId, variantId, quantity=1)` thêm đúng lượng; Thêm vào giỏ giữ trang, Mua ngay tới `/cart`. Bỏ accordion ghi chú và ba thẻ dịch vụ cũ; hai dòng dịch vụ mới là copy owner cung cấp, không thay coverage/phí/lịch API.
- Câu chuyện/Ý nghĩa/Chi tiết & Chăm sóc mới có bố cục và “Nội dung đang được cập nhật.” theo owner; chưa có field/API/admin để nhập nội dung riêng. Mô tả hiện tại vẫn từ DB. Gợi ý tối đa4mẫu khác, ưu tiên cùng danh mục, giá size nhỏ nhất; Xem thêm tới `/shop`.
- `WishlistProvider` giữ Product snapshot trong memory, dùng chung card/detail/header và qua route; không localStorage/sessionStorage/customer auth. Trái tim item chỉ toggle; header mở sidebar phải khoảng1/4viewport, tối thiểu256px/tối đa480px. Từ768px có yêu thích; mobile ẩn, resize xuống mobile đóng panel. Danh sách có count/xóa/link detail; Tiếp tục xem hoa/Escape đóng và trả focus, giữ route. Reload xóa danh sách.
- Source: `useProductDetail`, `ProductDetailView`, `ProductGallery`, `WishlistProvider`, `WishlistDrawer`; [runner](scripts/check-ui-product-detail.mjs) kiểm các hành vi/21theme bằng API tổng hợp, không ghi đơn. [Trạng thái local/staging](docs/PROJECT_STATUS.md).

### Auth admin, tồn kho và các feature deferred

Bảo vệ chống bot, giới hạn đơn chờ, hủy/hoàn tồn và expiry được mô tả tại [BOT_PROTECTION](docs/BOT_PROTECTION.md); [API contract](docs/pipeline/API_CONTRACT.md) là nguồn chi tiết payload và lỗi.

AuthProvider tải `/api/admin/me` để biết session server; login/logout gọi API bằng same-origin cookie. Không lưu password/JWT/session vào browser storage. 401 từ API quản trị xóa state admin và đưa về login; lỗi mạng có retry thay vì coi là logout thành công. Các response `/me` cũ được bỏ khi login/logout làm đổi session. Source fixtures và `lunara_user` legacy được giữ nhưng không active, không cấp quyền backend.

Backend Phase 4 dùng mật khẩu dài trong ADMIN_PASSWORD, SHA-256 hai phía + Workers timingSafeEqual, ký JWT HS256 bằng JWT_SECRET riêng. Cookie lunara_admin HttpOnly/SameSite=Strict/Path=/ có Max-Age=43200, Secure trên HTTPS và bỏ Secure ở HTTP loopback local. requireAdmin kiểm role/iat/exp; ghi admin cần JSON và Origin cùng origin. Thiếu/trống secret bị từ chối; auth không đọc/ghi D1 và không thêm dependency/bảng. Smoke dùng secret demo riêng, workerd dùng native crypto; Node tests có shim API timingSafeEqual của Workers. **[NGƯỜI]** tự đặt ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên và JWT_SECRET ≥32 ký tự ngẫu nhiên, khác nhau, trong .dev.vars trước real local use; agent không đặt secret thật, production thuộc Phase 6. Chi phí CPU cloud cần bằng chứng riêng; kiểm tra local không thay số đo cloud.

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
| Accent | `lunara-rose` | `#527E75` |
| CTA/nhãn nhỏ đủ tương phản | `lunara-rose-strong` | `#4D756E` |
| Accent nhạt | `lunara-rose-light` | `#9DB6B1` |
| Nền trang | `lunara-cream` | `#F8FBFA` |
| Surface phụ | `lunara-surface` | `#F1F7F5` |
| Nền ảnh | `lunara-blush` | `#EDF4F6` |
| Viền | `lunara-border` | `#E4EBE8` |
| Chữ chính | `lunara-ink` | `#344B49` |
| Chữ body đủ tương phản | `lunara-body` | `#5B6E6C` |
| Sidebar admin | `lunara-sidebar` | `#1A0D12` |
| Nền admin | `lunara-admin-background` | `#F8F4F2` |

Owner yêu cầu Original theo ref `D:/Download/lunara` ngày18/10, sau đó xác nhận không trộn UI xanh/hồng. Registry/`:root` dùng xanh/trắng sương; tên utility rose/cream/blush giữ tương thích. CTA/body có biến thể đủ tương phản. Top bar dùng soft surface; footer giữ bố cục/copy nhưng màu theo theme qua nhóm `--lunara-footer-*`. Không khóa footer vào rose cũ hoặc giữ màu hồng cố định của ref.15palette khác/ID/preference không đổi.

Logo minh họa dùng accent/light/strong tokens;5creative có secondary/tertiary riêng. `ImageWithFallback` dùng mask SVG với màu accent mạnh, giữ `<img>`, alt và kích thước khi ảnh lỗi. Màu logo/placeholder tự cập nhật theo CSS khi đổi theme, không gán HEX hồng trong asset dự phòng. Ảnh chụp vẫn là nội dung của ref/catalog, không đổi màu theo theme.

| Locale | `font-display` — heading/logo | `font-body` — body/form |
| --- | --- | --- |
| EN | Fraunces 500 / 500 Italic (optical sizing auto) | Inter |
| VI | Lora Regular 400 / 400 Italic (optical sizing auto) | Be Vietnam Pro |

Google Fonts qua stylesheet link trong `index.html`, preconnect Google APIs/Gstatic và `display=swap`; chỉ yêu cầu weight đang dùng. EN dùng Fraunces 500 cho heading/logo và 500 Italic cho cụm nhấn mạnh, `font-optical-sizing: auto` với opsz 9–144; body/UI và nhãn hero dùng Inter. VI theo source ref D:/Download/lunara: heading/logo Lora Regular 400, optical sizing auto; body/form Be Vietnam Pro. `brand.css` đổi biến font qua `html[lang='vi']`, kể cả dialog portal. Lora tải weight 400–700 normal/italic; display VI chuẩn hóa 400. html đặt font-body làm mặc định để portal kế thừa; font-sans/font-serif cùng trỏ token theo locale. Brand tokens tách `theme.css`; dark-mode product flow chưa hoàn chỉnh.

Nguồn font: [Lora](https://github.com/google/fonts/tree/main/ofl/lora), [Be Vietnam Pro](https://github.com/google/fonts/tree/main/ofl/bevietnampro). Cả hai được phát hành theo SIL Open Font License. Kiểm tra typography bằng `node scripts/check-ui.mjs http://127.0.0.1:4173 --i18n-only --fonts` sau khi mở preview; chế độ `--fonts` cho phép tải Google Fonts để xác nhận font thật và dấu tiếng Việt, thay vì chỉ kiểm tra fallback offline.

Theme Switcher trên Header dùng lại `Dropdown`/Radix:21light themes gồm Original +15palette cũ +5creative multicolor; preview5/6màu/check/cuộn/keyboard. [Spec nền](docs/ui-ux/LUNARA_MULTI_THEME_SPEC.md) và [Extend Multi Theme](docs/ui-ux/Extend_Lunara_Multi_Theme.md) sở hữu palette/mapping3accent; registry/semantic colors ở `src/shared/theme/themes.ts`, preference `lunara.theme.v1` chỉ lưu ID. `theme-store.ts` áp dụng trước `createRoot`, duy trì qua route/reload, xử lý storage lỗi/ID sai bằng Original và đồng bộ storage event. Original xóa override để về palette ref tại `:root`; các palette khác ánh xạ Lunara/generic/editorial/footer tokens. Story trên Home dùng ink/body chung với Hero/navbar. Accent mới có fallback giữ nguyên16theme cũ; status/sidebar riêng không đổi.5creative dùng semantic active/header border cho Admin; locale/font/currency độc lập với theme. Runner local: `node scripts/check-ui-themes.mjs http://127.0.0.1:4173`; mặc định chặn font remote cho kết quả ổn định, tùy chọn `--font-cache=<JSON cache local>` kiểm font thật. Bằng chứng kiểm tra tại PROJECT_STATUS.

Home dùng Hero → dải dịch vụ COD → FeaturedCollection → Hành trình trao gửi → OurStory. Dãy thẻ danh mục ảnh/All Flowers đã gỡ18/10 theo yêu cầu owner; danh mục ở navigation và Shop vẫn hoạt động. FeaturedCollection theo ref `D:/Download/lunara`: nhãn Tuyển chọn hôm nay, tiêu đề Sản phẩm nổi bật căn trái, Xem tất cả tới `/shop`; tối đa4sản phẩm `is_featured` từ catalog DB, giữ loading/error/retry/rỗng. `ProductGrid`/`ProductCard` có `appearance="featured"` dùng chung Home và Shop: ảnh4:5, thông tin một dòng, nút giỏ44px thêm variant còn hàng đầu tiên, hết hàng thì khóa; chọn size ở chi tiết. Shop chọn size nhỏ nhất, kể cả khi hết hàng, rồi khóa Add nếu cần; không tự đổi sang size lớn. Chọn size khác ở chi tiết. `Benefits variant="journey"` tái sử dụng component cho3bước Chọn hoa/Viết thiệp/Giao tận tay,1cột dưới768px và3cột từ768px; copy EN/VI trong namespace landing. Không chép fixture hoặc logic mẫu.

Hero và3ảnh Story dùng đúng ảnh Unsplash của ref, lưu local ở `src/assets/home-reference`; Hero có JPEG640/960/1400 với srcset/sizes, eager/high priority, crop giữa và không gradient. Dưới1024px ảnh dưới chữ; từ1024px chia5/7cột. Chữ36/48/54px, ảnh cao400/480/520px theo ref; khung ultra vẫn co giãn tới1600px. Giữ nguyên nhãn/tiêu đề/mô tả Hero và8dòng dịch vụ owner chỉ định; CTA là Chọn hoa. Story ảnh lớn320/400px, cột nhỏ chia đều theo gap. [Nguồn ảnh và asset cũ giữ lại](ATTRIBUTIONS.md), [ảnh danh mục](docs/CATEGORY_IMAGES.md). ProductGrid giữ2cột dưới1024px/4cột từ1024px; ảnh sản phẩm/nội dung/variant/giá/tồn vẫn từ DB.

- Responsive Home: `--lunara-content-max-width:clamp(1240px,80vw,1600px)` dùng chung Hero/services/Featured/Journey/Story; Header dùng1440–1600px. Giữ gutter20/32px; heading Featured/Journey24/30px, Story30/36px theo ref. Story dùng chung biến chiều cao ảnh/khoảng cách để hai cột ảnh luôn bằng nhau.
- Menu mobile vẫn là con absolute trực tiếp của sticky Header; `max-height:calc(100dvh - 100%)` trừ đúng chiều cao Header đang hiển thị. Giữ quan hệ containing block này khi đổi markup; kiểm màn hình ngang thấp và cuộn/focus tới mục cuối. Footer, API và các breakpoint ngoài phần Home/Header không đổi.

- Home theo bố cục, ảnh, line art và vai trò màu ref `D:/Download/lunara`; Original đổi tại registry/`:root`, không override palette theo route. Story cùng nền navbar chính và khác Journey. Runner kiểm màu render top/footer/logo/ảnh lỗi, từng theme → Original → reload, portal, ảnh local/copy owner; footer đối chiếu layout/font/copy/link với baseline, màu so với theme hiện tại.

| Vai trò màu trong ref | Token Lunara | Áp dụng trên Home |
| --- | --- | --- |
| `--bg-primary` | `--lunara-cream` | Hero, Featured |
| `--surface-card` | `--lunara-card-surface` | Navbar chính/search/menu, Story; nền trắng của21light themes theo ref |
| `--section-secondary` | `--lunara-section-secondary` | Dải dịch vụ/Journey16theme cũ; Journey5creative dùng tertiary-soft qua journey-surface |
| `--surface-tertiary` | `--lunara-blush` | Khung ảnh |
| Top bar (owner yêu cầu đồng bộ màu) | `--lunara-utility-background` |16theme cũ dùng soft surface;5creative dùng secondary gốc, text/focus có token riêng |

Featured ProductCard dùng card-surface cho ô Xem chi tiết; nền nút giỏ16theme cũ giữ card-surface,5creative dùng secondary-soft/strong qua product-action tokens. CTA chính giữ primary; nhãn Hero/category dùng tertiary gốc riêng5creative. Góc/kích thước/bố cục giữ ref. Link phụ/nhóm link Footer dùng secondary-strong; chi tiết mapping/ảnh đối chiếu theo Extend Multi Theme.

- Header3tầng max1440–1600px, lề20/32px, nav desktop từ1024px; shadow dưới thay border. Top bar36px gồm border1px, chữ10px dưới640px/12px từ640px, control32px; EN/VI storefront cao26px qua prop compact. Admin giữ cỡ cũ. Search cùng nền nav, không viền/outline cứng khi nhập, dùng shadow focus. Gạch active mở từ trái150ms, tắt với reduced-motion. Logo minh họa hoa từ ref, wordmark Lunarra; favicon giữ nguyên. Mobile đóng menu bằng Escape/click ngoài/đổi route.
- `StorefrontNavigation.tsx` dùng Radix DropdownMenu; danh mục lấy CatalogProvider, Quà tặng tới `/shop?category=gift-sets` khi có category. Search luôn hiện, trim/encode tới `/shop?q=` và sync URL; tra đơn/giỏ dùng route hiện có, badge dùng shared itemCount. Story còn ở Home/footer/`/about`.
- Lọc theo dịp, hỗ trợ, Hotline và Liên hệ mở Dialog + FeatureUnavailable; trả focus về nút mở, không chép hotline/badge mẫu. State/focus ở `useMainLayout`; Hoa yêu thích có sidebar memory-only như mục trên. Semantic tokens áp dụng21theme, giữ preference và16palette cũ.

Home dùng phong cách editorial của ref: ảnh góc2px, CTA góc2px, shadow nhẹ, line art và ảnh hoa. Các flow khác giữ component/layout hiện có. Dùng rose-strong cho chữ nhỏ/CTA đủ tương phản theo theme; giữ focus visible, labels, keyboard access và reduced motion.

`shared/lib/color-classes.ts` ánh xạ palette hữu hạn thành **class Tailwind đầy đủ** để các màu động của fixture được scan. Khi thêm màu mới, bổ sung class literal; không tạo `bg-[${color}]` lúc runtime. `shared/lib/format.ts` định dạng tiền tại ranh giới hiển thị.

## Component có sẵn

### Localization

`src/shared/i18n/config.ts` tạo i18next instance; `AppProviders` gắn I18nextProvider. Resources JSON được bundle tại `src/shared/i18n/locales/en|vi/`, tách namespace common/admin/auth/cart/custom-order/inventory/landing/orders/profile/shop. Không gọi dịch vụ dịch hoặc backend để đổi UI. English text hiện tại được giữ làm key/value; keySeparator/nsSeparator tắt để copy có dấu chấm/dấu hai chấm hoạt động. Message có count dùng các suffix plural của i18next và interpolation, không nối hậu tố English `s` trong JSX.

EN/VI nằm ở mép phải header storefront/admin và góc phải trên màn hình admin login. Ưu tiên preference `lunara_language` đã lưu; lần đầu chọn EN/VI từ navigator.languages, fallback English; khi storage bị chặn vẫn đổi được trong phiên. `document.documentElement.lang` cập nhật theo locale. Tiếng Việt thiếu key fallback English. Navbar dùng menu mobile dưới breakpoint lg; Theme và EN/VI nằm trong dải tiện ích trên cùng của header. Signup/customer auth source giữ ẩn.

Footer ở `app/layouts/components/StorefrontFooter.tsx` dùng surface sáng cho21theme; desktop4cột thương hiệu/social, Mua hàng, Về Lunarra, Liên hệ. Mobile thương hiệu/địa chỉ chiếm toàn hàng,2nhóm link cạnh nhau; copyright và Privacy/Shipping ở dưới. Giữ3địa chỉ/maps, pháp nhân/MST001,14đích chưa có URL và link About/Tra đơn/Admin; không lấy hotline/email/địa chỉ từ ảnh ref. Pháp nhân/MST/nội dung shop vẫn chưa được xác minh. Copy/address/map trong EN/VI common.json; ID/thứ tự/link ở `shared/config/storefront-footer.ts`; đích thiếu href dùng Dialog + FeatureUnavailable, Escape/X/Đóng trả focus.

`ZaloContact.tsx` vẫn portal vào body, icon tự vẽ ở góc phải, nâng trên CTA giỏ dưới1024px. Hover/focus/bấm mở giãn60→208px trong400ms(200ms khi reduced-motion). Chưa có tài khoản Zalo nên chỉ mở notice, chưa chat/badge.

Catalog có `name_en/name_vi`; `name` giữ compatibility. `name_vn` là alias tiếng Việt tương thích dữ liệu legacy; API hiện trả `name_vi/name_en`. `getLocalizedName` ưu tiên vi → vn → en → legacy cho tiếng Việt; English ưu tiên en → legacy → vi → vn. Cart/order item giữ tên snapshot song ngữ; source inventory legacy có tên Anh và Việt riêng. Search catalog/stock/order mẫu chấp nhận tên Việt và bỏ dấu. Đổi ngôn ngữ không đổi ID, state cart, giá, VND hoặc Asia/Ho_Chi_Minh; tên khách, contact, notes và dữ liệu nhập giữ nguyên.

Thống kê dữ liệu hiện có ở [docs/FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md); stack ở [docs/TECH_STACK.md](docs/TECH_STACK.md); thiết kế D1, canonical và quyết định schema ở [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md). Phase 0–3 có health/catalog/phí giao/quote, COD/lookup và transition hoàn tồn một lần/DELIVERED→PAID. Phase 4 có auth/admin summary/đơn/sản phẩm/tồn/phí giao, dùng nguyên 10 bảng canonical; stock_delta cập nhật tồn nguyên tử và quote mới dùng phí mới. Phase 5 đã nối UI checkout/lookup/admin và nghiệm thu local. GLOB SQL chỉ kiểm dạng ngày; service order kiểm ngày lịch/slot giờ VN. Không đổi Worker/DDL/pinned packages hoặc truy cập D1 remote khi nối frontend.

`src/shared/ui` giữ **Button, Input, Dialog, Dropdown, Combobox** và các subcomponent của Dialog. `Dropdown` dùng dependency Radix Select đã có, chung màu cream/blush/rose cho sort, size, checkout và admin; giữ form values, required, disabled và keyboard/focus. Các module không được app import đã loại bỏ, gồm calendar/menubar/input-otp/resizable và các wrapper khác. Không cần khôi phục cả bộ UI để thêm một primitive.

Customize Button/Input bằng Lunara classes; default shadcn primary vẫn là màu dark generic. Dialog inventory hỗ trợ focus trapping, Escape, title/description. `cn` dùng clsx/tailwind-merge; `useIsMobile` ở shared/hooks. `ImageWithFallback` giữ img/alt/dimensions và hiển thị placeholder khi ảnh lỗi.

Các domain component nằm trong feature tương ứng: Shop cards/filter/grid; CartItemList/CartSummary/CheckoutForm/Confirmation; các bước custom order; landing sections; profile tabs; bảng order/customer/inventory; dashboard widgets; settings sections. Chưa có generic domain StatusBadge.

## Tiêu chuẩn khi phát triển

Turnstile fail-closed16/10: Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Trạng thái deployment được ghi tại PROJECT_STATUS. Missing secret khác token sai:503 TURNSTILE_NOT_CONFIGURED so với403 FORBIDDEN. HTML/static _headers và API secureHeaders phải kiểm độc lập trên deployment; không giả định _headers bảo vệ response từ Worker.

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
node scripts/check-ui-storefront.mjs http://127.0.0.1:4173 --responsive
npm run check:ui:phase5
```

Dev mặc định `http://127.0.0.1:5173`, preview `http://127.0.0.1:4173`; dùng đúng port Vite hiển thị nếu port mặc định đang bận. Build frontend ở `dist/client/`, Worker và Wrangler config sinh tự động ở `dist/lunara/`. Browser test dùng **Edge headless trên Windows** và Node 24; `check:ui` kiểm 17 routes cùng EN/VI và layout 320/390/768/1024px. `check:ui:phase5` kiểm checkout/lookup/admin bằng HTTP loopback + workerd D1 cô lập/secret synthetic, 10 kịch bản bắt buộc và 2 mở rộng. Harness kiểm snapshot D1 persisted trước/sau. Kiểm tra offline hoặc có host allowlist không chứng minh ảnh/font remote tải được. Bằng chứng/screenshot/profile browser nằm trong `.security-review/`, không vào Git.

`typecheck` kiểm frontend và Worker; `check:architecture` kiểm import/public API/presentation state. `npm test`, smoke và browser runner có phạm vi khác nhau; số ca và kết quả theo từng mốc ở [PROJECT_STATUS](docs/PROJECT_STATUS.md), nghiệm thu phase ở các tài liệu pipeline. Build không thay typecheck; repo chưa có ESLint script. `db:verify` kiểm13nhóm schema trên D1 local và DB cô lập; CLI reset chỉ xóa local. Không chạy migrate/seed/reset như một bước bắt buộc cho sửa UI/tài liệu.

Smoke local dùng workerd D1 cô lập, demo secrets và kiểm snapshot persisted. Không suy rộng điều này cho mọi script: schema verifier dùng `getPlatformProxy` có thể đọc env local. Smoke remote chỉ đọc mặc định; quyền ghi, credentials/token stdin, đối chiếu và cleanup theo [OPERATIONS](docs/OPERATIONS.md).

Trên Windows, Vite/CodeGraph đang chạy có thể khóa native binaries trong `node_modules`, làm `npm ci` báo EPERM. Dừng đúng process của workspace trước khi cài, rồi khởi động lại server; không bật dependency scripts để xử lý lỗi.

## CodeGraph và cấu hình trợ lý

Dependency local pin `@colbymchenry/codegraph@1.5.0`; graph ở `.codegraph/`. Wrapper cố định root, tắt telemetry và fallback download, không đổi global settings. Exclusions ở `codegraph.json` giữ dependency/build/audit/secret ngoài index.

```bash
# Chỉ khi owner yêu cầu bật indexing cho bản clone này:
npm run assistant:setup
# Hằng ngày:
npm run graph:status -- --json
npm run graph:sync
npm run graph:explore -- "useProducts useCartState useCheckout"
node scripts/codegraph.mjs node --file src/features/shop/hooks/useProducts.ts --offset 1 --limit 100
```

Nếu không có `.codegraph/`, bỏ qua CodeGraph; không tự chạy setup trong tác vụ thông thường. PowerShell có thể dùng `npm.cmd` để giữ đối số sau `--`. Khi có index, dùng CodeGraph trước khi tìm/đọc code; dùng node/offset/limit khi explore thiếu target. File mới phải được review và có exact allowlist path trước khi sync.

Setup tạo `.codex/config.toml` local cho CodeGraph STDIO và OpenAI Docs MCP, giữ settings khác ngoài block quản lý. Mở phiên trusted mới để nạp cấu hình; không cấu hình global/repository khác. MCP OpenAI Docs chỉ đọc docs, không tích hợp OpenAI API vào storefront.

## Brainstorm và thứ tự phát triển

[Pipeline](docs/pipeline/README.md) giữ mục tiêu/tiêu chí phase; [BACKLOG](docs/pipeline/BACKLOG.md) giữ ý tưởng chưa triển khai. Tính năng đã có trong source không trở lại backlog chỉ vì chưa nghiệm thu provider/cloud. Dữ liệu và quyết định chủ shop còn thiếu nằm tại [PROJECT_STATUS](docs/PROJECT_STATUS.md#việc-còn-cần-chủ-shop).

## File chia sẻ và cách duy trì

Public widget keys riêng trong `.env.production`/`.env.staging`; staging dùng CLOUDFLARE_ENV=staging + Vite --mode staging, origin staging/noindex riêng. Deploy bằng hai npm scripts hiện có, không truyền key; TURNSTILE_SECRET do owner cấu hình riêng từng Worker khi còn thiếu hoặc cần rotate; không nhập lại sau mỗi deploy.

`.gitignore` là default-deny allowlist: source, manifest/lockfile, docs, verification scripts/tests và skill được xét duyệt có exact paths và parent exceptions. Không dùng `git add -f`. Nó không quét secrets hoặc thay branch protection.

Giữ local: `node_modules`, `dist`, `.codegraph`, `.codex`, `.security-review`, `.env`, keys/logs/cache. Trước commit/push kiểm tra status, file inclusion và `git diff --check`. Commit/push/deploy chỉ khi yêu cầu hiện tại hoặc standing authorization bao gồm hành động đó.

Khi thay route/component/model hoặc ownership, cập nhật mục liên quan ở đây, AGENTS và skill. Báo cáo kiểm chứng thực tế trong bàn giao; không coi số liệu của lượt kiểm tra cũ là bảo đảm cho source mới.

Staging: `env.staging` dùng Worker `lunara-staging`, D1 riêng và secrets riêng; `scripts/staging.mjs` chọn môi trường lúc build và kiểm UUID trước ghi/deploy. Tình trạng migrate/deploy/provider/Cron từng môi trường xem PROJECT_STATUS. Xem [STAGING](docs/STAGING.md).
