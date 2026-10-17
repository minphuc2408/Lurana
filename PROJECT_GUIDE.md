# Sổ tay dự án Lunara Flower Shop

> **Hiện hành 17/10/2026:** main **77bdfdc**; owner deploy staging **c29141be-740e-4908-b369-179d7631356e** lúc **16:42:38 giờ Việt Nam**, 100% traffic. @minphuc8042 thực hiện README (4821a53) và tiến trình tra đơn (7dac1bb); @minphuc2408 merge PR#1(d36519b) và PR#2(77bdfdc). Public JS khớp artifact local; 5 route storefront200/CSP/noindex. Staging có tên secret TURNSTILE_SECRET; chưa nghiệm thu challenge/login/đặt đơn thật. Catalog công khai4categories/1product, coverage1tỉnh Hà Nội/1phường. Các ghi chú chưa push/deploy, thiếu secret hoặc coverage0 bên dưới là lịch sử khi khác mốc này. Không đọc DB riêng tư/đổi cloud; production không rà lại; Phase6 vẫn5/7.




> Bàn giao source17/10/2026: owner đã cho phép chia commit theo chức năng và push GitHub trong lượt này; không bao gồm deploy hoặc DB remote. Kiểm tra trước push: typecheck, architecture234source,191/191tests và build PASS. Đã sửa test i18n nhận namespace với cả nháy đơn/kép. Đơn SMOKE thử tra cứu chỉ ở DB local (1đơn/1item/3history), không đưa dữ liệu hoặc SQL thử vào Git; db:verify13/13 PASS. Local5173 hiện thiếu cấu hình Turnstile và trả503 TURNSTILE_NOT_CONFIGURED; owner đã yêu cầu dừng, không thêm bypass hoặc thay cấu hình. Browser UI72ca trước đó dùng API/challenge giả lập, không đồng nghĩa lookup thật đã hoạt động. Remote/Phase6 vẫn giữ nguyên.


> Tra cứu đơn17/10/2026 (local5173, chưa push/deploy): /orders/track theo project ref, bỏ breadcrumb/eyebrow/đoạn hướng dẫn theo yêu cầu. Năm mốc trạng thái thực với icon, đơn hủy hiển thị riêng và chỉ đánh dấu các bước có trong lịch sử API. Hotline0987656789. Giữ bắt buộc mã đơn + điện thoại + Turnstile, không dữ liệu đơn mẫu trong ứng dụng. Không đổi API/Worker/DB/dependency hoặc màn hình admin. Typecheck, architecture234source,191tests, build và72ca responsive EN/VI PASS; kiểm tra browser dùng phản hồi API/challenge giả lập, không thay nghiệm thu provider/remote. Phase6 vẫn5/7.


> Câu chuyện17/10/2026 (local5173, chưa công bố/push/deploy): section theo ref ngay sau sản phẩm nổi bật, menu Câu chuyện và /about dạng article không breadcrumb. Owner cho dùng bài/ảnh/giờ mở cửa mẫu, địa chỉ dùng chung footer và link ngoài đại diện Lunarra. /about có metadata riêng/noindex, không sitemap; không CMS/API/DB mới. Typecheck/architecture232source/190tests/build và28ca browser EN/VI/7widths PASS,7vị trí ảnh ref tải thật,0exceptions.


> Giỏ hàng/Đặt hoa theo ref17/10/2026 (local5173, chưa push/deploy): /cart chỉ sản phẩm+tóm tắt; “Tiến hành đặt hàng” mở /checkout. Form5khối người đặt/người nhận/lịch giao/thiệp chung/thanh toán, sidebar đơn hoa, giữ review rồi xác nhận. Chưa chọn địa chỉ thì ẩn phí; COD mặc định/chuyển khoản thông báo. CheckoutFlowProvider giữ draft trong memory khi sửa giỏ, reload/rời nhóm route xóa draft. API/DB không đổi. Chi tiết và kiểm chứng tại docs/CHECKOUT_UI.md.


> Kích thước theo ref17/10/2026 (local, chưa commit/push/deploy): đã bỏ mục Cart trong menu chính/mobile, giữ nút giỏ bên phải. Header72px dưới640px/80px từ640px; container storefront1240px, padding20/32px. Hero ảnh400/480/520px, grid5/7 gap40/56px; sản phẩm2cột dưới1024px/4cột từ1024px, ảnh4:5. Dev đang dùng cổng5173. Xem PROJECT_STATUS để biết kiểm chứng và remote.


> Header 17/10/2026 (local, chưa commit/push/deploy): nút Tìm kiếm mở ô nhập theo project ref, desktop inline từ1280px/mobile mở dưới header; Enter/nút kính lúp tìm qua /shop?q=, Escape/Đóng trả focus. Nút Giỏ hàng icon nét1.5 + nhãn + badge inline khi có hàng, dùng CartProvider và link /cart. EN/VI, không đổi checkout/API/DB. Kiểm chứng:190tests, architecture225, typecheck/build; Edge24ca responsive và tương tác PASS,0exceptions/0POSTorder.


> Typography 17/10/2026 (local, chưa commit/push/deploy): đã đối chiếu source tham chiếu `D:/Download/lunara`; project hiện tại tải đủ Lora và Be Vietnam Pro cùng weight/style mẫu dùng. VI dùng Lora Regular 400 cho heading/logo (kể cả italic), Be Vietnam Pro cho body/form; thêm fallback Georgia/system-ui, font kế thừa từ html và đồng bộ utility font-sans/font-serif với token locale, bao gồm portal. EN vẫn Fraunces 500/Inter. Xem docs/PROJECT_STATUS.md để biết kiểm chứng và phạm vi remote.

