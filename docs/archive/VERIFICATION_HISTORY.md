# Lịch sử kiểm chứng và triển khai Lunarra

Hồ sơ dành cho maintainer và người vận hành tra nghiệm thu, audit, provenance backup và deployment. Tổng hợp ban đầu ngày **19/10/2026**, hợp nhất hồ sơ dư ngày **20/10/2026, giờ Việt Nam**. Đây là **kết quả lịch sử đã ghi nhận**, không phải lượt chạy lại runtime tests hoặc kiểm cloud. Trạng thái hiện hành thuộc [PROJECT_STATUS](../PROJECT_STATUS.md).

## Phạm vi và cách sử dụng

- Giữ audit, provenance backup và mốc kiểm chứng ngoài hồ sơ phase. Bằng chứng Phase 0–5 vẫn ở [các hồ sơ phase](../pipeline/README.md#3-các-phase); nghiệm thu production 15/10 ở [Phase 6](../pipeline/PHASE_6_DEPLOY.md#bằng-chứng-thực-thi--15102026), không sao chép lại ở đây.
- Mỗi kết quả chỉ áp dụng cho ngày, môi trường và phạm vi được nêu. API/challenge tổng hợp, font cache hoặc provider bị chặn không chứng minh giao dịch/provider thật, thiết bị vật lý hay CPU/quota cloud.
- Artifact trong `.security-review/` là hồ sơ local ignored, có thể không tồn tại trên clone khác. Giữ tóm tắt kiểm chứng tại đây; không công khai backup, cookie, token hoặc payload chứa dữ liệu khách. Bản PROJECT_STATUS trước refactor được Git lưu; không nhân bản toàn bộ bảng/log cũ.

## Kiểm tra bảo mật ban đầu — 12–14/10/2026

- Bản ghi ngày 12/10 rà 81 file/ZIP gốc khớp SHA-256, 355 archive dependency cùng sáu package đóng kèm; checksum/chữ ký ECDSA đã kiểm, chưa xác minh provenance attestation. Defender quét source và archive không ghi nhận threat trong phạm vi đó. Đây là kiểm tra snapshot ban đầu, không phải bảo đảm bảo mật source/dependency hiện tại hoặc toàn máy.
- Hai package high tại mốc đó là Vite 6.3.5 và React Router 7.13.0 (19 advisory); bản cập nhật 6.4.4/7.18.4 được ghi nhận audit 0, build/browser local PASS sau đó. Những kết luận demo auth/client storage cũ đã được thay bằng kiến trúc/API hiện hành; không dùng báo cáo cũ để kết luận thiếu backend hôm nay.
- Evidence riêng tư trong `.security-review/`: `source-audit.json`, `original-zip-audit.json`, `defender-{scan,events,archives-scan}.json`, `package-archive-audit.json`, `registry-signature-audit.json`, `installed-npm-audit.json`, `build-smoke-check.json`. Không tái mở hoặc tái kiểm artifact trong lượt dọn tài liệu; chưa kiểm production qua các bằng chứng này.

## Backup demo frontend — 14/10/2026

- Vị trí ghi nhận: `temp/fe-demo-2026-10-14-1791974270315/`, local/ignored. `frontend-source.zip` giữ frontend/config public tại commit `c33104f801ee07d6932b4c35a12bbd0c97e1ba0b`; `frontend-data.json` chứa tám sản phẩm PHP và source 18 fixture; `demo-images.zip` giữ 15 ảnh/kích thước gốc. `manifest.json` ánh xạ URL/file/source/bytes/SHA-256, 15/15 ảnh tải và hash kiểm lúc tạo; `README.txt` nhận diện backup.
- Đây là provenance phục hồi tham khảo thiết kế/demo, không xác nhận artifact còn trên mọi máy. Không nhập demo accounts/fixture vào D1 hoặc ghi đè source/dữ liệu vận hành; không mở backup để dọn Markdown. Scan fixture và nghiệm thu tích hợp vẫn ở Phase 5; lifecycle hiện hành thuộc [FRONTEND_ENTITIES](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu).

## Audit tài liệu và refactor — 17–20/10/2026

- Ngày 17/10: rà 32 Markdown/sửa 30, kiểm 387 links/anchors PASS; không đổi source/config/SQL/dependency hoặc chạy runtime tests/build. HTTP công khai kiểm 49 URL: 45 trả 2xx/3xx; PR1/PR2 trả 404 ẩn danh, Unsplash/trang license trả 401. Chưa kiểm authenticated hoặc tái thẩm định license; giữ credits/URL nguồn.
- Ngày 20/10, trước dọn file dư: các Giai đoạn 0–4 refactor tài liệu hoàn tất; 42 Markdown/536 links nội bộ, cấu trúc và diff whitespace PASS. Giữ 17 anchor guide, 16 palette nền/30 HEX creative, bảy khối DTO và bảng API, bốn mẫu backup/restore/cleanup; source/config/SQL/dependency không đổi. Bảy hồ sơ Phase giảm 912→280 dòng, giữ đủ tiêu chí; Phase 6 vẫn 5/7. Đây là nghiệm thu tài liệu, không phải runtime/cloud/provider.
- Hồ sơ kế hoạch, prompt đã hoàn tất, audit/backup riêng và chỉ mục guidelines dư được bỏ theo yêu cầu owner; phần lịch sử hữu ích hợp nhất tại đây. [PROJECT_GUIDE](../../PROJECT_GUIDE.md) là chỉ mục ownership, không còn task refactor đang chờ tiếp tục. Hạn chế full UI `total670`, creative cache, provider/Cron/quota và dữ liệu mở bán vẫn ở Status/các owner, không bị xóa khỏi phạm vi cần làm.

## Kiểm chứng local

| Mốc | Kết quả đã ghi nhận | Phạm vi và giới hạn |
| --- | --- | --- |
| 19/10 — hierarchy của 5 creative themes | Typecheck, architecture 242 source files, 200/200 tests và build PASS; regression mới FAIL trước sửa. Browser: 126 ca layout/type/content, 96 ca computed styles legacy; 70 cặp ảnh và 10 PNG ghép đã được xem. Runner 21 theme: 400 màu, 336 Header, 147 route, 21 lượt về Original, 10 navigation, 20 admin; detail 294 ca PASS. | Giữ 6 HEX/ID/key và snapshot 16 theme cũ; text AA và focus/control ≥3:1, keyboard/portal/boot/storage/form/4 font PASS; 0 exceptions/0 API ghi. Catalog/admin tổng hợp, ảnh mẫu/font cache local; chưa deploy. [Quyết định và mapping](../ui-ux/Extend_Lunara_Multi_Theme.md#phân-bổ-màu-và-kiểm-chứng). |
| 18/10 — detail/yêu thích/focus | Typecheck, architecture 242 source files, 197 tests, build PASS. Browser detail 224 ca =16 theme ×2 locale ×7 widths 320–3840px; sidebar/resize/keyboard/storage/size/quantity/loading/error PASS. Lookup 72 ca, checkout 18 nhóm và navigation 10 nhóm PASS. | 0 exceptions/0 API ghi; API/challenge tổng hợp, font cache. Chỉ local tại mốc này. [Hành vi](../ARCHITECTURE.md#chi-tiết-sản-phẩm-và-hoa-yêu-thích); nội dung Story/Ý nghĩa/Chăm sóc sản phẩm còn chờ owner. |
| 18/10 — Home/Original đồng bộ xanh | Typecheck/architecture 239 source files/197 tests/build PASS; runner 16 theme: 305 màu, 256 Header, 112 route, 10 navigation, 16 lượt về Original/reload; 224 ca footer và 28 layout/4 interaction PASS. Regression đã tái hiện lỗi trộn màu trước sửa. | 0 exceptions/0 ghi đơn; catalog GET bị intercept, font cache; chưa kiểm Safari/thiết bị vật lý/provider. Đã lên staging lúc 21:42 như mục dưới. Ma trận 1.504 ca responsive thuộc lượt refactor trước sửa màu, không phải lượt chạy mới này. |
| 18/10 — gỡ dãy danh mục Home | Typecheck/architecture 239 source files/196 tests/build PASS; 160 ca =16 theme ×EN/VI ×5 widths 320–1920px PASS. | Catalog snapshot bị intercept; 0 exceptions/0 ghi đơn. Không đổi DB/API/asset; khối danh mục không còn, navigation và Shop vẫn có danh mục. Đã lên staging. |
| 18/10 — storefront/footer/Shop | Typecheck/architecture 239 source files/196 tests/build PASS; 256 Header, 112 route, 10 navigation; storefront 28 layout và 4 nhóm interaction EN/VI, 390/1440px PASS. | Kiểm filter/sort/quick-add/Back/focus/notices/reduced motion; 0 exceptions/0 ghi đơn. Catalog/delivery snapshot bị intercept, font cache; không nghiệm thu admin/provider thật. Đã lên staging. |
| 18/10 — GitHub Pages local | Typecheck/architecture 237 source files/194 tests/build mặc định và Pages PASS; server tĩnh loopback render 6 routes, navigation/asset base/noindex/robots/sitemap/fallback PASS. | 0 exceptions/0 ghi; deep links Cart/Checkout/Tra đơn render với HTTP404. Chưa kiểm Settings/Actions hoặc deploy GitHub. Ghi chú workflow untracked trong bản ghi cũ đã được thay bằng kết quả Git tracked tại audit 19/10; điều đó không chứng minh Pages đã deploy. |
| 17/10 — 16 light themes | Typecheck/architecture 237 source files/194 tests/build PASS; 256 Header, 112 route, 16 lượt về Original/reload, keyboard/portal/persistence/storage/form và 4 font từ cache PASS. | Catalog/delivery snapshot bị intercept; 0 exceptions/0 ghi đơn. Lên staging 18/10; [spec palette nền](../ui-ux/LUNARA_MULTI_THEME_SPEC.md). |
| 17/10 — Home Featured/Journey | Typecheck/architecture 234 source files/191 tests/build PASS; 14 ca layout EN/VI ×7 widths 320–1440px, quick-add và loading/empty/error/retry PASS. | Catalog tổng hợp; snapshot staging lúc đó có 1 sản phẩm, ảnh Cloudinary tải trong preview. 0 exceptions/0 API ghi; không phải deploy mới. |
| 17/10 — Tra đơn/footer | Typecheck/architecture 234 source files/191 tests/build và staging build/dry-run PASS. Lookup 72 ca =6 trạng thái ×2 locale ×6 widths; footer 84 lượt =14 mục ×2 locale ×3 widths PASS. | Lookup API/challenge giả lập, 0 exceptions/0 ghi đơn; có kiểm response trễ và memory-only PII. Footer kiểm Escape/X/Đóng, trả focus và không điều hướng. [Tra đơn](../features/ORDER_TRACKING.md). |
| 17/10 — Cart/Checkout, Story và typography | Checkout 18 nhóm PASS, hai response đặt đơn bị intercept 503→201; Story 28 ca =2 route ×2 locale ×7 widths, 7 vị trí ảnh tải và noindex/navigation PASS. Header/search/cart 24 ca; typography tải 4 font/glyph Việt và kiểm portal PASS. | 0 exceptions/0 order API writes. Story đã chạy lại sau khi thêm Journey; header/typography là probe riêng, không thay full UI suite. [Checkout](../features/CHECKOUT_UI.md). |
| 16/10 — delivery/catalog | Typecheck/build, 190 tests/225 source files, schema 13/13 nhóm (46 assertions), smoke 40/40 PASS; browser admin 7, địa chỉ 8, checkout 12 nhóm PASS. | Dữ liệu cô lập; 0 exceptions. [Coverage và nguồn danh mục](../features/DELIVERY_ADDRESS.md). |
| 16/10 — gallery/detail và category images | Gallery 5 nhóm, detail 6 nhóm browser PASS; lần lượt 179/174 tests tại mốc tương ứng. Category: 172 tests, schema 13/13, smoke 40/40, ảnh EN/VI 10 ca và 4 WebP khớp SHA-256. | Signed upload/challenge giả lập, Worker/D1 cô lập, snapshot persisted không đổi; không nghiệm thu provider. [Cloudinary](../operations/CLOUDINARY.md), [ảnh danh mục](../features/CATEGORY_IMAGES.md). |
| 16/10 — hardening/fail-closed | Native verifier 3 cấu hình và 22 phản hồi header live đã kiểm. | Chỉ bằng chứng tại mốc đó; không chứng minh secret/challenge, Cron hoặc CPU/quota cloud hiện tại. [Hardening](../operations/HARDENING.md). |

Lần full UI checker ghi nhận ngày 17–18/10 dừng ở assertion `total670` trong `check-ui-live-catalog.mjs`; bản ghi xác định checker còn giả định quote-before-zone/checkout gộp. Các targeted PASS ở trên không phải full-suite PASS. Việc điều chỉnh và nghiệm thu lại vẫn theo [status hiện hành](../PROJECT_STATUS.md#code-và-kiểm-chứng-local).

Nhóm artifact local đã được ghi nhận: `creative-hierarchy-*`/`creative-hierarchy-audit/`, `product-detail-results.json`, `themes-results.json`, `storefront-results.json`, `home-reference-results.json`, `home-selection-results.json`, `lookup-ref-results.json`, `story-ui-results.json` và các ảnh/probe tương ứng trong `.security-review/`. Không dùng sự có mặt của tên file làm bằng chứng mới rằng artifact còn tồn tại hoặc đã được tái kiểm.

## Staging ngày 18/10/2026

### Bản deploy được ghi nhận

- Worker `lunara-staging`, [origin staging](https://lunara-staging.minphuc2408.workers.dev), deploy **21:42:04 giờ Việt Nam**, 100% traffic. Version `21f0e1be-22a6-44f3-b2fa-48d19630beda`, deployment `fdc73814-3677-43a6-ba9c-cc94b68f4986`; bản trước lúc 16:05 là `f77449f2-ddd4-4ee2-89e9-898dfb998930`.
- JS/CSS và 6 JPG live khớp SHA-256 build. Bundle `index-Cm58vrRs.js`, SHA-256 `045f2ab586954739ac11dfbfa38fa22a7e4849d1ebf48470f0676c7918a017bf`; 7 routes reload trả 200, CSP/noindex/nosniff và read-only smoke 3/3 PASS. Preflight staging build/dry-run và các kiểm local Home/Original nêu trên PASS.
- Edge live 224 ca =16 theme ×EN/VI ×7 widths 320–3840px và 4 nhóm interaction 390/1440px PASS. Catalog thật có 32 active products, ảnh ref tải đúng; 0 exceptions/0 API errors/0 API ghi. Font cache local; chưa nghiệm thu challenge/upload/admin/order thật hoặc thiết bị vật lý.
- D1 sau deploy khớp snapshot dữ liệu bên dưới, FK sạch và migrations 0001–0003; lượt deploy không migrate/seed/đổi secret/ghi production. Artifact local: `.security-review/deploy-20261018-final-{verification,browser-results,db-counts}.json` và `deploy-20261018-final-smoke.log`. Không thay nghiệm thu Cron/CPU/quota cloud.

### Bộ dữ liệu staging và backup

- Đã thay dữ liệu 12 bảng nghiệp vụ **lúc 21:27**, chỉ `lunara-staging-db`; giữ schema, migrations 0001–0003, sequence và coverage Hà Nội/Hoàn Kiếm. Quyết định dữ liệu, ngoại lệ ảnh trống và cách tránh trùng ID thuộc [DATABASE_DESIGN](../reference/DATABASE_DESIGN.md#bộ-dữ-liệu-staging-theo-quyết-định-owner).
- Snapshot đã đối chiếu toàn bộ row: **products 40 / variants 120 / categories 4 / images 0; users 10 / addresses 9; orders 18 / items 36 / history 54; provinces 1 / wards 126 / zones 1**. Products: ACTIVE 32, HIDDEN 4, ARCHIVED 4; featured 8. Mỗi badge BEST_SELLER/HOT/NEW có 10 sản phẩm, không badge 10; mỗi trạng thái đơn có 3 mẫu. Đây là dữ liệu kiểm thử, không phải dữ liệu mở bán; counts không giữ nguyên mãi do có TTL/Cron.
- Backup trước reset đã mở thử offline, integrity `ok`, không lỗi FK; `.security-review/backups/lunara-staging-final-before-reset-20261018-212651.sql`, SHA-256 `d62ec21fc09960c320f0c639ee8ada6b6a4c34566a21ebdaaab535757f57e302`. Hash trùng bản 21:11, không có drift trước ghi. Backup/SQL/SQLite/CSV chứa dữ liệu và chỉ giữ riêng tư, ignored.
- Dataset 23 SQL statements đã thử trên workerd D1 cô lập; catalog/filters/detail/quote/admin catalog/18 order details/summary/zones PASS. `db:verify` 13/13 nhóm, 46 assertions sau ghi; remote không lỗi FK, migration history không đổi; public 4 categories/32 active/8 featured và 32 detail không ảnh PASS. Artifact: `staging-dataset-{isolated-check,remote-verification}.json`, `staging-products-40.csv` trong `.security-review/`.

Đợt import từng có D1 trả 500 tạm thời; kiểm sau đó không còn lỗi. Owner xác nhận `/cart` hết lỗi sau Ctrl+Shift+R, không sửa code. Browser local/staging: 24 ca Home/Shop/detail ×320/768/1440/2560px và 6 ca giỏ rỗng/có variant/mã cũ PASS; 0 overflow/JS exceptions/API ghi, local vẫn dùng seed riêng. Artifact `cart-{local,staging}-verified.json`; 401 `/admin/me` khi chưa login là dự kiến.

## Production — preflight ngày 18/10/2026

- Owner chốt chỉ deploy staging, hoãn production. Preflight chỉ đọc ghi nhận version `e671445a-d2ff-4211-9312-57c46bf1b508`, deploy 17/10 lúc 21:08 giờ Việt Nam; D1 production chỉ có 0001, chưa có 0002/0003.
- Metadata chỉ có tên ADMIN_PASSWORD/JWT_SECRET; chưa có TURNSTILE_SECRET và hai Cloudinary API secrets tại mốc kiểm. Metadata không chứng minh giá trị secret, login/provider success hoặc trạng thái UI production.
- Nghiệm thu production 15/10, backup remote mở offline, smoke API 7/7, public browser và cleanup 3 đơn SMOKE vẫn ở [Phase 6](../pipeline/PHASE_6_DEPLOY.md#production-smoke-và-browser--15102026). Các thay đổi source/provider sau đó chưa được nghiệm thu bằng bằng chứng này. Tiếp tục production cần phạm vi được owner cho phép và runbook [STAGING](../operations/STAGING.md)/[OPERATIONS](../operations/OPERATIONS.md).

## Snapshot remote cũ ngày 16–17/10/2026

Các dòng dưới đã được mốc 18/10 thay thế khi có thông tin mới; không dùng làm current state hoặc suy tổng stock/orders từ public coverage.

| Mốc / môi trường | Bằng chứng lịch sử cần giữ |
| --- | --- |
| 16/10 — production | Version `26d0811c-f2f0-4f7f-a0fa-7cb175035d06` từ deploy 15/10 lúc 19:52; public 4 categories/8 active products/2 provinces. Chỉ thấy admin secret names, thiếu Cloudinary vars/secrets và TURNSTILE_SECRET tại snapshot; chưa có CSP/RateLimit/TTL mới, robots trả SPA. |
| 16/10, 13:31 — staging | Version `e984d962-076f-492c-b2e3-c5cac5f52ec3`; public 4 categories/1 active product/0 provinces. Thấy admin/Cloudinary names, chưa có TURNSTILE_SECRET; source deployed có CSP/noindex/key staging/RateLimit/TTL 24 giờ/scheduled handler, chưa chứng minh Cron tick. Secret staging xuất hiện trong metadata ngày 17/10, nên kết luận thiếu secret không áp dụng về sau. |
| 16/10 — category images | 0002 và 4 URL áp local/staging; version `75fcbb54-5528-4cc1-b101-22fdc7a91a40`. API trả 4 URL, 4 ảnh khớp SHA-256, browser 10 ca PASS; login/lookup trả 503 khi thiếu secret tại đúng mốc. |
| 16/10, 19:21 — danh mục hành chính | 0003 áp local/staging: 12 bảng, 1 tỉnh/126 phường Hà Nội, HCM 0, FK sạch; version `27c3d24e-f3df-42e1-8d18-8b8299427062`. Aggregate: zones 0 / products 1 / variants 3 / stock 30 / orders 0 / items 0 / history 0; public options trống. Không full seed/tạo phí. Lượt này chỉ đối chiếu aggregate/FK, không có full remote backup mở thử. |
| 17/10, 16:42 — staging | Version `c29141be-740e-4908-b369-179d7631356e`; public audit 4 categories/1 product/1 phường, CSP/noindex/bundle hash PASS. Hai thay đổi README/tiến trình đơn được ghi nhận qua [PR1](https://github.com/minphuc2408/Lurana/pull/1)/[PR2](https://github.com/minphuc2408/Lurana/pull/2). Artifact `.security-review/staging-doc-audit-2026-10-17.json`; không suy tổng orders/stock. |
| 17/10, 17:14 — staging | Version `ef985262-c3fe-4b70-b75f-636c87cfadda`; Tra đơn/footer 12/12 ca EN/VI PASS, lookup với token tổng hợp sai trả 403. Chưa chứng minh challenge thật; artifact `lookup-live-results.json`/`lookup-staging-verification.json` trong `.security-review/`. |
| 17/10, 20:47 — staging | Version `666e53f5-10fd-4000-9434-02d55c0b4285` được thấy ở preflight 18/10; không gán kết quả UI/provider riêng khi chưa có bằng chứng. |

## Giới hạn của hồ sơ

Không coi source Wrangler, tên secret, callback mock hoặc một kết quả từ chối 403 là nghiệm thu provider. Không tái chạy seed/cleanup/backup hoặc ghi remote chỉ để cập nhật tài liệu. Quy trình có quyền thao tác riêng tại [OPERATIONS](../operations/OPERATIONS.md); acceptance còn thiếu và dữ liệu chủ shop cần chốt nằm trong [PROJECT_STATUS](../PROJECT_STATUS.md#việc-còn-cần-chủ-shop).
