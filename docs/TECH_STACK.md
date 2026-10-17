# Tech stack Lunarra

> **Hiện hành 17/10/2026:** main **77bdfdc**; owner deploy staging **c29141be-740e-4908-b369-179d7631356e** lúc **16:42:38 giờ Việt Nam**, 100% traffic. @minphuc8042 thực hiện README (4821a53) và tiến trình tra đơn (7dac1bb); @minphuc2408 merge PR#1(d36519b) và PR#2(77bdfdc). Public JS khớp artifact local; 5 route storefront200/CSP/noindex. Staging có tên secret TURNSTILE_SECRET; chưa nghiệm thu challenge/login/đặt đơn thật. Catalog công khai4categories/1product, coverage1tỉnh Hà Nội/1phường. Các ghi chú chưa push/deploy, thiếu secret hoặc coverage0 bên dưới là lịch sử khi khác mốc này. Không đọc DB riêng tư/đổi cloud; production không rà lại; Phase6 vẫn5/7.




> Bàn giao source17/10/2026: owner đã cho phép chia commit theo chức năng và push GitHub trong lượt này; không bao gồm deploy hoặc DB remote. Kiểm tra trước push: typecheck, architecture234source,191/191tests và build PASS. Đã sửa test i18n nhận namespace với cả nháy đơn/kép. Đơn SMOKE thử tra cứu chỉ ở DB local (1đơn/1item/3history), không đưa dữ liệu hoặc SQL thử vào Git; db:verify13/13 PASS. Local5173 hiện thiếu cấu hình Turnstile và trả503 TURNSTILE_NOT_CONFIGURED; owner đã yêu cầu dừng, không thêm bypass hoặc thay cấu hình. Browser UI72ca trước đó dùng API/challenge giả lập, không đồng nghĩa lookup thật đã hoạt động. Remote/Phase6 vẫn giữ nguyên.


> Tra cứu đơn17/10/2026 (local5173, chưa push/deploy): /orders/track theo project ref, bỏ breadcrumb/eyebrow/đoạn hướng dẫn theo yêu cầu. Năm mốc trạng thái thực với icon, đơn hủy hiển thị riêng và chỉ đánh dấu các bước có trong lịch sử API. Hotline0987656789. Giữ bắt buộc mã đơn + điện thoại + Turnstile, không dữ liệu đơn mẫu trong ứng dụng. Không đổi API/Worker/DB/dependency hoặc màn hình admin. Typecheck, architecture234source,191tests, build và72ca responsive EN/VI PASS; kiểm tra browser dùng phản hồi API/challenge giả lập, không thay nghiệm thu provider/remote. Phase6 vẫn5/7.


> Câu chuyện17/10/2026 (local5173, chưa công bố/push/deploy): section theo ref ngay sau sản phẩm nổi bật, menu Câu chuyện và /about dạng article không breadcrumb. Owner cho dùng bài/ảnh/giờ mở cửa mẫu, địa chỉ dùng chung footer và link ngoài đại diện Lunarra. /about có metadata riêng/noindex, không sitemap; không CMS/API/DB mới. Typecheck/architecture232source/190tests/build và28ca browser EN/VI/7widths PASS,7vị trí ảnh ref tải thật,0exceptions.


> Giỏ hàng/Đặt hoa theo ref17/10/2026 (local5173, chưa push/deploy): /cart chỉ sản phẩm+tóm tắt; “Tiến hành đặt hàng” mở /checkout. Form5khối người đặt/người nhận/lịch giao/thiệp chung/thanh toán, sidebar đơn hoa, giữ review rồi xác nhận. Chưa chọn địa chỉ thì ẩn phí; COD mặc định/chuyển khoản thông báo. CheckoutFlowProvider giữ draft trong memory khi sửa giỏ, reload/rời nhóm route xóa draft. API/DB không đổi. Chi tiết và kiểm chứng tại CHECKOUT_UI.md.


> Kích thước theo ref17/10/2026 (local, chưa commit/push/deploy): đã bỏ mục Cart trong menu chính/mobile, giữ nút giỏ bên phải. Header72px dưới640px/80px từ640px; container storefront1240px, padding20/32px. Hero ảnh400/480/520px, grid5/7 gap40/56px; sản phẩm2cột dưới1024px/4cột từ1024px, ảnh4:5. Dev đang dùng cổng5173. Xem PROJECT_STATUS để biết kiểm chứng và remote.


> Header 17/10/2026 (local, chưa commit/push/deploy): nút Tìm kiếm mở ô nhập theo project ref, desktop inline từ1280px/mobile mở dưới header; Enter/nút kính lúp tìm qua /shop?q=, Escape/Đóng trả focus. Nút Giỏ hàng icon nét1.5 + nhãn + badge inline khi có hàng, dùng CartProvider và link /cart. EN/VI, không đổi checkout/API/DB. Kiểm chứng:190tests, architecture225, typecheck/build; Edge24ca responsive và tương tác PASS,0exceptions/0POSTorder.


