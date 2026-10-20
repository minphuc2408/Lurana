# Phát triển và kiểm tra local

How-to dành cho developer và agent chuẩn bị bản clone hoặc kiểm thay đổi. Đây là owner của setup/lệnh local và CodeGraph; phiên bản dependency ở [TECH_STACK](TECH_STACK.md), quyền/checks bắt buộc ở [AGENTS](../AGENTS.md). Các lệnh dưới là hướng dẫn, không phải bằng chứng đã chạy trên source mới.

## Chuẩn bị

- Chạy từ root repository với Node.js và npm. Môi trường local đã ghi nhận dùng Node 24 trên Windows; browser runners dùng Edge headless tại đường dẫn Windows trong source. Workflow Pages dùng Node 22 để build UI, không chứng minh toàn bộ suite local chạy trên mọi phiên bản Node 22.
- Dùng `npm ci` theo lockfile, giữ `.npmrc` HTTPS registry chính thức và `ignore-scripts=true`. Không bật toàn bộ dependency scripts để xử lý lỗi cài đặt.
- Chỉ dùng D1 local; Vite giữ `remoteBindings:false`, dev/preview bind `127.0.0.1`. Không cần login/create tài nguyên Cloudflare để kiểm catalog local.

## Bản clone mới

Cài dependency và tạo env demo nếu chưa có; không ghi đè env của người đang làm việc:

```powershell
npm ci
if (-not (Test-Path -LiteralPath .dev.vars)) {
  Copy-Item -LiteralPath .dev.vars.example -Destination .dev.vars
}
```

Chỉ với database local mới cần migration/seed mẫu ban đầu:

```powershell
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Mở URL Vite in ra, thường `http://127.0.0.1:5173`. Seed là mẫu, không phải dữ liệu mở bán; không seed/reset lại cho mỗi lần sửa UI hoặc bù một khoảng trống dữ liệu. Danh mục hành chính không tự mở coverage: delivery options chỉ trả zone active hợp lệ, theo [DELIVERY_ADDRESS](features/DELIVERY_ADDRESS.md).

