# Phase 6 — Deploy và nghiệm thu remote

**Mục tiêu:** MVP chạy thật trên `https://<tên>.<subdomain>.workers.dev` với D1 remote; dự kiến dùng gói Free, kiểm tra quota/chi phí trước deploy. Các bước **[NGƯỜI]** cần đầu vào/authorization của chủ dự án.

**Trạng thái:** IN PROGRESS · **5/7 tiêu chí hoàn tất**. Deployment: **[lunara.minphuc2408.workers.dev](https://lunara.minphuc2408.workers.dev)**. Ngày **15/10/2026**, chủ dự án đã deploy/đặt secrets; smoke API Production **7/7 PASS**, 10/10 kết quả chức năng MVP đã kiểm bằng API live + browser public. Đã dọn 3 đơn SMOKE, orders/items/history = 0; tồn variant 1 = 20, cả 24 variant khớp trước thử, FK sạch. Còn dữ liệu mở bán thật và xác nhận người vận hành đã nắm cách xem quota. [Hiện trạng](../PROJECT_STATUS.md) · [Runbook](../OPERATIONS.md). Smoke local giữ isolation; `--base-url` là nhánh remote riêng, mặc định chỉ đọc.

**Đầu vào lịch sử tại mốc Phase 5 (15/10/2026):** Phase 0–5 DONE local; backend Phase 4 đạt 9/9 tiêu chí, frontend Phase 5 đạt 6/6 tiêu chí cùng 10/10 kịch bản bắt buộc +2/2 mở rộng. Khi đó tests 136/136, architecture 207 source files, smoke local 40/40 và UI 17 routes/0 exceptions. [Bằng chứng Phase 5](PHASE_5_FRONTEND.md) không thay nghiệm thu remote phía dưới. Mốc trước B2/B3 có 143/143 tests. Mốc B2/B3 có 158 tests (sau Cron:160); M1–M9 hiện có 166/166 tests, widget/verifier, rate-limit bindings và public site key đã cấu hình local; secret/hostname/deploy còn chờ owner. Xem docs/BOT_PROTECTION.md để phân biệt bằng chứng local và cloud. CPU 10 ms chưa được đo từ dashboard cloud; smoke thành công không thay số đo CPU. Chủ dự án quản lý secrets; credential smoke Production chỉ nhập ở prompt ẩn, không đọc hoặc sử dụng mật khẩu local từ `.dev.vars`.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 6.0 | AGENT — DONE local | Typecheck/architecture/build/dry-run PASS; tests **143/143**, audit **0**; verifier **13/13**, smoke local **40/40**, UI **17 routes/0 exceptions**. Default reset bị khóa Windows; migrate/seed fresh state cô lập đã pass (xem bằng chứng). Auth fail-closed native **9/9**; remote runner có **7 tests** local; bằng chứng Production tách ở 6.8 |
| 6.1 | NGƯỜI — đã làm | Tài khoản Cloudflare đã có; kiểm tra 2FA khi chuẩn bị production. Quota/thẻ/chi phí phải đối chiếu gói lúc deploy |
| 6.2 | NGƯỜI — đã làm | Wrangler login/whoami đã thành công; không đăng nhập lại trong Phase 0 hoặc lúc rà tài liệu |
| 6.3 | NGƯỜI→AGENT — DONE | `whoami` đã đối chiếu account đang đăng nhập; `d1 info` xác nhận đúng tên/UUID và 0 bảng trước migrate. `account_id` được pin trong Wrangler; không create lại |
| 6.4 | AGENT — DONE | `npx wrangler d1 migrations apply lunara-db --remote` đã áp `0001_mvp.sql`; list không còn migration chờ, SELECT `d1_migrations` có `0001_mvp.sql`, đủ 10 bảng nghiệp vụ (không đếm bảng nội bộ) |
| 6.5 | AGENT — DONE | Đã nạp đúng `docs/sql/MVP_SEED_DEV.sql`: 4 categories/8 products/24 variants/8 images/4 zones, 0 orders, FK check rỗng. Đây là dữ liệu mẫu; không chạy lại seed sau khi nhập dữ liệu thật |
| 6.6 | NGƯỜI — DONE | Chủ dự án tự deploy; HTTPS URL thật và SPA `/shop`, `/orders/track` đã kiểm qua API/browser |
| 6.7 | NGƯỜI — DONE | Cloudflare có ADMIN_PASSWORD/JWT_SECRET; owner nhập Production password tại prompt terminal ẩn. Login/session và cookie HTTPS HttpOnly/Strict/Secure PASS; không dùng password local, không ghi credential vào file/log/source |
| 6.8 | AGENT — DONE | User duyệt đúng origin và **variant 1 BPB-S**, cửa sổ không giao dịch khách/chỉnh tồn đồng thời. Smoke Production **7/7**, 10/10 kết quả MVP qua API live + public browser. Checkout/admin nghiệp vụ kiểm qua API; không gọi là nghiệm thu đầy đủ checkout/admin UI remote |
| 6.9 | AGENT — DONE | Đã xác minh cả 3 SMOKE orders thuộc run hiện tại, chỉ variant 1, cả 24 tồn khớp baseline; chạy đúng `DELETE FROM orders WHERE customer_note LIKE 'SMOKE%';`. Sau dọn orders/items/history = 0, variant 1 tồn 20, FK sạch; không cộng tồn lại sau DELETE |
| 6.10 | NGƯỜI | **Dữ liệu thật:** (a) qua admin → Phí giao: nhập khu vực giao thật, phí, ngưỡng miễn phí; tắt (`is_active = 0`) dòng ví dụ. (b) Sản phẩm: tạo sản phẩm thật (ảnh = URL, vd. tải ảnh lên Cloudinary dashboard rồi dán URL); **ẩn** (`HIDDEN`) sản phẩm mẫu thay vì xóa. (c) Chỉnh `worker/config.ts` (phụ phí, giờ chốt, khung giờ) rồi deploy lại |
| 6.11 | NGƯỜI | **B2 local đã có code và public key:** kiểm hostname widget, owner nhập Worker secret đúng cặp rồi deploy đồng bộ; checkout/lookup/login đã có widget/verifier. Rate-limit bindings đi cùng deploy. Cron 24 giờ/mỗi giờ đã chốt local, chờ deploy; custom domain/WAF tùy chọn; [hướng dẫn](../BOT_PROTECTION.md) |
| 6.12 | NGƯỜI (tùy chọn) | **Tên miền riêng:** domain có thể có phí; chi phí hạ tầng/provider phụ thuộc quota/gói khi deploy. Gắn Custom Domain cho Worker rồi kiểm tra cookie admin và `Origin` trên domain mới |
| 6.13 | NGƯỜI — chờ xác nhận | Đã hướng dẫn ngắn Workers & Pages → lunara → Metrics và D1 → lunara-db → Metrics/Row Metrics; owner yêu cầu hướng dẫn, chưa xác nhận đã nắm cách xem. Xem mục 8 OPERATIONS; không tự tạo nhắc lịch |
| 6.14 | AGENT — DONE tài liệu | Đã viết [docs/OPERATIONS.md](../OPERATIONS.md): backup/mở offline, rollback, hạn mức, đổi secrets, phí giao/tồn và smoke/cleanup. Chủ dự án còn cần xác nhận quy trình theo dõi hằng ngày |

## Vận hành (nội dung cho `OPERATIONS.md`)

**Sao lưu**
- D1 Time Travel: `npx wrangler d1 time-travel info lunara-db`; kiểm tra retention/quota của gói thực tế trước vận hành.
- Xuất định kỳ (đề xuất hằng tuần): `npx wrangler d1 export lunara-db --remote --output=backup-YYYYMMDD.sql`. File chứa **tên, SĐT, địa chỉ khách** → **không commit**, cất ở nơi riêng tư.

**Rollback**
- Worker/frontend: `npx wrangler rollback` về phiên bản trước (xem `npx wrangler deployments list`).
- Schema: không sửa migration đã áp dụng; viết migration mới tiến về phía trước. Dữ liệu hỏng → dùng Time Travel (kiểm tra kỹ thời điểm trước khi khôi phục).

**Khi chạm hạn mức Free**
- Đọc lỗi/quota/reset window từ dashboard và tài liệu Cloudflare hiện hành; xác nhận static assets/API chịu ảnh hưởng thế nào. Tạm chờ reset hoặc điều chỉnh gói sau khi chủ dự án quyết định chi phí. Không suy ra hạn mức cloud từ kết quả local.
- Nguyên nhân thường gặp: bot quét API, truy vấn thiếu index/quét toàn bảng, vòng lặp gọi API ở frontend. Bật Turnstile (6.11) và rà log.

**Đổi mật khẩu admin:** `npx wrangler secret put ADMIN_PASSWORD`; đổi `JWT_SECRET` để **thu hồi mọi phiên** đang đăng nhập.

**Thêm khu vực giao:** trang admin → Phí giao; không ghi SQL remote ngoài danh sách đã duyệt.

**Chỉnh tồn khi mất phản hồi:** UI admin dùng stock_delta. Nếu báo lỗi chưa biết kết quả ghi, delta đã nhập được xóa và dòng bị khóa; bấm tải lại để GET tồn hiện tại thành công, đối chiếu tồn thực tế rồi nhập delta mới. Không tự lặp delta cũ vì request trước có thể đã được áp dụng. Luồng này đã kiểm local Phase 5; vẫn cần kiểm lại trên deployment remote.

## Tiêu chí nghiệm thu

- [x] URL `workers.dev` truy cập được; tải lại ở `/shop`, `/orders/track` vẫn hiển thị app (SPA fallback).
- [x] D1 remote: `migrations list` không còn migration chờ, SELECT `d1_migrations` có `0001_mvp.sql`; 10 bảng nghiệp vụ tồn tại.
- [x] 10 kịch bản "MVP xong" pass **trên bản deploy** bằng API live + public browser; smoke remote 7/7 pass (xem phạm vi bên dưới).
- [x] Secrets Production do owner đặt phía server/Cloudflare và nhập vào prompt ẩn cho smoke; không ghi giá trị vào Git/source/log. Auth thiếu/trống secret fail-closed đã kiểm native workerd local; không xóa secrets Production để test.
- [ ] Dữ liệu mở bán thật: **cleanup đã xong**, nhưng khu vực/phí giao, sản phẩm/ảnh/giá và tồn thực chưa được chủ shop cung cấp/chốt; sản phẩm mẫu chưa ẩn, vùng ví dụ chưa tắt.
- [x] Đã xuất một bản backup thử và mở lại được (không commit).
- [ ] Vận hành: **OPERATIONS và hướng dẫn hai bước xem quota đã có**; còn chờ chủ dự án xác nhận đã nắm cách xem hạn mức Workers/D1 hằng ngày.

## Bằng chứng thực thi — 15/10/2026

- Pre-flight hiện tại: typecheck PASS; architecture **207 source files**; **143/143 tests** (136 mốc Phase 5 + 7 kiểm thử smoke remote mới); audit **0 advisory**; build và `wrangler deploy --dry-run` PASS. UI preview **17 routes/0 exceptions** (EN/VI, cart persistence, fee fallback). Native workerd auth kiểm **9/9 cấu hình** (hợp lệ, thiếu/trống/ngắn/trùng secret), từ chối 401 và không cấp cookie khi không hợp lệ; cookie cũ cũng bị chặn.
- Smoke remote runner đã kiểm toàn bộ API flow qua **HTTP loopback + D1 workerd cô lập**: 3 SMOKE orders (DELIVERED/PAID, CANCELLED, CANCELLED), stock baseline được khôi phục, race phải đúng 201 + 409/OUT_OF_STOCK. Lost stock response hoặc committed order thiếu confirmation hợp lệ dừng tự recovery, không retry/cộng bù đoán. CLI vẫn buộc public HTTPS origin; **7/7 tests là kiểm chứng local, chưa remote acceptance**.
- `db:reset:local` mặc định gặp EPERM do preview đang giữ state Windows. Backup trước reset đã mở được, integrity `ok`, orders 0; không dừng preview đang chạy. Đã migrate/seed thành công trên state local mới `.security-review/phase6-fresh-state`; `db:verify` 13/13 nhóm, 46 assertions; smoke preview `http://127.0.0.1:4175` 40/40 PASS. Ca ghi vẫn D1 `persist:false`, `remoteBindings:false`, synthetic secrets.
- Rà Git/client/Worker upload không có giá trị ADMIN_PASSWORD/JWT_SECRET thật. Cloudflare Vite tạo bản `.dev.vars` local trong `dist/lunara/` ignored để preview; không nằm trong assets `dist/client/` hoặc bundle upload, không phải secrets production đã đặt.
- D1 remote UUID `1796e7bf-d230-4bc1-a80a-f4be4d1eccc7`: `0001_mvp.sql` áp 25 commands, seed áp 48 queries. SELECT sau ghi xác nhận counts `4/8/24/8/4`, orders `0`, `PRAGMA foreign_key_check` `[]`. DDL canonical không thay đổi; deferred/0002 không áp dụng.
- Backup remote: `.security-review/phase6-remote-initial-20261015.sql` (ignored), mở vào SQLite in-memory: integrity `ok`, FK `[]`, counts khớp remote. Không restore lên remote; không chia sẻ signed download URL do Wrangler in ra.
- Các bằng chứng migrate/seed/backup trên là mốc ban đầu. Lượt Production phía dưới cập nhật trạng thái deploy/smoke/cleanup; seed mẫu vẫn ACTIVE và vùng phí ví dụ vẫn active, nên tiêu chí dữ liệu thật chưa đạt.

### Production smoke và browser — 15/10/2026

- Origin duy nhất `https://lunara.minphuc2408.workers.dev`, variant duy nhất **1 / BPB-S**. Owner xác nhận website chưa mở bán, không có đơn khách hoặc sửa tồn đồng thời. Owner tự nhập Production password trong cửa sổ terminal có prompt ẩn; không đọc/reuse `.dev.vars`, không truyền password trong args, không lưu credential/cookie vào evidence.
- Run `d2e606fe-d499-41fd-84d0-ab55e44f2b4d`, khoảng **17:39–17:40 giờ Việt Nam**: API **7/7 PASS**. Tạo đúng 3 đơn `SMOKE`: 1 DELIVERED/PAID, 2 CANCELLED/UNPAID với stock_released = 1. Race phải trả đúng 201 và 409/OUT_OF_STOCK; replay không tạo thêm đơn hoặc trừ tồn.
- Đối chiếu D1 trước cleanup: đúng 3 đơn thuộc run này, mọi item chỉ variant 1; **cả 24 variant khớp tồn trước thử**, variant 1 = 20, FK `[]`. Chạy đúng DELETE được duyệt ở 6.9; sau dọn **orders = items = history = SMOKE orders = 0**, tồn 24 variant vẫn khớp, FK `[]`. DELETE không tự hoàn tồn và không cần cộng bù thêm.
- Browser thật trên deployment: Home/Shop/Cart EN/VI và VND; chỉ Add variant 1, qty 1; giỏ giữ variant/qty sau hard reload; đổi locale giữ tổng quote server; `/orders/track` hard reload/form EN/VI; navigation deferred ẩn, **0 JS exceptions**. Browser chỉ GET public và POST quote chỉ đọc; không gửi admin/order mutations hoặc nhập credential. Lookup, COD và admin transitions được kiểm bằng API live.
- Evidence riêng tư ignored: `.security-review/phase6-live-20261015-01/` (result/log đã lọc và snapshots/reconciliation); `.security-review/phase6-public-cart-track-1792060890541.json` (Cart/track PASS); `.security-review/phase6-deployed-public-1792060819630.json` (Home/Shop; Cart assertion đầu chạy trước quote-ready, đã kiểm lại PASS). Không đưa evidence, browser profiles hay backup vào Git.

| # MVP | Kết quả trên deployment | Bằng chứng |
| --- | --- | --- |
| 1 | PASS catalog/detail và giá VND | API + Home/Shop EN/VI browser |
| 2 | PASS Add/reload giỏ variant 1, qty 1 | Cart browser, storage chỉ IDs/qty |
| 3 | PASS COD, mã đơn/tổng server, trừ tồn 1 | API live + đối chiếu D1 |
| 4 | PASS mua món cuối song song: 201 + 409 OUT_OF_STOCK | API live |
| 5 | PASS cùng Idempotency-Key trả cùng đơn, không trừ thêm tồn | API live/order count |
| 6 | PASS bỏ qua giá/phí/tổng client giả | API live/snapshot đơn |
| 7 | PASS phí phường/mặc định tỉnh/NO_DELIVERY_ZONE | API live với zones hiện có |
| 8 | PASS lookup sender/recipient đúng; SĐT sai 404 | API live; browser chỉ kiểm form/reload |
| 9 | PASS login HTTPS, transition hợp lệ, PAID, hủy hoàn đúng một lần | API live; không tuyên bố admin UI remote đã test đủ |
| 10 | PASS VND, không ₱/fixture frontend ở luồng kiểm | Browser public + API thật; **D1 seed vẫn là mẫu**, tách tiêu chí dữ liệu thật |

## Đầu vào cần để tiếp tục

1. **Dữ liệu thật 6.10:** catalog/ảnh/giá/SKU/tồn và khu vực/phí/ngưỡng miễn phí; chốt phụ phí/cutoff/slots. Chủ shop nhập qua admin hoặc cung cấp bộ dữ liệu đã duyệt; không suy đoán từ seed. Ẩn sản phẩm mẫu, tắt vùng ví dụ sau khi có dữ liệu thay thế. Sau thay dữ liệu cần kiểm lại catalog/quote, không chạy lại seed để ghi đè.
2. **Vận hành:** đã hướng dẫn ngắn mục 8 [OPERATIONS](../OPERATIONS.md); owner cần xác nhận đã nắm cách kiểm dashboard Workers/D1 hằng ngày. Yêu cầu hướng dẫn chưa được tính là xác nhận tiêu chí; chưa tạo nhắc lịch tự động.
3. **Turnstile:** B2 local đã nối widget/verifier checkout/lookup/login đúng action/hostname. Owner tạo widget, đặt site key build + secret Worker và deploy bản mới cùng cấu hình; không bật riêng secret trên UI cũ. Rate-limit bindings đã khai báo local và hỗ trợ workers.dev. Cron 24 giờ/mỗi giờ đã chốt local; custom domain/WAF tùy chọn; không tự tạo domain/chi phí/remote write. [Hướng dẫn](../BOT_PROTECTION.md).

Staging bổ sung: mới cấu hình local Worker/D1 riêng; chưa xác minh/migrate/seed/secrets/deploy remote staging. Không thay 5/7 tiêu chí production. Xem [STAGING](../STAGING.md).

### Đổi tên hiển thị Lunara Shop — 15/10/2026

Owner yêu cầu đổi tên website và deploy production. Tab title/meta description, logo header/footer/admin/login, copyright và locale EN/VI đã cập nhật. `npm run deploy` PASS lên Worker lunara / lunara-db, version `26d0811c-f2f0-4f7f-a0fa-7cb175035d06`, URL https://lunara.minphuc2408.workers.dev. Không migrate/seed hoặc ghi D1 remote. Typecheck/build/architecture PASS; 143/143 tests PASS (lỗi i18n Lunara cũ hết sau đổi logo sang key common mới). Browser local và production xác nhận title/header/footer EN/VI ở 320/390/1440px, admin login, không overflow/chồng menu hoặc JS exception. Kiểm UI tổng quát đi qua 17 routes nhưng dừng trong luồng quote vì test đợi tổng 670.000 trước khi chọn khu vực giao; không tuyên bố suite UI tổng quát PASS. Không thay 5/7 tiêu chí Phase 6, chưa deploy staging. Script/evidence kiểm branding giữ local ignored tại .security-review/.

## B2/B3 — local hardening sau deployment trên (15/10/2026)

Chưa deploy hoặc sửa secrets/trigger/domain/D1 remote. Code có Turnstile UI/verifier checkout/lookup/login, RateLimit bindings, cap 3 PENDING/SĐT, hủy IN_TRANSIT có lý do và restock mặc định false; Cron 24 giờ/mỗi giờ đã cấu hình local, chờ deploy. **158/158 tests**, typecheck/architecture **211 files**/build và **40/40 smoke** PASS. Local native RateLimit: sáu login JSON không hợp lệ trả 400, lần bảy 429. UI/provider mock **10/10 MVP**, CRUD và B3 hai lựa chọn tồn PASS; widget hết hạn/lỗi/thử lại/token mới UUID cũ/EN/VI/compact 320–1440px PASS, persisted D1 giữ nguyên, 0 JS exceptions. Nhóm responsive rộng còn tràn `/shop` 320px; không xác nhận toàn suite PASS. Cloud challenge/quota/CPU chưa kiểm; owner cần cấu hình theo [runbook](../BOT_PROTECTION.md). Phase 6 giữ 5/7.

Cập nhật staging 15/10/2026: đã xác minh remote lunara-staging-db / ed391b18-0bcf-41b3-8315-389807ace7f2 và áp 0001_mvp.sql thành công (25 commands). Đã kiểm đủ 10 bảng nghiệp vụ, lịch sử 0001, không còn migration chờ, foreign_key_check rỗng, orders=0. db:verify local cô lập PASS 13/13 nhóm, 46 assertions. Chưa seed, đặt secrets hoặc deploy staging; production không được truy cập/ghi trong lượt sửa này.

Cloudinary 15/10/2026: đã tích hợp local signed direct upload (SHA-256, cookie admin/same-origin, JPEG/PNG/WebP, client 5 MB, prefix local/staging/prod). Typecheck/build/architecture 208 source files PASS; tests 148/148, smoke local 40/40 PASS. Browser mock EN/VI 390px PASS: file sai, thành công/preview, Save URL, thiếu config giữ URL; 0 JS exceptions. Chưa tạo preset/đặt keys/upload thật/deploy tính năng, không ghi D1 remote; Phase 6 vẫn 5/7. Không thêm migration/dependency hoặc tự xóa asset. [Cấu hình Cloudinary](../CLOUDINARY.md).

Staging categories fix — 15/10/2026: API public ban đầu categories=[] và products=[]; nút Save product khóa vì thiếu danh mục, không phải vì tồn 0. Owner chọn thêm đúng 4 danh mục mẫu từ canonical seed, giữ sản phẩm trống. Đã INSERT OR IGNORE chỉ categories vào lunara-staging-db (UUID ed391b18-0bcf-41b3-8315-389807ace7f2). D1/API xác nhận categories=4, products=variants=orders=delivery_zones=0, FK sạch; production không truy cập/ghi. UI local thêm giải thích thiếu danh mục + Reload categories EN/VI; chưa deploy thay đổi thông báo này. Typecheck/architecture 208 files/tests 148/build PASS; db:verify 13/13, 46 assertions. Browser mock EN/VI 390px xác nhận khóa khi trống, reload mở khóa, submit tồn 0; backend in-memory lưu đủ 3 variant tồn 0. Chưa tạo đơn/sản phẩm test remote hoặc nạp toàn bộ seed; staging thiếu delivery zones nên checkout chưa được nghiệm thu.

Form sản phẩm 15/10/2026: chọn/upload ảnh là mặc định; Image URL nằm trong tùy chọn phụ thu gọn. Không còn ô nhập slug; khi tạo, client sinh slug từ tên EN (fallback VI), bỏ dấu/ký tự đặc biệt + UUID v4, tối đa 200 ký tự; giữ slug đã sinh trong draft khi thử lưu lại, không đổi slug sản phẩm cũ. Chưa chọn ảnh hiển thị lỗi EN/VI; upload thành công xóa lỗi cũ. Backend contract/DDL không đổi, slug vẫn được API yêu cầu và unique DB kiểm tra. Typecheck/architecture/build, 150 tests và browser mock form EN/VI 390px PASS; không upload thật/ghi remote/deploy trong lượt này. Verifier Phase 5 tổng quát dừng ở ca 3 do chờ tổng quote trước khi chọn khu vực (2/10, 0/2 mở rộng, persisted D1 không đổi); không coi là suite UI PASS.


Owner chốt chính sách Cron 24 giờ/mỗi giờ (15/10/2026): production/staging đã khai báo `PENDING_ORDER_TTL_HOURS="24"` và `0 * * * *` trong Wrangler, chưa deploy. Scheduled handler chuyển sang batch 3 statements xử lý toàn bộ PENDING quá hạn, hoàn tồn đúng một lần và ghi SYSTEM; xác nhận/hủy admin được D1 tuần tự hóa với batch. Kiểm local hiện tại **160/160 tests**, typecheck/architecture/build PASS, **40/40 smoke**, persisted D1 giữ nguyên. Ca D1 mới kiểm nhiều đơn/15 dòng, đúng mốc 24h, timestamp ISO/SQLite, mọi trạng thái đã xác nhận, Cron chạy chồng, xác nhận trước batch và rollback lịch sử/tồn/trạng thái.

M1–M9 local 15/10/2026: 166/166 tests, typecheck/architecture 215 files/build production + staging, smoke40/40 PASS. Preview Workers Static Assets: header/noindex route riêng, Google Fonts/ảnh và SDK Turnstile thật dùng key test PASS; 0 CSP violations/JS exceptions. UI cô lập10/10 MVP +CRUD/B3/widget mock PASS; nhóm responsive rộng không chạy lại. Public site key owner đã cấu hình .env.production; secret/hostname/deploy cần owner, chưa nghiệm thu key thật/cloud quota/CPU. [Chi tiết](../HARDENING.md). Phase 6 giữ5/7.
