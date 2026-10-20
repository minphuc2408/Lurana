# Vận hành Lunarra trên Cloudflare

How-to cho operator/chủ shop, hợp nhất **19/10/2026**. Target/build/deploy thuộc [STAGING](STAGING.md), trạng thái/mức nghiệm thu thuộc [PROJECT_STATUS](../PROJECT_STATUS.md), bằng chứng phase ở [Phase 6](../pipeline/PHASE_6_DEPLOY.md). Các thông số provider/quota giữ mốc đối chiếu tài liệu **16/10/2026**, chưa tái thẩm định cloud trong lượt refactor.

## 1. Đúng môi trường và quyền thao tác

Chạy từ root với Node/npm/Wrangler đã pin. Đối chiếu account/Worker/DB/UUID theo [bảng target](STAGING.md#target-cloudflare) trước thao tác; các lệnh --remote bên dưới là production, staging phải dùng target riêng. Không login/create lại tài nguyên đã có hoặc đổi ID để né lỗi quyền/migration.

Ghi remote/deploy/rotate/rollback/restore cần authorization đúng thao tác và môi trường. Runbook không cấp quyền mới, không cho reset/truncate/xóa bảng/cập nhật tồn hàng loạt. Đợt thay dữ liệu staging 18/10 là lịch sử tại [archive](../archive/VERIFICATION_HISTORY.md#bộ-dữ-liệu-staging-và-backup), không phải thủ tục reset thường lệ.

Dev/preview giữ 127.0.0.1/remoteBindings:false; reset chỉ local theo [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md). Health chỉ kiểm Worker liveness; catalog/quote/truy vấn bảng mới kiểm D1 readiness.

## 2. Migration, deploy và dữ liệu mở bán

Đối chiếu [Status](../PROJECT_STATUS.md), backup/bookmark rồi dùng đúng [lệnh target/migration](STAGING.md#database-và-dữ-liệu-thử). Không sửa migration đã áp, không full seed để lấp dữ liệu thiếu. Danh sách migration chờ trống phải đi cùng migration history và đủ schema theo [Database](../reference/DATABASE_DESIGN.md), không suy remote từ source.

Sau deploy kiểm HTTPS/reload Shop/Tra đơn, catalog/quote/cookie/Origin và [10 kịch bản MVP](../pipeline/README.md#8-định-nghĩa-mvp-xong). Secret values không vào source/VITE_*/Git/chat/screenshots; owner nhập qua prompt ẩn.

Trước mở bán owner chốt catalog/ảnh có quyền dùng/giá VND/tồn từng variant, zone/phí/ngưỡng và chính sách. Ẩn HIDDEN sản phẩm mẫu, tắt zone mẫu, không xóa dữ liệu có tham chiếu. Phụ phí 0/30000/50000, cutoff 16:00, chuẩn bị 120 phút và slots trong [API contract](../reference/API_CONTRACT.md#quy-tắc-kiểm-tra-dữ-liệu-đặt-hàng) còn là giả định; sửa source khi được yêu cầu, kiểm local rồi deploy.

## 3. Smoke trên deployment và cleanup

Chỉ định đầy đủ HTTPS origin thuộc dự án, không có path/query/fragment. Chế độ đọc chỉ kiểm các nhóm public/anonymous, không nhận secret, không lookup đơn hoặc chỉnh tồn. Origin không nhận IP/port tùy chỉnh/path/query/fragment:

```powershell
node scripts/smoke.mjs --base-url https://TEN.SUBDOMAIN.workers.dev
```

Kiểm reload SPA cho phép tối đa một redirect 301/302/307/308 từ route sang đúng route thêm `/` trên cùng HTTPS origin (Cloudflare Assets phục vụ thư mục prerender). Redirect sang origin/path khác, có query/fragment hoặc lặp tiếp đều bị từ chối; API vẫn không theo redirect.

Nghiệm thu ghi cần chủ dự án cung cấp URL, variant được phép thử và khoảng thời gian chỉ dùng để kiểm thử; không có đơn khách đồng thời. Chế độ ghi yêu cầu xác nhận origin và variant ID rõ ràng; nhập mật khẩu admin qua stdin/prompt ẩn, không truyền vào command line hoặc biến `VITE_*`:

```powershell
node scripts/smoke.mjs --base-url https://TEN.SUBDOMAIN.workers.dev --allow-remote-writes --confirm-origin https://TEN.SUBDOMAIN.workers.dev --variant-id ID_DA_DUYET --exclusive-test-window
```

Khi Turnstile đã cấu hình, runner cần token mới đúng action/hostname cho từng login/create/replay/lookup; runner không tạo challenge. Prompt TTY chỉ hỏi password; tokens qua hidden stdin JSON `{admin_password,turnstile_tokens}`, tối đa 16 token. Full suite dùng 11 token theo thứ tự `admin_login, checkout, checkout, lookup, lookup, lookup, lookup, checkout, lookup, checkout, checkout`; hai token cuối có thể gửi đồng thời. Token hết hạn sau 5 phút; không lưu JSON/token trong file/args/log/chat.

Nếu không cấp được token đúng luồng/thời hạn, giữ API smoke read-only và nghiệm thu ghi qua browser trong cửa sổ được duyệt; không tắt bảo vệ production. Cơ chế challenge thuộc [BOT_PROTECTION](BOT_PROTECTION.md).

Write smoke tạo ba đơn `SMOKE`: COD giao xong/PAID, đơn kiểm giá đã sửa trên request rồi hủy, đơn thắng cuộc đua món cuối rồi hủy. Script chỉ chỉnh variant được chỉ định, tạm đưa tồn về 1 để kiểm race và phục hồi qua admin delta khi GET xác nhận đúng tồn dự kiến. Khi write mơ hồ, script dừng việc tự phục hồi và yêu cầu đối chiếu; không coi script fail là database chưa thay đổi. Sau run phải kiểm tồn và báo cáo riêng trước cleanup, tránh hoàn thêm lần nữa.

Mọi đơn thử phải có `customer_note` bắt đầu bằng `SMOKE`; dùng người/điện thoại/địa chỉ tổng hợp. Chỉ ghi nhận mã run, số ca pass/fail và ID cần đối chiếu vào bằng chứng riêng; không công bố credential, cookie, response chứa dữ liệu khách hoặc dump database. Smoke tự động không thay thế kiểm tra UI giỏ hàng/reload/VND và các quyết định dữ liệu thật.

Sau smoke, đối chiếu ledger riêng của run: đơn nào đã hủy/hoàn tồn, đơn nào đã giao hoặc còn giữ tồn, variant nào đã chỉnh và số lượng cuối mong muốn. Xóa đơn bằng SQL không gọi `transitionOrder`, **không tự hoàn tồn**. Không cộng tồn lần nữa cho đơn đã hủy. Nếu cần chỉnh, dùng admin → Kho, chỉ exact variant ID được chủ shop duyệt và `stock_delta = tồn_mục_tiêu - tồn_GET_hiện_tại`; kiểm lại GET sau ghi. Không phục hồi snapshot tồn cũ nếu đã có đơn khách hoặc không còn cửa sổ kiểm thử độc quyền.

Đếm trước khi xóa để chắc rằng tất cả dòng bắt đầu `SMOKE` đều là dữ liệu thử được phép dọn; nếu có dòng không xác định, dừng cleanup để chủ shop xác nhận. Chỉ chạy DELETE khi việc cleanup đã được duyệt và mọi dòng khớp đều thuộc run được phép; không mở rộng `WHERE`:

```powershell
npx wrangler d1 execute lunara-db --remote --command "SELECT COUNT(*) AS smoke_orders FROM orders WHERE customer_note LIKE 'SMOKE%'"
npx wrangler d1 execute lunara-db --remote --command "DELETE FROM orders WHERE customer_note LIKE 'SMOKE%';"
npx wrangler d1 execute lunara-db --remote --command "SELECT COUNT(*) AS total_orders FROM orders"
npx wrangler d1 execute lunara-db --remote --command "SELECT COUNT(*) AS smoke_orders FROM orders WHERE customer_note LIKE 'SMOKE%'"
```

FK canonical xóa dây chuyền `order_items`/`order_status_history`. Sau cleanup `smoke_orders = 0`, tồn từng ID khớp đối chiếu và đơn thật còn nguyên. Tổng đơn không bắt buộc bằng 0 nếu shop đã có đơn thật.

## 4. Sao lưu riêng tư và mở thử offline

D1 Time Travel luôn bật trên database production; retention tham chiếu tại mốc 16/10/2026: Free **7 ngày**, Paid **30 ngày**. Lấy bookmark trước migration, smoke ghi hoặc thay dữ liệu lớn và ghi thời điểm kèm timezone vào nhật ký riêng. Không suy ra có backup dùng được chỉ từ việc lấy bookmark. [Cloudflare Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

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
  const baseTables = ['users', 'user_addresses', 'categories', 'products', 'product_variants',
    'product_images', 'delivery_zones', 'orders', 'order_items', 'order_status_history'];
  const existing = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name));
  const tables = [...baseTables, ...['administrative_provinces', 'administrative_wards'].filter(name => existing.has(name))];
  if (tables.length === 11) throw new Error('Danh mục hành chính thiếu một bảng; kiểm migration0003.');
  for (const table of tables) {
    const row = db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get();
    console.log(`${table}: ${row.count}`);
  }
  console.log(`PASS: ${tables.length} bảng nghiệp vụ đọc được, integrity=ok, FK violations=0.`);
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

`secret list` chỉ kiểm tên/metadata, không xác minh giá trị/độ dài hoặc login/provider thành công. Kiểm cấu hình sai bằng harness local, không xóa secret production để test. Contract cookie 12 h/HttpOnly/Strict/Secure, fail-closed và Origin/JSON ở [API](../reference/API_CONTRACT.md#admin-cookie-lunara_admin-httponly); session/credentials không vào browser storage.

Đổi riêng `ADMIN_PASSWORD` chỉ thay mật khẩu cho **lần login tiếp theo**; các JWT còn hạn vẫn hợp lệ nếu `JWT_SECRET` giữ nguyên. Muốn thu hồi **mọi phiên**, chủ dự án rotate `JWT_SECRET`; sau đó phiên cũ phải nhận 401, UI về login, đăng nhập mới thành công. Khi nghi ngờ lộ mật khẩu, đổi cả hai, không chỉ logout trên một trình duyệt. Không ghi credential/JWT/cookie hoặc payload chứa PII vào log; lỗi ứng dụng INTERNAL chỉ giữ `request_id`/`error_name`.

## 7. Khu vực giao và tồn kho

Admin → **Phí giao** (`/admin/delivery-zones`) → chọn tỉnh/phường từ danh mục D1, nhập phí VND/ngưỡng miễn phí/ETA/active. Chỉ zone active hợp danh mục được công bố; không có zone phù hợp thì quote/order trả `NO_DELIVERY_ZONE`, không fallback tỉnh. Dòng legacy mặc định tỉnh hoặc ngoài danh mục được giữ để tắt, không dùng mở coverage. Kiểm quote cho phường active, phường đã tắt và ngoài vùng; không tự thêm phí/SQL ngoài phạm vi được duyệt. [Quy tắc địa chỉ](../features/DELIVERY_ADDRESS.md).

Admin → **Kho** (`/admin/stock`): GET tồn hiện tại, đối chiếu tồn thực tế, nhập **delta**, không nhập nhầm số tồn đích vào delta. Khi ghi lỗi `NETWORK`, `TIMEOUT`, `BAD_RESPONSE` hoặc `INTERNAL`, request có thể đã áp dụng: UI xóa delta vừa nhập, khóa hàng; bấm tải lại/kiểm lại để GET thành công, đối chiếu rồi mới nhập delta mới. Không lặp tự động delta cũ. Nếu GET vẫn lỗi, giữ hàng bị khóa và xử lý kết nối trước. Hủy ở trạng thái sớm mặc định hoàn tồn một lần; IN_TRANSIT hủy cần lý do, restock mặc định false và chỉ hoàn khi owner chọn true vì hoa còn bán được. CANCELLED luôn terminal. Không hoàn tay thêm sau khi service đã hoàn.

## 8. Kiểm hạn mức hằng ngày và sự cố

Chủ shop mở Cloudflare dashboard mỗi ngày và kiểm các mục sau:

1. **Workers & Pages → `lunara` → Metrics**: xem Requests, Errors và CPU Time; chọn khoảng thời gian cần kiểm tra, đối chiếu số request với quota ngày trong bảng dưới. [Cloudflare Workers metrics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/).
2. **D1 → `lunara-db` → Metrics → Row Metrics**: xem Rows read/Rows written; kiểm thêm Storage/dung lượng database và đối chiếu quota ngày/dung lượng. [Cloudflare D1 metrics](https://developers.cloudflare.com/d1/observability/metrics-analytics/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Ghi tổng hợp không chứa PII; kiểm quota **toàn account**, không chỉ Worker/DB này. Chọn ngưỡng cảnh báo nội bộ theo traffic thực tế; việc tạo nhắc lịch do chủ dự án quyết định, runbook này không tạo lịch tự động. Trạng thái owner xác nhận bàn giao quota ở [PROJECT_STATUS](../PROJECT_STATUS.md).

Thông số đối chiếu lại tài liệu Cloudflare ngày **16/10/2026**; trước vận hành phải xác nhận gói/giá thực tế trong account:

| Chỉ số Free | Mức tham chiếu | Nguồn |
| --- | --- | --- |
| Worker invocations | 100.000/ngày; CPU 10 ms/request | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| D1 rows read / written | 5 triệu / 100.000 mỗi ngày, tính toàn account | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| D1 dung lượng | 500 MB/database, 5 GB/account | [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |
| Workers Logs | 200.000 log events/ngày, lưu 3 ngày (kiểm lại chính sách từ 01/12/2026) | [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) |
| D1 queries/Worker invocation | 50 | [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |

Quota ngày reset **00:00 UTC = 07:00 giờ Việt Nam**. D1 tính số dòng đọc/ghi, không phải chỉ số query hoặc số đơn; một truy vấn quét nhiều dòng có thể tốn nhiều quota. Khi chạm daily read/write Free, truy vấn D1 bị từ chối đến reset hoặc khi nâng gói. Không xóa dữ liệu khách để giải quyết quota ngày. [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Static assets được phục vụ trực tiếp có requests miễn phí/không giới hạn; request gọi Worker vẫn tính theo gói. Repo dùng `run_worker_first: ["/api/*"]`: API luôn vào Worker và khi quá quota Free có thể nhận **429**, dù HTML/CSS/ảnh vẫn tải được. Tài liệu general Workers cũng nêu lỗi **1027** khi quá daily requests; xem đúng response và dashboard, không kết luận backend khỏe chỉ vì trang tĩnh tải được. [Static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Workers daily requests](https://developers.cloudflare.com/workers/platform/limits/#daily-requests).

Khi lỗi tăng: xác nhận URL/deployment và request_id, xem metrics/log đã redacted; phân biệt Worker quota/CPU, D1 quota/dung lượng và lỗi ứng dụng. Dừng các job hoặc vòng lặp fetch thừa; rà query quét nhiều dòng/index và bot. Chỉ nâng gói khi chủ dự án đồng ý chi phí. Hết daily quota thì chờ reset hoặc chọn gói phù hợp; hết dung lượng cần kế hoạch retention/archival hoặc nâng gói được duyệt. Không chạy delete hàng loạt/DDL để chữa quota. Local tests không đo được CPU cloud 10 ms; đo login, quote và order thật trong đợt remote acceptance.

## 9. Turnstile và domain

Setup/challenge/rate-limit/TTL theo [BOT_PROTECTION](BOT_PROTECTION.md), upload/gallery theo [CLOUDINARY](CLOUDINARY.md). Ghép đúng UI/site key/secret/hostname từng môi trường, không bật local bypass trên remote. Kiểm header static và API độc lập theo [HARDENING](HARDENING.md).

Domain riêng là tùy chọn cần owner đồng ý hạ tầng/chi phí. Sau gắn Custom Domain kiểm HTTPS/refresh SPA/assets/API cùng origin, login/logout/cookie Secure/write Origin và widget hostname. Cookie workers.dev không chuyển sang domain mới: đăng nhập lại, dùng origin mới cho smoke. [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## 10. Ghi nhận nghiệm thu và bàn giao

Ghi ngày/target/phạm vi/kết quả/giới hạn vào owner: [PROJECT_STATUS](../PROJECT_STATUS.md) chỉ latest verified/blocker/Next, [Phase 6](../pipeline/PHASE_6_DEPLOY.md) giữ mốc phase, [archive](../archive/VERIFICATION_HISTORY.md) giữ lịch sử ngoài phase. Không nhân bản test/deployment snapshots hoặc tick đầu vào còn thiếu.

Trước bước phụ thuộc cần đúng account/DB/quyền ghi, secrets do owner nhập, variant/cửa sổ thử độc quyền, catalog/tồn/zone/chính sách đã duyệt và người theo dõi quota. Có runbook hoặc local PASS chưa chứng minh deployment/provider/cloud đã nghiệm thu.
