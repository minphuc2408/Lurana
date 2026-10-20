# Lunarra — trạng thái hiện tại

Cập nhật **20/10/2026, giờ Việt Nam** sau thu gọn EN/VI và đặt bảng Monochrome thành Original, Original cũ thành Green Mist. Không chạy bộ test theo yêu cầu owner; các mốc staging/production giữ bằng chứng riêng. Chi tiết và giới hạn ở [hồ sơ lịch sử](archive/VERIFICATION_HISTORY.md).

**Phase 0–5 đã nghiệm thu local; Phase 6 chưa đóng**, mốc [5/7 tiêu chí ngày 15/10](pipeline/PHASE_6_DEPLOY.md#tiêu-chí-nghiệm-thu--mốc-production-15102026) còn thiếu dữ liệu mở bán thật và xác nhận bàn giao quota. Provider/Cron và giới hạn cloud vẫn cần nghiệm thu riêng.

## Code và kiểm chứng local

- Source có storefront/catalog, giỏ → checkout COD, tra đơn và admin API; customer auth/profile/custom request cùng các màn admin ngoài MVP vẫn deferred. Hành vi và ownership ở [ARCHITECTURE](ARCHITECTURE.md), [Checkout UI](features/CHECKOUT_UI.md), [Tra đơn](features/ORDER_TRACKING.md).
- Source typecheck, architecture251 files và build PASS. Preview EN/VI320–1440px: nhóm locale102×44 desktop/94×44 mobile, pill36px cao/vùng bấm44px; đổi bằng phím đúng, không overflow/JS exception. Picker22 theme có Original đầu/Green Mist thứ2; đổi cả hai/reload giữ đúng tên/màu/storage. Bằng chứng Header/search/pagination/D1/gallery trước đó ở [lịch sử](archive/VERIFICATION_HISTORY.md#kiểm-chứng-local); không suite/smoke/toàn theme, chưa cloud/provider/full E2E.
- Shop giữ Filter:sản phẩm 1:4, nay server tìm/lọc/sắp và phân trang40; query/page ở URL, metadata điều hướng trang cuối. Catalog boot featured và cache các trang/detail, bounded by-variants khôi phục giỏ ngoài trang đầu; lỗi restore giữ storage và có retry. [Kiến trúc](ARCHITECTURE.md#catalog-và-cuộn-trang), [API contract](reference/API_CONTRACT.md#get-apiproductspage1qcategorycodepriceallsortfeaturedfeatured1), [entity](reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu) sở hữu chi tiết; search đọc nhẹ tên/ID trong Worker, chưa đo cloud catalog lớn.
- Original mới dùng bảng Monochrome trắng0/11xám/5hồng (ID vẫn `monochrome`); Original xanh cũ chọn dưới tên Green Mist (ID `original`), giữ21palette trước và storage. [Design system](ui-ux/DESIGN_SYSTEM.md) sở hữu mapping/order/EN-VI gọn. Footer social dọc, detail portrait/breadcrumb trái, Header/favicon/Theme→EN-VI/Liên hệ `/#contact` giữ flow. Nav/badge/locale active hồng5, search một kính lúp, giỏ nổi nền1/chữ trắng; không dependency mới.
- Intro Shop về50 như catalog/Header, separator giới hạn khung nội dung; tra đơn vẫn trắng0, Footer100, chữ900/phụ700. MapPin About dùng màu Ghé thăm tiệm400; card Add400/icon trắng không đổi. [Thông báo chung](ui-ux/DESIGN_SYSTEM.md#thông-báo-tính-năng-chung), [Tra đơn](features/ORDER_TRACKING.md), [Checkout](features/CHECKOUT_UI.md) giữ behavior đã duyệt; không đổi Turnstile/đặt đơn/storage PII. Nội dung kinh doanh/ảnh thật chờ owner; chỉ local/chưa deploy.

## Môi trường được ghi nhận

| Môi trường | Mốc ghi nhận | Phạm vi đã biết và giới hạn |
| --- | --- | --- |
| Local | 20/10 | Đã build/xem EN–VI gọn tại320/390/768/1024/1440px, chọn/reload Original mới và Green Mist, keyboard locale; catalog chỉ đọc/browser riêng. Header/search/pagination/gallery/restore có evidence lượt trước. Suite/smoke/toàn theme chưa chạy; chưa cloud/provider/deploy. |
| [Staging](https://lunara-staging.minphuc2408.workers.dev) | 18/10, 21:42 giờ Việt Nam | Home/Original và 16 theme tại bản đó; migrations 0001–0003. Public routes/assets/headers, read-only smoke và browser PASS; chưa nghiệm thu checkout/admin/provider thật. Chưa có bằng chứng deploy các thay đổi local mới hơn. |
| [Production](https://lunara.minphuc2408.workers.dev) | Preflight chỉ đọc 18/10; deploy ghi nhận 17/10 | Owner hoãn production. D1 chỉ có 0001; chưa có 0002/0003, TURNSTILE_SECRET và hai Cloudinary API secrets trong metadata tại mốc kiểm. Chưa nghiệm thu lại theo source hiện tại. |
| GitHub Pages | Build local 18/10; Git audit 19/10 | Workflow đã tracked; chưa xác minh Settings/Actions hoặc URL deployment. Chỉ preview frontend tĩnh, không có Worker/D1/API. [Giới hạn](operations/STAGING.md#github-pages--static-ui-preview). |

Version/deployment IDs và bằng chứng đối chiếu nằm trong [hồ sơ staging](archive/VERIFICATION_HISTORY.md#staging-ngày-18102026) và [production](archive/VERIFICATION_HISTORY.md#production--preflight-ngày-18102026). Không suy trạng thái cloud từ config local hoặc tên secret.

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
| Nội dung shop | Duyệt thành phần/kích thước theo cỡ và ảnh sản phẩm; xác minh địa chỉ/maps, pháp nhân/MST, hotline, story/giờ mở cửa, policy và Zalo. Nội dung minh họa chưa được owner xác nhận; Zalo đang tắt tới khi có liên hệ thật. |
| Domain/WAF | Tùy chọn; quyết định hạ tầng/chi phí riêng, không tự coi là blocker deploy cơ bản. |

## Việc tiếp theo

- Chốt dữ liệu/chính sách và người theo dõi quota; khi được phép, lập cửa sổ nghiệm thu checkout/admin/provider theo [OPERATIONS](operations/OPERATIONS.md). Production tiếp tục giữ quyết định hoãn.
- Bổ sung nội dung shop và thông số từng cỡ từ dữ liệu owner đã duyệt; kiểm lại các luồng hỗ trợ/chính sách sau khi có đích thật. E2E local không đóng các điều kiện provider/cloud còn thiếu của Phase 6.
- Khi owner bật lại bộ kiểm toàn theme, nâng cache/mock các runner đang tạm dừng theo API phân trang trước khi chạy; [phạm vi còn thiếu](LOCAL_DEVELOPMENT.md#kiểm-theme-và-font). Commerce/i18n/Product Detail đã cập nhật fixture và kiểm cú pháp, chưa chạy suite.

## Tài liệu chuẩn

[Chỉ mục](../PROJECT_GUIDE.md) · [Kiến trúc](ARCHITECTURE.md) · [Phát triển local](LOCAL_DEVELOPMENT.md) · [Stack](TECH_STACK.md) · [API](reference/API_CONTRACT.md) · [Database](reference/DATABASE_DESIGN.md) · [Entity](reference/FRONTEND_ENTITIES.md) · [Staging](operations/STAGING.md) · [Operations](operations/OPERATIONS.md) · [Lịch sử kiểm chứng và audit](archive/VERIFICATION_HISTORY.md).
