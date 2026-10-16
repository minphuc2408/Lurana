# Lunarra — trạng thái hiện tại

> Hiện hành 16/10/2026 — Đã nhập danh mục D1 Hà Nội 1 tỉnh/126 phường vào local + staging bằng migration0003 (12 bảng); không nhập TP.HCM. Admin chọn/tìm tỉnh-phường, nhập phí; checkout chỉ hiện zone active thuộc danh mục, server không fallback tỉnh. Checkout gộp, thiệp NONE, terms nội bộ và bank rollback COD được giữ. Staging đã deploy version 27c3d24e-f3df-42e1-8d18-8b8299427062; zones0 nên checkout chưa có nơi giao cho tới khi admin cấu hình phí. Local190tests/225source/typecheck/build, schema13/13, smoke40/40, browser admin7nhóm PASS. Owner đã yêu cầu commit/push sau deploy; production không đổi, Phase6 giữ5/7. [Địa chỉ](DELIVERY_ADDRESS.md), [Checkout](CHECKOUT_UI.md). Các mốc dưới đây là lịch sử khi khác hiện trạng này.

## Danh mục Hà Nội và staging hiện hành — 16/10/2026

- Hai bảng mới `administrative_provinces`/`administrative_wards` qua0003, đã áp local + staging: **1 tỉnh,126 phường,không Hồ Chí Minh**,12bảng,FK sạch.0001/0002 không sửa.
- Admin delivery-zones chọn/tìm không dấu trong danh mục rồi nhập phí; checkout chỉ nhận phường có zone active hợp danh mục. Quote/order cùng kiểm server, không fallback tỉnh. Tạo Cửa Nam → hiện, tắt → ẩn/directquote422 đã kiểm với DB cô lập.
- Staging version **`27c3d24e-f3df-42e1-8d18-8b8299427062`**, deploy19:21 giờ Việt Nam. Live JS `index-Ba-uzNNV.js` khớp SHA256 artifact staging tại kiểm tra trước build local; CSP/noindex giữ nguyên. Public options200/provinces=[], admin401 không cookie.
- Staging aggregate sau migrate: **zones0/products1/variants3/tổng tồn30/orders0/items0/history0**, không đổi nghiệp vụ. **Chưa tự tạo phí**; admin cần cấu hình từng phường thì checkout mới có lựa chọn. Không chạy seed hoặc xuất dữ liệu khách, không đổi secrets.
- **190/190tests, architecture225source, typecheck/build, schema13/13 (46assertions), smoke40/40 PASS**. Browser admin7 + địa chỉ8 + checkout12nhóm PASS,0exceptions, EN/VI320/390/768/1440px. Địa chỉ:0quote khi gõ,3quote cho chọn/lựa chọn lại/nhóm tăng số lượng. Checkout:1quote khi chọn địa chỉ,0quote khi gõ,0POSTorder; Turnstile callback synthetic. Admin CRUD dùng cookie demo/SQLite cô lập, không tài khoản thật hoặc ghi staging.
- Checkout gộp/3khối dọc/cặp field640px, cùng người nhận, NONE ẩn-xóa message, terms “Cập nhật sau”, bank đóng trả COD, consent/schema/challenge gates giữ nguyên. Preview local4184 chạy lại sau build.
- Owner đã yêu cầu commit/push source sau khi xác nhận staging; không migrate hoặc deploy production. Staging deploy bao gồm source UI/gallery/checkout đang có lúc build; các ghi chú “local/chưa deploy” bên dưới là **lịch sử từng lượt**, không còn mô tả staging hiện hành. Phase6 vẫn5/7; provider/upload/Cron/quota chưa được nghiệm thu thêm.
- Full backup staging không được tạo: automatic approval review từ chối khả năng xuất dữ liệu khách. Chọn migration chỉ bổ sung và đối chiếu aggregate/FK trước-sau; backup local ignored đã tạo. [Chi tiết nguồn/schema/DB](DELIVERY_ADDRESS.md), [checkout](CHECKOUT_UI.md).