> Hiện hành 16/10/2026 — Đã nhập danh mục D1 Hà Nội 1 tỉnh/126 phường vào local + staging bằng migration0003 (12 bảng); không nhập TP.HCM. Admin chọn/tìm tỉnh-phường, nhập phí; checkout chỉ hiện zone active thuộc danh mục, server không fallback tỉnh. Checkout gộp, thiệp NONE, terms nội bộ và bank rollback COD được giữ. Staging đã deploy version 27c3d24e-f3df-42e1-8d18-8b8299427062; zones0 nên checkout chưa có nơi giao cho tới khi admin cấu hình phí. Local190tests/225source/typecheck/build, schema13/13, smoke40/40, browser admin7nhóm PASS. Owner đã yêu cầu commit/push sau deploy; production không đổi, Phase6 giữ5/7. [Địa chỉ](docs/DELIVERY_ADDRESS.md), [Checkout](docs/CHECKOUT_UI.md). Các mốc dưới đây là lịch sử khi khác hiện trạng này.

Tham chiếu cho chủ dự án và Codex về kiến trúc, giao diện, component và giới hạn demo. Quy tắc làm việc ở [AGENTS.md](AGENTS.md); workflow UI/nghiệp vụ ở [.agents/skills/lunara-flower-shop/SKILL.md](.agents/skills/lunara-flower-shop/SKILL.md). Cập nhật tài liệu: **16/10/2026**. Code hiện tại là nguồn quyết định khi tài liệu khác với implementation.

## Cách sử dụng với Codex

Mở đúng repository trong một phiên Codex được trusted để nạp instructions và MCP. Mô tả kết quả muốn đạt, flow cần kiểm chứng và ngoại lệ so với quy ước. Ví dụ:

```text
Dùng $lunara-flower-shop. Thực hiện [tính năng] ở [feature/flow].
Giữ bộ nhận diện và giới hạn demo hiện tại.
Kết quả cần: [hành vi có thể kiểm chứng].
```

ChatGPT thông thường không tự đọc file trên máy. Với phiên không có workspace, đính kèm sổ tay và instructions. Các đề xuất trong roadmap không tự cho phép triển khai, commit hoặc publish.

## Hiện trạng và bản đồ dự án

Nguồn trạng thái hiện hành: [PROJECT_STATUS](docs/PROJECT_STATUS.md). Lượt mới đã migrate local/staging0003 và deploy staging27c3d24e; không deploy production. Admin dùng danh mục Hà Nội126 từ D1, checkout chỉ dùng coverage active. Các mốc tiếp theo là lịch sử trước lượt này. Mốc gallery trước checkout gộp:179 tests/221 source files, typecheck/build/smoke40 PASS; gallery8ảnh với5nhóm browser tập trung PASS; dropdown/cursor thống nhất từ lượt trước, chưa push/deploy. Các mốc smoke40/dry-run hai môi trường thuộc lượt trước; xem trạng thái chuẩn cho phạm vi kiểm chứng. Snapshot 16/10: production vẫn bản 15/10; staging đã deploy 13:31 với hardening/key staging/RateLimit/TTL 24h, chưa có TURNSTILE_SECRET. Có bindings/secrets name không thay nghiệm thu thật; Phase 6 giữ5/7. Các đoạn cuối sổ tay ghi ngày 15/10 là lịch sử.

