# B2/B3 và M1–M9 — cấu hình và giới hạn hiện tại

**Cập nhật 16/10/2026:** code đã push; staging đã deploy 13:31 với CSP/SEO/key staging/RateLimit/TTL 24h và scheduled handler. Production vẫn version15/10; cả hai chưa có TURNSTILE_SECRET. Lượt rà tài liệu chỉ đọc remote; không deploy/ghi D1. Phase 6 vẫn IN PROGRESS (5/7). [Snapshot chi tiết](PROJECT_STATUS.md). Không thêm dependency, bảng hoặc migration. [Chống bot và COD](BOT_PROTECTION.md) ghi chi tiết B2/B3 và Cron.

## Hành vi hiện tại

| Mục | Thay đổi và giới hạn |
| --- | --- |
| M1 | Mọi phương thức giao **hôm nay**, kể cả STANDARD, yêu cầu giờ bắt đầu khung cách hiện tại ít nhất `MIN_PREPARATION_MINUTES=120`. Đúng 120 phút được nhận; thiếu dù 1 ms bị từ chối. EXPRESS/SAME_DAY vẫn chỉ hôm nay và trước cutoff 16:00; STANDARD ngày tương lai giữ lịch hiện có. |
| M2 | Summary chỉ đếm variant active thuộc sản phẩm ACTIVE và category active, tồn ≤ ngưỡng; bao gồm tồn 0. Không đếm hàng đã ẩn/tắt. |
| M3 | `public/_headers` áp cho Workers Static Assets: CSP, nosniff, DENY, Referrer-Policy, Permissions-Policy; trang admin/cart/lookup thêm X-Robots-Tag noindex. CSP cho Google Fonts, ảnh HTTPS/data/blob, script/frame Turnstile và kết nối Cloudinary upload. Zod frontend khởi tạo `jitless` trước schema để không thử eval. API giữ secureHeaders hiện có. |
| M4 | Preference EN/VI đã lưu được ưu tiên; lần đầu chọn ngôn ngữ được hỗ trợ đầu tiên trong navigator.languages, fallback English. HTML ban đầu tiếng Việt; metadata đổi theo route/locale. Build tạo metadata HTML riêng cho Home/Shop, robots.txt, sitemap.xml và OG PNG 1200×630; giữ favicon SVG sẵn có. Chỉ Home/Shop cho index; cart/lookup/admin noindex. Staging luôn noindex/Disallow toàn site, bất kể biến VITE_SITE_INDEXABLE. |
| M5 | Log INTERNAL có request_id/error_name đã chuẩn hóa và mã D1/SQLite, loại/đích ràng buộc thuộc danh sách cho phép nếu nhận diện được. Không ghi raw message/SQL/binds/stack. Cron bắt lỗi và chỉ ném lại tham chiếu an toàn. Wrangler production/staging bật log với lấy mẫu 10%, tắt invocation logs chứa URL request. Lỗi ngoài mẫu có thể không được lưu. |
| M6 | Rate-limit bindings chặn request vượt ngưỡng trước D1/Siteverify; cap PENDING và Cron giảm giữ tồn giả. API vẫn gọi Worker, kể cả trả 429; Cache-Control 30 giây không bảo đảm tránh invocation. Chưa có lớp bảo vệ quota account trước Worker. Theo dõi Metrics mỗi ngày; cân nhắc zone WAF/custom domain hoặc gói phù hợp theo traffic. |
| M7 | Dashboard nhóm trạng thái trong 30 ngày lịch VN gần nhất, trả thêm period_days=30; số đơn hôm nay riêng. Danh sách mặc định 90 ngày; có bộ lọc ngày đặt từ/đến để tra lịch sử, tối đa 366 ngày mỗi lần. Tìm kiếm literal tối thiểu 2/tối đa 100 ký tự, offset ≤10.000; thu hẹp ngày khi vượt giới hạn. Dùng raw ranges trên placed_at với index sẵn có, hỗ trợ timestamp ISO và SQLite UTC. Không có counter table/FTS; cửa sổ có rất nhiều đơn vẫn cần đo rows-read thực tế. |
| M8 | Product create/patch chỉ nhận URL HTTPS từ res.cloudinary.com hoặc images.unsplash.com, không credentials/port tùy chỉnh. Form giải thích giới hạn. Không sửa ảnh đã lưu hoặc tự tải/xóa asset bên ngoài. Cloudinary ký upload giữ contract image.url. |
| M9 | Lookup có widget/action/hostname verification và giới hạn 60/phút/IP/route; token được làm mới mỗi attempt. Không lộ việc mã đơn tồn tại khi mã/SĐT không khớp. Có hiệu lực thực tế khi deploy đúng binding + secret. |

