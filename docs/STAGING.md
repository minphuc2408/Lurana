# Lunara Shop — staging và production

Cập nhật **16/10/2026**. Hai môi trường dùng chung source/canonical migration, tách Worker, D1, secrets và rate-limit namespaces. Snapshot live được kiểm chỉ đọc tại [PROJECT_STATUS](PROJECT_STATUS.md#snapshot-remote-chỉ-đọc--16102026).

| Môi trường | Worker | D1 / UUID | Public frontend config |
| --- | --- | --- | --- |
| Production | `lunara` | `lunara-db` / `1796e7bf-d230-4bc1-a80a-f4be4d1eccc7` | `.env.production`, production widget/origin, index Home/Shop |
| Staging | `lunara-staging` | `lunara-staging-db` / `ed391b18-0bcf-41b3-8315-389807ace7f2` | `.env.staging`, staging widget/origin, luôn noindex |
| Local | Vite dev/preview loopback | D1 local, `remoteBindings: false` | Test key hoặc override local khi cần |

Production đang chạy version cũ ngày 15/10. Staging hiện chạy version `75fcbb54-5528-4cc1-b101-22fdc7a91a40` ngày16/10,đã được owner cho deploy layout/font/hero/category;CSP/SEO,key staging,RateLimit/TTL=24 và scheduled handler được giữ.Version e984d962 lúc13:31 là lịch sử trước lượt ảnh category. Cả hai có tên secrets admin; staging có thêm Cloudinary secrets; cả hai chưa có TURNSTILE_SECRET. Không suy ra nghiệm thu upload/Cron/checkout cloud từ sự hiện diện bindings.

D1 staging đã áp migration 0001 ngày 15/10. Lượt chỉ đọc 16/10 thấy 4 categories, 1 sản phẩm active, 0 tỉnh giao. Counts 0 sản phẩm/variants/orders ghi ngày 15/10 là lịch sử. Chưa có delivery zones nên chưa nghiệm thu checkout staging; không nạp full seed để bù thiếu dữ liệu.

## Build và deploy

Chạy từ root repo, lần lượt từng môi trường; cả hai dùng chung `dist/`.

```powershell
# Kiểm và đóng gói staging, không deploy
npm run staging:check
npm run deploy:staging:dry-run

# Deploy staging khi được phép
npm run deploy:staging

# Deploy production khi được phép
npm run deploy
```

Script staging kiểm tên Worker, binding DB và UUID trước build; build với `CLOUDFLARE_ENV=staging` + Vite `--mode staging`, rồi kiểm lại `dist/lunara/wrangler.json` trước deploy. Production build mặc định ở mode production. Không cần truyền Site key trong lệnh deploy. Không tự đặt CLOUDFLARE_ENV=staging hoặc VITE_TURNSTILE_SITE_KEY trong terminal dùng cho production; env terminal và các file `.env*.local` có thể ghi đè Vite config.

```powershell
# Chỉ cần nếu terminal đã tự đặt lựa chọn môi trường trước đó
Remove-Item Env:CLOUDFLARE_ENV -ErrorAction SilentlyContinue
Remove-Item Env:VITE_TURNSTILE_SITE_KEY -ErrorAction SilentlyContinue
```

Deploy dùng toàn bộ source local hiện tại, kể cả thay đổi chưa commit. Deploy không migrate/seed hoặc copy secrets/dữ liệu giữa hai môi trường. UI chưa có banner staging, kiểm hostname trước thao tác.

## Secrets — nhập một lần riêng cho từng Worker

Bản sửa local16/10 đóng khi thiếu TURNSTILE_SECRET: trả503 TURNSTILE_NOT_CONFIGURED, không đi tiếp. Local/test chỉ bypass khi flag server=true và hostname loopback; remote không bypass kể cả đặt flag. Khi deploy bản mới phải phối hợp đặt secret đúng widget; headers mới không chứng minh bản live đã có verifier mới.

ADMIN_PASSWORD ≥24 ký tự ngẫu nhiên, JWT_SECRET ≥32 ký tự ngẫu nhiên và khác nhau; không đọc/reuse password local để cấu hình cloud. Secrets đã tồn tại không cần nhập lại mỗi deploy.

Sau khi deploy UI mới, nhập Secret key đúng widget tại prompt ẩn:

```powershell
npx wrangler secret put TURNSTILE_SECRET --env staging --config wrangler.jsonc
npx wrangler secret put TURNSTILE_SECRET --config wrangler.jsonc
```

Staging widget cho phép `lunara-staging.minphuc2408.workers.dev`; production widget cho phép `lunara.minphuc2408.workers.dev`, không thêm scheme/path. Site key công khai nằm trong file env tương ứng; Secret key chỉ ở Worker. Kiểm checkout/lookup/admin login với challenge thật sau cấu hình. [Turnstile](BOT_PROTECTION.md) · [Cloudinary](CLOUDINARY.md).

## Database và dữ liệu thử

Không create lại D1/Worker đã có. Migration mới chỉ được áp khi có thay đổi schema và authorization đúng target:

```powershell
# Chỉ đọc thông tin target
npx wrangler d1 info lunara-staging-db --env staging --config wrangler.jsonc

# Có ghi remote, chỉ chạy khi được phép và có migration mới
npm run db:migrate:staging
```

`npm run db:seed:staging` nạp toàn bộ seed mẫu, không phải reset và không khôi phục tồn đã sửa. **Không chạy lại cho trạng thái staging hiện có** khi chỉ cần categories hoặc delivery zones. Canonical base là `migrations/0001_mvp.sql`, thêm `0002_category_images.sql` cho ảnh category; không áp deferred/0002, không sửa migration đã áp remote.

Smoke remote mặc định chỉ đọc; ghi cần origin/variant/exclusive window và credential/token qua hidden stdin. Không tự retry write có kết quả chưa rõ. [OPERATIONS](OPERATIONS.md).

## Bằng chứng và giới hạn

Ngày 16/10: staging target guard, build/dry-run hai môi trường PASS; bundle chỉ chứa đúng key tương ứng, canonical staging riêng, HTML/header/robots staging noindex. Typecheck/architecture 215/tests 166 PASS; smoke 40/40 PASS, persisted D1 giữ nguyên. Đây là local evidence; việc kiểm cloud trong lượt rà tài liệu chỉ đọc metadata/public endpoints.

Mốc lịch sử 15/10: staging migration đủ 10 bảng/FK sạch; fix thiếu categories đã thêm đúng 4 categories, chưa full seed. Cloudinary/form tạo sản phẩm và widget đã kiểm mock/local. Phase 6 production vẫn **5/7**, không kết phase bằng preview hoặc deployment staging.

Ảnh category16/10: owner cho cập nhật DB local/staging;0002 đã áp đúng UUID staging,4 URL public revisioned đã UPDATE và FK sạch,1product/3variants/0orders không đổi về counts. Owner sau đó đã xác nhận deploy staging cả UI/layout/font/hero/category và giữ Turnstile fail-closed khi TURNSTILE_SECRET còn thiếu.172 tests/smoke40/schema13/13 +dry-run PASS; production không trong phạm vi. [Runbook](CATEGORY_IMAGES.md).

Staging delivery ảnh category đã nghiệm thu:4URL trong API,4WebP200đúngMIME/SHA256,browserEN/VI10/10case,0exception;noindex/CSP còn hiệu lực.Login/lookup503TURNSTILE_NOT_CONFIGURED được xác nhận bằng inputsynthetic,giữ fail-closed đúng owner;khôngcredentialreal/đặtđơn.[Kết quả](CATEGORY_IMAGES.md).
