# Lunara Shop — trạng thái hiện tại

Cập nhật **16/10/2026**, giờ Việt Nam. Repo GitHub: **Lurana**. Code đã push tới `1fecd26`; lượt rà soát tài liệu này chỉ đọc remote, không deploy, thay secrets hoặc ghi D1.

## Code và kiểm chứng local

**Phase 0–5 DONE local; Phase 6 IN PROGRESS, 5/7 tiêu chí.** Còn dữ liệu mở bán thật và xác nhận người vận hành đã nắm cách kiểm quota. Không nâng mức nghiệm thu chỉ từ deploy staging hoặc kiểm tra public.

| Phần | Trạng thái |
| --- | --- |
| Storefront | Catalog/cart/delivery/quote VND, checkout COD form → review → API confirmation, retry cùng UUID, public lookup tại `/orders/track` |
| Admin | Cookie auth, dashboard, đơn/ghi chú/trạng thái, sản phẩm/variants/tồn `stock_delta`, khu vực/phí giao; không dùng fixtures để giả vận hành |
| Bảo vệ | Turnstile fail-closed checkout/lookup/login; thiếu secret503, bypass chỉ opt-in server+loopback; rate limit 6 request/phút/IP/route cho orders/login, 60 cho lookup/quote/catalog; cap 3 PENDING/SĐT người đặt |
| Hủy và tồn | IN_TRANSIT → CANCELLED cần lý do; restock mặc định false. Trước IN_TRANSIT mặc định hoàn tồn. CANCELLED luôn terminal |
| Hết hạn | TTL 24 giờ, Cron `0 * * * *`; một batch D1 3 statements hủy toàn bộ PENDING quá hạn/stock_released=0, history SYSTEM và hoàn tồn một lần |
| Hardening | Chuẩn bị mọi đơn giao hôm nay ≥120 phút; summary 30 ngày, tra đơn mặc định 90/tối đa 366 ngày; URL ảnh HTTPS Cloudinary/Unsplash; log D1 allowlist |
| Frontend | CSP/static headers, Zod jitless, preference → browser EN/VI → English fallback; metadata Home/Shop, canonical/OG/robots/sitemap |
| Build | Production đọc `.env.production`; staging script chọn `CLOUDFLARE_ENV=staging` + Vite `--mode staging`, đọc `.env.staging` và luôn noindex |
| Storage | Chỉ locale và cart variantId/quantity lưu bền; contact/order intent/token/JWT không lưu browser storage |
| Deferred | Customer auth/profile/orders/wishlist, custom requests, admin customers/settings/notifications giữ source nhưng ẩn; customer API-ready gate vẫn false |

**Bằng chứng local gần nhất, 16/10/2026:** typecheck PASS; architecture **215 source files**; **170/170 tests PASS**; build và dry-run prod/staging PASS. Bundle từng môi trường chỉ có Site key tương ứng, đúng Worker/D1/canonical/noindex. Smoke **40/40 PASS**, persisted D1 giữ nguyên; smoke chỉ chấp nhận redirect Shop tới chính xác `/shop/` cùng origin.

Bằng chứng browser đầy đủ tại mốc Phase 5: 17 routes/0 exceptions, 10/10 MVP +2/2 mở rộng. Sau hardening, UI/provider mock 10/10 MVP + CRUD/B3/widget và native preview CSP/SDK test-key đã pass; nhóm responsive rộng còn lỗi `/shop` 320px và chưa được nghiệm thu lại toàn bộ. Không đồng nhất test-key/mock với widget thật hoặc CPU/quota cloud.