UI branding là **Lunarra**; repository GitHub tên **Lurana**. UI có English/Tiếng Việt, mặc định/fallback English; commerce dùng VND từ D1, giờ Asia/Ho_Chi_Minh. Checkout/tra đơn/admin đã nối API; customer auth/profile/wishlist, custom request và admin customers/settings/notifications giữ source nhưng ẩn. Giao tiếp với chủ dự án bằng tiếng Việt.

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
| Media MVP | API catalog trả URL ảnh từ D1; signed direct Cloudinary upload trong admin đã tích hợp local; staging đã có cấu hình/secret names và deployment; production thiếu Cloudinary config/secrets, upload thật/preset validity chưa nghiệm thu |
| Order MVP | Phase 3 COD/server pricing/tồn/idempotency/lookup; Phase 4 admin status gọi lại transitionOrder hoàn tồn một lần, DELIVERED → PAID; Phase 5 form/review/gửi/retry/xác nhận/lookup và admin đã nối |
| Admin auth | Phase 4 local: SHA-256/timingSafeEqual + HS256 JWT cookie HttpOnly/Strict 12h; kiểm quyền/Origin/JSON ở server; auth khách để sau |
| Schema | [Base bất biến: 10 bảng](migrations/0001_mvp.sql), thêm0002ảnh category + [0003danh mục Hà Nội](migrations/0003_hanoi_administrative_areas.sql) thành12bảng ở local/staging; có `delivery_zones`, idempotency và CHECK/unique; `custom_requests` deferred. [Đối chiếu v1/v2](docs/DATABASE_DESIGN.md); hai file schema cũ chỉ dẫn về migration |
| D1 local | Worker binding `DB`; migration0001+0002+0003, Hà Nội1/126; seed 4 categories/8 products/24 variants/8 images/4 zones; verifier 13 nhóm qua `db:verify` |
| Cloudflare remote | Phase 6 đã xác minh account/UUID và pin account_id, áp `0001`/seed remote, backup mở offline PASS; 10 bảng/0 đơn/FK sạch; đã deploy, API Production 7/7 + public browser PASS và dọn SMOKE; chưa có dữ liệu thật |
| Persistence | CartProvider + localStorage version 1, chỉ variantId/quantity; wishlist tạm ẩn |
| Thị trường | UI active VND/tỉnh-phường từ API; legacy PHP/settings ẩn. Quote lấy giá/phí DB |
| Vận hành | Worker đã deploy workers.dev, API live/cleanup PASS; đã có OPERATIONS. Còn dữ liệu thật, xác nhận đã nắm quota; Turnstile secret thật còn thiếu ở cả hai Worker; staging có RateLimit bindings, production chưa có; custom domain/WAF/email/payment provider chưa cấu hình |

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
│   ├── custom-order/           # wizard và quản trị request mẫu
│   ├── landing/                # hero, featured, story, testimonials
│   ├── profile/                # profile, wishlist, account sections
│   ├── inventory/              # source inventory legacy ẩn; active admin stock thuộc features/admin
│   └── admin/                  # order/product/variant/summary/delivery API; fixture quản trị deferred ẩn
├── shared/
│   ├── ui/                     # button, input, dialog, dropdown
│   ├── components/             # ImageWithFallback, route feedback, TurnstileChallenge
│   ├── hooks/                  # useIsMobile, useTurnstile
│   ├── lib/                    # cn, formatMoney, finite color classes
│   └── i18n/                   # config/hooks/switch + JSON en/vi theo feature
└── styles/                     # fonts, Tailwind entry, global theme/brand
```

| Backend keyword | File / cấu hình |
| --- | --- |
| Entry + env | `worker/index.ts`; `worker/env.ts`: DB, ADMIN_PASSWORD, JWT_SECRET, TURNSTILE_SECRET tùy chọn, RATE_LIMIT_SENSITIVE/PUBLIC, TTL Cron 24 giờ/mỗi giờ đã cấu hình local |
| Public routes | `worker/routes/public.ts`: categories/products/product detail, delivery options, checkout quote |
| Orders | `worker/routes/orders.ts`: POST orders/lookup; `worker/services/orders.ts`: create/lookup/transition, 35 statements cho 15 dòng và guard retry ≤40; admin status tái sử dụng transitionOrder |
| Admin | `worker/lib/auth.ts` + `worker/routes/admin-*.ts`: login/me/logout, summary/orders/products/variants/delivery-zones; middleware requireAdmin/requireSameOrigin trước API quản trị |
| Services | `worker/services/catalog.ts`: tối đa 3 truy vấn; `delivery.ts`: phường rồi mặc định tỉnh; `pricing.ts`: một truy vấn variants `IN`, gộp giỏ và báo issues, chỉ đọc |
| Validation/lỗi | Root `shared/constants.ts`, `shared/schemas.ts` và `shared/admin-*-schemas.ts`; `worker/lib/validate.ts`, `errors.ts`; INTERNAL chỉ trả request_id, log request_id/error_name và diagnostic D1/SQLite/constraint/target thuộc allowlist, không raw message/SQL/binds |
| Middleware | Secure headers, X-Request-Id, IP/route rate-limit bindings trước D1/Siteverify; GET catalog thành công cache public 30 giây; API khác/lỗi no-store |
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
| `/` | `HomePage` | Landing sections; featured products lấy từ catalog chung; section Câu chuyện ngay sau featured, CTA /about |
| `/about` | `StoryPage` | Article tĩnh theo ref, không breadcrumb; bài/ảnh/giờ mẫu owner-approved local, địa chỉ chung footer; noindex/chưa công bố |
| `/shop` | `ShopPage` | Catalog D1, search/category code/sort, chọn variant S/M/L và Add shared cart; wishlist/rating ẩn |
| `/shop/:slug` | `ProductDetailPage` | Gallery ảnh DB/zoom, mô tả/size/SKU/giá/tồn; Đặt hoa ngay thêm đúng variant rồi tới giỏ; loading/retry/404, EN/VI và mobile |
| `/cart` | `CartPage` | Bảng sản phẩm/số lượng/xóa + tóm tắt; Tiến hành đặt hàng → /checkout |
| `/checkout` | `CheckoutPage` | Thông tin người đặt/người nhận/lịch giao/thiệp chung/thanh toán → review → gửi/retry → xác nhận API; draft memory-only dùng chung với /cart |
| `/orders/track` | `TrackOrderPage` | Mã đơn + SĐT gửi lookup; snapshot items/tổng, giao hàng và timeline từ API |
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

### Auth admin, tồn kho và các feature deferred

B2/B3 trong code hiện tại (snapshot remote16/10 ở PROJECT_STATUS): Turnstile widget ở review checkout/lookup/admin login; VITE_TURNSTILE_SITE_KEY lúc build + TURNSTILE_SECRET Worker, kiểm đúng action/hostname và reset token mỗi request. Token không đổi fingerprint/UUID đơn. Rate-limit bindings 6/phút/IP/route cho order/login, 60 cho lookup/quote/catalog; staging namespace riêng, không dùng D1 đếm. INSERT tạo đơn giới hạn 3 PENDING/SĐT người đặt chuẩn hóa, atomic với batch, giữ 35/36 statements. IN_TRANSIT → CANCELLED bắt buộc lý do, mặc định không hoàn tồn; admin có checkbox restock. Trước IN_TRANSIT giữ mặc định hoàn tồn. Cron đã chốt TTL 24 giờ và lịch 0 * * * * cho production/staging; batch 3 statements hủy mọi PENDING quá hạn, hoàn tồn và ghi SYSTEM nguyên tử. Staging có TTL/bindings/scheduled handler trong version mới, production chưa có; chưa kiểm thực thi Cron cloud. Đơn đã xác nhận không bị ảnh hưởng. [Cấu hình, giới hạn và quy trình gọi/Zalo xác nhận](docs/BOT_PROTECTION.md).

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
| EN | Fraunces 500 / 500 Italic (optical sizing auto) | Inter |
| VI | Lora Regular 400 / 400 Italic (optical sizing auto) | Be Vietnam Pro |

Google Fonts qua stylesheet link trong `index.html`, preconnect Google APIs/Gstatic và `display=swap`; chỉ yêu cầu weight đang dùng. EN dùng Fraunces 500 cho heading/logo và 500 Italic cho cụm nhấn mạnh, `font-optical-sizing: auto` với opsz 9–144; body/UI và nhãn hero dùng Inter. VI theo source ref D:/Download/lunara: heading/logo Lora Regular 400, optical sizing auto; body/form Be Vietnam Pro. `brand.css` đổi biến font qua `html[lang='vi']`, kể cả dialog portal. Lora tải weight 400–700 normal/italic; display VI chuẩn hóa 400. html đặt font-body làm mặc định để portal kế thừa; font-sans/font-serif cùng trỏ token theo locale. Brand tokens tách `theme.css`; dark-mode product flow chưa hoàn chỉnh.

Nguồn font: [Lora](https://github.com/google/fonts/tree/main/ofl/lora), [Be Vietnam Pro](https://github.com/google/fonts/tree/main/ofl/bevietnampro). Cả hai được phát hành theo SIL Open Font License. Kiểm tra typography bằng `node scripts/check-ui.mjs http://127.0.0.1:4173 --i18n-only --fonts` sau khi mở preview; chế độ `--fonts` cho phép tải Google Fonts để xác nhận font thật và dấu tiếng Việt, thay vì chỉ kiểm tra fallback offline.

