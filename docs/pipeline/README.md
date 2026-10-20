# Pipeline MVP Lunarra

Explanation cho chủ dự án/developer: phạm vi, quyết định đã chốt và cổng nghiệm thu. Hợp nhất tài liệu **19/10/2026**; các Phase 0–6 dưới đây là phase phát triển sản phẩm, khác Giai đoạn0–4 refactor tài liệu. Trạng thái hiện hành theo từng môi trường có một owner tại [PROJECT_STATUS](../PROJECT_STATUS.md), bằng chứng có ngày ở từng phase.

## 1. Phạm vi MVP

| Trong MVP | Deferred / sau MVP |
| --- | --- |
| Catalog EN/VI, variants, ảnh, detail và wishlist storefront memory | Wizard hoa theo yêu cầu, customer auth/profile/server wishlist |
| Cart trình duyệt và server quote lại | Online payment, coupon thật, reviews |
| COD, stock atomic, idempotency và tra đơn | Inventory ledger/nhiều chi nhánh |
| Coverage từng phường, methods/slots/thiệp | Mở coverage tỉnh mặc định hoặc tự seed zone |
| Admin auth/orders/product-gallery/stock/delivery/summary | Advanced KPI/charts, notifications, customers/settings |
| Signed direct upload/Save liên kết ảnh | Tự xóa/dọn asset provider |

Luồng runtime đã tích hợp không trở lại backlog chỉ vì provider/cloud chưa nghiệm thu. [BACKLOG](BACKLOG.md) giữ đề xuất chưa triển khai; dữ liệu mở bán và nghiệm thu còn thiếu thuộc Status.

## 2. Quyết định đã chốt

