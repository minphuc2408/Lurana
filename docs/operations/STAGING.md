# Lunarra — staging và production

How-to cho người triển khai: target, build và migrations; hợp nhất tài liệu 19/10/2026. Version đang được ghi nhận, migrations đã áp và kết quả kiểm cloud xem [PROJECT_STATUS](../PROJECT_STATUS.md); tài liệu này không phải deployment log.

## GitHub Pages — static UI preview

- **Cấu hình:** [workflow](../../.github/workflows/deploy-pages.yml) dùng Node 22, `npm ci`, build `dist/client` với base `/Lurana/`, rồi thêm `404.html`; chạy khi push `main` hoặc manual dispatch. Router dùng Vite `BASE_URL`; bản Worker vẫn dùng `/`. Base này dành cho project Pages tên repo `Lurana`, cần đổi nếu đổi tên repo hoặc dùng custom domain.
- **Thiết lập GitHub:** chọn **Settings → Pages → Build and deployment → Source: GitHub Actions**, cho phép Actions và environment `github-pages` deploy từ nhánh mong muốn. Repo private cần gói GitHub hỗ trợ Pages. Workflow đã được Git theo dõi khi kiểm local19/10; chưa xác minh Settings/Actions hoặc deployment Pages. Tracked không chứng minh workflow đã chạy. [Hướng dẫn GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
- **Giới hạn:** chỉ phục vụ frontend tĩnh, không có Worker/D1/API; catalog, quote, checkout, tra đơn và admin không hoạt động. Dùng các target Cloudflare bên dưới cho luồng có API. `404.html` cho app render khi mở trực tiếp route chưa có file; HTTP vẫn 404, không phải rewrite 200. `/shop/` và `/about/` có HTML do SEO plugin sinh.
- **SEO/headers:** workflow đặt `VITE_SITE_INDEXABLE=false` cho preview, sinh meta noindex, robots disallow và sitemap rỗng. Canonical/OG vẫn trỏ production theo `.env.production`; đây không phải cấu hình SEO cho domain Pages riêng. Pages không áp dụng file Cloudflare `_headers`, nên không suy CSP/security headers từ artifact. Build local hoặc thêm workflow không chứng minh deploy thành công; xem bằng chứng tại PROJECT_STATUS.

## Target Cloudflare

| Môi trường | Worker | D1 / UUID | Public frontend config |
| --- | --- | --- | --- |
| Production | `lunara` | `lunara-db` / `1796e7bf-d230-4bc1-a80a-f4be4d1eccc7` | `.env.production`, production widget/origin, index Home/Shop |
| Staging | `lunara-staging` | `lunara-staging-db` / `ed391b18-0bcf-41b3-8315-389807ace7f2` | `.env.staging`, staging widget/origin, luôn noindex |
| Local | Vite dev/preview loopback | D1 local, `remoteBindings: false` | Test key hoặc override local khi cần |

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

Bẫy preview giữ manifest cũ sau build và cách kiểm MIME/bundle được quản lý trong [hướng dẫn local](../LOCAL_DEVELOPMENT.md#bẫy-local-thường-gặp).

## Secrets — nhập một lần riêng cho từng Worker

Owner nhập secrets riêng từng Worker qua prompt ẩn khi thiếu hoặc rotate; không đọc/reuse password local, không cần nhập lại sau mỗi deploy. Auth/rotate/revoke phiên theo [OPERATIONS](OPERATIONS.md#6-secrets-mật-khẩu-và-phiên-admin), widget/site-secret/hostname theo [BOT_PROTECTION](BOT_PROTECTION.md#việc-chủ-shop-cần-cấu-hình-trên-cloudflare), upload keys theo [CLOUDINARY](CLOUDINARY.md#3-owner-nhập-keys-vào-cloudflare).

Site key/origin công khai ở file env đúng mode; Secret key chỉ ở Worker. Kiểm challenge thật ở checkout/lookup/admin login sau cấu hình. Thiếu secret fail-closed; metadata secret names không chứng minh success, không bật bypass trên remote.

## Database và dữ liệu thử

Không create lại D1/Worker đã có. Migration mới chỉ được áp khi có thay đổi schema và authorization đúng target:

```powershell
# Chỉ đọc thông tin target
npx wrangler d1 info lunara-staging-db --env staging --config wrangler.jsonc

# Có ghi remote, chỉ chạy khi được phép và có migration mới
npm run db:migrate:staging
```

`npm run db:seed:staging` nạp toàn bộ seed mẫu, không phải reset và không khôi phục tồn đã sửa. **Không chạy lại cho trạng thái staging hiện có** khi chỉ cần categories hoặc delivery zones. Canonical base là `migrations/0001_mvp.sql`, thêm `0002_category_images.sql` cho ảnh category và `0003_hanoi_administrative_areas.sql` cho danh mục Hà Nội; không áp deferred/0002, không sửa migration đã áp remote.

Staging có [bộ mẫu riêng theo owner](../reference/DATABASE_DESIGN.md#bộ-dữ-liệu-staging-theo-quyết-định-owner); seed dev không phục hồi bộ này. Bằng chứng lần thay18/10 và backup ở [archive](../archive/VERIFICATION_HISTORY.md#bộ-dữ-liệu-staging-và-backup); phạm vi cũ không cấp quyền reset tiếp.

Smoke remote mặc định chỉ đọc; ghi cần origin/variant/exclusive window và credential/token qua hidden stdin. Không tự retry write có kết quả chưa rõ. [OPERATIONS](OPERATIONS.md).

### Kiểm và áp migration production

Đối chiếu đúng target, authorization và backup theo [OPERATIONS](OPERATIONS.md#4-sao-lưu-riêng-tư-và-mở-thử-offline); kiểm từng kết quả trước bước tiếp:

```powershell
npx wrangler d1 migrations list lunara-db --remote
npx wrangler d1 migrations apply lunara-db --remote
npx wrangler d1 execute lunara-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
npx wrangler d1 execute lunara-db --remote --command "SELECT name, applied_at FROM d1_migrations ORDER BY id"
```

migrations list chỉ liệt kê phần chưa áp; danh sách trống cần đi cùng history và đủ bảng theo [Database](../reference/DATABASE_DESIGN.md), không đếm bảng nội bộ. Seed chỉ dành database mới, chưa có dữ liệu thật và đã được phép: `npx wrangler d1 execute lunara-db --remote --file=./docs/sql/MVP_SEED_DEV.sql`. Không chạy lại để sửa môi trường hiện có.

## Giới hạn nghiệm thu

Deploy/build/dry-run không tự migrate D1, seed dữ liệu hoặc xác minh secrets/provider. Kiểm public route/asset, CSP/noindex và đúng môi trường sau deploy; nghiệm thu write cần cửa sổ thử và quyền riêng theo OPERATIONS. Coverage phải được cấu hình bằng admin, không nạp full seed để chữa thiếu lựa chọn. Kết quả theo từng mốc chỉ ghi tại PROJECT_STATUS.

## Wrangler Dashboard diff

Nguồn cũ có observability.head_sampling_rate=0.1 nhưng thiếu logs.head_sampling_rate và traces.head_sampling_rate. Hàm normalizeObservability trong Wrangler 4.150.0 điền mặc định 1 cho các mục con thiếu khi so sánh remote; đã tái hiện bằng chính hàm từ dependency local. Điều này giải thích diff10%→100% trong prompt; không kết luận chỉ từ diff rằng cloud đã đổi sampling hoặc đã deploy.

`wrangler.jsonc` khai báo rõ 0.1 ở cấp chung/logs/traces cho cả production và staging; invocation_logs=false giữ nguyên, không bật traces. Guard scripts/staging.mjs kiểm các giá trị này trong cả source và config generated trước deploy, vẫn kiểm đúng tên Worker/DB/UUID.

Nếu đang ở prompt cũ: chọn n để hủy upload, và n nếu được hỏi cập nhật local config từ remote; sau đó dùng lại npm run deploy:staging khi muốn deploy. Không tiếp tục prompt đã nạp config cũ. Không sửa tay dist/lunara/wrangler.json; build lại từ nguồn. D1 database_name/migrations_dir và assets có thể còn xuất hiện do metadata/đường dẫn build khác remote; kiểm từng diff, không tắt cảnh báo hoặc auto-yes. Dry-run bỏ qua remote pre-upload check, không chứng minh prompt cloud đã biến mất.

Giữ config generated là artifact build: nếu prompt/update tạo khóa lạ như `assets__added`, build lại từ source đã kiểm thay vì chép vào wrangler.jsonc. Dry-run không kiểm remote pre-upload và không chứng minh Dashboard/local diff đã hết.

Nguồn tham khảo: [Cloudflare Wrangler observability](https://developers.cloudflare.com/workers/wrangler/configuration/#observability).
