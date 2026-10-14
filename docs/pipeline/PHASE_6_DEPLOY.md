# Phase 6 — Deploy và nghiệm thu remote

**Mục tiêu:** MVP chạy thật trên `https://<tên>.<subdomain>.workers.dev` với D1 remote; dự kiến dùng gói Free, kiểm tra quota/chi phí trước deploy. Các bước **[NGƯỜI]** cần đầu vào/authorization của chủ dự án.

**Trạng thái:** PLANNED · chưa deploy/migrate/seed remote/secrets production. [Hiện trạng / đầu vào](../PROJECT_STATUS.md). Tài khoản, login Wrangler và D1 `lunara-db` đã được chủ dự án tạo; không làm lại. Smoke hiện **local-only**, chưa hỗ trợ remote/`--base-url`.

**Đầu vào hiện tại:** Phase 0–3 DONE local, Phase 4 chưa triển khai, Phase 5 PARTIAL; chưa đủ cổng mở bán. Smoke Phase 3 chạy order bằng source Hono + HTTP loopback + workerd D1 cô lập, không kiểm order trên deployment remote. Verifier Turnstile đã có nhưng widget/domain/site key/secret thật và rate limit chưa có. Chỉ thêm chế độ remote khi thực hiện Phase 6 có authorization; giữ nguyên isolation và guard local của bộ test hiện tại.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 6.0 | AGENT | **Pre-flight:** typecheck, architecture, tests, build, audit; sau Phase 1–5 chạy reset/verify local + smoke. Rà nội dung Git không có secret thật; placeholder demo được phép. Test auth fail closed khi thiếu/trống secret. Ở Phase 6 thêm `--base-url <URL>`/remote mode có URL explicit vào smoke local-only hiện tại; gắn note `SMOKE` cho mọi đơn thử |
| 6.1 | NGƯỜI — đã làm | Tài khoản Cloudflare đã có; kiểm tra 2FA khi chuẩn bị production. Quota/thẻ/chi phí phải đối chiếu gói lúc deploy |
| 6.2 | NGƯỜI — đã làm | Wrangler login/whoami đã thành công; không đăng nhập lại trong Phase 0 hoặc lúc rà tài liệu |
| 6.3 | NGƯỜI→AGENT — đã làm | D1 `lunara-db` đã có, ID đã cấu hình; không create lại. Trước remote migration xác nhận đúng account/database và authorization |
| 6.4 | AGENT | `npx wrangler d1 migrations apply lunara-db --remote` (xác nhận khi được hỏi). Kiểm tra: `npx wrangler d1 execute lunara-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"` thấy 10 bảng + `d1_migrations` |
| 6.5 | AGENT | Nạp seed mẫu: `npx wrangler d1 execute lunara-db --remote --file=./docs/sql/MVP_SEED_DEV.sql` (chỉ để kiểm thử; sẽ thay bằng dữ liệu thật ở 6.10) |
| 6.6 | NGƯỜI | **Deploy lần đầu:** `npm run deploy`. Có thể được hỏi chọn subdomain `workers.dev` (chọn tên không lộ thông tin cá nhân) |
| 6.7 | NGƯỜI | **Đặt secret:** `npx wrangler secret put ADMIN_PASSWORD` và `npx wrangler secret put JWT_SECRET` (giá trị ngẫu nhiên dài; xem Phase 4). Sau đó đăng nhập admin thử |
| 6.8 | AGENT | Chạy `node scripts/smoke.mjs --base-url https://<url>` và kịch bản 10 mục ở [README → Định nghĩa "MVP xong"](README.md#8-định-nghĩa-mvp-xong) trên bản deploy |
| 6.9 | AGENT | **Dọn dữ liệu thử:** `DELETE FROM orders WHERE customer_note LIKE 'SMOKE%';` (xóa dây chuyền items/history) và đặt lại tồn các variant về giá trị thật (hoặc nhập tồn thật ở 6.10). Kiểm tra `SELECT COUNT(*) FROM orders` |
| 6.10 | NGƯỜI | **Dữ liệu thật:** (a) qua admin → Phí giao: nhập khu vực giao thật, phí, ngưỡng miễn phí; tắt (`is_active = 0`) dòng ví dụ. (b) Sản phẩm: tạo sản phẩm thật (ảnh = URL, vd. tải ảnh lên Cloudinary dashboard rồi dán URL); **ẩn** (`HIDDEN`) sản phẩm mẫu thay vì xóa. (c) Chỉnh `worker/config.ts` (phụ phí, giờ chốt, khung giờ) rồi deploy lại |
| 6.11 | NGƯỜI (tùy chọn) | **Turnstile:** tạo widget ở dashboard (khóa site + secret), đặt `VITE_TURNSTILE_SITE_KEY` lúc build và `npx wrangler secret put TURNSTILE_SECRET`; gắn widget vào checkout và form đăng nhập admin; giới hạn hostname cho widget |
| 6.12 | NGƯỜI (tùy chọn) | **Tên miền riêng:** domain có thể có phí; chi phí hạ tầng/provider phụ thuộc quota/gói khi deploy. Gắn Custom Domain cho Worker rồi kiểm tra cookie admin và `Origin` trên domain mới |
| 6.13 | NGƯỜI | **Theo dõi hạn mức:** xem dashboard Workers/D1 theo quota gói thực tế; đặt nhắc việc lặp lại khi vận hành |
| 6.14 | AGENT | Viết `docs/OPERATIONS.md`: backup, rollback, xử lý khi hết hạn mức, đổi mật khẩu admin, thêm khu vực giao (nội dung ở dưới) |

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

**Thêm khu vực giao:** trang admin → Phí giao (hoặc `INSERT INTO delivery_zones ...`).

## Tiêu chí nghiệm thu

- [ ] URL `workers.dev` truy cập được; tải lại ở `/shop`, `/orders/track` vẫn hiển thị app (SPA fallback).
- [ ] `npx wrangler d1 migrations list lunara-db --remote` báo `0001` đã áp dụng; 10 bảng tồn tại.
- [ ] 10 kịch bản "MVP xong" pass **trên bản deploy**; smoke remote pass.
- [ ] Secret production chỉ nằm phía server/Cloudflare; Git không có giá trị thật (demo placeholders được phép); thiếu/trống secret thì không đăng nhập được.
- [ ] Dữ liệu thử đã dọn; khu vực giao, sản phẩm, tồn kho là dữ liệu thật; sản phẩm mẫu đã ẩn.
- [ ] Đã xuất một bản backup thử và mở lại được (không commit).
- [ ] `docs/OPERATIONS.md` đã có; người vận hành biết xem hạn mức hằng ngày.

## Goal prompt (dán vào `/goal`)

```text
Đọc docs/pipeline/README.md và PHASE_6_DEPLOY.md rồi thực hiện Phase 6.
Làm các bước [AGENT]: pre-flight (build, test, smoke local, kiểm tra fail-closed khi thiếu ADMIN_PASSWORD, không lộ secret), hỗ trợ cấu hình wrangler.jsonc, áp migration/seed lên D1 remote, chạy smoke trên URL đã deploy, dọn dữ liệu thử, viết docs/OPERATIONS.md.
Không làm lại đăng ký Cloudflare/wrangler login/d1 create đã hoàn thành. Với đầu vào hoặc authorization production còn thiếu (deploy, secrets thật, dữ liệu thật, Turnstile, domain): chuẩn bị cấu hình/kiểm chứng local, rồi nói rõ việc cần chủ dự án cung cấp/xác nhận trước bước phụ thuộc đó.
Không tự ý chạy lệnh xóa/ghi trên D1 remote ngoài danh sách trong tài liệu. Xong khi mọi "Tiêu chí nghiệm thu" Phase 6 pass.
```
