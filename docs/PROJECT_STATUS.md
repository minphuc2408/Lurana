# Lunarra — trạng thái hiện tại

Cập nhật **24/10/2026, giờ Việt Nam** sau nhập sản phẩm Excel và nút ảnh ngoài danh sách kho local. Staging vẫn là `c0979ce` ngày21/10, chưa gồm admin mới/Excel. Kiểm chứng/phạm vi ở [hồ sơ lịch sử](archive/VERIFICATION_HISTORY.md#kiểm-chứng-local).

**Phase 0–5 đã nghiệm thu local; Phase 6 chưa đóng**, mốc [5/7 tiêu chí ngày 15/10](pipeline/PHASE_6_DEPLOY.md#tiêu-chí-nghiệm-thu--mốc-production-15102026) còn thiếu dữ liệu mở bán thật và xác nhận bàn giao quota. Provider/Cron và giới hạn cloud vẫn cần nghiệm thu riêng.

## Code và kiểm chứng local

- Source có storefront/catalog, giỏ → checkout COD, tra đơn và admin API; customer auth/profile/custom request cùng các màn admin ngoài MVP vẫn deferred. Hành vi và ownership ở [ARCHITECTURE](ARCHITECTURE.md), [Checkout UI](features/CHECKOUT_UI.md), [Tra đơn](features/ORDER_TRACKING.md).
- Kho24/10: tải template `.xlsx` theo danh mục active; kiểm file → xem trước → nhập nguyên tử sản phẩm mới, bỏ ảnh. Nút Tải ảnh trước Sửa mở gallery dùng lại upload/Save. Typecheck/architecture260/216test/build/audit0, smoke40/40, UI17route và51 kiểm browser EN/VI1440/390/320 PASS; Worker bundle HTTP/D1 tạm cũng PASS. [API Excel](reference/API_CONTRACT.md#nhập-sản-phẩm-excel) sở hữu giới hạn/rollback, [Cloudinary](operations/CLOUDINARY.md#gallery-nhiều-ảnh) sở hữu ảnh; chưa push/deploy/nghiệm thu provider thật.
- Admin workspace22/10: typecheck, architecture258 files,207 test, build, smoke40/40 và check:ui17route PASS. Browser16 tổ hợp EN/VI390/1440px, popup thêm768/320px,6 ca lịch/focus và scope22theme PASS; [evidence/giới hạn](archive/VERIFICATION_HISTORY.md#kiểm-chứng-local). Tab status lấy trang đơn từ server và giữ count các tab theo cùng bộ lọc; [contract](reference/API_CONTRACT.md). Browser toàn theme storefront vẫn là bộ kiểm riêng chưa chạy lại.
- Shop giữ Filter:sản phẩm 1:4, nay server tìm/lọc/sắp và phân trang40; query/page ở URL, metadata điều hướng trang cuối. Catalog boot featured và cache các trang/detail, bounded by-variants khôi phục giỏ ngoài trang đầu; lỗi restore giữ storage và có retry. [Kiến trúc](ARCHITECTURE.md#catalog-và-cuộn-trang), [API contract](reference/API_CONTRACT.md#get-apiproductspage1qcategorycodepriceallsortfeaturedfeatured1), [entity](reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu) sở hữu chi tiết; search đọc nhẹ tên/ID trong Worker, chưa đo cloud catalog lớn.
- Original mới dùng bảng Monochrome trắng0/11xám/5hồng (ID vẫn `monochrome`); Original xanh cũ chọn dưới tên Green Mist (ID `original`), giữ21palette trước và storage. [Design system](ui-ux/DESIGN_SYSTEM.md) sở hữu mapping/order/EN-VI gọn. Footer social dọc, detail portrait/breadcrumb trái, Header/favicon/Theme→EN-VI/Liên hệ `/#contact` giữ flow. Nav/badge/locale active hồng5, search một kính lúp, giỏ nổi nền hồng50/chữ và icon xám900 qua biến theme (owner 21/10); không dependency mới.
- Mono: navbar/search dùng trắng0 chung `--lunara-header-background`; About/Shop/tra đơn dùng alias nền này, gồm khoảng trống trước Footer. Radio viền600/chọn hồng400; chữ hover/focus tab cùng màu underline. Footer100 và input tra đơn50 giữ khả năng nhận diện. [Design system](ui-ux/DESIGN_SYSTEM.md) và [Tra đơn](features/ORDER_TRACKING.md) sở hữu mapping; không đổi Turnstile/đặt đơn/storage PII. Nội dung/ảnh thật vẫn chờ owner; đã deploy staging21/10, production giữ quyết định hoãn.
- Admin bỏ intro lặp, header14px/400, input/button borderless riêng admin, lịch DayPicker custom. Mọi collection có pager; toolbar/footer luôn ngoài vùng cuộn. Orders API trả metadata count theo status; popup ngang chia phần giữ nút lưu/thao tác. Kho giữ accordion và draft khi đổi trang; zone10/sản phẩm5 phân trang client. [Design system](ui-ux/DESIGN_SYSTEM.md#áp-dụng-mono-cho-admin) và [entity](reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu) sở hữu UI/state; không đổi auth/schema/API ghi/tồn. Ba địa chỉ vẫn chờ owner tại [config địa chỉ](ui-ux/DESIGN_SYSTEM.md#địa-chỉ-shop-chưa-công-bố).

## Môi trường được ghi nhận

| Môi trường | Mốc ghi nhận | Phạm vi đã biết và giới hạn |
| --- | --- | --- |
| Local | 24/10 | Workspace admin và nhập Excel/nút ảnh ngoài kho đã triển khai, chưa push/deploy. Latest:216test/typecheck/architecture260/build/audit0; smoke40/40, UI17route,51check browser Excel PASS; [evidence/phạm vi](archive/VERIFICATION_HISTORY.md#kiểm-chứng-local). API ghi dùng D1/SQLite cô lập và synthetic admin; seed local giữ nguyên; chưa nghiệm thu provider/cloud. |
| [Staging](https://lunara-staging.minphuc2408.workers.dev) | 21/10, 22:18:51 giờ Việt Nam | Bản `c0979ce`, version `daf8418c-2f25-47de-93b8-9272559deef4` nhận100%traffic. Public read-only smoke3/3,6route/robots200+noindex/CSP,5JS/CSS khớp build; browser10case EN1440/VI390 PASS. Không migrate/seed/API ghi; admin đăng nhập/checkout/provider thật còn chờ. [Evidence](archive/VERIFICATION_HISTORY.md#staging-ngày-21102026). |
| [Production](https://lunara.minphuc2408.workers.dev) | Preflight chỉ đọc 18/10; deploy ghi nhận 17/10 | Owner hoãn production. D1 chỉ có 0001; chưa có 0002/0003, TURNSTILE_SECRET và hai Cloudinary API secrets trong metadata tại mốc kiểm. Chưa nghiệm thu lại theo source hiện tại. |
| GitHub Pages | Build local 18/10; Git audit 19/10 | Workflow đã tracked; chưa xác minh Settings/Actions hoặc URL deployment. Chỉ preview frontend tĩnh, không có Worker/D1/API. [Giới hạn](operations/STAGING.md#github-pages--static-ui-preview). |

Version/deployment IDs và bằng chứng đối chiếu nằm trong [staging21/10](archive/VERIFICATION_HISTORY.md#staging-ngày-21102026), [mốc18/10](archive/VERIFICATION_HISTORY.md#staging-ngày-18102026) và [production](archive/VERIFICATION_HISTORY.md#production--preflight-ngày-18102026). Không suy trạng thái cloud từ config local hoặc tên secret.

### Dữ liệu staging thay mới theo owner — 18/10/2026

Staging dùng bộ mẫu riêng 40 sản phẩm/120 variants, ảnh sản phẩm trống theo owner; coverage ghi nhận Hà Nội/Hoàn Kiếm. Đây chưa phải dữ liệu mở bán. [Quyết định dữ liệu](reference/DATABASE_DESIGN.md#bộ-dữ-liệu-staging-theo-quyết-định-owner) và [backup/counts/checks tại mốc thay dữ liệu](archive/VERIFICATION_HISTORY.md#bộ-dữ-liệu-staging-và-backup) được giữ riêng; không dùng seed dev để phục hồi hoặc coi counts lịch sử là số hiện tại.

## Việc còn cần chủ shop

| Việc | Điều kiện còn thiếu / bước xử lý |
| --- | --- |
| Dữ liệu mở bán | Duyệt catalog/ảnh/giá/SKU/tồn, zone/phí/ngưỡng/cutoff/slots thật; ẩn hoặc tắt mẫu và kiểm quote theo [OPERATIONS](operations/OPERATIONS.md#2-migration-deploy-và-dữ-liệu-mở-bán). |
| Bàn giao quota | Owner xác nhận xem được Workers Requests/Errors/CPU và D1 rows/storage theo [runbook](operations/OPERATIONS.md#8-kiểm-hạn-mức-hằng-ngày-và-sự-cố). |
| Turnstile | Challenge thành công đúng action/hostname cho checkout, lookup và login trên từng môi trường; metadata hoặc token sai trả 403 không đủ. [BOT_PROTECTION](operations/BOT_PROTECTION.md). |
| Cloudinary/Cron/cloud limits | Nghiệm thu preset/upload thật, Cron tick/expiry và CPU/quota đúng môi trường trong cửa sổ được phép. [Cloudinary](operations/CLOUDINARY.md), [Hardening](operations/HARDENING.md). |
| Checkout/admin staging | Chưa nghiệm thu end-to-end với dữ liệu và challenge thật; public read/browser cũ không thay kiểm ghi. [Smoke và đối soát](operations/OPERATIONS.md#3-smoke-trên-deployment-và-cleanup). |
| Production mới | Cần yêu cầu đúng phạm vi để tiếp tục; xử lý migrations/config/secrets và rollback theo [STAGING](operations/STAGING.md). Không seed để bù schema. |
| Nội dung shop | Duyệt thành phần/kích thước/ảnh; nhập địa chỉ/maps đã duyệt vào `storeLocations` đang để trống theo [Design system](ui-ux/DESIGN_SYSTEM.md#địa-chỉ-shop-chưa-công-bố). Pháp nhân/MST, hotline, story/giờ mở cửa, policy và Zalo vẫn cần xác minh riêng; Zalo đang tắt tới khi có liên hệ thật. |
| Domain/WAF | Tùy chọn; quyết định hạ tầng/chi phí riêng, không tự coi là blocker deploy cơ bản. |

## Việc tiếp theo

- Chốt dữ liệu/chính sách và người theo dõi quota; khi được phép, lập cửa sổ nghiệm thu checkout/admin/provider theo [OPERATIONS](operations/OPERATIONS.md). Production tiếp tục giữ quyết định hoãn.
- Bổ sung nội dung shop và thông số từng cỡ từ dữ liệu owner đã duyệt; kiểm lại các luồng hỗ trợ/chính sách sau khi có đích thật. E2E local không đóng các điều kiện provider/cloud còn thiếu của Phase 6.
- Khi owner bật lại bộ kiểm toàn theme, nâng cache/mock các runner đang tạm dừng theo API phân trang trước khi chạy; [phạm vi còn thiếu](LOCAL_DEVELOPMENT.md#kiểm-theme-và-font). `npm test`207 đã PASS; điều này không thay thế toàn bộ runner browser/theme riêng.

## Tài liệu chuẩn

[Chỉ mục](../PROJECT_GUIDE.md) · [Kiến trúc](ARCHITECTURE.md) · [Phát triển local](LOCAL_DEVELOPMENT.md) · [Stack](TECH_STACK.md) · [API](reference/API_CONTRACT.md) · [Database](reference/DATABASE_DESIGN.md) · [Entity](reference/FRONTEND_ENTITIES.md) · [Staging](operations/STAGING.md) · [Operations](operations/OPERATIONS.md) · [Lịch sử kiểm chứng và audit](archive/VERIFICATION_HISTORY.md).
