# Lunarra — trạng thái hiện tại

Cập nhật cấu trúc và liên kết tài liệu **20/10/2026, giờ Việt Nam**. Các mốc dưới là lần xác minh gần nhất **đã ghi nhận**, không phải lần kiểm cloud/tests mới của lượt tổ chức tài liệu. Chi tiết nghiệm thu cũ ở [hồ sơ lịch sử](archive/VERIFICATION_HISTORY.md).

**Phase 0–5 đã nghiệm thu local; Phase 6 chưa đóng**, mốc [5/7 tiêu chí ngày 15/10](pipeline/PHASE_6_DEPLOY.md#tiêu-chí-nghiệm-thu--mốc-production-15102026) còn thiếu dữ liệu mở bán thật và xác nhận bàn giao quota. Provider/Cron và giới hạn cloud vẫn cần nghiệm thu riêng.

## Code và kiểm chứng local

- Source có storefront/catalog, giỏ → checkout COD, tra đơn và admin API; customer auth/profile/custom request cùng các màn admin ngoài MVP vẫn deferred. Hành vi và ownership ở [ARCHITECTURE](ARCHITECTURE.md), [Checkout UI](features/CHECKOUT_UI.md), [Tra đơn](features/ORDER_TRACKING.md).
- Mốc local 19/10 ghi nhận typecheck/architecture/tests/build và các runner theme/detail có phạm vi kiểm chọn lọc PASS. Detail/yêu thích và 5 creative themes có thay đổi local chưa ghi nhận deploy; xem [phạm vi và giới hạn](archive/VERIFICATION_HISTORY.md#kiểm-chứng-local).
- Lần full UI checker ghi nhận 17–18/10 dừng ở assertion `total670` trong `check-ui-live-catalog.mjs`, còn giả định quote-before-zone/checkout gộp. **Chưa có nghiệm thu lại full suite**; targeted PASS không thay full-suite PASS.

## Môi trường được ghi nhận

| Môi trường | Mốc ghi nhận | Phạm vi đã biết và giới hạn |
| --- | --- | --- |
| Local | 19/10 | Kiểm source và nghiệm thu local nêu trên; API/challenge tổng hợp hoặc font cache trong một số runner, không thay kiểm provider thật. |
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
| Nội dung shop | Xác minh địa chỉ/maps, pháp nhân/MST, hotline, story/giờ mở cửa, policy và Zalo; copy minh họa chưa phải xác nhận pháp lý. |
| Domain/WAF | Tùy chọn; quyết định hạ tầng/chi phí riêng, không tự coi là blocker deploy cơ bản. |

## Việc tiếp theo

- Chốt dữ liệu/chính sách và người theo dõi quota; khi được phép, lập cửa sổ nghiệm thu checkout/admin/provider theo [OPERATIONS](operations/OPERATIONS.md). Production tiếp tục giữ quyết định hoãn.
- Xử lý giả định checkout cũ của full UI checker và chạy lại trong một tác vụ source được phép; chưa đánh dấu full suite PASS hoặc Phase 6 DONE bằng kết quả kiểm chọn lọc.

## Tài liệu chuẩn

[Chỉ mục](../PROJECT_GUIDE.md) · [Kiến trúc](ARCHITECTURE.md) · [Phát triển local](LOCAL_DEVELOPMENT.md) · [Stack](TECH_STACK.md) · [API](reference/API_CONTRACT.md) · [Database](reference/DATABASE_DESIGN.md) · [Entity](reference/FRONTEND_ENTITIES.md) · [Staging](operations/STAGING.md) · [Operations](operations/OPERATIONS.md) · [Lịch sử kiểm chứng và audit](archive/VERIFICATION_HISTORY.md).
