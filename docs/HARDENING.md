# B2/B3 và M1–M9 — bản sửa local 15/10/2026

**Chưa deploy hoặc thay đổi secrets/D1/domain trên Cloudflare.** Phase 6 vẫn IN PROGRESS (5/7). Không thêm dependency, bảng hoặc migration. [Chống bot và COD](BOT_PROTECTION.md) ghi chi tiết B2/B3 và Cron.

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

- `.env.production` chứa site key **công khai owner đã cung cấp**, origin `https://lunara.minphuc2408.workers.dev` và indexable=true. Không chứa secret. Build bình thường tự đọc file này; `.env.local` hoặc env build có thể override. Không cần gửi lại site key.
- Owner mở widget tương ứng trong Cloudflare Turnstile, kiểm hostname `lunara.minphuc2408.workers.dev` được cho phép; widget staging riêng cho phép `lunara-staging.minphuc2408.workers.dev`. Không đặt scheme/path trong hostname. Staging tự dùng widget/key riêng từ `.env.staging` qua Vite `--mode staging`.
- **Chỉ secret cần nhập riêng:** Workers & Pages → lunara → Settings → Variables and Secrets → thêm secret `TURNSTILE_SECRET` của widget. Hoặc chạy `npx.cmd wrangler secret put TURNSTILE_SECRET`; staging thêm `--env staging`. Không gửi secret qua chat, không đặt trong VITE_* hoặc source. Không bật secret trên deployment UI cũ; deploy UI/verifier cùng cặp khóa trong một lần triển khai được phép.
- Cron `0 * * * *`, TTL 24 giờ, RateLimit bindings, observability và static headers đã khai báo trong repo; đi cùng deploy, không cần tạo Cron bằng tay. Chưa thực hiện deploy ở lượt này. Sau deploy phải nghiệm thu thật cả checkout/lookup/admin login trên hostname được phép.
- Khi đổi domain, sửa VITE_SITE_URL rồi build lại canonical/OG/sitemap và cập nhật hostname Turnstile. Bật WAF zone cần custom domain theo [BOT_PROTECTION](BOT_PROTECTION.md); đây là tùy chọn hạ tầng, không phải yêu cầu của widget.

Theo [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), kiểm ngày 15/10/2026: Free có 200.000 log events/ngày, giữ 3 ngày; chính sách giá thay đổi từ 01/12/2026, cần kiểm lại trước mốc đó. Mẫu 10% không phải cam kết quota tuyệt đối. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) và [Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) giải thích giới hạn request; xem [OPERATIONS](OPERATIONS.md) để theo dõi hằng ngày.

## Bằng chứng local

- 166/166 tests PASS: min chuẩn bị, low-stock visibility, hai dạng UTC/mốc nửa đêm VN và lịch sử, EXPLAIN QUERY PLAN dùng idx_orders_placed_at thay vì SCAN orders, giới hạn tìm kiếm, URL ảnh, chẩn đoán không PII, ngôn ngữ và SEO. Typecheck/build production/staging và architecture PASS.
- Smoke 40/40 PASS; phép ghi dùng workerd D1 persist:false/remoteBindings:false và secret tổng hợp; snapshot persisted giữ nguyên.
- UI cô lập với CSP mới: 10/10 MVP + nhóm CRUD mở rộng PASS; B3 cả hai lựa chọn tồn, lifecycle ba action Turnstile qua mock PASS, 0 JS exceptions. Nhóm responsive rộng không chạy lại; lỗi tràn `/shop` 320px đã biết từ B2/B3 vẫn là giới hạn riêng.
- Native preview Workers Static Assets: HTTP header ở Home/Shop/admin login/cart/lookup PASS; Edge tải Home/Shop/lookup/login với Google Fonts, ảnh và **SDK Turnstile thật dùng test site key chính thức**, nhận token ở lookup/login, 0 CSP violations, 0 JS exceptions hoặc request tải thất bại. Không đăng nhập/đặt đơn bằng credential thật. Cloudinary upload thật và widget/secret production chưa nghiệm thu.
- Build staging kiểm đúng target, HTML/header noindex, robots Disallow toàn site. Sau kiểm bằng test key, build cuối khôi phục key công khai owner cung cấp. Các file evidence/browser profiles ở `.security-review/` bị ignore; không ghi credentials hoặc token.


Turnstile theo môi trường (16/10/2026, cấu hình local, chưa deploy trong lượt này): `.env.production` dùng Site key production, `.env.staging` dùng Site key staging và origin staging/noindex. `npm run deploy:staging` tự chọn `CLOUDFLARE_ENV=staging` + Vite `--mode staging`; `npm run deploy` dùng production như trước. Không cần đặt Site key bằng lệnh bổ sung. `TURNSTILE_SECRET` cần nhập một lần riêng cho từng Worker, đúng cặp widget; không lưu secret trong source. Biến môi trường terminal và `.env.local`/file override có thể ghi đè cấu hình Vite. Không đổi DDL/binding/logic Worker; chưa thay đổi remote hoặc mức hoàn thành Phase 6.

Smoke local 16/10/2026: static metadata Shop có thể redirect `/shop` → `/shop/`; smoke chỉ chấp nhận đích chính xác cùng origin này rồi xác minh HTML 200. Các request API vẫn từ chối redirect.
