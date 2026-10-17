# Lunarra

> Bàn giao source17/10/2026: owner đã cho phép chia commit theo chức năng và push GitHub trong lượt này; không bao gồm deploy hoặc DB remote. Kiểm tra trước push: typecheck, architecture234source,191/191tests và build PASS. Đã sửa test i18n nhận namespace với cả nháy đơn/kép. Đơn SMOKE thử tra cứu chỉ ở DB local (1đơn/1item/3history), không đưa dữ liệu hoặc SQL thử vào Git; db:verify13/13 PASS. Local5173 hiện thiếu cấu hình Turnstile và trả503 TURNSTILE_NOT_CONFIGURED; owner đã yêu cầu dừng, không thêm bypass hoặc thay cấu hình. Browser UI72ca trước đó dùng API/challenge giả lập, không đồng nghĩa lookup thật đã hoạt động. Remote/Phase6 vẫn giữ nguyên.


> Tra cứu đơn17/10/2026 (local5173, chưa push/deploy): /orders/track theo project ref, bỏ breadcrumb/eyebrow/đoạn hướng dẫn theo yêu cầu. Năm mốc trạng thái thực với icon, đơn hủy hiển thị riêng và chỉ đánh dấu các bước có trong lịch sử API. Hotline0987656789. Giữ bắt buộc mã đơn + điện thoại + Turnstile, không dữ liệu đơn mẫu trong ứng dụng. Không đổi API/Worker/DB/dependency hoặc màn hình admin. Typecheck, architecture234source,191tests, build và72ca responsive EN/VI PASS; kiểm tra browser dùng phản hồi API/challenge giả lập, không thay nghiệm thu provider/remote. Phase6 vẫn5/7.


> Câu chuyện17/10/2026 (local5173, chưa công bố/push/deploy): section theo ref ngay sau sản phẩm nổi bật, menu Câu chuyện và /about dạng article không breadcrumb. Owner cho dùng bài/ảnh/giờ mở cửa mẫu, địa chỉ dùng chung footer và link ngoài đại diện Lunarra. /about có metadata riêng/noindex, không sitemap; không CMS/API/DB mới. Typecheck/architecture232source/190tests/build và28ca browser EN/VI/7widths PASS,7vị trí ảnh ref tải thật,0exceptions.


> Giỏ hàng/Đặt hoa theo ref17/10/2026 (local5173, chưa push/deploy): /cart chỉ sản phẩm+tóm tắt; “Tiến hành đặt hàng” mở /checkout. Form5khối người đặt/người nhận/lịch giao/thiệp chung/thanh toán, sidebar đơn hoa, giữ review rồi xác nhận. Chưa chọn địa chỉ thì ẩn phí; COD mặc định/chuyển khoản thông báo. CheckoutFlowProvider giữ draft trong memory khi sửa giỏ, reload/rời nhóm route xóa draft. API/DB không đổi. Chi tiết và kiểm chứng tại docs/CHECKOUT_UI.md.


> Kích thước theo ref17/10/2026 (local, chưa commit/push/deploy): đã bỏ mục Cart trong menu chính/mobile, giữ nút giỏ bên phải. Header72px dưới640px/80px từ640px; container storefront1240px, padding20/32px. Hero ảnh400/480/520px, grid5/7 gap40/56px; sản phẩm2cột dưới1024px/4cột từ1024px, ảnh4:5. Dev đang dùng cổng5173. Xem PROJECT_STATUS để biết kiểm chứng và remote.


> Header 17/10/2026 (local, chưa commit/push/deploy): nút Tìm kiếm mở ô nhập theo project ref, desktop inline từ1280px/mobile mở dưới header; Enter/nút kính lúp tìm qua /shop?q=, Escape/Đóng trả focus. Nút Giỏ hàng icon nét1.5 + nhãn + badge inline khi có hàng, dùng CartProvider và link /cart. EN/VI, không đổi checkout/API/DB. Kiểm chứng:190tests, architecture225, typecheck/build; Edge24ca responsive và tương tác PASS,0exceptions/0POSTorder.


