# Vận hành Lunara trên Cloudflare

Cập nhật **15/10/2026**. Runbook cho một Worker `lunara` và D1 `lunara-db`; trạng thái nghiệm thu và bằng chứng thực thi nằm tại [Phase 6](pipeline/PHASE_6_DEPLOY.md). Có runbook hoặc chạy tốt local không đồng nghĩa deployment đã nghiệm thu. Chỉ mở bán sau khi đủ toàn bộ tiêu chí Phase 6, gồm dữ liệu thật và kiểm thử trên URL đã deploy.

## 1. Đúng môi trường và quyền thao tác

Chạy từ root repository với Node/npm và Wrangler đã pin trong `package-lock.json`. Không đăng ký tài khoản, login hoặc tạo lại D1 đã có. Đối chiếu account trong dashboard trước mỗi đợt ghi; cấu hình hiện tại ở [wrangler.jsonc](../wrangler.jsonc): Worker `lunara`, binding `DB`, database `lunara-db`, ID `1796e7bf-d230-4bc1-a80a-f4be4d1eccc7`. ID database không phải secret. Không đổi ID để bỏ qua lỗi quyền hoặc lỗi migrate.

Các lệnh `--remote` nhắm database production. Lệnh ghi remote, deploy, thay secrets, rollback và restore chỉ thực hiện khi chủ dự án đã cho phép đúng thao tác/target. Hướng dẫn dưới đây không tạo authorization mới. Trong Phase 6, SQL ghi trực tiếp chỉ gồm migration canonical, seed mẫu ở bước 6.5 và cleanup `SMOKE` ở bước 6.9 theo [danh sách đã duyệt](pipeline/PHASE_6_DEPLOY.md). Không reset D1 remote, truncate, xóa bảng hay cập nhật tồn hàng loạt.

Giữ dev/preview trên `127.0.0.1`, `remoteBindings: false`; `npm run db:reset:local` chỉ dùng local. `/api/health` kiểm tra Worker còn chạy; catalog/quote và truy vấn bảng mới kiểm chứng D1 sẵn sàng.

## 2. Migration, deploy và dữ liệu mở bán

Đầu tiên đối chiếu account/database, quota và quyền áp dụng migration. Các lệnh sau là kế hoạch có điều kiện; kiểm tra từng kết quả trước bước kế tiếp:

```powershell
npx wrangler d1 migrations list lunara-db --remote
npx wrangler d1 migrations apply lunara-db --remote
npx wrangler d1 execute lunara-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
npx wrangler d1 execute lunara-db --remote --command "SELECT name, applied_at FROM d1_migrations ORDER BY id"
```

`migrations list` liệt kê migration **chưa áp dụng**. Danh sách trống cần đi cùng dòng `0001_mvp.sql` trong `d1_migrations` và đủ 10 bảng nghiệp vụ: `users`, `user_addresses`, `categories`, `products`, `product_variants`, `product_images`, `delivery_zones`, `orders`, `order_items`, `order_status_history`; không đếm bảng nội bộ Cloudflare/SQLite vào số 10. [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).

Seed mẫu chỉ chạy một lần để nghiệm thu trước mở bán, sau khi xác nhận database chưa có dữ liệu thật; không chạy lại seed để sửa dữ liệu production:

```powershell
npx wrangler d1 execute lunara-db --remote --file=./docs/sql/MVP_SEED_DEV.sql
```