## Các mốc trước lượt danh mục

Cập nhật **16/10/2026**, giờ Việt Nam. Repo GitHub: **Lurana**. Code của lượt UI/ảnh danh mục đã chia theo nhóm: typography `14c82c2`, bố cục/card `9e8f20d`, hero `9f19e2c` và catalog/DB `5ed8a56`; tài liệu được commit riêng cùng lượt. Owner đã cho migrate/gán 4 ảnh category trên DB local + staging và deploy staging version `75fcbb54-5528-4cc1-b101-22fdc7a91a40` ngày 16/10. Không deploy/ghi production hoặc thay secrets.

## Gallery nhiều ảnh local trước checkout gộp (chưa push/deploy)

- Schema đã có `product_images`, `cloudinary_public_id`, thứ tự và unique một primary: **không tạo bảng/migration**, không thay dữ liệu hiện có.
- Admin chọn nhiều file JPEG/PNG/WebP (mỗi ảnh≤5MiB), tối đa8 ảnh; upload từng ảnh bằng signed ticket riêng, lưu URL + public ID, chọn cover, lên/xuống, gỡ liên kết. Upload lỗi giữ những ảnh thành công và dừng, không auto-retry. Lưu sản phẩm mới ghi gallery vào D1; hủy/gỡ không tự xóa Cloudinary asset.
- POST/PATCH products nhận `images`1..8 với đúng1primary, không URL/public ID trùng, public ID phải khớp URL. API `image` đơn cũ vẫn dùng được; không gửi đồng thời cả hai. Gallery patch thay liên kết trong1 D1 batch, rollback toàn bộ khi một insert lỗi. Admin đọc thêmid/sort_order/public ID; API public không trả public ID.
- GET products chỉ trả1 cover (fallback xác định nếu dữ liệu cũ thiếu primary); GET products/:slug trả toàn bộ ảnh theo sort_order/id. Gallery frontend bắt đầu ở cover và cho chuyển đủ các ảnh. Không tải toàn bộ ảnh phụ khi đang ở Shop.
- “Trở về bộ sưu tập” nằm ngay trên sản phẩm; CTA “Đặt hoa ngay” chỉ có chữ căn giữa.
- Local: typecheck, architecture221source, build, smoke40/40 và db:verify13/13 PASS. Tests mới nhất179/179 PASS, gồm8ảnh/list-vs-detail/validation và rollback trên real workerd D1. Browser Edge + Worker/D1 tạm5/5nhóm PASS,0exceptions: multi-upload/sort/primary/remove/save, lỗi upload từng phần, limit/duplicate/type,8ảnh end-to-end, vị trí back/CTA và EN/VI320/390/768/1440px. Cloudinary delivery/upload và Turnstile là mock; ký ticket, API product và D1 là code thật với cấu hình tổng hợp, persist:false/remoteBindings:false. Snapshot D1 persisted không đổi; chưa nghiệm thu upload provider thật.
- Preview mới nhất `http://127.0.0.1:4184/`. Không thay Worker secrets, không commit/push/deploy hoặc ghi DB staging/production; Phase6 giữ5/7. Evidence local ignored: `.security-review/gallery-ui-results.json`.

## Trang sản phẩm local trước đó (chưa push/deploy)