> Typography 17/10/2026 (local, chưa commit/push/deploy): đã đối chiếu source tham chiếu `D:/Download/lunara`; project hiện tại tải đủ Lora và Be Vietnam Pro cùng weight/style mẫu dùng. VI dùng Lora Regular 400 cho heading/logo (kể cả italic), Be Vietnam Pro cho body/form; thêm fallback Georgia/system-ui, font kế thừa từ html và đồng bộ utility font-sans/font-serif với token locale, bao gồm portal. EN vẫn Fraunces 500/Inter. Xem PROJECT_STATUS.md để biết kiểm chứng và phạm vi remote.

> Hiện hành 16/10/2026 — Đã nhập danh mục D1 Hà Nội 1 tỉnh/126 phường vào local + staging bằng migration0003 (12 bảng); không nhập TP.HCM. Admin chọn/tìm tỉnh-phường, nhập phí; checkout chỉ hiện zone active thuộc danh mục, server không fallback tỉnh. Checkout gộp, thiệp NONE, terms nội bộ và bank rollback COD được giữ. Staging đã deploy version 27c3d24e-f3df-42e1-8d18-8b8299427062; zones0 nên checkout chưa có nơi giao cho tới khi admin cấu hình phí. Local190tests/225source/typecheck/build, schema13/13, smoke40/40, browser admin7nhóm PASS. Owner đã yêu cầu commit/push sau deploy; production không đổi, Phase6 giữ5/7. [Địa chỉ](DELIVERY_ADDRESS.md), [Checkout](CHECKOUT_UI.md). Các mốc dưới đây là lịch sử khi khác hiện trạng này.

Cập nhật **16/10/2026**. Repo `Lurana`; branding UI **Lunarra**. **Phase 0–5 DONE local; Phase 6 IN PROGRESS (5/7)**. [Hiện trạng và snapshot live](PROJECT_STATUS.md).

## Công nghệ và phiên bản repository

Giữ phiên bản trong package.json/package-lock.json, cài bằng `npm ci`; không nâng dependency trong lượt tài liệu này.

| Tầng | Công nghệ / hành vi |
| --- | --- |
| Frontend | React/React DOM 18.3.1, React Router 7.18.4, TypeScript 5.7.3, Vite 6.4.4, Tailwind 4.1.12, React plugin 4.7.0 |
| Backend | Hono 4.13.13, Cloudflare Workers, @cloudflare/vite-plugin 1.63.2, Wrangler 4.150.0 |
| Validation | Zod 4.6.7; root `shared/` chứa API schemas/constants, frontend bật jitless trước load schemas để chạy dưới CSP |
| Database | D1/SQLite, binding DB; 12 bảng local/staging: `0001_mvp.sql` base10bảng bất biến + `0002_category_images.sql` + `0003_hanoi_administrative_areas.sql` (1tỉnh/126phường); production vẫn0001; custom_requests deferred |
| i18n | i18next/react-i18next, `src/shared/i18n/`; preference → browser EN/VI → English fallback; VND/Asia/Ho_Chi_Minh không đổi theo locale |
| UI | cream/rose, font EN Fraunces 500/500 Italic (optical sizing auto) + Inter, VI Lora Regular 400/Be Vietnam Pro, html và sans/serif kế thừa token locale; Button/Input/Dialog/Dropdown (Radix Select)/Combobox tìm không dấu và Lucide |
| Media | Cloudinary signed direct upload, cookie admin + same-origin JSON, SHA-256 params server-owned; browser upload rồi Save image.url |
| Auth | Một admin từ secret, SHA-256/timingSafeEqual, hono/jwt HS256 cookie HttpOnly/Strict/12h; Secure trên HTTPS; không credentials/JWT trong browser storage |
| Chống bot | Turnstile fail-closed checkout/lookup/admin-login; thiếu secret503, controlled loopback opt-in only; kiểm action/hostname; RateLimit bindings riêng prod/staging; cap 3 PENDING/SĐT trong INSERT atomic |
| Scheduled | TTL 24h, Cron mỗi giờ; batch D1 3 statements ghi SYSTEM/restock/CANCELLED, không hủy đơn đã xác nhận/hoàn tồn lặp |
| SEO/bảo mật | Vite metadata Home/Shop, MetadataLayout cho client routes, canonical/OG/robots/sitemap; static _headers CSP/noindex; chưa prerender catalog/trang sản phẩm |
| Tooling | CodeGraph1.5.0 local; Node24.11.1/npm11.6.3 là môi trường đã kiểm; scripts architecture/typecheck/tests/smoke/UI |