> Typography 17/10/2026 (local, chưa commit/push/deploy): đã đối chiếu source tham chiếu `D:/Download/lunara`; project hiện tại tải đủ Lora và Be Vietnam Pro cùng weight/style mẫu dùng. VI dùng Lora Regular 400 cho heading/logo (kể cả italic), Be Vietnam Pro cho body/form; thêm fallback Georgia/system-ui, font kế thừa từ html và đồng bộ utility font-sans/font-serif với token locale, bao gồm portal. EN vẫn Fraunces 500/Inter. Xem docs/PROJECT_STATUS.md để biết kiểm chứng và phạm vi remote.

> Hiện hành 16/10/2026 — Đã nhập danh mục D1 Hà Nội 1 tỉnh/126 phường vào local + staging bằng migration0003 (12 bảng); không nhập TP.HCM. Admin chọn/tìm tỉnh-phường, nhập phí; checkout chỉ hiện zone active thuộc danh mục, server không fallback tỉnh. Checkout gộp, thiệp NONE, terms nội bộ và bank rollback COD được giữ. Staging đã deploy version 27c3d24e-f3df-42e1-8d18-8b8299427062; zones0 nên checkout chưa có nơi giao cho tới khi admin cấu hình phí. Local190tests/225source/typecheck/build, schema13/13, smoke40/40, browser admin7nhóm PASS. Owner đã yêu cầu commit/push sau deploy; production không đổi, Phase6 giữ5/7. [Địa chỉ](docs/DELIVERY_ADDRESS.md), [Checkout](docs/CHECKOUT_UI.md). Các mốc dưới đây là lịch sử khi khác hiện trạng này.

Storefront + admin từ thiết kế Flower Shop Figma. **UI: Lunarra · GitHub: Lurana**.

| Keyword | Hiện trạng |
| --- | --- |
| Frontend | React/React DOM 18.3.1 · React Router 7.18.4 · Vite 6.4.4 · Tailwind 4.1.12 |
| Worker | Hono + `@cloudflare/vite-plugin`; Phase 0–3 DONE local, Phase 4 backend đã DONE local (9/9 tiêu chí) |
| API | Health/catalog/delivery/quote/orders/lookup; auth và quản trị `/api/admin/*` dùng JWT cookie; API lạ → JSON 404, admin thiếu cookie → 401 |
| D1 | Binding `DB`; base0001 gồm10bảng, local/staging thêm0002+0003 thành12bảng; production giữ0001; danh mục Hà Nội126 tách khỏi phí giao |
| Commerce | Home/Shop/Cart/Delivery/Quote, checkout COD, tra đơn và admin đã nối API local; Phase 5 DONE local (6/6 tiêu chí) |
| Locale | Preference đã lưu → ngôn ngữ trình duyệt EN/VI → fallback English; catalog/giỏ hiển thị VND; Worker dùng Asia/Ho_Chi_Minh |
| Build | Frontend `dist/client/` · Worker + Wrangler config `dist/lunara/` |
| Môi trường đã dùng | Node 24.11.1 · npm 11.6.3; Wrangler hiện yêu cầu Node ≥22 |

Health xác nhận Worker phản hồi, chưa kiểm tra DB. Giỏ bắt đầu rỗng, lưu variant ID/số lượng trong localStorage; giá và phí được báo lại từ server. Checkout COD trong `/cart` có form, duyệt đơn, gửi/retry và xác nhận mã đơn từ API Phase 3; `/orders/track` tra đơn bằng mã + SĐT. Admin đăng nhập tại `/admin/login`, quản lý đơn, sản phẩm/tồn, phí giao và dashboard tóm tắt qua API Phase 4. Phase 5 đã nghiệm thu đầy đủ local; deployment remote thuộc Phase 6.