`.dev.vars` là server env ignored; demo password không dùng production. Catalog có thể đọc khi chưa có provider thật, nhưng checkout/lookup/admin login mặc định fail-closed nếu thiếu TURNSTILE_SECRET. Cấu hình site key công khai, secret và controlled loopback test theo [BOT_PROTECTION](operations/BOT_PROTECTION.md); không tự bật bypass để coi là nghiệm thu thật. Cloudinary local dùng scope riêng theo [CLOUDINARY](operations/CLOUDINARY.md#4-local).

## Build, preview và kiểm tra

```powershell
npm run build
npm run preview
```

Preview thường ở `http://127.0.0.1:4173`; nếu cổng bận, dùng đúng URL server in ra. Các terminal kiểm tra phải trỏ cùng build/server. Build không thay typecheck; output layout thuộc [TECH_STACK](TECH_STACK.md#build-types-và-cấu-hình).

| Khi nào | Lệnh / phạm vi |
| --- | --- |
| Runtime/style/build changes | `npm run typecheck`, `npm run check:architecture`, `npm test`, `npm run build`, rồi kiểm flow ảnh hưởng |
| Dependency changes | Thêm `npm audit`; giữ manifest/lockfile nhất quán |
| Worker changes | `npm run smoke` trên dev/preview đang chạy; catalog đọc server đó, order/admin writes dùng HTTP loopback + workerd D1 cô lập |
| Database changes | `npm run db:verify`; ca destructive dùng D1 cô lập, persisted seed chỉ đọc; verifier không phải công cụ migrate |
| Binding/type changes | `npm run cf:typegen` tạo Worker declarations; không chạy chỉ vì sửa docs |
| UI tổng quát | `npm run check:ui -- http://127.0.0.1:4173` |
| Storefront responsive | `node scripts/check-ui-storefront.mjs http://127.0.0.1:4173 --responsive` |
| Checkout/lookup/admin | `npm run check:ui:phase5`; nếu build có site key, dùng build test key và `-- --turnstile-test` theo [BOT_PROTECTION](operations/BOT_PROTECTION.md#kiểm-tra-và-giới-hạn-bằng-chứng). Harness cô lập/synthetic secrets, không nghiệm thu provider/cloud |
| Cart/checkout UI chọn lọc | `node scripts/check-ui-cart-checkout.mjs http://127.0.0.1:4173 --fonts`; loopback, callback/POST response tổng hợp, không ghi D1 |
| Lookup UI chọn lọc | `node scripts/check-ui-order-lookup.mjs http://127.0.0.1:4173`; API/challenge giả lập, không tạo đơn |
| Regression refinement | `node scripts/check-ui-refinements.mjs http://127.0.0.1:4173`; focus/menu admin, sticky, control/placeholder và filter mobile; public GET cache trong lượt chạy, admin giả lập, chặn mọi API ghi; tùy chọn `--font-cache=<file>` |
| Theme | [Quy trình kiểm theme](#kiểm-theme-và-font) và scope trong design system |
| Markdown-only | Kiểm nội dung, links/anchors, file inclusion và `git diff --check`; không chạy lại suite runtime để tạo log mới |

Smoke local giữ `persist:false`, `remoteBindings:false`, env demo/synthetic và đối chiếu snapshot persisted. Không suy rộng việc cô lập secret này cho mọi script: schema verifier dùng getPlatformProxy có thể đọc env local. Browser mock/cache và tài nguyên remote bị chặn phải được ghi rõ phạm vi. Full UI checker đã kiểm lại checkout tách route/ward tường minh ngày 20/10; phạm vi và giới hạn bằng chứng ở [hồ sơ nghiệm thu](archive/VERIFICATION_HISTORY.md#kiểm-chứng-local). Một targeted PASS không thay full-suite PASS.

`npm run db:reset:local` xóa state D1 local rồi migrate/seed, chỉ dùng khi cần reset dữ liệu local có chủ đích. Không nằm trong vòng kiểm tài liệu/UI thường lệ. Remote smoke/deploy/migrate/restore thuộc [STAGING](operations/STAGING.md) và [OPERATIONS](operations/OPERATIONS.md), không lấy quyền từ hướng dẫn local này.

## Kiểm theme và font

```powershell
node scripts/check-ui-themes.mjs http://127.0.0.1:4173
node scripts/check-ui.mjs http://127.0.0.1:4173 --i18n-only --fonts
```

Runner theme mặc định chặn font remote; `--font-cache=<file>` và `--api-cache=<file>` là tùy chọn, không phải file bắt buộc trên clone mới. Chế độ `--fonts` của runner i18n cho tải Google Fonts để kiểm bốn font và glyph tiếng Việt. Scope thiết kế/contrast ở [DESIGN_SYSTEM](ui-ux/DESIGN_SYSTEM.md#kiểm-chứng-thiết-kế).

Sau đổi catalog phân trang ngày 20/10, trước khi bật lại các runner theme/storefront/refinements/creative đang tạm dừng, cập nhật bộ giả lập/cache API theo [contract](reference/API_CONTRACT.md#get-apiproductspage1qcategorycodepriceallsortfeaturedfeatured1): khóa cache phải giữ query, response có metadata 40/trang và hỗ trợ `featured` cùng `products/by-variants` để restore giỏ. Cache cũ chỉ khóa pathname không đủ. Fixture Commerce/i18n/Product Detail đã thích ứng và qua kiểm cú pháp; chưa chạy lại suite. Bằng chứng targeted của pagination không thay bằng chứng toàn theme.

Trước khi nối lại kiểm theme, sửa assumptions cũ về21theme, `themes[0]` là mặc định và tên Original gắn với ID `original`: [hợp đồng tên/ID hiện tại](ui-ux/DESIGN_SYSTEM.md#bootstrap-persistence-và-compatibility) giữ ID nhưng đổi nhãn Original/Green Mist. Snapshot16 palette phải tiếp tục bảo vệ giá trị màu/token, chỉ cập nhật tên đã được duyệt. EN/VI storefront nay có màu ở `[data-language-pill]`, nút ngoài giữ vùng bấm44px; không đo background của nút để suy màu active. Các suite này vẫn chưa chạy theo owner.

Runner creative có prerequisite riêng đã xác minh: [check-ui-creative-colors.mjs](../scripts/check-ui-creative-colors.mjs) đọc bắt buộc `.security-review/themes-font-cache.json`, `themes-api-cache.json` và ảnh Hero trong build trước khi chạy `before|after`. Đây là cache local ignored; repository chưa có quy trình chia sẻ đầy đủ để tái tạo chúng cho clone mới. Nếu thiếu, ghi runner chưa chạy thay vì tuyên bố PASS; không đưa snapshot admin/PII vào Git để chữa lỗi. Chuẩn bị cache an toàn hoặc sửa runner là tác vụ source riêng.

## Bẫy local thường gặp

- Vite/CodeGraph đang chạy trên Windows có thể khóa native binaries trong `node_modules`, khiến `npm ci` báo EPERM. Dừng đúng process workspace trước khi cài rồi khởi động lại; không bật dependency scripts toàn cục.
- Sau build đổi bundle, restart preview trước browser tests. Đã từng có HTML mới nhưng JS mới trả `text/html` từ SPA fallback vì preview giữ manifest cũ; kiểm MIME/bundle sau restart, không sửa asset URL để chữa trạng thái server này.
- PowerShell dùng `npm.cmd` khi cần giữ đối số sau `--`; `curl.exe` gọi curl thật thay alias. Giữ dev/preview loopback.
- `.security-review/`, `temp/`, browser profiles/cache và backups là artifact local; không dùng đường dẫn riêng máy hoặc file ignored làm điều kiện duy nhất để người khác hiểu kết quả. Kết quả có ngày/scope ở [status](PROJECT_STATUS.md), bằng chứng cũ ở [archive](archive/VERIFICATION_HISTORY.md).

## CodeGraph và cấu hình trợ lý

Khi `.codegraph/` tồn tại, dùng CodeGraph trước khi tìm/đọc code; Markdown/CSS/JSON hoặc file không được index có thể đọc trực tiếp. Nếu không có index thì bỏ qua; chỉ chạy `npm run assistant:setup` khi owner yêu cầu bật indexing cho clone này.

```powershell
npm.cmd run graph:status -- --json
npm.cmd run graph:explore -- "useProducts useCartState useCheckout"
node scripts/codegraph.mjs node --file src/features/shop/hooks/useProducts.ts --offset 1 --limit 100
```

Khi source đổi và status báo stale, `npm run graph:sync` cập nhật index; file untracked bị allowlist chặn cần review/mở đúng path trước. Không sync chỉ để sửa Markdown. Wrapper pin dependency, cố định root, tắt telemetry/fallback downloads; exclusions ở `codegraph.json` giữ dependency/build/secret/audit ngoài graph. CodeGraph là công cụ điều hướng, không phải security scanner.

Setup quản lý block local trong `.codex/config.toml` cho CodeGraph STDIO/OpenAI Docs MCP, giữ settings ngoài block. Mở phiên trusted mới để nạp cấu hình; không cấu hình global/repository khác. `.codex/` và `.codegraph/` ở local, không đưa vào Git. Quy tắc trợ lý và quyền thao tác vẫn thuộc AGENTS; khi thiếu context chỉ đọc owner tương ứng qua [chỉ mục](../PROJECT_GUIDE.md).
