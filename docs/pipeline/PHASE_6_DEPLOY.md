# Phase 6 — Deploy và nghiệm thu remote

**Mục tiêu:** MVP chạy thật trên `https://<tên>.<subdomain>.workers.dev` với D1 remote; dự kiến dùng gói Free, kiểm tra quota/chi phí trước deploy. Các bước **[NGƯỜI]** cần đầu vào/authorization của chủ dự án.

**Trạng thái:** IN PROGRESS · **2/7 tiêu chí hoàn tất** (migration remote, backup thử). Ngày **15/10/2026** đã kiểm pre-flight, áp migration/seed D1 remote và mở lại backup offline. Chưa deploy, đặt secrets production, chạy smoke trên URL thật hoặc nhập dữ liệu thật. [Hiện trạng / đầu vào](../PROJECT_STATUS.md) · [Runbook vận hành](../OPERATIONS.md). Không làm lại đăng ký/login/create D1. Smoke local giữ isolation; `--base-url` là nhánh remote riêng, mặc định chỉ đọc.

**Đầu vào hiện tại (15/10/2026):** Phase 0–5 DONE local; backend Phase 4 đạt 9/9 tiêu chí, frontend Phase 5 đạt 6/6 tiêu chí cùng 10/10 kịch bản bắt buộc +2/2 mở rộng. Checkout COD/retry/xác nhận, public lookup, cookie login và admin orders/products/stock/delivery/summary đã nối; EN mặc định/fallback, VND/giờ VN giữ nguyên. Typecheck/architecture (207 source files)/136 tests/build, 40/40 smoke local và UI 17 routes/0 exceptions pass; persisted D1 snapshot không đổi. [Bằng chứng Phase 5](PHASE_5_FRONTEND.md). Đây chưa phải nghiệm thu remote hoặc đủ cổng mở bán. Test ghi chạy HTTP loopback + workerd D1 cô lập/secret demo, không kiểm deployment remote hoặc đặt secret thật. Auth thiếu/trống secret bị từ chối; cookie HttpOnly/SameSite=Strict và Secure trên HTTPS, ghi cần Origin đúng/JSON. **[NGƯỜI]** quản lý ADMIN_PASSWORD/JWT_SECRET thật cho local và production ở 6.7. Verifier Turnstile đã có nhưng widget/domain/site key/secret thật và rate limit chưa có. Chỉ thêm chế độ remote khi thực hiện Phase 6 có authorization; giữ nguyên isolation và guard local của bộ test hiện tại. CPU 10 ms là ràng buộc thiết kế chưa được đo/xác nhận trên cloud.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 6.0 | AGENT — DONE local | Typecheck/architecture/build/dry-run PASS; tests **143/143**, audit **0**; verifier **13/13**, smoke local **40/40**, UI **17 routes/0 exceptions**. Default reset bị khóa Windows; migrate/seed fresh state cô lập đã pass (xem bằng chứng). Auth fail-closed native **9/9**; đã thêm remote mode và **7 tests** local, mọi đơn smoke có note `SMOKE`. Chưa chạy smoke trên deployment |
| 6.1 | NGƯỜI — đã làm | Tài khoản Cloudflare đã có; kiểm tra 2FA khi chuẩn bị production. Quota/thẻ/chi phí phải đối chiếu gói lúc deploy |
| 6.2 | NGƯỜI — đã làm | Wrangler login/whoami đã thành công; không đăng nhập lại trong Phase 0 hoặc lúc rà tài liệu |
| 6.3 | NGƯỜI→AGENT — DONE | `whoami` đã đối chiếu account đang đăng nhập; `d1 info` xác nhận đúng tên/UUID và 0 bảng trước migrate. `account_id` được pin trong Wrangler; không create lại |
| 6.4 | AGENT — DONE | `npx wrangler d1 migrations apply lunara-db --remote` đã áp `0001_mvp.sql`; list không còn migration chờ, SELECT `d1_migrations` có `0001_mvp.sql`, đủ 10 bảng nghiệp vụ (không đếm bảng nội bộ) |
| 6.5 | AGENT — DONE | Đã nạp đúng `docs/sql/MVP_SEED_DEV.sql`: 4 categories/8 products/24 variants/8 images/4 zones, 0 orders, FK check rỗng. Đây là dữ liệu mẫu; không chạy lại seed sau khi nhập dữ liệu thật |
| 6.6 | NGƯỜI | **Deploy lần đầu:** `npm run deploy`. Có thể được hỏi chọn subdomain `workers.dev` (chọn tên không lộ thông tin cá nhân) |
| 6.7 | NGƯỜI | **Đặt secret:** `npx wrangler secret put ADMIN_PASSWORD` và `npx wrangler secret put JWT_SECRET` (giá trị ngẫu nhiên dài; xem Phase 4). Sau đó đăng nhập admin thử |
| 6.8 | AGENT — chờ URL/secrets | `node scripts/smoke.mjs --base-url https://<url>` chỉ đọc. Full API smoke cần thêm `--allow-remote-writes --confirm-origin https://<url> --variant-id <id> --exclusive-test-window`, mật khẩu qua prompt ẩn. Chạy riêng 10 kịch bản gồm UI trong [README](README.md#8-định-nghĩa-mvp-xong); xem [runbook](../OPERATIONS.md#3-smoke-trên-deployment-và-cleanup) |
| 6.9 | AGENT | **Dọn dữ liệu thử:** `DELETE FROM orders WHERE customer_note LIKE 'SMOKE%';` (xóa dây chuyền items/history) và đặt lại tồn các variant về giá trị thật (hoặc nhập tồn thật ở 6.10). Kiểm tra `SELECT COUNT(*) FROM orders` |
| 6.10 | NGƯỜI | **Dữ liệu thật:** (a) qua admin → Phí giao: nhập khu vực giao thật, phí, ngưỡng miễn phí; tắt (`is_active = 0`) dòng ví dụ. (b) Sản phẩm: tạo sản phẩm thật (ảnh = URL, vd. tải ảnh lên Cloudinary dashboard rồi dán URL); **ẩn** (`HIDDEN`) sản phẩm mẫu thay vì xóa. (c) Chỉnh `worker/config.ts` (phụ phí, giờ chốt, khung giờ) rồi deploy lại |
| 6.11 | NGƯỜI (tùy chọn) | **Turnstile:** tạo widget ở dashboard (khóa site + secret), đặt `VITE_TURNSTILE_SITE_KEY` lúc build và `npx wrangler secret put TURNSTILE_SECRET`; gắn widget vào checkout và form đăng nhập admin; giới hạn hostname cho widget |
| 6.12 | NGƯỜI (tùy chọn) | **Tên miền riêng:** domain có thể có phí; chi phí hạ tầng/provider phụ thuộc quota/gói khi deploy. Gắn Custom Domain cho Worker rồi kiểm tra cookie admin và `Origin` trên domain mới |
| 6.13 | NGƯỜI | **Theo dõi hạn mức:** xem dashboard Workers/D1 theo quota gói thực tế; đặt nhắc việc lặp lại khi vận hành |
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

- [ ] URL `workers.dev` truy cập được; tải lại ở `/shop`, `/orders/track` vẫn hiển thị app (SPA fallback).
- [x] D1 remote: `migrations list` không còn migration chờ, SELECT `d1_migrations` có `0001_mvp.sql`; 10 bảng nghiệp vụ tồn tại.
- [ ] 10 kịch bản "MVP xong" pass **trên bản deploy**; smoke remote pass.
- [ ] Secret production chỉ nằm phía server/Cloudflare; Git không có giá trị thật (demo placeholders được phép); thiếu/trống secret thì không đăng nhập được.
- [ ] Dữ liệu thử đã dọn; khu vực giao, sản phẩm, tồn kho là dữ liệu thật; sản phẩm mẫu đã ẩn.
- [x] Đã xuất một bản backup thử và mở lại được (không commit).
- [ ] `docs/OPERATIONS.md` đã có; người vận hành biết xem hạn mức hằng ngày.

## Bằng chứng thực thi — 15/10/2026

- Pre-flight hiện tại: typecheck PASS; architecture **207 source files**; **143/143 tests** (136 mốc Phase 5 + 7 kiểm thử smoke remote mới); audit **0 advisory**; build và `wrangler deploy --dry-run` PASS. UI preview **17 routes/0 exceptions** (EN/VI, cart persistence, fee fallback). Native workerd auth kiểm **9/9 cấu hình** (hợp lệ, thiếu/trống/ngắn/trùng secret), từ chối 401 và không cấp cookie khi không hợp lệ; cookie cũ cũng bị chặn.
- Smoke remote runner đã kiểm toàn bộ API flow qua **HTTP loopback + D1 workerd cô lập**: 3 SMOKE orders (DELIVERED/PAID, CANCELLED, CANCELLED), stock baseline được khôi phục, race phải đúng 201 + 409/OUT_OF_STOCK. Lost stock response hoặc committed order thiếu confirmation hợp lệ dừng tự recovery, không retry/cộng bù đoán. CLI vẫn buộc public HTTPS origin; **7/7 tests là kiểm chứng local, chưa remote acceptance**.
- `db:reset:local` mặc định gặp EPERM do preview đang giữ state Windows. Backup trước reset đã mở được, integrity `ok`, orders 0; không dừng preview đang chạy. Đã migrate/seed thành công trên state local mới `.security-review/phase6-fresh-state`; `db:verify` 13/13 nhóm, 46 assertions; smoke preview `http://127.0.0.1:4175` 40/40 PASS. Ca ghi vẫn D1 `persist:false`, `remoteBindings:false`, synthetic secrets.
- Rà Git/client/Worker upload không có giá trị ADMIN_PASSWORD/JWT_SECRET thật. Cloudflare Vite tạo bản `.dev.vars` local trong `dist/lunara/` ignored để preview; không nằm trong assets `dist/client/` hoặc bundle upload, không phải secrets production đã đặt.
- D1 remote UUID `1796e7bf-d230-4bc1-a80a-f4be4d1eccc7`: `0001_mvp.sql` áp 25 commands, seed áp 48 queries. SELECT sau ghi xác nhận counts `4/8/24/8/4`, orders `0`, `PRAGMA foreign_key_check` `[]`. DDL canonical không thay đổi; deferred/0002 không áp dụng.
- Backup remote: `.security-review/phase6-remote-initial-20261015.sql` (ignored), mở vào SQLite in-memory: integrity `ok`, FK `[]`, counts khớp remote. Không restore lên remote; không chia sẻ signed download URL do Wrangler in ra.
- Chưa có đơn SMOKE remote: chưa cần chạy DELETE. Seed mẫu vẫn ACTIVE và vùng phí ví dụ vẫn active; tiêu chí dữ liệu thật chưa đạt. Không dùng local API/Edge tests hoặc backup để suy ra acceptance deployment/CPU cloud.

## Đầu vào cần để tiếp tục

1. **Deploy 6.6 và secrets 6.7:** chủ dự án đã chọn tự deploy và đặt secrets trong phiên 15/10/2026; chạy `npm run deploy`, tự nhập ADMIN_PASSWORD (≥24 ký tự ngẫu nhiên) và JWT_SECRET khác nhau (≥32) bằng `wrangler secret put`, rồi cung cấp URL HTTPS. Không gửi secret thật qua chat; hiện không có quyền agent deploy thay. Các bước [NGƯỜI] ở pipeline là ranh giới hiện tại.
2. **Smoke ghi/dọn thử:** chỉ định variant ID được thử và cửa sổ không có giao dịch khách. Nhập mật khẩu admin vào prompt ẩn của script. Smoke không xóa SQL; agent chỉ dọn bằng `DELETE FROM orders WHERE customer_note LIKE 'SMOKE%';` sau khi đối chiếu/hoàn tồn đúng các variant liên quan.
3. **Dữ liệu thật 6.10:** catalog/ảnh/giá/SKU/tồn và khu vực/phí/ngưỡng miễn phí; chốt phụ phí/cutoff/slots. Chủ shop nhập qua admin hoặc cung cấp bộ dữ liệu đã duyệt; không suy đoán từ seed. Ẩn sản phẩm mẫu, tắt vùng ví dụ sau khi có dữ liệu thay thế.
4. **Tùy chọn:** dùng workers.dev không cần domain riêng. Nếu chọn Turnstile, cung cấp site key công khai/hostname; tích hợp widget checkout + đường token và login verifier trước khi đặt TURNSTILE_SECRET. Chỉ verifier orders hiện có; bật secret ngay sẽ chặn checkout chưa có token. Không tự đăng ký widget/domain hoặc quyết định chi phí.
5. **Vận hành:** chủ dự án xác nhận đã biết kiểm dashboard hạn mức hằng ngày theo [OPERATIONS](../OPERATIONS.md); chưa tạo nhắc lịch tự động.
