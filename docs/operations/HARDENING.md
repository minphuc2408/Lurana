# Hardening Lunarra — HTTP, SEO và diagnostics

Reference cho backend/operator; hợp nhất ngày **19/10/2026** từ các kiểm soát M1–M9. Mô tả source, không xác nhận deployment/provider mới. [BOT_PROTECTION](BOT_PROTECTION.md) sở hữu Turnstile/rate limit/cap/TTL; [API_CONTRACT](../reference/API_CONTRACT.md) sở hữu validation/DTO; [PROJECT_STATUS](../PROJECT_STATUS.md) giữ checks và môi trường đã xác minh.

## HTTP headers và payload

| Nguồn policy | Phạm vi |
| --- | --- |
| public/_headers | HTML/static assets: CSP, nosniff, DENY, Referrer-Policy, Permissions-Policy; route admin/cart/checkout/lookup noindex, staging noindex toàn site. |
| worker/index.ts → secureHeaders | API JSON, gồm 200/401/404; không tự nhận CSP/Permissions-Policy của assets. API no-store, GET catalog thành công public max-age=30. |

CSP cho Google Fonts, ảnh HTTPS/data/blob, script/frame Turnstile và kết nối upload Cloudinary. Frontend khởi tạo Zod jitless trước schema để tránh eval. Worker HTML/SSR nếu được thêm phải tự đặt headers trên Response; _headers không áp phản hồi Worker. [Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/).

Middleware drain payload bị bỏ qua ở 404/non-JSON bằng stream, không buffer toàn body. Workerd đóng socket có unread body; proxy Miniflare có thể reuse socket đó, gây POST→GET tiếp theo lỗi. Source: [worker/index.ts](../../worker/index.ts). Probe 100 requests lịch sử nằm ở [Phase 2](../pipeline/PHASE_2_API_CATALOG.md#triển-khai-và-phạm-vi-kiểm-chứng--14102026).

API smoke không theo redirect. Static Shop chỉ chấp nhận redirect cùng origin đúng /shop → /shop/ trước kiểm HTML; quy tắc deployment smoke đầy đủ ở [OPERATIONS](OPERATIONS.md#3-smoke-trên-deployment-và-cleanup).

## SEO và metadata

Build phát metadata HTML Home/Shop/About, robots/sitemap/OG PNG 1200×630; không prerender nội dung React/catalog. Sitemap production chỉ Home/Shop. Product metadata/index do client lấy DTO/catalog, bổ sung snapshot detail khi catalog thành công; chưa có SSR/product sitemap. About không thuộc publicSeoPaths; About/cart/checkout/lookup/admin noindex. Staging luôn noindex/Disallow, kể cả VITE_SITE_INDEXABLE=true.

HTML ban đầu tiếng Việt; metadata đổi theo route/locale, preference lifecycle ở [Entities](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu). Public frontend origin/widget/indexable thuộc [STAGING](STAGING.md); khi đổi domain sửa VITE_SITE_URL, build lại canonical/OG/sitemap và cập nhật hostname widget. Noindex không phải access control.

## Diagnostics và observability

INTERNAL chỉ có tham chiếu request_id cho client; log giữ request_id/error_name đã chuẩn hóa cùng mã D1/SQLite/constraint/target thuộc allowlist khi nhận diện được. Không raw message/SQL/binds/stack/request/credential/PII. Cron bắt lỗi, log an toàn rồi ném lại reference.

Source production/staging khai báo head_sampling_rate=0.1 ở observability/logs/traces, invocation_logs=false và không bật traces. Lỗi ngoài mẫu có thể không được lưu; không coi 10% là giới hạn quota tuyệt đối. Wrangler 4.150.0 normalize nested rate thiếu thành 1; guard kiểm cả source/generated theo [STAGING](STAGING.md#wrangler-dashboard-diff). Không sửa generated config hoặc chấp nhận remote diff tùy tiện.

[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) và [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) là nguồn đối chiếu chính sách khi có tác vụ vận hành; bảng quota có ngày tại [OPERATIONS](OPERATIONS.md#8-kiểm-hạn-mức-hằng-ngày-và-sự-cố).

## Tải tài nguyên và giới hạn query

Summary active-only gồm tồn 0; cửa sổ orders/search/pagination, UTC ranges và thời gian chuẩn bị 120 phút thuộc [API validation](../reference/API_CONTRACT.md#dto-và-validation-admin), [delivery contract](../reference/API_CONTRACT.md#quy-tắc-kiểm-tra-dữ-liệu-đặt-hàng). Query dùng raw placed_at ranges/index idx_orders_placed_at, tránh scan không giới hạn; traffic lớn vẫn phải đo rows-read, chưa có counter table/FTS.

Giới hạn URL ảnh HTTPS allowlist/không credentials/custom port thuộc [API](../reference/API_CONTRACT.md#dto-và-validation-admin); không tự tải/sửa/xóa ảnh cũ. CSP chỉ cho phép tải tài nguyên, không thay validation hoặc xác nhận provider.

Rate-limit/cap/Cron giảm tải nhưng request 429 vẫn gọi Worker; cache 30 s không bảo đảm tránh invocation. Chưa có bảo vệ cứng quota account trước Worker; WAF/domain là tùy chọn theo [Bot](BOT_PROTECTION.md).

## Kiểm chứng

Kiểm độc lập headers HTML/assets/API, cả lỗi 401/404; browser CSP phải tải được font/ảnh/Turnstile/preview-upload, không violations/JS errors. Tests có preparation boundary (đúng 120 phút nhận, thiếu 1 ms từ chối), active-only low stock, UTC ranges/index, search/image limits, redacted diagnostics, locale/metadata.

Local/mock hoặc secret names không thay success flow provider, Cron tick hoặc đo CPU cloud. Kết quả có ngày/scope và full-versus-targeted UI ở Status, không nhân bản kết quả runtime tại đây.