- Card dùng shadow màu token, không viền; hover nâng4px và tăng shadow, tôn trọng reduced motion. Ảnh/tên/mô tả cùng dẫn tới `/shop/:slug`.
- Trang `ProductDetailPage` dùng endpoint có sẵn `GET /api/products/:slug`: gallery từ DB với thumbnail khi có nhiều ảnh, phóng ảnh bằng Dialog, breadcrumb, tên/mô tả EN/VI, SKU/giá/compare-at/size/tồn. Desktop chia2cột, mobile xếp dọc. Không dựng thêm tone/loại hoa/kích thước cm/dịp tặng khi DB chưa có.
- **Đặt hoa ngay** thêm1 variant đang chọn rồi chuyển `/cart`; thêm thất bại do giới hạn giỏ/hết hàng thì giữ trang và báo lỗi. `addItem` trả boolean; giỏ vẫn chỉ lưu variantId/quantity và quote server định giá. Detail API được cập nhật vào CatalogProvider bằng `rememberProduct`, cho phép đặt từ link trực tiếp ngoài100 sản phẩm đầu; không tăng giới hạn API list.
- Loading/error/retry/404 và ảnh rỗng có trạng thái riêng; không fixture fallback. Metadata client theo tên/mô tả/ảnh/canonical sản phẩm, staging vẫn noindex; nội dung sản phẩm chưa SSR/prerender và sitemap chỉ Home/Shop.
- Local: **174/174 tests, architecture220source, typecheck/build PASS**. Browser Edge + Worker bridge/D1 tạm: **6/6 nhóm,0exception**, EN/VI ở320/390/768/1024/1440px; link/hover/reduced-motion, gallery/zoom/Escape/focus, size→giá/SKU→cart, cart-limit/sold-out, reload/404/hidden/retry và link ngoài100 mẫu đầu đều đạt. D1 persisted không đổi. Evidence local ignored: `.security-review/product-detail-ui-results.json`.
- Không đổi Worker/API/schema/dependency/secret hoặc ghi DB local/staging. Các trang mới và tinh chỉnh UI trước đó đều chưa push/deploy; bản remote giữ nguyên. Phase6 giữ5/7; kết quả UI toàn phần cũ bên dưới là phạm vi khác.

## Tinh chỉnh UI local trước đó (chưa push/deploy)

- Đổi tên hiển thị thành **Lunarra** trên EN/VI, logo, metadata và ảnh OG; giữ tên kỹ thuật Worker/D1/repo và khóa i18n tương thích.
- Home bỏ caption Khám phá bộ sưu tập, tile Tất cả hoa dùng token blush; tiêu đề Những mẫu hoa nổi bật căn giữa và bỏ mô tả. Shop chỉ giữ tiêu đề Bộ sưu tập của chúng tôi và câu mô tả theo yêu cầu.
- Shared `src/shared/ui/dropdown.tsx` dùng Radix Select đã có: cùng popup cream/blush/rose cho sort, size, checkout/admin và source deferred; không kích hoạt chức năng đang ẩn, không thêm dependency. Giữ giá trị, required/disabled, portal trong dialog và keyboard/focus.
- Con trỏ pointer cho nút/link/filter/options/checkbox/radio và summary; disabled dùng not-allowed, input chữ giữ text. Overlay đóng sidebar là button có nhãn. Toolbar filter co vừa320px.
- Typecheck, architecture216 source,172/172 tests và build PASS. Browser Edge + Worker bridge/D1 tạm `persist:false`, `remoteBindings:false`, synthetic auth/Turnstile mock:4/4 nhóm UI đạt,0exception; EN/VI tại320/390/768/1024/1440px, dropdown Escape/focus, variant→cart, slot/card/form values, admin reset/category/status trong dialog. D1 persisted không đổi.
- Bộ UI toàn phần vẫn vướng assertion Total670 trước chọn vùng giao đã ghi nhận từ lượt trước;4 nhóm trên là kiểm tra tập trung, không thay nghiệm thu toàn bộ checkout/cloud. Không sửa Worker/schema/secret; staging/production giữ bản đã deploy bên dưới.

## Bản đã live staging — ảnh category

- Staging version `75fcbb54-5528-4cc1-b101-22fdc7a91a40` đã deploy với bố cục, font, hero mới và 4 ảnh danh mục từ DB.
- Migration `0002_category_images.sql` và 4 URL ảnh đã áp local/staging. Production vẫn chỉ có migration 0001.
- Live: API trả 4 URL; cả 4 WebP khớp SHA-256 với file local. Browser EN/VI đạt 10/10 trường hợp, 0 exception; CSP/noindex được giữ.
- Local: 172 tests, 13/13 nhóm kiểm tra schema và 40/40 nhóm smoke đạt.
- Staging giữ Turnstile fail-closed theo owner: login/lookup trả 503 khi chưa có secret. Provider, Cron và quota cloud chưa được nghiệm thu.
- [Chi tiết triển khai, ảnh, prompt và rollback](CATEGORY_IMAGES.md).