Local16/10 bổ sung fail-closed Turnstile: Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 hiện local/chưa deploy. Native workerd3cấu hình PASS; 22phản hồi header live đã kiểm riêng HTML/assets/API. [Chi tiết](HARDENING.md#turnstile-fail-closed-và-header-live-16102026).

## Snapshot remote chỉ đọc — 16/10/2026

| Hạng mục | Production | Staging |
| --- | --- | --- |
| URL | [Production](https://lunara.minphuc2408.workers.dev) | [Staging](https://lunara-staging.minphuc2408.workers.dev) |
| Worker / D1 | `lunara` / `lunara-db` | `lunara-staging` / `lunara-staging-db` |
| Version active | `26d0811c-f2f0-4f7f-a0fa-7cb175035d06` | `e984d962-076f-492c-b2e3-c5cac5f52ec3` |
| Deploy, giờ Việt Nam | 15/10/2026 19:52 | 16/10/2026 13:31 |
| Public catalog | 4 categories, 8 sản phẩm active, 2 tỉnh giao | 4 categories, 1 sản phẩm active, 0 tỉnh giao |
| ADMIN_PASSWORD / JWT_SECRET | Có tên secrets | Có tên secrets |
| Cloudinary | Chưa có vars/secrets tương ứng trong version live | Có cloud/preset/scope và tên CLOUDINARY_API_KEY/API_SECRET |
| TURNSTILE_SECRET | Chưa có | Chưa có |
| Public Site key trong bundle | Chưa có bộ key mới | Đúng key staging, không chứa key production |
| CSP / SEO mới | Chưa có CSP; robots.txt trả SPA HTML | Có CSP, X-Robots-Tag noindex; robots.txt Disallow toàn site |
| RateLimit / TTL | Chưa có bindings/biến mới | Có hai bindings và TTL=24; có scheduled handler |

Snapshot dựa trên deployment/version metadata, tên secrets và HTTP public. Không đọc giá trị secrets, không đăng nhập admin, không upload/đặt đơn/ghi dữ liệu. Có tên Cloudinary secrets chưa chứng minh preset/credentials hợp lệ hoặc upload thành công. Scheduled handler/bindings chưa chứng minh Cron đã thực chạy hay restock trên cloud.

Migration 0001 đã được xác minh trên cả hai D1 ngày 15/10. Counts đơn/tồn/FK sau cleanup production và counts staging=0 trước đây là **snapshot lịch sử**, không phải counts hiện tại; lượt này không truy vấn dữ liệu đơn riêng tư. Không chạy lại seed để đồng bộ hai môi trường.

## Việc còn cần chủ shop

| Việc | Nơi thực hiện |
| --- | --- |
| Dữ liệu mở bán thật | Catalog/ảnh/giá/SKU/tồn, khu vực/phí/khung giờ thật; ẩn hàng mẫu, tắt vùng ví dụ và kiểm quote |
| Bàn giao quota | Xác nhận xem được Workers Requests/Errors/CPU và D1 Rows read/written/storage; [OPERATIONS](OPERATIONS.md) |
| Turnstile | Hai widget/hostname riêng; đúng Site key + secret cùng cặp; deploy UI mới rồi nhập TURNSTILE_SECRET từng Worker và kiểm ba form |
| Production mới | Deploy code mới và thêm Cloudinary secrets nếu cần upload; không sao chép dữ liệu thử staging |
| Staging checkout | Chưa có delivery zones nên chưa nghiệm thu checkout; thêm dữ liệu thử chỉ khi được phép |
| Upload/Cron/bot protection thật | Nghiệm thu trên đúng môi trường và cửa sổ test được cho phép; chưa có bằng chứng đầy đủ |
| Thông tin shop | Chốt địa chỉ/map/pháp nhân/MST, link Zalo và policy; nội dung placeholder không phải dữ liệu pháp lý thật |
| Domain/WAF | Tùy chọn; quyết định riêng về hạ tầng/chi phí |

## Tài liệu chuẩn

[Kiến trúc](../PROJECT_GUIDE.md) · [Stack](TECH_STACK.md) · [API contract](pipeline/API_CONTRACT.md) · [Database](DATABASE_DESIGN.md) · [Entity](FRONTEND_ENTITIES.md) · [Staging](STAGING.md) · [Cloudinary](CLOUDINARY.md) · [Turnstile/COD](BOT_PROTECTION.md) · [Hardening](HARDENING.md) · [Phase 6](pipeline/PHASE_6_DEPLOY.md) · [Rà soát tài liệu](DOCUMENTATION_AUDIT.md).

Các output 53/92/125/136/143/148/150/158/160 tests trong pipeline là kết quả tại mốc cũ. Giữ nguyên bằng chứng, dùng **170 tests / 215 files / 40 smoke** cho code hiện tại.
