# Lunara Shop — staging và production

Cập nhật **16/10/2026**. Hai môi trường dùng chung source/canonical migration, tách Worker, D1, secrets và rate-limit namespaces. Snapshot live được kiểm chỉ đọc tại [PROJECT_STATUS](PROJECT_STATUS.md#snapshot-remote-chỉ-đọc--16102026).

| Môi trường | Worker | D1 / UUID | Public frontend config |
| --- | --- | --- | --- |
| Production | `lunara` | `lunara-db` / `1796e7bf-d230-4bc1-a80a-f4be4d1eccc7` | `.env.production`, production widget/origin, index Home/Shop |
| Staging | `lunara-staging` | `lunara-staging-db` / `ed391b18-0bcf-41b3-8315-389807ace7f2` | `.env.staging`, staging widget/origin, luôn noindex |
| Local | Vite dev/preview loopback | D1 local, `remoteBindings: false` | Test key hoặc override local khi cần |

Production đang chạy version cũ ngày 15/10. Staging hiện chạy version `27c3d24e-f3df-42e1-8d18-8b8299427062` (16/10,19:21 giờ Việt Nam), gồm danh mục Hà Nội/admin Combobox/checkout active-only và toàn bộ source local lúc deploy. Version75fcbb54 là mốc ảnh category trước đó;CSP/SEO,key staging,RateLimit/TTL=24 và scheduled handler được giữ.Version e984d962 lúc13:31 là lịch sử trước lượt ảnh category. Cả hai có tên secrets admin; staging có thêm Cloudinary secrets; cả hai chưa có TURNSTILE_SECRET. Không suy ra nghiệm thu upload/Cron/checkout cloud từ sự hiện diện bindings.

D1 staging hiện đã áp0001+0002+0003;12bảng,1tỉnh/126phường Hà Nội,HCM0,FK sạch. Aggregate sau0003: zones0/products1/variants3/tổng tồn30/orders0/items0/history0, không thay counts nghiệp vụ. [Thao tác và bằng chứng](DELIVERY_ADDRESS.md).

Lịch sử: D1 staging đã áp migration0001 ngày15/10. Lượt chỉ đọc 16/10 thấy 4 categories, 1 sản phẩm active, 0 tỉnh giao. Counts 0 sản phẩm/variants/orders ghi ngày 15/10 là lịch sử. Chưa có delivery zones nên chưa nghiệm thu checkout staging; không nạp full seed để bù thiếu dữ liệu.

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

`npm run db:seed:staging` nạp toàn bộ seed mẫu, không phải reset và không khôi phục tồn đã sửa. **Không chạy lại cho trạng thái staging hiện có** khi chỉ cần categories hoặc delivery zones. Canonical base là `migrations/0001_mvp.sql`, thêm `0002_category_images.sql` cho ảnh category và `0003_hanoi_administrative_areas.sql` cho danh mục Hà Nội; không áp deferred/0002, không sửa migration đã áp remote.

Smoke remote mặc định chỉ đọc; ghi cần origin/variant/exclusive window và credential/token qua hidden stdin. Không tự retry write có kết quả chưa rõ. [OPERATIONS](OPERATIONS.md).

## Bằng chứng và giới hạn

Lượt danh mục16/10: owner cho phép migrate local/staging và deploy staging, cấm production.0003áp thành công,190tests/typecheck/architecture225/build/schema13/13/smoke40/40 và7nhóm browser admin PASS. Public bundle staging khớp SHA256 artifact index-Ba-uzNNV.js; options200/provinces=[] đúng zones0, admin401 không cookie, CSP/noindex giữ nguyên. CRUD UI với DB cô lập đã đạt; chưa dùng tài khoản thật trên staging. Không tự nhập phí hoặc chạy full seed; cần cấu hình zone trong admin để checkout có lựa chọn. Full backup staging không xuất vì automatic approval review từ chối khả năng sao chép dữ liệu khách; chỉ aggregate trước/sau, migration bổ sung. Không thay secret.

Ngày 16/10: staging target guard, build/dry-run hai môi trường PASS; bundle chỉ chứa đúng key tương ứng, canonical staging riêng, HTML/header/robots staging noindex. Typecheck/architecture 215/tests 166 PASS; smoke 40/40 PASS, persisted D1 giữ nguyên. Đây là local evidence; việc kiểm cloud trong lượt rà tài liệu chỉ đọc metadata/public endpoints.

Mốc lịch sử 15/10: staging migration đủ 10 bảng/FK sạch; fix thiếu categories đã thêm đúng 4 categories, chưa full seed. Cloudinary/form tạo sản phẩm và widget đã kiểm mock/local. Phase 6 production vẫn **5/7**, không kết phase bằng preview hoặc deployment staging.

Ảnh category16/10: owner cho cập nhật DB local/staging;0002 đã áp đúng UUID staging,4 URL public revisioned đã UPDATE và FK sạch,1product/3variants/0orders không đổi về counts. Owner sau đó đã xác nhận deploy staging cả UI/layout/font/hero/category và giữ Turnstile fail-closed khi TURNSTILE_SECRET còn thiếu.172 tests/smoke40/schema13/13 +dry-run PASS; production không trong phạm vi. [Runbook](CATEGORY_IMAGES.md).

Staging delivery ảnh category đã nghiệm thu:4URL trong API,4WebP200đúngMIME/SHA256,browserEN/VI10/10case,0exception;noindex/CSP còn hiệu lực.Login/lookup503TURNSTILE_NOT_CONFIGURED được xác nhận bằng inputsynthetic,giữ fail-closed đúng owner;khôngcredentialreal/đặtđơn.[Kết quả](CATEGORY_IMAGES.md).


## Wrangler Dashboard diff — 16/10/2026, sửa local

Nguồn cũ có observability.head_sampling_rate=0.1 nhưng thiếu logs.head_sampling_rate và traces.head_sampling_rate. Hàm normalizeObservability trong Wrangler4.150.0 điền mặc định1 cho các mục con thiếu khi so sánh remote; đã tái hiện bằng chính hàm từ dependency local. Điều này giải thích diff10%→100% trong prompt; không kết luận chỉ từ diff rằng cloud đã đổi sampling hoặc đã deploy.

Nguồn wrangler.jsonc nay khai báo rõ0.1 ở cấp chung/logs/traces cho cả production và staging; invocation_logs=false giữ nguyên, không bật traces. Guard scripts/staging.mjs kiểm các giá trị này trong cả source và config generated trước deploy, vẫn kiểm đúng tên Worker/DB/UUID. Không đổi binding/DDL/dependency/secret hoặc upload trong lượt này.

Nếu đang ở prompt cũ: chọn n để hủy upload, và n nếu được hỏi cập nhật local config từ remote; sau đó dùng lại npm run deploy:staging khi muốn deploy. Không tiếp tục prompt đã nạp config cũ. Không sửa tay dist/lunara/wrangler.json; build lại từ nguồn. D1 database_name/migrations_dir và assets có thể còn xuất hiện do metadata/đường dẫn build khác remote; kiểm từng diff, không tắt cảnh báo hoặc auto-yes. Dry-run bỏ qua remote pre-upload check, không chứng minh prompt cloud đã biến mất.

Đã kiểm staging build/dry-run, production build/dry-run, typecheck, architecture225 và186tests. Hàm normalize thực tế trả logs/traces0.1 cho source2môi trường và generated staging; guard từ chối synthetic logs1. Traces normalized vẫn disabled. Không truy cập/ghi D1 remote hay deploy, Phase6 giữ5/7. Nếu prompt cập nhật từ remote làm generated config có khóa lạ như assets__added, bỏ artifact bằng cách build lại từ nguồn, không copy nó vào wrangler.jsonc.

Nguồn tham khảo: [Cloudflare Wrangler observability](https://developers.cloudflare.com/workers/wrangler/configuration/#observability).