Trang chủ local tái bố cục theo [Stitch](https://stitch.withgoogle.com/projects/14566722138013174841) (16/10/2026), chỉ tham chiếu cấu trúc: hero bo góc hai cột 5/7, hàng category DB + All Flowers, dải dịch vụ phù hợp COD và lưới featured dùng chung ProductGrid/ProductCard (1/2/3/4 cột theo viewport). Giữ palette/token Lunara và typography EN/VI ở trên. Hero dùng ảnh bó hoa tạo bằng imagegen theo mẫu/chấp thuận của chủ shop, import WebP 640/960/1440px từ src/assets/hero qua Vite (hashed URLs, srcset/sizes, eager/high priority, width/height cố định). Desktop từ1024px ảnh bên phải với gradient ngang hòa nền cream; mobile/tablet ảnh dưới chữ, khung4:3 và gradient trên. Hero là ảnh trang trí aria-hidden/alt rỗng, không thay ảnh sản phẩm DB. Ảnh tròn category hiện lấy categories.image_url từ DB;4 thumbnail AI do owner yêu cầu nằm ở public/images/categories/<code>-v1.webp (WebP256px,10–14KB). URL cùng origin cố định; field vắng/null giữ khung trống. Ảnh trang trí khác tiếp tục để trống (div aria-hidden), không lấy ảnh từ Stitch/fixture. OurStory hiện render ngay sau FeaturedCollection theo ref từ17/10; ảnh Unsplash và bài mẫu được owner cho dựng local, CTA /about, không dùng khung trống cũ. Card giữ ảnh, tên, mô tả EN/VI, badge, giá và variants từ DB; chọn size/thêm giỏ qua CartProvider, không thêm wishlist giả. Số featured theo DB (3 ở lần kiểm local này), không tạo card để lấp lưới. Header có nút Tìm kiếm mọi viewport: bấm mở ô nhập inline từ xl, dưới header ở màn hình nhỏ; Enter/nút submit tới `/shop?q=...`, Escape/Đóng trả focus. Nút giỏ icon/nhãn/badge inline chỉ khi có hàng, link `/cart`; category mở `/shop?category=<code>`. Hook Shop nhận URL khi vào trang hoặc đổi query cùng route; bộ lọc tương tác tiếp tục ở state local. Không đổi API/DDL, không deploy.

Giữ cream/rose floral, rounded cards, pill CTAs, shadow nhẹ, ảnh hoa và Lucide icons. Chữ trắng trên rose gốc không đủ contrast cho normal text; dùng rose-strong. Status labels nhỏ dùng màu tối hơn màu icon/chart. Giữ focus visible, labels, keyboard access và reduced motion khi thêm animation.

`shared/lib/color-classes.ts` ánh xạ palette hữu hạn thành **class Tailwind đầy đủ** để các màu động của fixture được scan. Khi thêm màu mới, bổ sung class literal; không tạo `bg-[${color}]` lúc runtime. `shared/lib/format.ts` định dạng tiền tại ranh giới hiển thị.

## Component có sẵn

### Localization

`shared/i18n/config.ts` tạo i18next instance; `AppProviders` gắn I18nextProvider. Resources JSON được bundle tại `shared/i18n/locales/en|vi/`, tách namespace common/admin/auth/cart/custom-order/inventory/landing/orders/profile/shop. Không gọi dịch vụ dịch hoặc backend để đổi UI. English text hiện tại được giữ làm key/value; keySeparator/nsSeparator tắt để copy có dấu chấm/dấu hai chấm hoạt động. Message có count dùng các suffix plural của i18next và interpolation, không nối hậu tố English `s` trong JSX.

EN/VI nằm ở mép phải header storefront/admin và góc phải trên màn hình admin login. Ưu tiên preference `lunara_language` đã lưu; lần đầu chọn EN/VI từ navigator.languages, fallback English; khi storage bị chặn vẫn đổi được trong phiên. `document.documentElement.lang` cập nhật theo locale. Tiếng Việt thiếu key fallback English. Navbar chuyển sang menu mobile ở dưới breakpoint lg khi có thêm mục Câu chuyện để chứa nhãn Việt và language switch. Signup/customer auth source giữ ẩn.

Footer storefront được tách thành `app/layouts/components/StorefrontFooter.tsx`: giữ khối thương hiệu và tiêu đề Lunara, hiển thị các địa chỉ/map URL hiện có, cùng các liên kết nội bộ theo luồng đang hỗ trợ. Chưa có liên kết chính sách/mạng xã hội chính thức của Lunara nên không hiển thị link ngoài hoặc pháp nhân/MST chưa được xác nhận. Tên cửa hàng, địa chỉ và URL bản đồ cấu hình trong `shared/i18n/locales/en/common.json` và `vi/common.json`: các khóa `Main Store`/`HCMC Store`/`Hanoi Branch`, cùng hậu tố `address` và `map URL`. `shared/config/storefront-footer.ts` giữ ID/thứ tự/khóa locale của cửa hàng; các mảng link ngoài để trống đến khi chủ shop cung cấp nguồn chính thức. English là fallback; địa danh giữ tên riêng, phần mô tả địa chỉ hiển thị theo locale. Các link mở tab mới. Desktop từ 1024px dùng 4 cột; mobile/tablet đặt chăm sóc khách hàng và mạng xã hội cạnh nhau, khối thương hiệu và địa chỉ chiếm toàn hàng. `tailwind.css` đăng ký rõ thư mục layout components để Vite theo dõi cả file mới. `ZaloContact.tsx` portal vào body, dùng icon tự vẽ (đã rollback asset logo widget theo yêu cầu), mặc định chỉ hiện icon ở góc dưới phải, nâng lên trên CTA giỏ hàng dưới 1024px. Viền xanh của summary chuyển trực tiếp chiều rộng 60→208px về bên trái khi hover/focus hoặc bấm mở, rồi thu ngược khi đóng/rời nút: 400ms, giảm còn 200ms trong reduced motion. Chữ không có fade/slide riêng; popup căn phải và nằm trong viewport. Chưa có tài khoản Zalo: bấm nút chỉ mở thông báo sẽ cập nhật sớm, chưa mở chat hoặc hiển thị số tin nhắn. Kiểm trình duyệt EN/VI cho vị trí, hover/focus, hit-test, popup và nội dung JSON ở 320/390/768/1024/1440px.

Catalog có `name_en/name_vi`; `name` giữ compatibility. `name_vn` là alias tiếng Việt tương thích dữ liệu legacy; API hiện trả `name_vi/name_en`. `getLocalizedName` ưu tiên vi → vn → en → legacy cho tiếng Việt; English ưu tiên en → legacy → vi → vn. Cart/order item giữ tên snapshot song ngữ; source inventory legacy có tên Anh và Việt riêng. Search catalog/stock/order mẫu chấp nhận tên Việt và bỏ dấu. Đổi ngôn ngữ không đổi ID, state cart, giá, VND hoặc Asia/Ho_Chi_Minh; tên khách, contact, notes và dữ liệu nhập giữ nguyên.

Thống kê dữ liệu hiện có ở [docs/FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md); stack ở [docs/TECH_STACK.md](docs/TECH_STACK.md); thiết kế D1, canonical và quyết định schema ở [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md). Phase 0–3 có health/catalog/phí giao/quote, COD/lookup và transition hoàn tồn một lần/DELIVERED→PAID. Phase 4 có auth/admin summary/đơn/sản phẩm/tồn/phí giao, dùng nguyên 10 bảng canonical; stock_delta cập nhật tồn nguyên tử và quote mới dùng phí mới. Phase 5 đã nối UI checkout/lookup/admin và nghiệm thu local. GLOB SQL chỉ kiểm dạng ngày; service order kiểm ngày lịch/slot giờ VN. Không đổi Worker/DDL/pinned packages hoặc truy cập D1 remote khi nối frontend.

`shared/ui` giữ **Button, Input, Dialog, Dropdown** và các subcomponent của Dialog. `Dropdown` dùng dependency Radix Select đã có, chung màu cream/blush/rose cho sort, size, checkout và admin; giữ form values, required, disabled và keyboard/focus. Các module không được app import đã loại bỏ, gồm calendar/menubar/input-otp/resizable và các wrapper khác. Không cần khôi phục cả bộ UI để thêm một primitive.

Customize Button/Input bằng Lunara classes; default shadcn primary vẫn là màu dark generic. Dialog inventory hỗ trợ focus trapping, Escape, title/description. `cn` dùng clsx/tailwind-merge; `useIsMobile` ở shared/hooks. `ImageWithFallback` giữ img/alt/dimensions và hiển thị placeholder khi ảnh lỗi.

Các domain component nằm trong feature tương ứng: Shop cards/filter/grid; CartItemList/CartSummary/CheckoutForm/Confirmation; các bước custom order; landing sections; profile tabs; bảng order/customer/inventory; dashboard widgets; settings sections. Chưa có generic domain StatusBadge.

## Tiêu chuẩn khi phát triển

Turnstile fail-closed16/10: Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 hiện local/chưa deploy. Missing secret khác token sai:503 TURNSTILE_NOT_CONFIGURED so với403 FORBIDDEN. HTML/static _headers và API secureHeaders phải kiểm độc lập trên deployment; không giả định _headers bảo vệ response từ Worker.

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

`typecheck` kiểm frontend và `tsconfig.worker.json`; `check:architecture` kiểm chiều import/public API, presentation state và inline styles. Bằng chứng tại mốc Phase 5 **15/10/2026**: **136/136 tests**, architecture **207 source files**, typecheck/build pass; smoke local **40/40** = 16 nhóm catalog + 10 ca order + đối chiếu tồn/query budget + 12 nhóm admin + kiểm snapshot persisted. UI kiểm **17 routes, 0 JS exceptions**; Phase 5 đạt **6/6 tiêu chí**, **10/10 kịch bản bắt buộc +2/2 mở rộng**, persisted D1 logical snapshot không đổi. Test ghi dùng workerd D1 `persist:false`, `remoteBindings:false` và secret demo riêng; không dùng ambient secrets. Guard local 127.0.0.1 giữ nguyên; nhánh deployment --base-url HTTPS mặc định chỉ đọc, ghi cần --allow-remote-writes/--confirm-origin/--variant-id/--exclusive-test-window và credential stdin ẩn. Smoke API Production đã 7/7, public browser EN/VI/VND/cart reload PASS; kết quả 10/10 MVP tách phạm vi API/public UI trong Phase 6. Credential do owner nhập prompt ẩn, không đọc/reuse password local. [Output tại mốc Phase 5](docs/pipeline/PHASE_5_FRONTEND.md); kết quả hiện tại **170/170 tests**, architecture 215 files, smoke 40/40 cùng bằng chứng Phase 6 tại [PHASE_6_DEPLOY](docs/pipeline/PHASE_6_DEPLOY.md); **125 tests/178 files của Phase 4 và 92 tests/27 smoke của Phase 3 là lịch sử**. cf:typegen sinh binding types với --include-runtime=false; các npm script migrate/seed local dùng --local; lệnh remote chỉ theo phạm vi được duyệt ở Phase 6; db:verify kiểm 13 nhóm D1 local/cô lập. db:reset:local xóa local, deploy cần yêu cầu riêng; chưa có ESLint, build không thay typecheck.

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
| Filter theo dịp | Product detail đã có local tại /shop/:slug; occasion tags/tone/loại hoa cần contract riêng khi có dữ liệu |
| Cart/wishlist persistence | Cart variant/localStorage đã có; wishlist server/hợp nhất Shop/Profile ngoài MVP |
| Delivery/message/gift options | Form/options/quote/order đã nối ngày/slot/thiệp; còn chốt policy và cấu hình thật trước mở bán |
| Customer auth/requests | Admin cookie auth và orders đã có backend/UI; customer auth/custom requests deferred cần API riêng |
| Checkout COD production | Form/gửi/retry/xác nhận/tra đơn đã nghiệm thu local; cấu hình production và remote acceptance thuộc Phase 6 |
| Inventory nâng cao | Order trừ tồn/admin hủy hoàn một lần/UI stock_delta đã có; sổ cái tồn và capacity theo ngày là backlog |
| Reviews và payment online | Làm sau MVP khi có chính sách/provider phù hợp |
| SEO/performance | Admin lazy-load và metadata Home/Shop/robots/sitemap/OG đã có; đã có trang detail và metadata client; còn prerender nội dung và ảnh/font tối ưu theo đo đạc |

Backend/media đã chọn; auth admin secret + JWT cookie/API Phase 4 và checkout/lookup/login/admin frontend Phase 5 đã nghiệm thu local. EN mặc định/fallback, VND/giờ VN và cart persistence giữ nguyên. Máy trạng thái/hoàn tồn Phase 3 được admin API dùng lại; policy vận hành, delivery cutoff/phí/khu vực/secret production thật vẫn cần chủ shop chốt. Auth khách, multi-store, subscription, loyalty hay chatbot ngoài MVP. Chỉ hỏi quyết định thực sự ảnh hưởng task đang được yêu cầu.

### Thông tin chủ dự án cần bổ sung theo phase

Checklist hiện trạng/đầu vào ở [PROJECT_STATUS.md](docs/PROJECT_STATUS.md): catalog/ảnh/giá VND/tồn, khu vực/phí/cutoff giao hàng, policy đơn, Zalo/liên hệ, Cloudinary/domain và cấu hình production theo phase.

Phase 6 hiện 5/7 tiêu chí: D1 remote migrate/seed/backup, deploy/secrets, API live 7/7 và public browser đã pass. Đã dọn 3 SMOKE orders; tồn variant 1 = 20, 24 variant khớp baseline, FK sạch. Còn dữ liệu mở bán thật và xác nhận người vận hành đã nắm cách xem quota. Xem [bằng chứng Phase 6](docs/pipeline/PHASE_6_DEPLOY.md) và [runbook](docs/OPERATIONS.md). Phase 0–5 DONE local; không suy ra đã mở bán hoặc đạt cổng remote. Không làm lại auth/admin API/UI, COD/tồn/idempotency, catalog adapters, cart storage hoặc VND đã nghiệm thu local. Schema/seed local không thay dữ liệu thật trước mở bán. Các tài khoản hoặc credentials thật không đưa vào source, docs hay VITE_*.

## File chia sẻ và cách duy trì

Public widget keys riêng trong `.env.production`/`.env.staging`; staging dùng CLOUDFLARE_ENV=staging + Vite --mode staging, origin staging/noindex riêng. Deploy bằng hai npm scripts hiện có, không truyền key; TURNSTILE_SECRET nhập một lần riêng từng Worker sau UI mới.

`.gitignore` là default-deny allowlist: source, manifest/lockfile, docs, verification scripts/tests và skill được xét duyệt có exact paths và parent exceptions. Không dùng `git add -f`. Nó không quét secrets hoặc thay branch protection.

Giữ local: `node_modules`, `dist`, `.codegraph`, `.codex`, `.security-review`, `.env`, keys/logs/cache. Trước commit/push kiểm tra status, file inclusion và `git diff --check`. Commit/push/deploy chỉ khi yêu cầu hiện tại hoặc standing authorization bao gồm hành động đó.

Khi thay route/component/model hoặc ownership, cập nhật mục liên quan ở đây, AGENTS và skill. Báo cáo kiểm chứng thực tế trong bàn giao; không coi số liệu của lượt kiểm tra cũ là bảo đảm cho source mới.

Staging: `env.staging` dùng Worker `lunara-staging`, D1 riêng và secrets riêng; `scripts/staging.mjs` chọn môi trường lúc build và kiểm UUID trước ghi/deploy. Staging đã migrate và deploy 16/10; checkout/provider/Cron thực chạy chưa nghiệm thu remote. Xem [STAGING](docs/STAGING.md).

## Lịch sử thay đổi sau Phase 5

Các mốc dưới đây là evidence tại ngày ghi; snapshot hiện tại ở PROJECT_STATUS.

Tên hiển thị website từ 15/10/2026 là **Lunarra** (tab, header/footer, admin, EN/VI); giữ Worker/D1 và repo GitHub hiện có. Typecheck/build/architecture và 143 tests PASS; kiểm branding EN/VI 320/390/1440px PASS. UI tổng quát dừng ở bước quote chưa chọn khu vực giao; chi tiết deploy tại [Phase 6](docs/pipeline/PHASE_6_DEPLOY.md).

Cập nhật staging 15/10/2026: đã xác minh remote lunara-staging-db / ed391b18-0bcf-41b3-8315-389807ace7f2 và áp 0001_mvp.sql thành công (25 commands). Đã kiểm đủ 10 bảng nghiệp vụ, lịch sử 0001, không còn migration chờ, foreign_key_check rỗng, orders=0. db:verify local cô lập PASS 13/13 nhóm, 46 assertions. Chưa seed, đặt secrets hoặc deploy staging; production không được truy cập/ghi trong lượt sửa này.

Cloudinary 15/10/2026: đã tích hợp local signed direct upload (SHA-256, cookie admin/same-origin, JPEG/PNG/WebP, client 5 MB, prefix local/staging/prod). Typecheck/build/architecture 208 source files PASS; tests 148/148, smoke local 40/40 PASS. Browser mock EN/VI 390px PASS: file sai, thành công/preview, Save URL, thiếu config giữ URL; 0 JS exceptions. Chưa tạo preset/đặt keys/upload thật/deploy tính năng, không ghi D1 remote; Phase 6 vẫn 5/7. Không thêm migration/dependency hoặc tự xóa asset. [Cấu hình Cloudinary](docs/CLOUDINARY.md).

Staging categories fix — 15/10/2026: API public ban đầu categories=[] và products=[]; nút Save product khóa vì thiếu danh mục, không phải vì tồn 0. Owner chọn thêm đúng 4 danh mục mẫu từ canonical seed, giữ sản phẩm trống. Đã INSERT OR IGNORE chỉ categories vào lunara-staging-db (UUID ed391b18-0bcf-41b3-8315-389807ace7f2). D1/API xác nhận categories=4, products=variants=orders=delivery_zones=0, FK sạch; production không truy cập/ghi. UI local thêm giải thích thiếu danh mục + Reload categories EN/VI; chưa deploy thay đổi thông báo này. Typecheck/architecture 208 files/tests 148/build PASS; db:verify 13/13, 46 assertions. Browser mock EN/VI 390px xác nhận khóa khi trống, reload mở khóa, submit tồn 0; backend in-memory lưu đủ 3 variant tồn 0. Chưa tạo đơn/sản phẩm test remote hoặc nạp toàn bộ seed; staging thiếu delivery zones nên checkout chưa được nghiệm thu.

Form sản phẩm 15/10/2026: chọn/upload ảnh là mặc định; Image URL nằm trong tùy chọn phụ thu gọn. Không còn ô nhập slug; khi tạo, client sinh slug từ tên EN (fallback VI), bỏ dấu/ký tự đặc biệt + UUID v4, tối đa 200 ký tự; giữ slug đã sinh trong draft khi thử lưu lại, không đổi slug sản phẩm cũ. Chưa chọn ảnh hiển thị lỗi EN/VI; upload thành công xóa lỗi cũ. Backend contract/DDL không đổi, slug vẫn được API yêu cầu và unique DB kiểm tra. Typecheck/architecture/build, 150 tests và browser mock form EN/VI 390px PASS; không upload thật/ghi remote/deploy trong lượt này. Verifier Phase 5 tổng quát dừng ở ca 3 do chờ tổng quote trước khi chọn khu vực (2/10, 0/2 mở rộng, persisted D1 không đổi); không coi là suite UI PASS.

M1–M9 (15/10/2026) đã sửa local, chưa deploy: mọi đơn hôm nay chuẩn bị ≥120 phút; low-stock chỉ hàng đang bán; CSP/static headers; browser locale và metadata/robots/sitemap/OG; log D1 theo allowlist, observability 10%; summary 30 ngày, tra đơn mặc định90/tối đa366 ngày với index sẵn có; URL ảnh HTTPS Cloudinary/Unsplash. Public Turnstile key owner đã cấu hình .env.production; secret/hostname/deploy còn chờ owner. Không thêm dependency/DDL, Phase 6 giữ 5/7. [Chi tiết và bằng chứng](docs/HARDENING.md). Metadata tĩnh Home/Shop không phải prerender catalog; mốc này chưa có trang sản phẩm; cập nhật16/10 đã có /shop/:slug local, chưa prerender. Staging luôn noindex; khi đổi domain cập nhật VITE_SITE_URL và hostname widget.

Ảnh category16/10: migration0002_category_images.sql additive sau base0001 bất biến; đã áp local/staging và gán4 URL bằng docs/sql/CATEGORY_IMAGES.sql. GET categories thêm image_url nullable, frontend optional để tương thích Worker cũ; không thêm API admin/DDL sản phẩm/seed. [Quy trình, scope và rollback](docs/CATEGORY_IMAGES.md). Production chưa migrate và không nằm trong deploy được phép của lượt này.

Staging16/10 đã deploy version `75fcbb54-5528-4cc1-b101-22fdc7a91a40` theo owner:4ảnh category sống/API4URL/UIEN-VI10casePASS;giữ fail-closed khi thiếuTURNSTILE_SECRET,login/lookup503đã kiểm.Không coi provider/Cron/quota được nghiệm thu;production không đổi.[Trạng thái](docs/PROJECT_STATUS.md).

Trang sản phẩm16/10 local: `useProductDetail` gọi endpoint slug với AbortController; `ProductDetailView`/`ProductGallery` chỉ trình bày. `rememberProduct` đồng bộ detail DTO vào CatalogProvider, hỗ trợ link ngoài100 mẫu đầu. `addItem` trả boolean để chỉ chuyển giỏ khi thành công. Card ảnh/tên/desc là Link riêng; điều khiển size/add không nằm trong Link. UI lấy dữ liệu thật có sẵn, không thêm thông số/dịch vụ chưa có trong DB; không đổi schema/API/dependency.174 tests/220src và6 nhóm browser PASS, chưa push/deploy.

Gallery 16/10 local: `AdminProductImages` và `useAdminApiProducts` hỗ trợ chọn nhiều file, tối đa 8 ảnh, cover, lên/xuống, gỡ liên kết và URL thủ công. Signed upload trả URL/public ID. Bảng `product_images` và cột public ID đã có nên không cần migration. POST/PATCH products.images thay cả gallery trong một batch atomic; image đơn vẫn tương thích. Admin đọc thêm id/sort_order/public ID; public list chỉ lấy cover và detail lấy đủ ảnh. Upload lỗi giữ phần thành công, không tự retry/xóa asset; bấm Save mới ghi D1. Back link ở trên sản phẩm, CTA chỉ có chữ căn giữa. Kiểm tra local: 179 tests, 221 source files, smoke 40 và 5 nhóm browser đạt; Cloudinary là mock, chưa deploy.


Địa chỉ checkout16/10 local: shared Combobox giữ query riêng với giá trị đã chọn; snapshot Open Admin Data CC-BY4.0 chỉ Hà Nội126/HCM168, đủ phường/xã/đặc khu theo nguồn, không quận/huyện. Đổi city xóa ward; useQuoteCart kiểm membership, debounce350ms và hủy request cũ. Phí vẫn D1/server-owned, không mở vùng giao mới hoặc thêm DDL.182tests/223source/8browser groups đạt; [nguồn và chi tiết](docs/DELIVERY_ADDRESS.md). Chưa push/deploy; full UI legacy chưa đạt.


Checkout3khối16/10 local: người đặt/nhận cạnh nhau từ768px, mobile xếp dọc; recipient read-only/live-sync khi bật cùng người. Thiệp/yêu cầu riêng, payment+consent dưới Total, giữ bước review. COD mặc định, ghi chú chỉ thanh toán khi nhận hàng; bank mở FeatureUnavailable inline trong Dialog và khóa gửi. canReviewCheckout dùng schema/date/slots/quote/consent/COD; submit còn cần token Turnstile. Không quận/huyện theo nguồn2cấp.186tests/225source/10nhóm browser mới +8địa chỉ PASS, no POST order; chưa deploy. [Chi tiết](docs/CHECKOUT_UI.md).


Wrangler config16/10 local: explicit sampling10% cho observability/logs/traces, không bật traces, invocation_logs=false; staging guard giữ đúng target và sampling.186tests/typecheck/architecture225/build+dry-run2môi trường đạt; không upload/remote changes. Dry-run không chứng minh cloud diff hết. [Chi tiết](docs/STAGING.md).