Footer: cấu hình tên cửa hàng, địa chỉ và link bản đồ trong `src/shared/i18n/locales/en/common.json` và `vi/common.json` (khóa `Main Store`/`HCMC Store`/`Hanoi Branch`, hậu tố `address`/`map URL`). Zalo ở góc phải dùng icon tự vẽ; viền xanh mở rộng 60→208px khi hover/focus/bấm mở bằng transition width 400ms (reduced motion 200ms), chữ không có hiệu ứng riêng. Link Zalo thật vẫn chờ chủ shop cung cấp.

## Hiện trạng — 16/10/2026

Mốc lịch sử gallery trước lượt deploy staging hiện tại: **gallery tối đa8 ảnh/sản phẩm** trong admin (multi-upload, cover, thứ tự, gỡ liên kết), lưu URL/public ID vào bảng đã có. Shop lấy cover; `/shop/:slug` hiển thị đầy đủ gallery; link trở về ở trên sản phẩm, nút Đặt hoa ngay chỉ có chữ.179 tests/architecture221/typecheck/build, smoke40/40 và5nhóm browser gallery PASS. Chưa push/deploy; [hướng dẫn](docs/CLOUDINARY.md), [kiểm chứng](docs/PROJECT_STATUS.md).

Phase 0–5 DONE local; Phase 6 IN PROGRESS (5/7). Các thay đổi mới được chia thành commit typography, bố cục/card, hero, catalog/DB và tài liệu; xem `git log` và trạng thái chi tiết bên dưới. Mốc triển khai ảnh category trước lượt UI hiện tại: **172/172 tests, architecture215, smoke40/40, typecheck/build và staging dry-run PASS**. Production giữ bản15/10. Mốc staging trước đó deploy `75fcbb54` ngày16/10 với layout/font/hero,4ảnh category từ DB,CSP/noindex,key staging,RateLimit/TTL24h và scheduled handler. Migration0002 chỉ áp local/staging. Cả hai chưa có TURNSTILE_SECRET;staging giữ fail-closed theo owner,login/lookup trả503; upload thật/Cron thực chạy chưa được nghiệm thu. Staging hiện4 categories/1 sản phẩm active/0 tỉnh giao. [Trạng thái và giới hạn chi tiết](docs/PROJECT_STATUS.md).

## Chạy local

```bash
npm ci
# Lần đầu: tạo .dev.vars từ .dev.vars.example, chỉ dùng giá trị demo.
npm run dev
# Terminal khác trên PowerShell:
curl.exe http://127.0.0.1:5173/api/health
npm run smoke
```

Dev: http://127.0.0.1:5173. Preview: http://127.0.0.1:4173. Port bận: dùng URL Vite in ra. `.npmrc`: npm registry HTTPS chính thức, `ignore-scripts=true`.

PowerShell: dùng `npm.cmd`/`npx.cmd` khi truyền đối số qua `--`; dùng `curl.exe` cho curl thật.

## Kiểm tra và build

```bash
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
# Terminal khác khi preview đang chạy:
npm run check:ui -- http://127.0.0.1:4173
```

`cf:typegen`: bindings, `--include-runtime=false`; runtime types từ `@cloudflare/workers-types`. `check:ui`: Edge headless trên Windows, chặn ảnh/font ngoài ở chế độ mặc định; evidence local ở `.security-review/`. Chạy audit khi đổi dependency. Chưa có ESLint.

Hai D1 remote đã áp migration0001; seed chuẩn local/production ban đầu gồm4 categories,8 products,24 variants,8 images,4 zones. Đây không phải counts hiện tại của staging; xem snapshot riêng trong PROJECT_STATUS. `db:verify` kiểm 13 nhóm trên D1 local, dùng database tạm cho phép thử ghi/xóa; xem [output nghiệm thu Phase 1](docs/pipeline/PHASE_1_DATABASE.md). Khu vực/phí, ảnh và giá/tồn seed là dữ liệu mẫu. Không áp `docs/sql/deferred/0002_custom_requests.sql`.

