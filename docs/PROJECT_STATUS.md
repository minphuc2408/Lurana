# Lunara Shop — trạng thái hiện tại

Cập nhật **16/10/2026**, giờ Việt Nam. Repo GitHub: **Lurana**. Code của lượt UI/ảnh danh mục đã chia theo nhóm: typography `14c82c2`, bố cục/card `9e8f20d`, hero `9f19e2c` và catalog/DB `5ed8a56`; tài liệu được commit riêng cùng lượt. Owner đã cho migrate/gán 4 ảnh category trên DB local + staging và deploy staging version `75fcbb54-5528-4cc1-b101-22fdc7a91a40` ngày 16/10. Không deploy/ghi production hoặc thay secrets.

## Cập nhật mới nhất — ảnh category đã live staging

- Staging version `75fcbb54-5528-4cc1-b101-22fdc7a91a40` đã deploy với bố cục, font, hero mới và 4 ảnh danh mục từ DB.
- Migration `0002_category_images.sql` và 4 URL ảnh đã áp local/staging. Production vẫn chỉ có migration 0001.
- Live: API trả 4 URL; cả 4 WebP khớp SHA-256 với file local. Browser EN/VI đạt 10/10 trường hợp, 0 exception; CSP/noindex được giữ.
- Local: 172 tests, 13/13 nhóm kiểm tra schema và 40/40 nhóm smoke đạt.
- Staging giữ Turnstile fail-closed theo owner: login/lookup trả 503 khi chưa có secret. Provider, Cron và quota cloud chưa được nghiệm thu.
- [Chi tiết triển khai, ảnh, prompt và rollback](CATEGORY_IMAGES.md).

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

**Bằng chứng local gần nhất, 16/10/2026:** typecheck PASS; architecture **215 source files**; **172/172 tests PASS**; build và dry-run prod/staging PASS. Bundle từng môi trường chỉ có Site key tương ứng, đúng Worker/D1/canonical/noindex. Smoke **40/40 PASS**, persisted D1 sau migration giữ nguyên trong lúc smoke; smoke chỉ chấp nhận redirect Shop tới chính xác `/shop/` cùng origin.

Bằng chứng browser đầy đủ tại mốc Phase 5: 17 routes/0 exceptions, 10/10 MVP +2/2 mở rộng. Sau hardening, UI/provider mock 10/10 MVP + CRUD/B3/widget và native preview CSP/SDK test-key đã pass; nhóm responsive rộng còn lỗi `/shop` 320px và chưa được nghiệm thu lại toàn bộ. Không đồng nhất test-key/mock với widget thật hoặc CPU/quota cloud.