## Code và kiểm chứng local

**Phase 0–5 DONE local; Phase 6 IN PROGRESS, 5/7 tiêu chí.** Còn dữ liệu mở bán thật và xác nhận người vận hành đã nắm cách kiểm quota. Không nâng mức nghiệm thu chỉ từ deploy staging hoặc kiểm tra public.

| Phần | Trạng thái |
| --- | --- |
| Storefront | Catalog/cart/delivery/quote VND, checkout COD form → review → API confirmation, retry cùng UUID, public lookup tại `/orders/track` |
| Admin | Cookie auth, dashboard, đơn/ghi chú/trạng thái, sản phẩm/variants/tồn `stock_delta`, khu vực/phí giao; không dùng fixtures để giả vận hành |
| Bảo vệ | Turnstile fail-closed checkout/lookup/login; thiếu secret503, bypass chỉ opt-in server+loopback; rate limit 6 request/phút/IP/route cho orders/login, 60 cho lookup/quote/catalog; cap 3 PENDING/SĐT người đặt |
| Hủy và tồn | IN_TRANSIT → CANCELLED cần lý do; restock mặc định false. Trước IN_TRANSIT mặc định hoàn tồn. CANCELLED luôn terminal |
| Hết hạn | TTL 24 giờ, Cron `0 * * * *`; một batch D1 3 statements hủy toàn bộ PENDING quá hạn/stock_released=0, history SYSTEM và hoàn tồn một lần |
| Hardening | Chuẩn bị mọi đơn giao hôm nay ≥120 phút; summary 30 ngày, tra đơn mặc định 90/tối đa 366 ngày; URL ảnh HTTPS Cloudinary/Unsplash; log D1 allowlist |
| Frontend | CSP/static headers, Zod jitless, preference → browser EN/VI → English fallback; metadata Home/Shop, canonical/OG/robots/sitemap |
| Build | Production đọc `.env.production`; staging script chọn `CLOUDFLARE_ENV=staging` + Vite `--mode staging`, đọc `.env.staging` và luôn noindex |
| Storage | Chỉ locale và cart variantId/quantity lưu bền; contact/order intent/token/JWT không lưu browser storage |
| Deferred | Customer auth/profile/orders/wishlist, custom requests, admin customers/settings/notifications giữ source nhưng ẩn; customer API-ready gate vẫn false |

**Bằng chứng local gần nhất, 16/10/2026:** typecheck PASS; architecture **215 source files**; **172/172 tests PASS**; build và dry-run prod/staging PASS. Bundle từng môi trường chỉ có Site key tương ứng, đúng Worker/D1/canonical/noindex. Smoke **40/40 PASS**, persisted D1 sau migration giữ nguyên trong lúc smoke; smoke chỉ chấp nhận redirect Shop tới chính xác `/shop/` cùng origin.

Bằng chứng browser đầy đủ tại mốc Phase 5: 17 routes/0 exceptions, 10/10 MVP +2/2 mở rộng. Sau hardening, UI/provider mock 10/10 MVP + CRUD/B3/widget và native preview CSP/SDK test-key đã pass; nhóm responsive rộng còn lỗi `/shop` 320px và chưa được nghiệm thu lại toàn bộ. Không đồng nhất test-key/mock với widget thật hoặc CPU/quota cloud.