## Kiến trúc và ownership

Danh mục hành chính ở hai bảng D1, chỉ admin GET nhận đủ Hà Nội126; public options JOIN active zones nên checkout không dùng JSON runtime. Phí quote/order kiểm cùng coverage, không fallback tỉnh; legacy zones được giữ nhưng không mở giao. Không dependency/binding mới.

`pages → features → shared`; cross-feature qua index.ts. Pages ghép hooks/views, services gọi API client cùng origin; component không fetch trực tiếp. Router duy nhất `src/app/router.tsx`, MetadataLayout bọc routes, AppProviders ghép i18n/auth/catalog/cart. API Worker là ranh giới quyền; AdminRoute chỉ bảo vệ điều hướng UI.

CatalogProvider tải snapshot API không fixture fallback. CartProvider sở hữu lines theo variant ID; localStorage `lunara.cart.v1` chỉ variantId/quantity. Quote đọc giá/phí/tồn và không reserve stock. Checkout contact/intent/token chỉ ở memory; UUID giữ khi retry cùng payload, token lấy mới mỗi attempt. Confirmation chỉ từ API response. Wishlist/customer auth/profile/custom request/admin customers/settings/notifications source giữ nhưng ẩn, API-ready gate false.

Admin dùng stock_delta atomic; PATCH chỉ dirty fields. NETWORK/TIMEOUT/BAD_RESPONSE/INTERNAL có thể đã commit: xóa delta, khóa row, GET recheck thành công rồi mới nhập điều chỉnh mới. Không tự retry stock write hoặc product create. IN_TRANSIT hủy phải có lý do, restock mặc định false; early states mặc định true, CANCELLED terminal.

Catalog/admin products/summary ≤3 D1 statements; 15 dòng order success35/diagnostic36, toàn bộ retries≤40. Summary30 ngày lịch VN; orders mặc định90, tối đa366 ngày khi có cặp ngày đặt, q2–100 nếu khác rỗng, offset≤10000. Dùng raw ranges trên idx_orders_placed_at cho hai dạng UTC.

## Build, môi trường và secrets

| Môi trường | Frontend | Worker / database |
| --- | --- | --- |
| Local | Vite dev/preview `127.0.0.1` | `remoteBindings:false`, D1 local |
| Production | `.env.production`, Site key production/origin production/indexable | `lunara` / `lunara-db` |
| Staging | `.env.staging`, Site key staging/origin staging/noindex; Vite --mode staging | `lunara-staging` / `lunara-staging-db` |

Deploy commands: `npm run deploy` và `npm run deploy:staging`, đều build mới. Staging script chọn CLOUDFLARE_ENV và kiểm UUID trước/sau build. Output dùng chung `dist/client/` và `dist/lunara/`, chạy tuần tự. Env terminal/`.env*.local` có thể override public config. [Staging](STAGING.md).

TURNSTILE_SECRET và Cloudinary API secrets chỉ ở Worker, nhập riêng từng môi trường, không nhập lại mỗi deploy. Hai widget dùng hai cặp Site/Secret key đúng hostname. .dev.vars local ignored, .dev.vars.example chỉ demo. Không đọc password local để kiểm chứng production.

