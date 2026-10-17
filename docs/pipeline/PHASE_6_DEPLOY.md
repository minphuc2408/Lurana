# Phase 6 — Deploy và nghiệm thu remote

**Mục tiêu:** MVP chạy thật trên `https://<tên>.<subdomain>.workers.dev` với D1 remote; dự kiến dùng gói Free, kiểm tra quota/chi phí trước deploy. Các bước **[NGƯỜI]** cần đầu vào/authorization của chủ dự án.

**Trạng thái:** IN PROGRESS · **5/7 tiêu chí hoàn tất**. Deployment: **[lunara.minphuc2408.workers.dev](https://lunara.minphuc2408.workers.dev)**. Ngày **15/10/2026**, chủ dự án đã deploy/đặt secrets; smoke API Production **7/7 PASS**, 10/10 kết quả chức năng MVP đã kiểm bằng API live + browser public. Tại snapshot cleanup15/10 đã dọn3 đơn SMOKE, orders/items/history=0; tồn variant 1 = 20, cả 24 variant khớp trước thử, FK sạch. Còn dữ liệu mở bán thật và xác nhận người vận hành đã nắm cách xem quota. [Hiện trạng](../PROJECT_STATUS.md) · [Runbook](../OPERATIONS.md). Smoke local giữ isolation; `--base-url` là nhánh remote riêng, mặc định chỉ đọc.

Phần checklist và bằng chứng dưới đây ghi nghiệm thu production **15/10/2026**; các lượt staging/hardening tiếp theo không thay 5/7 tiêu chí này. Phiên bản/migration từng môi trường và kết quả gần nhất ở PROJECT_STATUS; staging runbook ở [STAGING](../STAGING.md). CPU/quota thật và provider/Cron cần bằng chứng riêng, không suy từ local checks. Credentials Production chỉ do owner nhập qua prompt ẩn, không đọc lại `.dev.vars`.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 6.0 | AGENT — DONE local | Pre-flight tại mốc15/10: typecheck/architecture/tests/build/dry-run/smoke PASS; chi tiết bên dưới. Checks mới xem PROJECT_STATUS; không tự nâng nghiệm thu remote |
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
| 6.11 | NGƯỜI | **Bảo vệ trước mở bán:** nghiệm thu đúng cặp Site/Secret key, hostname và widget checkout/lookup/login; kiểm RateLimit/Cron trên môi trường được phép. Mức deploy/secret names hiện tại xem PROJECT_STATUS; không suy provider success từ metadata; [hướng dẫn](../BOT_PROTECTION.md) |
| 6.12 | NGƯỜI (tùy chọn) | **Tên miền riêng:** domain có thể có phí; chi phí hạ tầng/provider phụ thuộc quota/gói khi deploy. Gắn Custom Domain cho Worker rồi kiểm tra cookie admin và `Origin` trên domain mới |
| 6.13 | NGƯỜI — chờ xác nhận | Đã hướng dẫn ngắn Workers & Pages → lunara → Metrics và D1 → lunara-db → Metrics/Row Metrics; owner yêu cầu hướng dẫn, chưa xác nhận đã nắm cách xem. Xem mục 8 OPERATIONS; không tự tạo nhắc lịch |
| 6.14 | AGENT — DONE tài liệu | Đã viết [docs/OPERATIONS.md](../OPERATIONS.md): backup/mở offline, rollback, hạn mức, đổi secrets, phí giao/tồn và smoke/cleanup. Chủ dự án còn cần xác nhận quy trình theo dõi hằng ngày |

## Vận hành

[OPERATIONS](../OPERATIONS.md) là nguồn quy trình backup/rollback, remote smoke/đối soát/cleanup, secrets, quota và stock_delta chưa rõ kết quả. Không chạy lại lệnh cleanup hoặc seed lịch sử bên dưới trên dữ liệu hiện tại; mỗi lượt ghi remote cần phạm vi đã duyệt và đối soát riêng.

## Tiêu chí nghiệm thu — mốc production 15/10/2026

- [x] URL `workers.dev` truy cập được; tải lại ở `/shop`, `/orders/track` vẫn hiển thị app (SPA fallback).
- [x] D1 remote tại mốc15/10: base 0001 đã áp, không còn migration chờ của artifact khi đó; 10 bảng nghiệp vụ. Không khẳng định migration mới trong source đã có ở production.
- [x] 10 kịch bản "MVP xong" pass **trên bản deploy** bằng API live + public browser; smoke remote 7/7 pass (xem phạm vi bên dưới).
- [x] Secrets Production do owner đặt phía server/Cloudflare và nhập vào prompt ẩn cho smoke; không ghi giá trị vào Git/source/log. Auth thiếu/trống secret fail-closed đã kiểm native workerd local; không xóa secrets Production để test.
- [ ] Dữ liệu mở bán thật: **cleanup đã xong**, nhưng khu vực/phí giao, sản phẩm/ảnh/giá và tồn thực chưa được chủ shop cung cấp/chốt; sản phẩm mẫu chưa ẩn, vùng ví dụ chưa tắt.
- [x] Đã xuất một bản backup thử và mở lại được (không commit).
- [ ] Vận hành: **OPERATIONS và hướng dẫn hai bước xem quota đã có**; còn chờ chủ dự án xác nhận đã nắm cách xem hạn mức Workers/D1 hằng ngày.

## Bằng chứng thực thi — 15/10/2026

- Pre-flight lịch sử 15/10 trước hardening: typecheck PASS; architecture **207 source files**; **143/143 tests** (136 mốc Phase 5 + 7 kiểm thử smoke remote mới); audit **0 advisory**; build và `wrangler deploy --dry-run` PASS. UI preview **17 routes/0 exceptions** (EN/VI, cart persistence, fee fallback). Native workerd auth kiểm **9/9 cấu hình** (hợp lệ, thiếu/trống/ngắn/trùng secret), từ chối 401 và không cấp cookie khi không hợp lệ; cookie cũ cũng bị chặn.
- Smoke remote runner đã kiểm toàn bộ API flow qua **HTTP loopback + D1 workerd cô lập**: 3 SMOKE orders (DELIVERED/PAID, CANCELLED, CANCELLED), stock baseline được khôi phục, race phải đúng 201 + 409/OUT_OF_STOCK. Lost stock response hoặc committed order thiếu confirmation hợp lệ dừng tự recovery, không retry/cộng bù đoán. CLI vẫn buộc public HTTPS origin; **7/7 tests là kiểm chứng local, chưa remote acceptance**.
- Local state mới cô lập đã migrate/seed, verifier13/13 (46 assertions), preview smoke40/40 PASS; mọi ca ghi dùng persist:false/remoteBindings:false và synthetic secrets. Không reset state preview đang dùng.
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
3. **Bảo vệ trước mở bán:** nghiệm thu Turnstile/provider/hostname, Cron cloud và quota/CPU theo [BOT_PROTECTION](../BOT_PROTECTION.md), [HARDENING](../HARDENING.md). Các control trong source và secret names không thay kiểm chứng thật.

Bằng chứng staging và các cập nhật sau deployment production15/10 thuộc [PROJECT_STATUS](../PROJECT_STATUS.md), với quy trình tại STAGING và runbook chức năng. File này giữ mốc production 5/7, không dùng staging hoặc kiểm local để đánh dấu DONE.