Local16/10 bổ sung fail-closed Turnstile: Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 đã deploy staging cùng version ảnh category; production chưa deploy. Native workerd3cấu hình PASS; 22phản hồi header live đã kiểm riêng HTML/assets/API. [Chi tiết](HARDENING.md#turnstile-fail-closed-và-header-live-16102026).

## Snapshot remote chỉ đọc — 16/10/2026

**Lịch sử trước lượt deploy ảnh category**: bảng dưới là snapshot13:31;version staging hiện tại ở mục cập nhật mới nhất trên đầu trang.

| Hạng mục | Production | Staging |
| --- | --- | --- |
| URL | [Production](https://lunara.minphuc2408.workers.dev) | [Staging](https://lunara-staging.minphuc2408.workers.dev) |
| Worker / D1 | `lunara` / `lunara-db` | `lunara-staging` / `lunara-staging-db` |
| Version active | `26d0811c-f2f0-4f7f-a0fa-7cb175035d06` | `e984d962-076f-492c-b2e3-c5cac5f52ec3` |
| Deploy, giờ Việt Nam | 15/10/2026 19:52 | 16/10/2026 13:31 |
| Public catalog | 4 categories, 8 sản phẩm active, 2 tỉnh giao | 4 categories, 1 sản phẩm active, 0 tỉnh giao |
| ADMIN_PASSWORD / JWT_SECRET | Có tên secrets | Có tên secrets |
| Cloudinary | Chưa có vars/secrets tương ứng trong version live | Có cloud/preset/scope và tên CLOUDINARY_API_KEY/API_SECRET |
| TURNSTILE_SECRET | Chưa có | Chưa có |
| Public Site key trong bundle | Chưa có bộ key mới | Đúng key staging, không chứa key production |
| CSP / SEO mới | Chưa có CSP; robots.txt trả SPA HTML | Có CSP, X-Robots-Tag noindex; robots.txt Disallow toàn site |
| RateLimit / TTL | Chưa có bindings/biến mới | Có hai bindings và TTL=24; có scheduled handler |

Snapshot dựa trên deployment/version metadata, tên secrets và HTTP public. Không đọc giá trị secrets, không đăng nhập admin, không upload/đặt đơn/ghi dữ liệu. Có tên Cloudinary secrets chưa chứng minh preset/credentials hợp lệ hoặc upload thành công. Scheduled handler/bindings chưa chứng minh Cron đã thực chạy hay restock trên cloud.

Migration 0001 đã được xác minh trên cả hai D1 ngày 15/10. Counts đơn/tồn/FK sau cleanup production và counts staging=0 trước đây là **snapshot lịch sử**, không phải counts hiện tại; lượt này không truy vấn dữ liệu đơn riêng tư. Không chạy lại seed để đồng bộ hai môi trường.

## Việc còn cần chủ shop

| Việc | Nơi thực hiện |
| --- | --- |
| Dữ liệu mở bán thật | Catalog/ảnh/giá/SKU/tồn, khu vực/phí/khung giờ thật; ẩn hàng mẫu, tắt vùng ví dụ và kiểm quote |
| Bàn giao quota | Xác nhận xem được Workers Requests/Errors/CPU và D1 Rows read/written/storage; [OPERATIONS](OPERATIONS.md) |
| Turnstile | Hai widget/hostname riêng; đúng Site key + secret cùng cặp; deploy UI mới rồi nhập TURNSTILE_SECRET từng Worker và kiểm ba form |
| Production mới | Deploy code mới và thêm Cloudinary secrets nếu cần upload; không sao chép dữ liệu thử staging |
| Staging checkout | Chưa có delivery zones nên chưa nghiệm thu checkout; thêm dữ liệu thử chỉ khi được phép |
| Upload/Cron/bot protection thật | Nghiệm thu trên đúng môi trường và cửa sổ test được cho phép; chưa có bằng chứng đầy đủ |
| Thông tin shop | Chốt địa chỉ/map/pháp nhân/MST, link Zalo và policy; nội dung placeholder không phải dữ liệu pháp lý thật |
| Domain/WAF | Tùy chọn; quyết định riêng về hạ tầng/chi phí |

## Tài liệu chuẩn

[Kiến trúc](../PROJECT_GUIDE.md) · [Stack](TECH_STACK.md) · [API contract](pipeline/API_CONTRACT.md) · [Database](DATABASE_DESIGN.md) · [Entity](FRONTEND_ENTITIES.md) · [Staging](STAGING.md) · [Cloudinary](CLOUDINARY.md) · [Turnstile/COD](BOT_PROTECTION.md) · [Hardening](HARDENING.md) · [Phase 6](pipeline/PHASE_6_DEPLOY.md) · [Rà soát tài liệu](DOCUMENTATION_AUDIT.md).

Các output 53/92/125/136/143/148/150/158/160 tests trong pipeline là kết quả tại mốc cũ. Giữ nguyên bằng chứng, dùng **190 tests / 225 files / 40 smoke** cho code hiện tại;172/215 là mốc ảnh category;170 thuộc mốc trước ảnh category.

Typography EN thử local (16/10/2026): Fraunces 500/500 Italic cho heading/logo, optical sizing tự động (opsz 9–144); Inter cho body/UI. Bỏ Caveat, nhãn hero dùng body. VI giữ Lora/Be Vietnam Pro. Google Fonts dùng preconnect + display=swap; chưa deploy.

Kiểm chứng Fraunces/Inter: typecheck, architecture 215, 170/170 tests, build và diff check PASS. Probe Edge riêng tải đủ 2 font EN + 2 font VI; glyph VI không fallback, heading EN 500/italic/optical sizing auto, VI 600 giữ nguyên. Bố cục không tràn ngang và logo EN một dòng ở 320/390/768/1024/1440px, 0 runtime exceptions. Full UI checker không chạy lại (quote-before-zone đã ghi nhận); ảnh Unsplash bị chặn bởi host allowlist của probe. Preview local http://127.0.0.1:4175; chưa deploy.

Bố cục Home theo [Stitch](https://stitch.withgoogle.com/projects/14566722138013174841) được triển khai local16/10: hero hai cột, category DB, dải dịch vụ COD, grid/card dùng chung Shop; giữ màu Lunara và Fraunces/Inter (VI Lora/Be Vietnam Pro). Ảnh trang trí để trống chờ chủ shop cung cấp, ảnh sản phẩm giữ nguồn DB. Header search/category nối Shop qua q/category; Home có chọn size/thêm giỏ thật. Không đổi API/DDL/dependency hoặc deploy.

Kiểm chứng layout Stitch local16/10: typecheck/build PASS, architecture215, tests170/170, diff check PASS. Probe Edge Home + card Shop EN/VI ở320/390/768/1024/1440px không overflow hoặc cắt controls (>=44px); giữ4 category DB/3 featured tại lúc kiểm, ảnh trang trí trống, chọn size/giá/variant cart, category URL, header search và tìm lại cùng route, API failure→retry và empty catalog PASS;0 runtime exceptions. Checker repo chạy lại vẫn dừng ở quote-before-zone `Total includes 670` đã biết, không coi full UI PASS. Preview http://127.0.0.1:4176; ảnh DB hiện có không tải được trong probe nên ImageWithFallback hiển thị placeholder, không chứng minh provider ảnh live. Không gửi order hoặc ghi D1/remote.

Hero responsive local16/10: ảnh bó hoa mới tạo bằng imagegen theo ảnh tham chiếu và chấp thuận của chủ shop; lưu src/assets/hero/lunara-bouquet-{640,960,1440}.webp (~47/83/150 KB), import Vite thay vì public, srcset/sizes + high priority. Desktop ảnh phải/gradient ngang; dưới1024px ảnh dưới chữ, khung4:3/gradient trên. Ảnh category/trang trí khác vẫn trống, ảnh DB giữ nguyên. [Nguồn/prompt](../ATTRIBUTIONS.md). Chưa deploy.

Kiểm chứng hero ảnh16/10: typecheck PASS sau bật vite/client, architecture215,170/170 tests, build/diff check PASS. Probe Edge EN/VI ở320/390/768/1024/1440px (10 cases) và mobile390px DPR2 PASS: ảnh load thật/có naturalWidth, không overlap CTA/text, không overflow, khung mobile4:3; mỗi navigation tải đúng1 candidate (640px~47KB ở mobile DPR1,960px~83KB ở mobile DPR2). Không JS exception. Screenshot/probe trong .security-review local; preview http://127.0.0.1:4180. Không chạy lại full UI checker ở lượt chỉ thêm hero ảnh (lỗi quote-before-zone từ lượt layout vẫn chưa xử lý); không đổi Worker/D1 hoặc deploy.

Category images16/10 (cập nhật mới hơn snapshot remote chỉ đọc ở trên): owner yêu cầu tạo/gán ảnh local+staging và xác nhận deploy staging giữ fail-closed. Migration0002_category_images.sql và4 URL đã áp cả2DB; staging kiểm trực tiếp có4category/1product/3variants/0orders,FK sạch.4WebP256px trong public/images/categories,10–14KB/tấm;API thêm image_url nullable,UI tròn từDB. Local172/172tests,typecheck,architecture215,db:verify13/13,smoke40/40,build và staging dry-run PASS. Probe ảnh load thật EN/VI/nămviewport10/10,category navigation PASS,0exception. Production chưa migrate/deploy; staging delivery đã PASS trên version `75fcbb54-5528-4cc1-b101-22fdc7a91a40`:API4URL,ảnh4/4khớpSHA256,browser10/10case;khôngproduction. [Chi tiết](CATEGORY_IMAGES.md).


## Checkout địa chỉ — 16/10/2026, local/chưa push/deploy

Đã thêm chọn/tìm không dấu Hà Nội126 và Hồ Chí Minh168 đơn vị từ snapshot Open Admin Data, city→ward reset và shared Combobox có bàn phím/empty state. Quote chỉ nhận lựa chọn hợp lệ, debounce350ms; gõ tìm kiếm hoặc contact/address không gọi API. Phí vẫn theo D1, không ghi D1/đổi Worker/API/DDL/dependency hay remote. Typecheck/build/182tests/architecture223source PASS;8nhóm Edge browser PASS,0exceptions,0request khi gõ;3quote tương ứng2lựa chọn địa chỉ +1nhóm tăng số lượng nhanh. Viewport320/390/768/1440 và EN/VI PASS. Full UI cũ vẫn vướng quote-before-zone/input-datalist; không lấy targeted pass thay full suite. Nguồn/license/mapping phí tại [DELIVERY_ADDRESS](DELIVERY_ADDRESS.md). Preview4184 đã restart sau build để nạp manifest mới. Phase6 giữ5/7; remote versions không đổi.


## Form checkout —16/10/2026, local/chưa push/deploy

3khối responsive người đặt/người nhận/thiệp-yêu cầu, checkbox cùng người nhận sao chép/live-sync tên/SĐT và tắt để sửa riêng. Payment dưới Total; mặc định COD với note thanh toán khi nhận hàng, không note cọc50%. Bank-transfer mở Dialog dùng FeatureUnavailable inline và khóa nút; consent mặc định false, schema/date/slot/quote/COD/consent gate cả review và submit, submit vẫn cần Turnstile. Không quận/huyện với snapshot2cấp, không đổi Worker/DDL/API/dependency/remote.186tests/architecture225source/typecheck/build PASS;10nhóm browser checkout EN/VI/320-1440px PASS,0exceptions,1quote khi chọn địa chỉ và0quote khi gõ/đổi consent/payment,0POST order. Callback Turnstile synthetic, không nghiệm thu provider;8nhóm địa chỉ vẫn PASS. Full UI legacy chưa thích ứng consent/datalist/quote-before-zone, không coi full suite pass. [Chi tiết](CHECKOUT_UI.md).Phase6 giữ5/7.


Wrangler config16/10 local: explicit sampling10% cho observability/logs/traces, không bật traces, invocation_logs=false; staging guard giữ đúng target và sampling.186tests/typecheck/architecture225/build+dry-run2môi trường đạt; không upload/remote changes. Dry-run không chứng minh cloud diff hết. [Chi tiết](STAGING.md).