Local16/10 bổ sung fail-closed Turnstile: Thiếu/rỗng/whitespace TURNSTILE_SECRET trả503 TURNSTILE_NOT_CONFIGURED trước D1/auth/Siteverify. Chỉ bypass khi cờ server TURNSTILE_ALLOW_LOCAL_BYPASS=true và hostname chính xác localhost/127.0.0.1/[::1]; mặc định local cũng đóng. Có secret thì luôn xác minh token, kể cả bật cờ. Không khai báo cờ trong Wrangler prod/staging, không nhận cờ từ body/header/client. Harness test cô lập tự bật rõ ràng; không đọc ambient .dev.vars. Bản sửa16/10 đã deploy staging cùng version ảnh category; production chưa deploy. Native workerd3cấu hình PASS; 22phản hồi header live đã kiểm riêng HTML/assets/API. [Chi tiết](HARDENING.md#turnstile-fail-closed-và-header-live-16102026).

## Snapshot remote chỉ đọc — 16/10/2026

**Lịch sử trước lượt deploy ảnh category**: bảng dưới là snapshot13:31;version staging hiện tại ở mục cập nhật mới nhất trên đầu trang.

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

Các output 53/92/125/136/143/148/150/158/160 tests trong pipeline là kết quả tại mốc cũ. Giữ nguyên bằng chứng, dùng **172 tests / 215 files / 40 smoke** cho code hiện tại;170 thuộc mốc trước ảnh category.

Typography EN thử local (16/10/2026): Fraunces 500/500 Italic cho heading/logo, optical sizing tự động (opsz 9–144); Inter cho body/UI. Bỏ Caveat, nhãn hero dùng body. VI giữ Lora/Be Vietnam Pro. Google Fonts dùng preconnect + display=swap; chưa deploy.

Kiểm chứng Fraunces/Inter: typecheck, architecture 215, 170/170 tests, build và diff check PASS. Probe Edge riêng tải đủ 2 font EN + 2 font VI; glyph VI không fallback, heading EN 500/italic/optical sizing auto, VI 600 giữ nguyên. Bố cục không tràn ngang và logo EN một dòng ở 320/390/768/1024/1440px, 0 runtime exceptions. Full UI checker không chạy lại (quote-before-zone đã ghi nhận); ảnh Unsplash bị chặn bởi host allowlist của probe. Preview local http://127.0.0.1:4175; chưa deploy.

Bố cục Home theo [Stitch](https://stitch.withgoogle.com/projects/14566722138013174841) được triển khai local16/10: hero hai cột, category DB, dải dịch vụ COD, grid/card dùng chung Shop; giữ màu Lunara và Fraunces/Inter (VI Lora/Be Vietnam Pro). Ảnh trang trí để trống chờ chủ shop cung cấp, ảnh sản phẩm giữ nguồn DB. Header search/category nối Shop qua q/category; Home có chọn size/thêm giỏ thật. Không đổi API/DDL/dependency hoặc deploy.

Kiểm chứng layout Stitch local16/10: typecheck/build PASS, architecture215, tests170/170, diff check PASS. Probe Edge Home + card Shop EN/VI ở320/390/768/1024/1440px không overflow hoặc cắt controls (>=44px); giữ4 category DB/3 featured tại lúc kiểm, ảnh trang trí trống, chọn size/giá/variant cart, category URL, header search và tìm lại cùng route, API failure→retry và empty catalog PASS;0 runtime exceptions. Checker repo chạy lại vẫn dừng ở quote-before-zone `Total includes 670` đã biết, không coi full UI PASS. Preview http://127.0.0.1:4176; ảnh DB hiện có không tải được trong probe nên ImageWithFallback hiển thị placeholder, không chứng minh provider ảnh live. Không gửi order hoặc ghi D1/remote.

Hero responsive local16/10: ảnh bó hoa mới tạo bằng imagegen theo ảnh tham chiếu và chấp thuận của chủ shop; lưu src/assets/hero/lunara-bouquet-{640,960,1440}.webp (~47/83/150 KB), import Vite thay vì public, srcset/sizes + high priority. Desktop ảnh phải/gradient ngang; dưới1024px ảnh dưới chữ, khung4:3/gradient trên. Ảnh category/trang trí khác vẫn trống, ảnh DB giữ nguyên. [Nguồn/prompt](../ATTRIBUTIONS.md). Chưa deploy.

Kiểm chứng hero ảnh16/10: typecheck PASS sau bật vite/client, architecture215,170/170 tests, build/diff check PASS. Probe Edge EN/VI ở320/390/768/1024/1440px (10 cases) và mobile390px DPR2 PASS: ảnh load thật/có naturalWidth, không overlap CTA/text, không overflow, khung mobile4:3; mỗi navigation tải đúng1 candidate (640px~47KB ở mobile DPR1,960px~83KB ở mobile DPR2). Không JS exception. Screenshot/probe trong .security-review local; preview http://127.0.0.1:4180. Không chạy lại full UI checker ở lượt chỉ thêm hero ảnh (lỗi quote-before-zone từ lượt layout vẫn chưa xử lý); không đổi Worker/D1 hoặc deploy.

Category images16/10 (cập nhật mới hơn snapshot remote chỉ đọc ở trên): owner yêu cầu tạo/gán ảnh local+staging và xác nhận deploy staging giữ fail-closed. Migration0002_category_images.sql và4 URL đã áp cả2DB; staging kiểm trực tiếp có4category/1product/3variants/0orders,FK sạch.4WebP256px trong public/images/categories,10–14KB/tấm;API thêm image_url nullable,UI tròn từDB. Local172/172tests,typecheck,architecture215,db:verify13/13,smoke40/40,build và staging dry-run PASS. Probe ảnh load thật EN/VI/nămviewport10/10,category navigation PASS,0exception. Production chưa migrate/deploy; staging delivery đã PASS trên version `75fcbb54-5528-4cc1-b101-22fdc7a91a40`:API4URL,ảnh4/4khớpSHA256,browser10/10case;khôngproduction. [Chi tiết](CATEGORY_IMAGES.md).