## Các mốc triển khai và kiểm chứng lịch sử

Các số test/source/browser trong phần này thuộc thời điểm nghiệm thu từng phase; số hiện tại ở đầu trang.

Phase 2 đã có `GET /api/categories`, `GET /api/products`, `GET /api/products/:slug`, `GET /api/delivery/options` và `POST /api/checkout/quote`. Catalog dùng tối đa 3 truy vấn D1; quote đọc giá/tồn từ DB, gộp variant trùng và trả `issues`, luôn chỉ đọc. `shared/` ở root giữ constants/schema Zod dùng chung; frontend catalog/cart/quote đã nối sớm một phần Phase 5. [Contract](docs/pipeline/API_CONTRACT.md) và [nghiệm thu/output Phase 2](docs/pipeline/PHASE_2_API_CATALOG.md).

Phase 3 hoàn tất local: API đặt đơn COD có UUID v4 `Idempotency-Key`, server tự tính tiền/phí, batch trừ tồn không điều kiện + CHECK rollback; API tra đơn bằng mã + SĐT; `transitionOrder` hoàn tồn một lần và đánh dấu COD PAID khi DELIVERED. Giỏ 15 dòng: success 35 statements, nhánh CHECK/unique diagnostic 36, retry được chặn trong giới hạn 40. Tại mốc Phase 3: `npm test` 92/92, smoke 10/10 ca order và tổng 27/27; typecheck/architecture/build pass. [Output lịch sử Phase 3](docs/pipeline/PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026).

Phase 4 DONE local (9/9 tiêu chí): đăng nhập bằng SHA-256 + `timingSafeEqual`, JWT HS256 trong cookie HttpOnly/SameSite=Strict 12 giờ, `requireAdmin`/`requireSameOrigin`, API summary/orders/products/variants/delivery-zones. Chuyển trạng thái gọi lại `transitionOrder`; chỉnh tồn ưu tiên `stock_delta` nguyên tử. Không thêm bảng hoặc dependency; không băm mật khẩu nặng trong Worker. **125/125 tests và 178 source files là mốc lịch sử Phase 4**; native workerd auth đã kiểm local, chưa đo CPU 10 ms trên cloud. [Checklist/output Phase 4](docs/pipeline/PHASE_4_ADMIN.md).

Phase 5 **DONE local (6/6 tiêu chí)**, cập nhật **15/10/2026**: frontend đã nối toàn bộ các API MVP; **136/136 tests**, typecheck, architecture **207 source files**, build và **40/40 smoke local** pass. UI kiểm **17 routes, 0 JS exceptions**; bộ nghiệm thu Phase 5 pass **10/10 kịch bản bắt buộc + 2/2 mở rộng**, snapshot D1 persisted giữ nguyên. [Bảng tiến độ, tiêu chí và bằng chứng Phase 5](docs/pipeline/PHASE_5_FRONTEND.md). Đây là bằng chứng local tại mốc Phase 5; kết quả deployment được ghi riêng ở Phase 6 bên dưới.

`npm run smoke` giữ 16 nhóm catalog trên URL local được truyền vào, rồi tự tạo HTTP loopback + D1 `persist:false`, `remoteBindings:false` để chạy ca order/admin và đối chiếu tồn/query budget. Admin smoke dùng secret demo riêng trong bộ nhớ, không cần secret thật và không sửa seed persisted hoặc remote. B2/B3 đã bổ sung local: widget/verifier Turnstile checkout/lookup/login, rate-limit bindings, cap 3 PENDING/SĐT người đặt, Cron 24 giờ/mỗi giờ đã cấu hình local và hủy IN_TRANSIT có lý do/restock mặc định false. Mốc B2/B3 có **160/160 PASS**; số ở các mốc Phase bên dưới là lịch sử. Chưa deploy thay đổi này; site key công khai đã cấu hình trong .env.production, secret Worker/hostname và deploy còn chờ owner; Cron đã chốt 24 giờ/mỗi giờ. [Cấu hình và vận hành](docs/BOT_PROTECTION.md).