Snapshot trước lượt danh mục: production còn version15/10; staging đã deploy bản13:31, có CSP/SEO/rate-limit/TTL/scheduled handler và Cloudinary config. Cả hai thiếu TURNSTILE_SECRET. Có binding/secret name không thay nghiệm thu runtime thật; [chi tiết](PROJECT_STATUS.md#snapshot-remote-chỉ-đọc--16102026).

## Kiểm chứng và giới hạn

Bản fail-closed mới16/10: Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 hiện local/chưa deploy. Tests170 PASS; header live kiểm độc lập22phản hồi, native verifier3cấu hình PASS. [Chi tiết](HARDENING.md#turnstile-fail-closed-và-header-live-16102026).

Mốc local gallery trước lượt danh mục: typecheck/architecture221/tests179/build PASS;5 nhóm browser gallery PASS; smoke40 PASS; dropdown dùng dependency Radix có sẵn, không đổi lockfile. Mốc trước: build/dry-run hai môi trường PASS; smoke 40/40, persisted D1 giữ nguyên. Các số 125/136/143/148/150/158/160 tests là mốc cũ, không cộng hoặc dùng thay current count. Pipeline giữ nguyên output lịch sử.

UI Phase 5 đầy đủ tại mốc cũ:17 routes/0 exceptions,10/10 MVP+2/2 extended. Hardening UI/mock/test-key đã pass targeted; responsive rộng còn tràn Shop320px, chưa nghiệm thu lại toàn suite. CPU cloud/quota/challenge thật/upload thật/Cron thực chạy chưa được xác minh đầy đủ. Không dùng evidence local để kết Phase 6.

Workers Free tham chiếu100.000 request/ngày,10ms CPU/request; D1 50 queries/invocation,5 triệu rows read/100.000 written/ngày,500MB/database,5GB/account. Đối chiếu lại nguồn chính thức16/10; quota thực tế account cần owner kiểm. [Workers](https://developers.cloudflare.com/workers/platform/limits/) · [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) · [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Dữ liệu seed, delivery surcharges0/30.000/50.000, cutoff16:00, preparation120 phút/slots08:00–20:00 vẫn cần owner chốt cho mở bán. Không thêm DDL/dependency/provider ngoài yêu cầu.

[Guide](../PROJECT_GUIDE.md) · [Database](DATABASE_DESIGN.md) · [Entities](FRONTEND_ENTITIES.md) · [API](pipeline/API_CONTRACT.md) · [Operations](OPERATIONS.md) · [Hardening](HARDENING.md).

UI Home local16/10 tham chiếu cấu trúc Stitch 14566722138013174841; dùng React/Tailwind hiện có, palette brand.css, chung ProductGrid/ProductCard với Shop. Ảnh trang trí trống; ảnh/mô tả sản phẩm từ D1. Header dùng React Router Form GET; useProducts nhận q/category từ URL. Không thêm UI stack/dependency.

Hero asset local16/10: import WebP tĩnh từ src/assets/hero (640/960/1440), Vite content hash, srcset/sizes và fetchPriority high; tsconfig frontend nạp vite/client để khai báo module ảnh. Không thêm dependency; cwebp có sẵn chỉ dùng để tạo derivative, build không yêu cầu cwebp. Ba file ảnh có allowlist chính xác. Hero dùng ảnh AI được chủ shop chấp thuận, category/trang trí khác giữ trống.

Ảnh category: public WebP256px với URL revisioned lưu D1 categories.image_url, GET categories trả nullable; không Cloudinary key/dependency mới. Test/harness SQLite/workerd áp cả migration0001+0002. Local172 tests,architecture215,db:verify13/13,smoke40 PASS; ảnh256px tải thật ở10 case EN/VI/5viewport. [Runbook](CATEGORY_IMAGES.md).

Staging đã deploy version `75fcbb54-5528-4cc1-b101-22fdc7a91a40`;APIcategory+ảnh publiclive và browser10casePASS.Production chưa migrate0002 hoặc deploy lần này;không thêm dependency.

Product detail local16/10: route React /shop/:slug và API existing /api/products/:slug, ảnh/variants/mô tả/SKU từ DB, Dialog zoom và shared Dropdown; canonical/title/OG client theo sản phẩm. Chưa SSR/prerender/sitemap sản phẩm. CatalogProvider cập nhật detail DTO trong memory để giỏ nhận sản phẩm ngoài100 mẫu đầu; cart add trả boolean, quote vẫn server-owned. Card bỏ border dùng shadow token/hover lift4px/reduced-motion. Không đổi dependency/DDL/Worker; chưa push/deploy.

Gallery 16/10 local dùng `product_images/cloudinary_public_id` sẵn có, không thêm DDL/dependency. Product create/patch nhận images từ 1 đến 8 ảnh, đúng một primary, không trùng URL/ID; thay gallery trong một batch atomic. Signed direct upload chạy tuần tự, mỗi ảnh kiểm 5 MiB ở client/metadata; không tự xóa asset Cloudinary. Public list trả cover, detail trả đủ ảnh; admin có public ID. Provider thật chưa nghiệm thu; 5 nhóm browser dùng mock provider và D1 tạm đã đạt.


Checkout16/10 local: shared Combobox không dependency mới; snapshot JSON Open Admin Data CC-BY4.0 (2city/294ward), tìm không dấu và chọn giá trị xác định; useQuoteCart debounce350ms/hủy request cũ. Phí D1/API không đổi;182tests/223source và8browser groups PASS. [Chi tiết](DELIVERY_ADDRESS.md).


Checkout16/10 local: service checkout-form.ts giữ logic sync người nhận/validation; hook sở hữu consent/payment, CheckoutPayment trình bày sidebar. Tái dùng Radix Dialog/FeatureUnavailable inline, không dependency mới.186tests/225source/10nhóm checkout +8nhóm địa chỉ browser PASS. [Chi tiết](CHECKOUT_UI.md).


Wrangler config16/10 local: explicit sampling10% cho observability/logs/traces, không bật traces, invocation_logs=false; staging guard giữ đúng target và sampling.186tests/typecheck/architecture225/build+dry-run2môi trường đạt; không upload/remote changes. Dry-run không chứng minh cloud diff hết. [Chi tiết](STAGING.md).
