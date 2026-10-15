# Lunara staging

Ngày 15/10/2026: đã xác minh D1 remote staging và áp migration 0001; chưa seed, đặt secrets hoặc deploy staging. Các đoạn kiểm chứng local phía dưới là mốc lịch sử trước migration. Không thay nghiệm thu Phase 6 production.

| Môi trường | Worker | D1 |
| --- | --- | --- |
| Local | Vite dev/preview loopback | D1 local, `remoteBindings: false` |
| Production (top-level) | `lunara` | `lunara-db` / `1796e7bf-d230-4bc1-a80a-f4be4d1eccc7` |
| Staging (`env.staging`) | `lunara-staging` | `lunara-staging-db` / `ed391b18-0bcf-41b3-8315-389807ace7f2` |

Giữ binding `DB`, dùng chung source và `migrations/`; dữ liệu/secrets riêng. Chuyển code/migration đã kiểm sang production, không chuyển đơn thử. Thêm migration mới khi đổi schema; không sửa migration đã áp dụng hoặc áp deferred/0002.

## Kiểm tra local

```powershell
npm run staging:check
npm run deploy:staging:dry-run
```

Script kiểm tên Worker, binding, UUID staging và từ chối UUID production hoặc arguments thừa. Build với `CLOUDFLARE_ENV=staging`, kiểm lại `dist/lunara/wrangler.json` rồi deploy đúng config sinh ra. Dry-run chỉ đóng gói, không deploy. Deploy staging luôn build mới; dist dùng chung nên build/deploy từng môi trường tuần tự. `npm run deploy` tiếp tục build production; không đặt CLOUDFLARE_ENV=staging trong terminal dùng deploy production.

## Khởi tạo remote — chỉ chạy khi được phép

1. Owner tạo D1 `lunara-staging-db`; không tạo lại nếu đã có. Đối chiếu tên/UUID/account: `npx wrangler d1 info lunara-staging-db --env staging --config wrangler.jsonc`.
2. `npm run db:migrate:staging`: áp migration lên remote staging.
3. `npm run db:seed:staging`: nạp seed mẫu khi khởi tạo. INSERT OR IGNORE không phải reset, không khôi phục tồn đã sửa.
4. Owner đặt secrets riêng tại prompt ẩn:

```powershell
npx wrangler secret put ADMIN_PASSWORD --env staging --config wrangler.jsonc
npx wrangler secret put JWT_SECRET --env staging --config wrangler.jsonc
```

Nếu Wrangler hỏi tạo Worker chưa có, kiểm đúng `lunara-staging`. ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên, JWT_SECRET ≥32 ký tự ngẫu nhiên, khác nhau và khác production. Không gửi secrets vào chat, không lấy từ `.dev.vars`. Thiếu secrets thì admin fail-closed. Chưa bật TURNSTILE_SECRET khi UI chưa tích hợp widget/token thật.

5. `npm run deploy:staging`: tạo/cập nhật Worker staging. URL dự kiến `https://lunara-staging.minphuc2408.workers.dev`; dùng URL Wrangler trả về.
6. Kiểm catalog/quote, COD/idempotency/tồn, hủy/hoàn tồn, lookup và admin. Health chỉ kiểm liveness. UI chưa có banner staging; kiểm hostname trước thao tác.

Smoke remote giữ guard tại [OPERATIONS](OPERATIONS.md): mặc định chỉ đọc; ca ghi cần đúng origin/variant/exclusive window và credential nhập ẩn. Không thêm reset remote. Hướng dẫn không tự cấp quyền deploy/ghi remote.

## Kiểm chứng local 15/10/2026

Typecheck, architecture (207 source files), build production và build/dry-run staging PASS; output staging đúng tên/UUID, output production vẫn đúng target cũ. Năm kiểm tra target xác nhận từ chối tên Worker sai, binding/database sai, thiếu D1 và UUID dùng chung production. cf:typegen và graph:sync đã chạy. npm test còn lỗi i18n khóa `Lunara` trong AdminLayout.tsx (source/test/locale không thay đổi trong lượt staging); không tuyên bố toàn bộ test PASS. Chưa chạy smoke/browser staging vì chưa deploy; không ghi remote.

Tham khảo: [D1 environments](https://developers.cloudflare.com/d1/configuration/environments/) · [Cloudflare Vite environments](https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/).

Lượt đổi tên website sau đó (15/10/2026): lỗi i18n khóa Lunara đã được xử lý trong phạm vi branding; 143/143 tests PASS. Production đã deploy tên Lunara Shop, staging vẫn chưa deploy.

Cập nhật staging 15/10/2026: đã xác minh remote lunara-staging-db / ed391b18-0bcf-41b3-8315-389807ace7f2 và áp 0001_mvp.sql thành công (25 commands). Đã kiểm đủ 10 bảng nghiệp vụ, lịch sử 0001, không còn migration chờ, foreign_key_check rỗng, orders=0. db:verify local cô lập PASS 13/13 nhóm, 46 assertions. Chưa seed, đặt secrets hoặc deploy staging; production không được truy cập/ghi trong lượt sửa này.