**Mốc M1–M9 (15/10):** 166/166 tests, typecheck/architecture/build và 40/40 smoke PASS. Đã cấu hình site key công khai; CSP preview tải được font/ảnh/Turnstile SDK thật với test key, không vi phạm CSP. [Thay đổi, giới hạn và phần Cloudflare cần owner nhập](docs/HARDENING.md).

**Mốc Phase 6 trước B2/B3:** tests **143/143**, audit **0**, typecheck/architecture/build/dry-run PASS; verifier **13/13**, smoke local **40/40**, UI **17 routes/0 exceptions**, native auth fail-closed **9/9 cấu hình**. `node scripts/smoke.mjs --base-url https://TEN.SUBDOMAIN.workers.dev` mặc định chỉ đọc; ghi cần confirm origin/variant/exclusive window và mật khẩu qua prompt ẩn. Runner có 7 tests local; smoke API Production đã **7/7 PASS**, 10/10 kết quả MVP bằng API live + public browser (EN/VI, VND, giỏ variant 1 sau reload, 0 JS exceptions). Deployment: [lunara.minphuc2408.workers.dev](https://lunara.minphuc2408.workers.dev). Owner nhập Production password qua prompt ẩn; không đọc/reuse mật khẩu local. Đã dọn 3 SMOKE orders, orders/items/history = 0; variant 1 tồn 20, cả 24 variant khớp baseline/FK sạch. Phase 6 **5/7 tiêu chí**; còn dữ liệu thật và xác nhận đã nắm cách xem quota. [Điều kiện tiếp tục Phase 6](docs/pipeline/PHASE_6_DEPLOY.md) · [Runbook](docs/OPERATIONS.md).

**[NGƯỜI]** Trước khi dùng admin với dữ liệu thật tại local, tự đặt `ADMIN_PASSWORD` ≥24 ký tự ngẫu nhiên và `JWT_SECRET` ≥32 ký tự ngẫu nhiên, khác mật khẩu, trong `.dev.vars`; không gửi giá trị qua chat hoặc ghi vào Git/`VITE_*`. Cấu hình secret production thuộc Phase 6. Secret thiếu/trống bị từ chối; demo chỉ phục vụ kiểm thử.

`worker/config.ts` chứa giả định để chủ shop chỉnh: phụ phí Standard/Express/Same-day lần lượt 0/30.000/50.000 VND, giờ chốt 16:00, chuẩn bị tối thiểu 120 phút, khung giờ 08:00–20:00. Giới hạn API: 15 dòng giỏ, 20 sản phẩm mỗi variant sau gộp, ngày giao tối đa +30 ngày theo Asia/Ho_Chi_Minh.

Bạn có thể test `/shop`/`cart` với D1 local: chọn size, thêm giỏ, reload, đổi khu vực/phương thức để nhận báo giá VND, điền form và duyệt đơn COD. Mỗi payload được gắn UUID v4; retry payload không đổi giữ nguyên key, xác nhận chỉ xuất hiện khi API trả mã đơn và tổng tiền thật. Form/đơn/SĐT/địa chỉ không lưu vào browser storage. Admin dùng cookie server, không dùng tài khoản fixture hoặc sessionStorage. Khi một lần chỉnh tồn mất phản hồi, UI xóa delta đã nhập, khóa dòng và yêu cầu tải lại tồn từ API trước lần chỉnh tiếp; không tự gửi lại delta chưa biết đã được áp dụng hay chưa. [Backup và kiểm kê frontend](docs/pipeline/FE_AUDIT.md) · [Nghiệm thu Phase 5](docs/pipeline/PHASE_5_FRONTEND.md).

## Turnstile fail-closed — bản sửa local16/10

Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 hiện local/chưa deploy. [Chi tiết kiểm chứng và header live](docs/HARDENING.md#turnstile-fail-closed-và-header-live-16102026). Sau deploy mới, thiếu secret sẽ khóa3form bằng503; phải cấu hình đúng secret từng Worker.

## Deploy và hai widget Turnstile

```powershell
npm run deploy:staging
npm run deploy
```

Chạy tuần tự từ root repo. Script tự build và chọn `.env.staging`/`.env.production`; không cần truyền Site key. Không đặt CLOUDFLARE_ENV=staging hoặc public-key override trong terminal production. Sau deploy UI mới, nhập `TURNSTILE_SECRET` **một lần** cho từng Worker đúng cặp widget:

```powershell
npx wrangler secret put TURNSTILE_SECRET --env staging --config wrangler.jsonc
npx wrangler secret put TURNSTILE_SECRET --config wrangler.jsonc
```

Secrets được giữ qua các lần deploy. Deploy không seed/migrate/copy dữ liệu; xem [STAGING](docs/STAGING.md), [Cloudinary](docs/CLOUDINARY.md), [Turnstile](docs/BOT_PROTECTION.md).

## Tài liệu và phần tiếp theo

| Cần tra | File |
| --- | --- |
| Hiện trạng, khoảng trống, đầu vào cần chủ dự án bổ sung | [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) |
| Routes, component, data ownership, giới hạn demo | [PROJECT_GUIDE.md](PROJECT_GUIDE.md) |
| Instructions + skill | [AGENTS.md](AGENTS.md) · [lunara-flower-shop](.agents/skills/lunara-flower-shop/SKILL.md) |
| Phase 0 → deploy | [Pipeline](docs/pipeline/README.md) · [Phase 6](docs/pipeline/PHASE_6_DEPLOY.md) |
| Vận hành, backup/rollback, secrets và smoke/cleanup | [OPERATIONS.md](docs/OPERATIONS.md) |
| Stack + entity map | [TECH_STACK.md](docs/TECH_STACK.md) · [FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md) |
| Database + đối chiếu v1/v2 | [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) · [Canonical SQL](migrations/0001_mvp.sql) |

MVP: **Hono/Workers · D1/SQLite · Cloudinary (signed upload đã code local, chưa nghiệm thu thật) · Zod · COD khách vãng lai**. Phase 1 chốt nguyên DDL v2 thành `migrations/0001_mvp.sql`, nguồn schema duy nhất; hai file SQL schema cũ chỉ chứa chú thích dẫn về migration. `delivery_zones` trong MVP; `custom_requests` deferred. **Phase 0–5 DONE local; Phase 6 IN PROGRESS.** Customer auth/profile/wishlist, custom request và admin customers/settings/notifications giữ source nhưng ẩn bằng cờ; `VITE_ENABLE_CUSTOMER_AUTH` mặc định false và API-ready gate vẫn false nên không bật lại fixture. Phase 6 đã deploy, kiểm API live/public browser và dọn thử; dữ liệu mở bán vẫn mẫu, còn chờ xác nhận vận hành quota. [Bằng chứng và điều kiện tiếp tục](docs/pipeline/PHASE_6_DEPLOY.md) · [Vận hành](docs/OPERATIONS.md).

## Codex và CodeGraph

```bash
npm run assistant:setup
npm run graph:status -- --json
npm run graph:explore -- "useProducts useCartState useCheckout"
```

Setup: CodeGraph 1.5.0 local → `.codegraph/` + `.codex/config.toml` cho CodeGraph/OpenAI Docs MCP. Mở phiên trusted mới để nạp cấu hình. Wrapper tắt telemetry/fallback download; không đổi global settings.

Git: allowlist exact paths sau review; source/docs/skill được chia sẻ. `.dev.vars`, `.wrangler/`, `.codex/`, `.codegraph/`, build/dependencies/evidence ở local. `.dev.vars.example` chỉ chứa placeholder demo. Commit/push/deploy cần yêu cầu hiện tại hoặc standing authorization.

## Attribution

Figma gốc: [Flower Shop Website Design](https://www.figma.com/design/0YRitOqUypqP0K0esw8sXL/Flower-Shop-Website-Design--Copy---Community-). Attribution shadcn/ui và Unsplash: [ATTRIBUTIONS.md](ATTRIBUTIONS.md).


Rà soát tài liệu16/10/2026: [kết quả và phạm vi](docs/DOCUMENTATION_AUDIT.md). Snapshot remote là kết quả chỉ đọc; lượt rà tài liệu không deploy hoặc ghi dữ liệu.

Typography EN thử local (16/10/2026): Fraunces 500/500 Italic cho heading/logo, optical sizing tự động (opsz 9–144); Inter cho body/UI. Bỏ Caveat, nhãn hero dùng body. VI giữ Lora/Be Vietnam Pro. Google Fonts dùng preconnect + display=swap; chưa deploy.

Bố cục Home theo [Stitch](https://stitch.withgoogle.com/projects/14566722138013174841) được triển khai local16/10: hero hai cột, category DB, dải dịch vụ COD, grid/card dùng chung Shop; giữ màu Lunara và Fraunces/Inter (VI Lora/Be Vietnam Pro). Ảnh trang trí để trống chờ chủ shop cung cấp, ảnh sản phẩm giữ nguồn DB. Header search/category nối Shop qua q/category; Home có chọn size/thêm giỏ thật. Không đổi API/DDL/dependency hoặc deploy.

Hero responsive local16/10: ảnh bó hoa mới tạo bằng imagegen theo ảnh tham chiếu và chấp thuận của chủ shop; lưu src/assets/hero/lunara-bouquet-{640,960,1440}.webp (~47/83/150 KB), import Vite thay vì public, srcset/sizes + high priority. Desktop ảnh phải/gradient ngang; dưới1024px ảnh dưới chữ, khung4:3/gradient trên. Ảnh category/trang trí khác vẫn trống, ảnh DB giữ nguyên. [Nguồn/prompt](ATTRIBUTIONS.md). Chưa deploy.

Ảnh category16/10:4 thumbnail AI WebP256px đã tạo, image_url đã lưu local/staging qua migration0002 + data UPDATE riêng. UI đọc URL từ DB, preview http://127.0.0.1:4182/. Production chưa migrate; owner đã cho deploy staging với Turnstile fail-closed. [Runbook/kết quả](docs/CATEGORY_IMAGES.md).

Ảnh đã live trên [staging](https://lunara-staging.minphuc2408.workers.dev),version `75fcbb54-5528-4cc1-b101-22fdc7a91a40`:API4URL,4WebPkhớpSHA256,browserEN/VI10casePASS,0exception.172tests/schema13/13/smoke40PASS. [Nguồn và prompt](ATTRIBUTIONS.md).


Checkout16/10 local: chọn/tìm không dấu Hà Nội126 và Hồ Chí Minh168 đơn vị; quote chỉ sau lựa chọn hợp lệ, debounce350ms, không gọi theo từng ký tự.182tests/223source và8nhóm browser PASS. [Nguồn/kiểm chứng địa chỉ](docs/DELIVERY_ADDRESS.md). Chưa push/deploy.


Checkout16/10 local mới:3khối người đặt/người nhận/thiệp-yêu cầu; tự điền người nhận; payment dưới Total, COD mặc định, bank-transfer thông báo đang phát triển và khóa gửi. Consent + form hợp lệ mới đi tiếp; bỏ note cọc theo owner.186tests/225source và10nhóm browser mới +8nhóm địa chỉ PASS. Chưa push/deploy; [chi tiết](docs/CHECKOUT_UI.md).


Wrangler config16/10 local: explicit sampling10% cho observability/logs/traces, không bật traces, invocation_logs=false; staging guard giữ đúng target và sampling.186tests/typecheck/architecture225/build+dry-run2môi trường đạt; không upload/remote changes. Dry-run không chứng minh cloud diff hết. [Chi tiết](docs/STAGING.md).