SEO hiện tạo **metadata tĩnh**, không prerender nội dung React/catalog. Frontend chưa có route chi tiết sản phẩm; sitemap không bịa URL sản phẩm. Prerender/SSR và metadata riêng mỗi sản phẩm cần đi cùng tính năng trang chi tiết sau này. Chưa khẳng định SEO đã tối ưu toàn bộ.

## Cấu hình đã làm và phần owner phải nhập

- `.env.production` chứa site key **công khai owner đã cung cấp**, origin `https://lunara.minphuc2408.workers.dev` và indexable=true. `.env.staging` chứa key staging riêng, origin staging và indexable=false. Không chứa secret. Build bình thường tự đọc file này; `.env.local` hoặc env build có thể override. Không cần gửi lại site key.
- Owner mở widget tương ứng trong Cloudflare Turnstile, kiểm hostname `lunara.minphuc2408.workers.dev` được cho phép; widget staging riêng cho phép `lunara-staging.minphuc2408.workers.dev`. Không đặt scheme/path trong hostname. Staging tự dùng widget/key riêng từ `.env.staging` qua Vite `--mode staging`.
- **Chỉ secret cần nhập riêng:** Workers & Pages → lunara → Settings → Variables and Secrets → thêm secret `TURNSTILE_SECRET` của widget. Hoặc chạy `npx.cmd wrangler secret put TURNSTILE_SECRET`; staging thêm `--env staging`. Không gửi secret qua chat, không đặt trong VITE_* hoặc source. Không bật secret trên deployment UI cũ; deploy UI/verifier cùng cặp khóa trong một lần triển khai được phép.
- Cron `0 * * * *`, TTL 24h, RateLimit bindings, observability và static headers đã khai báo cho cả hai môi trường. Staging live đã có TTL/bindings/handler và headers mới; production chưa có. Chưa kiểm Cron thực chạy/quota cloud, không tự gọi handler để thử trong lượt tài liệu. Sau deploy phải nghiệm thu thật cả checkout/lookup/admin login trên hostname được phép.
- Khi đổi domain, sửa VITE_SITE_URL rồi build lại canonical/OG/sitemap và cập nhật hostname Turnstile. Bật WAF zone cần custom domain theo [BOT_PROTECTION](BOT_PROTECTION.md); đây là tùy chọn hạ tầng, không phải yêu cầu của widget.

Theo [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), đối chiếu lại ngày 16/10/2026: Free có 200.000 log events/ngày, giữ 3 ngày; chính sách giá thay đổi từ 01/12/2026, cần kiểm lại trước mốc đó. Mẫu 10% không phải cam kết quota tuyệt đối. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) và [Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) giải thích giới hạn request; xem [OPERATIONS](OPERATIONS.md) để theo dõi hằng ngày.

## Bằng chứng local

Kiểm gần nhất 16/10: typecheck/architecture 215/tests 166, build/dry-run hai môi trường PASS; bundle mỗi bản chỉ chứa key tương ứng và đúng canonical/noindex; smoke 40/40, persisted D1 giữ nguyên. Các nhóm UI/test-key phía dưới là evidence tại mốc hardening15/10, không phải nghiệm thu challenge production.

- 166/166 tests PASS: min chuẩn bị, low-stock visibility, hai dạng UTC/mốc nửa đêm VN và lịch sử, EXPLAIN QUERY PLAN dùng idx_orders_placed_at thay vì SCAN orders, giới hạn tìm kiếm, URL ảnh, chẩn đoán không PII, ngôn ngữ và SEO. Typecheck/build production/staging và architecture PASS.
- Smoke 40/40 PASS; phép ghi dùng workerd D1 persist:false/remoteBindings:false và secret tổng hợp; snapshot persisted giữ nguyên.
- UI cô lập với CSP mới: 10/10 MVP + nhóm CRUD mở rộng PASS; B3 cả hai lựa chọn tồn, lifecycle ba action Turnstile qua mock PASS, 0 JS exceptions. Nhóm responsive rộng không chạy lại; lỗi tràn `/shop` 320px đã biết từ B2/B3 vẫn là giới hạn riêng.
- Native preview Workers Static Assets: HTTP header ở Home/Shop/admin login/cart/lookup PASS; Edge tải Home/Shop/lookup/login với Google Fonts, ảnh và **SDK Turnstile thật dùng test site key chính thức**, nhận token ở lookup/login, 0 CSP violations, 0 JS exceptions hoặc request tải thất bại. Không đăng nhập/đặt đơn bằng credential thật. Cloudinary upload thật và widget/secret production chưa nghiệm thu.
- Build staging kiểm đúng target, HTML/header noindex, robots Disallow toàn site. Sau kiểm bằng test key, build cuối khôi phục key công khai owner cung cấp. Các file evidence/browser profiles ở `.security-review/` bị ignore; không ghi credentials hoặc token.