Chủ dự án thực hiện deploy đầu tiên bằng `npm run deploy`, chọn subdomain `workers.dev` khi được hỏi và cung cấp URL chính xác. Không đưa secrets vào `wrangler.jsonc`, `VITE_*`, source, Git, nội dung chat hay ảnh chụp. Đặt hai secrets riêng biệt qua prompt của Wrangler theo mục 6. Sau deploy kiểm tra HTTPS, refresh trực tiếp `/shop` và `/orders/track`, catalog/quote, cookie/Origin và [10 kịch bản MVP](pipeline/README.md#8-định-nghĩa-mvp-xong).

Trước mở bán, chủ shop cung cấp/nhập sản phẩm, giá VND, tồn từng variant, ảnh có quyền sử dụng, khu vực/phí/ngưỡng miễn phí và chính sách giao. Ẩn (`HIDDEN`) sản phẩm mẫu; tắt khu vực mẫu thay vì xóa dữ liệu có tham chiếu. Các giá trị hiện tại trong [worker/config.ts](../worker/config.ts) là giả định: phụ phí Standard/Express/Same-day `0/30.000/50.000`, cutoff `16:00`, thời gian chuẩn bị `120` phút; khung giờ được re-export từ [shared/constants.ts](../shared/constants.ts). Chốt và kiểm thử local trước khi deploy cấu hình đã sửa.

## 3. Smoke trên deployment và cleanup

Chỉ định đầy đủ HTTPS origin thuộc dự án, không có path/query/fragment. Lệnh đọc không nhận secret và không tạo đơn:

```powershell
node scripts/smoke.mjs --base-url https://TEN.SUBDOMAIN.workers.dev
```

Nghiệm thu ghi cần chủ dự án cung cấp URL, variant được phép thử và khoảng thời gian chỉ dùng để kiểm thử; không có đơn khách đồng thời. Chế độ ghi yêu cầu xác nhận origin và variant ID rõ ràng; nhập mật khẩu admin qua stdin/prompt ẩn, không truyền vào command line hoặc biến `VITE_*`:

```powershell
node scripts/smoke.mjs --base-url https://TEN.SUBDOMAIN.workers.dev --allow-remote-writes --confirm-origin https://TEN.SUBDOMAIN.workers.dev --variant-id ID_DA_DUYET --exclusive-test-window
```

Write smoke tạo ba đơn `SMOKE`: COD giao xong/PAID, đơn kiểm giá đã sửa trên request rồi hủy, đơn thắng cuộc đua món cuối rồi hủy. Script chỉ chỉnh variant được chỉ định, tạm đưa tồn về 1 để kiểm race và phục hồi qua admin delta khi GET xác nhận đúng tồn dự kiến. Khi write mơ hồ, script dừng việc tự phục hồi và yêu cầu đối chiếu; không coi script fail là database chưa thay đổi. Sau run phải kiểm tồn và báo cáo riêng trước cleanup, tránh hoàn thêm lần nữa.

Mọi đơn thử phải có `customer_note` bắt đầu bằng `SMOKE`; dùng người/điện thoại/địa chỉ tổng hợp. Chỉ ghi nhận mã run, số ca pass/fail và ID cần đối chiếu vào bằng chứng riêng; không công bố credential, cookie, response chứa dữ liệu khách hoặc dump database. Smoke tự động không thay thế kiểm tra UI giỏ hàng/reload/VND và các quyết định dữ liệu thật.

Sau smoke, đối chiếu ledger riêng của run: đơn nào đã hủy/hoàn tồn, đơn nào đã giao hoặc còn giữ tồn, variant nào đã chỉnh và số lượng cuối mong muốn. Xóa đơn bằng SQL không gọi `transitionOrder`, **không tự hoàn tồn**. Không cộng tồn lần nữa cho đơn đã hủy. Nếu cần chỉnh, dùng admin → Kho, chỉ exact variant ID được chủ shop duyệt và `stock_delta = tồn_mục_tiêu - tồn_GET_hiện_tại`; kiểm lại GET sau ghi. Không phục hồi snapshot tồn cũ nếu đã có đơn khách hoặc không còn cửa sổ kiểm thử độc quyền.

Đếm trước khi xóa để chắc rằng tất cả dòng bắt đầu `SMOKE` đều là dữ liệu thử được phép dọn; nếu có dòng không xác định, dừng cleanup để chủ shop xác nhận. Chỉ dùng lệnh xóa đã có trong Phase 6; không mở rộng `WHERE`:

```powershell
npx wrangler d1 execute lunara-db --remote --command "SELECT COUNT(*) AS smoke_orders FROM orders WHERE customer_note LIKE 'SMOKE%'"
npx wrangler d1 execute lunara-db --remote --command "DELETE FROM orders WHERE customer_note LIKE 'SMOKE%';"
npx wrangler d1 execute lunara-db --remote --command "SELECT COUNT(*) AS total_orders FROM orders"
npx wrangler d1 execute lunara-db --remote --command "SELECT COUNT(*) AS smoke_orders FROM orders WHERE customer_note LIKE 'SMOKE%'"
```

FK canonical xóa dây chuyền `order_items`/`order_status_history`. Sau cleanup `smoke_orders = 0`, tồn từng ID khớp đối chiếu và đơn thật còn nguyên. Tổng đơn không bắt buộc bằng 0 nếu shop đã có đơn thật.

## 4. Sao lưu riêng tư và mở thử offline

D1 Time Travel luôn bật trên database production; retention hiện hành: Free **7 ngày**, Paid **30 ngày**. Lấy bookmark trước migration, smoke ghi hoặc thay dữ liệu lớn và ghi thời điểm kèm timezone vào nhật ký riêng. Không suy ra có backup dùng được chỉ từ việc lấy bookmark. [Cloudflare Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

```powershell
npx wrangler d1 time-travel info lunara-db
```

Đề xuất xuất SQL hằng tuần và trước đợt thay đổi production. Chạy lúc ít giao dịch vì export đang chạy chặn các request database khác. Export schema + data ra SQL là đường dẫn Cloudflare hỗ trợ để import lại. [Cloudflare import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/).

Ví dụ PowerShell: `.security-review/` đã được ignore. Chọn tên duy nhất; kiểm tra ignore trước khi xuất, không dùng `git add -f`:

```powershell
$backupStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path (Get-Location) '.security-review/backups'
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$backupFile = Join-Path $backupDir "lunara-$backupStamp.sql"
git check-ignore -- "$backupFile"
if ($LASTEXITCODE -ne 0) { throw 'Đường dẫn backup phải được Git ignore trước khi xuất.' }
if (Test-Path -LiteralPath $backupFile) { throw 'Không ghi đè backup cũ.' }
npx wrangler d1 export lunara-db --remote --output "$backupFile"
if ($LASTEXITCODE -ne 0) { throw 'Export thất bại; chưa có backup hợp lệ.' }
Get-FileHash -LiteralPath $backupFile -Algorithm SHA256
```

SQL và bản SQLite kiểm tra có thể chứa **tên, SĐT, địa chỉ, lời nhắn khách hàng**. Git ignore chỉ chống commit nhầm, không mã hóa file. Giới hạn người được đọc, dùng ổ/thư mục riêng tư có mã hóa hoặc kho backup riêng của chủ shop; không để trong `public/`, `dist/`, cloud share công khai hoặc đính kèm issue. Output export có thể có URL tải tạm đã ký; không chia sẻ toàn bộ log/URL đó, chỉ lưu kết quả thành công và hash. Chốt lịch lưu/xóa backup với chủ shop; giữ ít nhất một bản riêng khỏi máy phát triển.

Mở thử bằng Node 24 `node:sqlite`, hoàn toàn offline, vào **file SQLite mới** cạnh backup. Không kết nối D1 remote, không dùng seeded local D1 của ứng dụng và không in dữ liệu từng đơn. Chạy ngay sau export trong cùng PowerShell:

```powershell
$restoreFile = Join-Path $backupDir "lunara-$backupStamp-restore-check.sqlite"
@'
import { readFileSync, existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const [source, target] = process.argv.slice(2);
if (!source || !target || existsSync(target)) throw new Error('Cần backup SQL và target mới.');
const db = new DatabaseSync(target);
try {
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(readFileSync(source, 'utf8'));
  db.exec('PRAGMA foreign_keys = ON;');
  const integrity = db.prepare('PRAGMA integrity_check').all();
  const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
  if (integrity.length !== 1 || Object.values(integrity[0])[0] !== 'ok' || foreignKeys.length) {
    throw new Error('Backup không qua integrity/FK check; chưa nghiệm thu.');
  }
  const tables = ['users', 'user_addresses', 'categories', 'products', 'product_variants',
    'product_images', 'delivery_zones', 'orders', 'order_items', 'order_status_history'];
  for (const table of tables) {
    const row = db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get();
    console.log(`${table}: ${row.count}`);
  }
  console.log('PASS: 10 bảng đọc được, integrity=ok, FK violations=0.');
} finally {
  db.close();
}
'@ | node --input-type=module - "$backupFile" "$restoreFile"
if ($LASTEXITCODE -ne 0) { throw 'Mở backup offline thất bại; chưa nghiệm thu backup.' }
```

Đối chiếu số bảng/số dòng với tổng hợp tại thời điểm export; lưu SHA-256, thời gian, kết quả integrity/FK trong ghi chú riêng. Chỉ tick tiêu chí backup Phase 6 sau khi **bản export remote thực tế** mở thử thành công. Chạy cùng kỹ thuật với dữ liệu local chỉ kiểm chứng quy trình, không thay bằng chứng backup remote.

Import SQL trở lại D1 production là một thay đổi dữ liệu khác với export. Không chạy file backup trên database đang có dữ liệu để thử restore. Nếu cần phục hồi từ SQL, chủ dự án phải duyệt target và kế hoạch mới; thử file trên database cô lập trước, đối chiếu FK/tổng đơn/tồn/phiên bản schema rồi mới xử lý production. [Cloudflare import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/).

## 5. Rollback và xử lý dữ liệu hỏng

Đọc deployment/version trước khi rollback; chọn đúng version đã biết tốt, tương thích schema đang dùng:

```powershell
npx wrangler deployments list
npx wrangler versions list
```

Sau khi chủ dự án cho phép rollback target cụ thể:

```powershell
npx wrangler rollback VERSION_ID_DA_DUYET
```

Rollback đổi code/assets/config của Worker đang phục vụ traffic ngay; **không rollback schema hoặc dữ liệu D1**. Nếu migration mới phá tương thích, code cũ có thể lỗi. [Cloudflare rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/), [Workers versions](https://developers.cloudflare.com/workers/versions-and-deployments/).

Secrets là binding gắn với version; vì vậy cần coi rollback về version trước đợt rotate là nguy cơ khôi phục cấu hình credential cũ. Sau rollback kiểm tra secret names và đăng nhập; nếu phiên/mật khẩu cũ từng bị lộ, chủ dự án đặt lại secrets hiện hành trước mở traffic. Đây là suy luận vận hành từ việc [version giữ bindings](https://developers.cloudflare.com/workers/versions-and-deployments/) và [secret là binding, thay secret tạo/deploy version](https://developers.cloudflare.com/workers/configuration/secrets/).

Schema đã áp remote giữ nguyên file migration lịch sử. Thay đổi schema dùng migration mới `000N_*.sql`, test local và backup trước khi áp remote; không sửa `0001_mvp.sql`, không áp `docs/sql/deferred/0002_custom_requests.sql` vào MVP. Với lỗi dữ liệu, dừng thao tác ghi liên quan, giữ bookmark hiện tại/backup và xác định thời điểm tốt cuối cùng cùng chủ shop.

Time Travel restore **ghi đè toàn database** và hủy truy vấn đang chạy; có thể làm mất mọi đơn hợp lệ sinh sau mốc được chọn. Chỉ chủ dự án/agent đã được ủy quyền restore mới chạy sau khi đối chiếu mốc, phạm vi mất dữ liệu và phương án bảo toàn đơn phát sinh:

```powershell
npx wrangler d1 time-travel info lunara-db --timestamp="YYYY-MM-DDTHH:mm:ss+07:00"
npx wrangler d1 time-travel restore lunara-db --bookmark=BOOKMARK_DA_DUYET
```

Lưu bookmark trước restore và bookmark undo do Wrangler trả về. Kiểm tra migration, catalog, lookup đơn tổng hợp, tổng đơn và tồn trước khi mở lại; Worker rollback và D1 restore là hai quyết định riêng. [Cloudflare Time Travel restore](https://developers.cloudflare.com/d1/reference/time-travel/#restore-a-database).

## 6. Secrets, mật khẩu và phiên admin

Chủ dự án tạo mật khẩu ngẫu nhiên tối thiểu **24 ký tự** và JWT secret khác biệt tối thiểu **32 ký tự**, lưu trong password manager. Nhập qua prompt của các lệnh dưới đây; không truyền giá trị vào CLI/history, biến `VITE_*` hay chat. Local thật dùng `.dev.vars` ignored; smoke local dùng demo secrets riêng trong harness. Cloudflare khuyến nghị secrets thay cho `vars`; `secret put` tạo version và deploy ngay. [Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

```powershell
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put JWT_SECRET
npx wrangler secret list
```

`secret list` chỉ kiểm tên/metadata, không xác minh giá trị hay độ dài; phải kiểm đăng nhập thực tế. Thiếu/trống/ngắn secrets hoặc hai giá trị giống nhau: code hiện tại từ chối login/admin, không cấp cookie. Kiểm fail-closed bằng test/harness local; không xóa secret production chỉ để nghiệm thu. Cookie `lunara_admin` là HttpOnly/SameSite=Strict/Path=/, Secure trên HTTPS, hết hạn 12 giờ. Ghi admin yêu cầu đúng Origin và JSON; không lưu password/JWT/session vào localStorage/sessionStorage.

Đổi riêng `ADMIN_PASSWORD` chỉ thay mật khẩu cho **lần login tiếp theo**; các JWT còn hạn vẫn hợp lệ nếu `JWT_SECRET` giữ nguyên. Muốn thu hồi **mọi phiên**, chủ dự án rotate `JWT_SECRET`; sau đó phiên cũ phải nhận 401, UI về login, đăng nhập mới thành công. Khi nghi ngờ lộ mật khẩu, đổi cả hai, không chỉ logout trên một trình duyệt. Không ghi credential/JWT/cookie hoặc payload chứa PII vào log; lỗi ứng dụng INTERNAL chỉ giữ `request_id`/`error_name`.

## 7. Khu vực giao và tồn kho

Admin → **Phí giao** (`/admin/delivery-zones`) → tạo/sửa khu vực: tỉnh/thành, phường/xã, phí VND, ngưỡng miễn phí, ETA và active. `ward_name` rỗng là mặc định tỉnh; dòng phường active khớp sẽ ưu tiên. Không có cả dòng phường và mặc định tỉnh active thì checkout báo `NO_DELIVERY_ZONE`. Tắt dòng ví dụ, kiểm quote mới ở ba trường hợp (phường riêng/mặc định/ngoài vùng), rồi owner xác nhận phí thật. Dùng form admin đã có để tạo khu vực; không tự thêm SQL production ngoài Phase 6.

Admin → **Kho** (`/admin/stock`): GET tồn hiện tại, đối chiếu tồn thực tế, nhập **delta**, không nhập nhầm số tồn đích vào delta. Khi ghi lỗi `NETWORK`, `TIMEOUT`, `BAD_RESPONSE` hoặc `INTERNAL`, request có thể đã áp dụng: UI xóa delta vừa nhập, khóa hàng; bấm tải lại/kiểm lại để GET thành công, đối chiếu rồi mới nhập delta mới. Không lặp tự động delta cũ. Nếu GET vẫn lỗi, giữ hàng bị khóa và xử lý kết nối trước. Sau hủy đơn hợp lệ, service hoàn tồn đúng một lần; không hoàn tay thêm lần nữa.

## 8. Kiểm hạn mức hằng ngày và sự cố

Chủ shop mở dashboard mỗi ngày: Workers & Pages → `lunara` → Metrics (request, lỗi, CPU); D1 → `lunara-db` → Metrics/Row Metrics (rows read/written, dung lượng). Ghi tổng hợp không chứa PII; kiểm quota **toàn account**, không chỉ Worker/DB này. Chọn ngưỡng cảnh báo nội bộ theo traffic thực tế; việc tạo nhắc lịch do chủ dự án quyết định, runbook này không tạo lịch tự động.

Thông số đối chiếu tài liệu Cloudflare ngày **15/10/2026**; trước vận hành phải xác nhận gói/giá thực tế trong account:

| Chỉ số Free | Mức tham chiếu | Nguồn |
| --- | --- | --- |
| Worker invocations | 100.000/ngày; CPU 10 ms/request | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| D1 rows read / written | 5 triệu / 100.000 mỗi ngày, tính toàn account | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| D1 dung lượng | 500 MB/database, 5 GB/account | [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |
| D1 queries/Worker invocation | 50 | [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |

Quota ngày reset **00:00 UTC = 07:00 giờ Việt Nam**. D1 tính số dòng đọc/ghi, không phải chỉ số query hoặc số đơn; một truy vấn quét nhiều dòng có thể tốn nhiều quota. Khi chạm daily read/write Free, truy vấn D1 bị từ chối đến reset hoặc khi nâng gói. Không xóa dữ liệu khách để giải quyết quota ngày. [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Static assets được phục vụ trực tiếp có requests miễn phí/không giới hạn; request gọi Worker vẫn tính theo gói. Repo dùng `run_worker_first: ["/api/*"]`: API luôn vào Worker và khi quá quota Free có thể nhận **429**, dù HTML/CSS/ảnh vẫn tải được. Tài liệu general Workers cũng nêu lỗi **1027** khi quá daily requests; xem đúng response và dashboard, không kết luận backend khỏe chỉ vì trang tĩnh tải được. [Static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Workers daily requests](https://developers.cloudflare.com/workers/platform/limits/#daily-requests).

Khi lỗi tăng: xác nhận URL/deployment và request_id, xem metrics/log đã redacted; phân biệt Worker quota/CPU, D1 quota/dung lượng và lỗi ứng dụng. Dừng các job hoặc vòng lặp fetch thừa; rà query quét nhiều dòng/index và bot. Chỉ nâng gói khi chủ dự án đồng ý chi phí. Hết daily quota thì chờ reset hoặc chọn gói phù hợp; hết dung lượng cần kế hoạch retention/archival hoặc nâng gói được duyệt. Không chạy delete hàng loạt/DDL để chữa quota. Local tests không đo được CPU cloud 10 ms; đo login, quote và order thật trong đợt remote acceptance.

## 9. Turnstile và domain

Hiện mới có verifier Turnstile server có điều kiện cho **đặt đơn**; checkout/admin chưa có widget và login admin chưa gọi verifier. Chỉ đặt `TURNSTILE_SECRET` ngay bây giờ sẽ buộc request order có token trong khi UI chưa tạo token, khiến checkout bị chặn. `VITE_TURNSTILE_SITE_KEY` một mình cũng chưa tạo widget. Không bật secret trước khi tích hợp đầy đủ và test local.

Nếu owner chọn bật Turnstile: cung cấp site key public/hostname và quản lý secret riêng qua Cloudflare; tích hợp widget checkout + admin, thêm verifier ở login, truyền/reset token và kiểm `hostname`/`action` theo cấu hình mong muốn; test token thiếu/sai/hết hạn/provider lỗi và thành công trước deploy. Không gửi secret trong chat. Quá trình bật cần deploy được duyệt; rate limit vẫn là phần chưa có, không coi Turnstile thay thế rate limit. [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Domain riêng là tùy chọn. Chủ dự án cung cấp domain và đồng ý chi phí/authorization; sau gắn Custom Domain kiểm HTTPS, refresh SPA, asset/API cùng origin, login/logout/cookie Secure và write Origin trên domain mới. Cookie cũ của `workers.dev` không chuyển sang domain mới; đăng nhập lại. Dùng HTTPS origin mới khi chạy smoke và cấu hình hostname Turnstile nếu đã bật. [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## 10. Nhật ký nghiệm thu và bàn giao

Giữ trong [Phase 6](pipeline/PHASE_6_DEPLOY.md) các bằng chứng **đã thực thi**: ngày giờ, target, migration applied, số smoke pass, 10 ca MVP trên deployment, cleanup/tồn, backup remote mở offline, dữ liệu thật và owner xác nhận cách xem quota mỗi ngày. Không ghi URL giả hoặc tick mục đang chờ owner.

Đầu vào cần owner cung cấp/xác nhận trước bước phụ thuộc: đúng account/database và quyền ghi; quyền deploy đầu tiên/URL; secrets thật do owner nhập; variant/cửa sổ thử độc quyền; sản phẩm/tồn/khu vực/phí/chính sách thật; lựa chọn Turnstile/domain; người kiểm hạn mức hằng ngày. Các mục tùy chọn không tự chặn deploy cơ bản, nhưng lựa chọn bật chúng cần tích hợp/kiểm thử tương ứng.