| Chủ đề | Quyết định / owner |
| --- | --- |
| Thanh toán/market | COD; VND integer, Asia/Ho_Chi_Minh; EN mặc định/fallback, locale không đổi tiền/timezone/dữ liệu khách. [Entities](../reference/FRONTEND_ENTITIES.md). |
| Địa chỉ | Tỉnh/phường/address_line, không quận/huyện; zone active hợp danh mục, không fallback tỉnh. [Delivery](../features/DELIVERY_ADDRESS.md). |
| Tồn/đơn | Variant stock, server pricing, atomic/CHECK rollback và transition hoàn một lần. [Architecture](../ARCHITECTURE.md#worker-và-dữ-liệu-bền-vững). |
| Admin auth | Một mật khẩu ngẫu nhiên server secret + JWT cookie, requireAdmin/Origin; không bảng auth mới. [API](../reference/API_CONTRACT.md#admin-cookie-lunara_admin-httponly). |
| Runtime | Một Worker phục vụ assets/API cùng origin; production/staging tách Worker/D1/secrets. [STAGING](../operations/STAGING.md). |
| Media | Browser-to-Cloudinary signed upload, D1 lưu URL/public ID, explicit Save. [CLOUDINARY](../operations/CLOUDINARY.md). |
| Persistence | Cart chỉ IDs/quantity; checkout/lookup PII và intent memory-only. [Entities](../reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu). |
| Schema | Base 0001 bất biến + additive migrations; users có sẵn nhưng customer auth chưa nối. [Database](../reference/DATABASE_DESIGN.md). |

## 3. Các phase

| Phase / hồ sơ | Cổng nghiệm thu |
| --- | --- |
| [0 — Prepare](PHASE_0_PREPARE.md) | FE/Worker health/API 404/SPA/local binding, pin/types/build. |
| [1 — Database](PHASE_1_DATABASE.md) | Base canonical, migration/seed local và 13 nhóm constraints/FK/rollback. |
| [2 — Catalog](PHASE_2_API_CATALOG.md) | Catalog≤3 queries, DB delivery/quote/read-only, validation/lỗi. |
| [3 — Checkout orders](PHASE_3_CHECKOUT_ORDERS.md) | COD/idempotency/stock races/lookup/transition, submitted statements≤40 kể cả failed batches. |
| [4 — Admin](PHASE_4_ADMIN.md) | Auth/cookie/Origin và CRUD/summary/status/stock delta; không schema/dependency mới. |
| [5 — Frontend](PHASE_5_FRONTEND.md) | API thật/EN-VI/VND, persistence/retry/confirmation, lookup/admin, không fixture active. |
| [6 — Deploy](PHASE_6_DEPLOY.md) | Bản đã deploy, migrate/backup/remote flow/cleanup, dữ liệu thật và bàn giao quota. |

Mỗi hồ sơ giữ ngày/target/criteria/evidence/limits tại mốc nghiệm thu; không dùng số test hoặc counts seed lịch sử làm số hiện tại. Migrations đã áp từng môi trường ở Status; schema SQL canonical tại [migrations](../../migrations/0001_mvp.sql), seed chỉ là [mẫu dev](../sql/MVP_SEED_DEV.sql).

## 4. Cách thực hiện một phase

Chọn phần việc thực sự còn thiếu theo Status; đọc owner/reference và cổng nghiệm thu tương ứng. Đầu vào tài khoản/dữ liệu/secrets/remote actions cần authorization đúng phạm vi, không suy từ checklist lịch sử. Chỉ đóng phase khi đủ evidence; local PASS không thay cloud/provider.

Checks và quyền commit/push/deploy theo [AGENTS](../../AGENTS.md), cách chạy local theo [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md); docs-only kiểm nội dung/link/Git, không tạo test framework hoặc runtime logs mới.

## 5. Quy tắc chung cho mọi phase

Giữ stack đã pin, prepared statements/bind, server pricing/quyền và migration bất biến. Không secrets/PII vào Git/browser storage. Thiếu provider fail-closed; current contract/error codes ở [API](../reference/API_CONTRACT.md).

## 6. Giới hạn gói Free cần nhớ

Sizing kế hoạch ban đầu:50 D1 queries/request,10 ms CPU/request; cổng order≤40 submitted statements, giỏ≤15 dòng. Đây không phải phép đo cloud. Quota/day/storage/log/reset có ngày tại [OPERATIONS](../operations/OPERATIONS.md#8-kiểm-hạn-mức-hằng-ngày-và-sự-cố); đối chiếu gói/chi phí trước deploy, không duy trì bảng quota thứ hai.

## 7. Cấu trúc repo đích

Ownership/module/provider/flow hiện hành ở [ARCHITECTURE](../ARCHITECTURE.md), phiên bản/output/types ở [TECH_STACK](../TECH_STACK.md). Router/source migrations là nguồn chính xác; không sao chép cây source/config vào pipeline.

## 8. Định nghĩa "MVP xong"

Đủ evidence cho các kết quả sau trên **bản đã deploy**, trong cửa sổ nghiệm thu đúng quyền:

1. Catalog/detail hiển thị đúng sản phẩm và VND.
2. Add/reload giữ giỏ, storage chỉ IDs/quantity.
3. COD thành công có mã/tổng server, tồn giảm đúng.
4. Hai request mua món cuối song song: một thành công, một hết hàng.
5. Replay cùng Idempotency-Key không sinh đơn/trừ tồn lần hai.
6. Sửa giá/phí/tổng client không làm đổi server pricing.
7. Phường active hợp danh mục đúng phí; chưa cấu hình/tắt/ngoài danh mục →NO_DELIVERY_ZONE, không fallback tỉnh.
8. Lookup mã/SĐT đúng thấy đơn; SĐT sai báo không tìm thấy.
9. Admin status đúng thứ tự; DELIVERED→PAID; hủy hoàn một lần, IN_TRANSIT cần lý do/default không restock.
10. Các flow trên không fixture frontend/PHP/₱; dữ liệu catalog/coverage mẫu chỉ được dùng nghiệm thu, cần owner duyệt dữ liệu thật trước mở bán.

Smoke/đối soát/cleanup ở [OPERATIONS](../operations/OPERATIONS.md#3-smoke-trên-deployment-và-cleanup). Public read/browser, API writes, provider success, CPU/quota và dữ liệu mở bán là các phạm vi evidence riêng.
