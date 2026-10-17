# Hardening — cấu hình và giới hạn hiện tại

Cập nhật 17/10/2026. Tài liệu mô tả các kiểm soát M1–M9 trong source và phần cần nghiệm thu khi vận hành. [Chống bot và COD](BOT_PROTECTION.md) sở hữu chi tiết Turnstile/rate limit/Cron; [PROJECT_STATUS](PROJECT_STATUS.md) sở hữu phiên bản triển khai và bằng chứng local/cloud.

## Hành vi hiện tại

| Mục | Thay đổi và giới hạn |
| --- | --- |
| M1 | Mọi phương thức giao **hôm nay**, kể cả STANDARD, yêu cầu giờ bắt đầu khung cách hiện tại ít nhất `MIN_PREPARATION_MINUTES=120`. Đúng 120 phút được nhận; thiếu dù 1 ms bị từ chối. EXPRESS/SAME_DAY vẫn chỉ hôm nay và trước cutoff 16:00; STANDARD ngày tương lai giữ lịch hiện có. |
| M2 | Summary chỉ đếm variant active thuộc sản phẩm ACTIVE và category active, tồn ≤ ngưỡng; bao gồm tồn 0. Không đếm hàng đã ẩn/tắt. |
| M3 | `public/_headers` áp cho Workers Static Assets: CSP, nosniff, DENY, Referrer-Policy, Permissions-Policy; trang admin/cart/lookup thêm X-Robots-Tag noindex. CSP cho Google Fonts, ảnh HTTPS/data/blob, script/frame Turnstile và kết nối Cloudinary upload. Zod frontend khởi tạo `jitless` trước schema để không thử eval. Phản hồi Worker/API dùng bộ header riêng bên dưới. |
| M4 | Preference EN/VI đã lưu được ưu tiên; lần đầu chọn ngôn ngữ được hỗ trợ đầu tiên trong navigator.languages, fallback English. HTML build ban đầu tiếng Việt; metadata đổi theo route/locale. Build tạo metadata HTML cho Home/Shop/About, robots.txt, sitemap.xml và OG PNG 1200×630. Sitemap production chỉ có Home/Shop; trang sản phẩm có metadata/index sau khi client tìm được DTO trong catalog. About/cart/checkout/lookup/admin noindex; staging luôn noindex/Disallow toàn site, bất kể VITE_SITE_INDEXABLE. |
| M5 | Log INTERNAL có request_id/error_name đã chuẩn hóa và mã D1/SQLite, loại/đích ràng buộc thuộc danh sách cho phép nếu nhận diện được. Không ghi raw message/SQL/binds/stack. Cron bắt lỗi và chỉ ném lại tham chiếu an toàn. Wrangler production/staging bật log với lấy mẫu 10%, tắt invocation logs chứa URL request. Lỗi ngoài mẫu có thể không được lưu. |
| M6 | Rate-limit bindings chặn request vượt ngưỡng trước D1/Siteverify; cap PENDING và Cron giảm giữ tồn giả. API vẫn gọi Worker, kể cả trả 429; Cache-Control 30 giây không bảo đảm tránh invocation. Chưa có lớp bảo vệ quota account trước Worker. Theo dõi Metrics mỗi ngày; cân nhắc zone WAF/custom domain hoặc gói phù hợp theo traffic. |
| M7 | Dashboard nhóm trạng thái trong 30 ngày lịch VN gần nhất, trả thêm period_days=30; số đơn hôm nay riêng. Danh sách mặc định 90 ngày; có bộ lọc ngày đặt từ/đến để tra lịch sử, tối đa 366 ngày mỗi lần. Tìm kiếm literal tối thiểu 2/tối đa 100 ký tự, offset ≤10.000; thu hẹp ngày khi vượt giới hạn. Dùng raw ranges trên placed_at với index sẵn có, hỗ trợ timestamp ISO và SQLite UTC. Không có counter table/FTS; cửa sổ có rất nhiều đơn vẫn cần đo rows-read thực tế. |
| M8 | Product create/patch chỉ nhận URL HTTPS từ res.cloudinary.com hoặc images.unsplash.com, không credentials/port tùy chỉnh. Form giải thích giới hạn. Không sửa ảnh đã lưu hoặc tự tải/xóa asset bên ngoài. Cloudinary ký upload giữ contract image.url. |
| M9 | Lookup dùng bảo vệ trong [BOT_PROTECTION](BOT_PROTECTION.md), làm mới token mỗi attempt và trả cùng NOT_FOUND khi mã/SĐT không khớp. Giao diện/tiến trình tra đơn ở [ORDER_TRACKING](ORDER_TRACKING.md); hợp đồng ở [API_CONTRACT](pipeline/API_CONTRACT.md#post-apiorderslookup). |

SEO build tạo **metadata tĩnh**, không prerender nội dung React/catalog. Route `/shop/:slug` đã có; client cập nhật canonical/OG/tên/mô tả/ảnh từ sản phẩm trong catalog, với snapshot detail được bổ sung khi catalog tải thành công. Chưa có prerender/SSR hoặc sitemap theo sản phẩm. About có metadata/noindex riêng và không thuộc `publicSeoPaths`.

## Cấu hình theo môi trường

- `.env.production` chứa site key **công khai owner đã cung cấp**, origin `https://lunara.minphuc2408.workers.dev` và indexable=true. `.env.staging` chứa key staging riêng, origin staging và indexable=false. Không chứa secret. Build bình thường tự đọc file này; `.env.local` hoặc env build có thể override. Không cần gửi lại site key.
- Ghép đúng widget/site key/secret/hostname và nghiệm thu checkout/lookup/admin login theo [BOT_PROTECTION](BOT_PROTECTION.md#việc-chủ-shop-cần-cấu-hình-trên-cloudflare). Không đưa secret vào frontend hoặc bật bypass trên cloud.
- RateLimit bindings, lịch expiry và observability trong source cần đi cùng bản build đúng môi trường. Không dùng cấu hình repo để kết luận Worker live hoặc Cron đã chạy; đối chiếu [PROJECT_STATUS](PROJECT_STATUS.md).
- Khi đổi domain, sửa VITE_SITE_URL rồi build lại canonical/OG/sitemap và cập nhật hostname Turnstile. Bật WAF zone cần custom domain theo [BOT_PROTECTION](BOT_PROTECTION.md); đây là tùy chọn hạ tầng, không phải yêu cầu của widget.

[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) và [Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) là nguồn kiểm hạn mức/chính sách hiện hành trước vận hành. Mẫu 10% không phải cam kết quota tuyệt đối; theo dõi hằng ngày theo [OPERATIONS](OPERATIONS.md).

## Phạm vi header và observability

| Nguồn policy | Phạm vi |
| --- | --- |
| `public/_headers` | HTML/static assets: CSP, nosniff, DENY, referrer và permissions policy; noindex theo các route khai báo. Build staging bổ sung noindex toàn site. |
| `worker/index.ts` → `secureHeaders()` | Phản hồi API JSON, gồm 200/401/404. Không tự nhận CSP/Permissions-Policy của static assets. API mặc định no-store; catalog GET thành công có public max-age=30. |

`_headers` không áp vào phản hồi do Worker tạo. Nếu bổ sung HTML/SSR trong Worker phải đặt header trên Response; không kết luận API thiếu bảo vệ chỉ vì không có CSP dành cho HTML. [Phạm vi Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/).

Wrangler khai báo sampling `0.1` rõ ở observability/logs/traces cho cả production/staging, `invocation_logs=false`; không bật traces. Wrangler 4.150.0 chuẩn hóa nested rate vắng thành 1, nên staging guard kiểm cả source/generated. Cách xử lý prompt khác biệt cấu hình ở [STAGING](STAGING.md); không chấp nhận remote diff hoặc sửa generated config tùy tiện.

## Kiểm chứng

Test kiểm thời gian chuẩn bị, low-stock active-only, date ranges hai dạng UTC và index `idx_orders_placed_at`, giới hạn tìm kiếm, URL ảnh, chẩn đoán không PII, locale và metadata. Smoke giữ API không redirect; static Shop chỉ chấp nhận redirect cùng origin chính xác `/shop` → `/shop/` trước khi kiểm HTML.

Header cần kiểm độc lập cho HTML/assets và API, cả lỗi 401/404. Browser với CSP phải tải được font, ảnh, Turnstile và preview/upload Cloudinary; không có CSP violations hoặc lỗi JS. Callback/provider mock và test site key không nghiệm thu provider thật. Kết quả local/live, phạm vi full/targeted UI và việc chưa nghiệm thu được giữ tại [PROJECT_STATUS](PROJECT_STATUS.md).