Smoke local 16/10/2026: static metadata Shop có thể redirect `/shop` → `/shop/`; smoke chỉ chấp nhận đích chính xác cùng origin này rồi xác minh HTML 200. Các request API vẫn từ chối redirect.


## Turnstile fail-closed và header live —16/10/2026

Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 hiện local/chưa deploy.

Unit/integration kiểm cả3route, secret undefined/rỗng/whitespace, remote cố bật flag, body/X-Forwarded-Host giả loopback, không D1/cookie/provider call khi cấu hình sai, configured-secret vẫn cần token. Native workerd với synthetic bindings kiểm503 mặc định,200 chỉ khi loopback opt-in,403 khi có secret nhưng thiếu token. Frontend ánh xạ lỗi cấu hình sang thông báo xác minh hiện có EN/VI.

**Bằng chứng mới:** typecheck/architecture215,170/170 tests, build/dry-run2env và smoke40/40 PASS; persisted D1 giữ nguyên. UI checker tổng quát vẫn dừng ở phép đợi tổng quote670 trước chọn khu vực (giới hạn script đã biết), không tuyên bố full browser suite PASS. Không có dependency/DDL/deploy/secret change.

### Header kiểm độc lập trên live

22 phản hồi GET public: mỗi môi trường6HTML routes,1JS asset và4API responses (health/catalog200, guest admin401, unknown404). Hai lỗi mạng tạm thời đã kiểm lại thành công; evidence chỉ giữ header allowlist trong .security-review/security-headers-live-20261016.json (ignored). Không gửi credentials, không POST hoặc ghi remote.

| Nhóm | Production | Staging |
| --- | --- | --- |
| HTML/static assets | Chưa có CSP/nosniff/X-Frame-Options/Referrer-Policy/Permissions-Policy trong các phản hồi đã kiểm | Có CSP, nosniff, DENY, strict-origin-when-cross-origin, Permissions-Policy camera/microphone/geolocation=(); noindex |
| API200/401/404 | nosniff, SAMEORIGIN, no-referrer, HSTS max-age15552000/includeSubDomains; health/errors/admin no-store | Cùng bộ secureHeaders API; catalog200 có public max-age30 |
| CSP/Permissions-Policy ở API | Không có trong cấu hình secureHeaders hiện tại | Không có trong cấu hình secureHeaders hiện tại |

Đây là hai bộ policy có phạm vi khác nhau. API trả JSON, không suy ra thiếu secureHeaders chỉ vì không có CSP của HTML. _headers không áp vào phản hồi do Worker tạo; nếu bổ sung HTML/SSR trong Worker phải đặt header trực tiếp trên Response. [Cloudflare Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/).

Production cần deploy static headers mới. Lượt này không thay deployment hoặc tuyên bố headers đã được sửa trên production. Staging private routes có X-Robots-Tag lặp noindex do các rule chồng nhau; không thay đổi ý nghĩa noindex, chưa sửa ngoài phạm vi.

Cập nhật deploy16/10:owner đã cho deploy staging version `75fcbb54-5528-4cc1-b101-22fdc7a91a40` cùng UI/ảnh category,bao gồm Turnstile fail-closed.TURNSTILE_SECRET vẫn thiếu;live login/lookup503TURNSTILE_NOT_CONFIGURED đã kiểm bằng inputsynthetic.Không đổi/bypasssecrets,khôngđặtđơn;production giữ bảncũ.[Hiện trạng](PROJECT_STATUS.md),[scope ảnh](CATEGORY_IMAGES.md).


16/10 local: sampling0.1 được khai báo rõ ở observability/logs/traces cho prod+staging để tránh diff defaults1 trong Wrangler4.150.0; invocation logs vẫn false, traces không bật. Staging guard kiểmsource/generated. Không deploy/cloud verification; [chẩn đoán và xử lý prompt](STAGING.md).
