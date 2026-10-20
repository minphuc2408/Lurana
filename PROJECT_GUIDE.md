# Chỉ mục dự án Lunarra

Dành cho chủ dự án, developer và agent tìm đúng tài liệu sở hữu chủ đề. Cấu trúc thư mục được chốt ngày **20/10/2026**; các mục cũ bên dưới giữ anchor chuyển tiếp. Code/test xác định implementation; quyết định sản phẩm đã duyệt vẫn có giá trị khi chưa triển khai. Trạng thái local/staging/production xem [PROJECT_STATUS](docs/PROJECT_STATUS.md).

`docs/` giữ tài liệu tổng quan: trạng thái, kiến trúc, công nghệ và phát triển local. Các tài liệu chuyên đề được nhóm theo mục đích:

- `docs/reference/`: hợp đồng API, thiết kế database và frontend entities.
- `docs/features/`: checkout, tra đơn, địa chỉ giao hàng và ảnh danh mục.
- `docs/operations/`: triển khai, vận hành, bảo vệ bot, hardening và Cloudinary.

Giữ các nhóm `docs/ui-ux/`, `docs/pipeline/`, `docs/archive/` cho thiết kế, kế hoạch/nghiệm thu và bằng chứng lịch sử. SQL giữ nguyên trong `docs/sql/` và tại các vị trí hiện có. Dùng chỉ mục này để tìm tài liệu; không cần README riêng cho từng thư mục mới.

## Đọc theo nhu cầu

| Nhu cầu / nội dung sở hữu | Tài liệu |
| --- | --- |
| Quy tắc agent, authorization và chính sách documentation | [AGENTS](AGENTS.md); workflow tính năng ở [repo skill](.agents/skills/lunara-flower-shop/SKILL.md) |
| Clone mới, env/D1 local, lệnh kiểm tra và CodeGraph | [LOCAL_DEVELOPMENT](docs/LOCAL_DEVELOPMENT.md) |
| Module boundaries, providers, flow liên kết và rationale giao dịch | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| Phiên bản/package lock, build/types và lựa chọn công nghệ | [TECH_STACK](docs/TECH_STACK.md) |
| Design hierarchy, typography, semantic roles, theme compatibility/a11y | [DESIGN_SYSTEM](docs/ui-ux/DESIGN_SYSTEM.md); palette đã duyệt ở hai spec được dẫn từ đó |
| Model/DTO adapter, state và storage lifecycle | [FRONTEND_ENTITIES](docs/reference/FRONTEND_ENTITIES.md) |
| UX giỏ → checkout/review/confirmation và tra đơn | [CHECKOUT_UI](docs/features/CHECKOUT_UI.md), [ORDER_TRACKING](docs/features/ORDER_TRACKING.md) |
| Endpoint/payload/validation/lỗi và contract server | [API_CONTRACT](docs/reference/API_CONTRACT.md) |
| Schema/migrations và decision dữ liệu | [DATABASE_DESIGN](docs/reference/DATABASE_DESIGN.md); DDL thuộc migrations |
| Coverage, danh mục hành chính và provenance | [DELIVERY_ADDRESS](docs/features/DELIVERY_ADDRESS.md) |
| Upload/gallery lifecycle và asset danh mục | [CLOUDINARY](docs/operations/CLOUDINARY.md), [CATEGORY_IMAGES](docs/features/CATEGORY_IMAGES.md) |
| Turnstile/rate limit/TTL/restock; headers/CSP/SEO/log | [BOT_PROTECTION](docs/operations/BOT_PROTECTION.md), [HARDENING](docs/operations/HARDENING.md) |
| Target/build/deploy và thao tác smoke/backup/rollback/quota | [STAGING](docs/operations/STAGING.md), [OPERATIONS](docs/operations/OPERATIONS.md) |
| Current status/blocker; evidence lịch sử | [PROJECT_STATUS](docs/PROJECT_STATUS.md), [archive](docs/archive/VERIFICATION_HISTORY.md); mỗi phase giữ mốc nghiệm thu riêng |
| Scope/cổng MVP và ý tưởng chưa triển khai | [Pipeline](docs/pipeline/README.md), [BACKLOG](docs/pipeline/BACKLOG.md) |
| License và nguồn ảnh/font/dữ liệu | [ATTRIBUTIONS](ATTRIBUTIONS.md) |

Mỗi nhóm sự thật có một owner; tài liệu khác chỉ tóm tắt và liên kết. Khi thay đổi, áp dụng policy trong AGENTS thay vì cập nhật đồng loạt guide/AGENTS/skill. Không tạo thêm reference chỉ để sao chép router, registry hoặc bảng lệnh.

## Cách sử dụng với Codex

Đọc [quy tắc agent](AGENTS.md) và [setup/cấu hình trợ lý local](docs/LOCAL_DEVELOPMENT.md#codegraph-và-cấu-hình-trợ-lý); chỉ nạp context của flow cần làm.

## Hiện trạng và bản đồ dự án

[Current status](docs/PROJECT_STATUS.md) · [bản đồ kiến trúc](docs/ARCHITECTURE.md).

### Kiến trúc MVP đã chọn

[Worker, persistence và provider boundaries](docs/ARCHITECTURE.md#worker-và-dữ-liệu-bền-vững).

### Ranh giới module

[Layering và public APIs](docs/ARCHITECTURE.md#ranh-giới-module).

## Trang và luồng nghiệp vụ

[Router/providers và các nhóm flow](docs/ARCHITECTURE.md#router-và-provider-ownership); route tree chính xác ở source router.

### Ownership của catalog và cart

[Model/state/storage](docs/reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu).

### Catalog và cuộn trang

[Search/filter/variant và scroll](docs/ARCHITECTURE.md#catalog-và-cuộn-trang).

### Chi tiết sản phẩm và hoa yêu thích

[Detail và wishlist storefront](docs/ARCHITECTURE.md#chi-tiết-sản-phẩm-và-hoa-yêu-thích).

### Auth admin, tồn kho và các feature deferred

[Quyền/provider boundaries](docs/ARCHITECTURE.md#quyền-phiên-và-ranh-giới-provider) · [feature deferred](docs/ARCHITECTURE.md#feature-deferred-và-quyết-định-còn-thiếu).

## Bộ nhận diện và token thiết kế

[Design system hiện hành](docs/ui-ux/DESIGN_SYSTEM.md); không suy màu từ alias rose/cream/blush.

## Component có sẵn

[Component reuse và layout](docs/ui-ux/DESIGN_SYSTEM.md#bố-cục-storefront-và-component-reuse).

### Localization

[Typography theo locale](docs/ui-ux/DESIGN_SYSTEM.md#typography-theo-locale) · [vòng đời locale/dữ liệu](docs/reference/FRONTEND_ENTITIES.md#ownership-và-vòng-đời-dữ-liệu).

## Tiêu chuẩn khi phát triển

[AGENTS](AGENTS.md) giữ security/architecture/tooling guardrails; các owner ở bảng trên giữ behavior/contract.

## Lệnh cài, chạy và kiểm tra

[Local setup và checks](docs/LOCAL_DEVELOPMENT.md).

## CodeGraph và cấu hình trợ lý

[CodeGraph và cấu hình local](docs/LOCAL_DEVELOPMENT.md#codegraph-và-cấu-hình-trợ-lý).

## Brainstorm và thứ tự phát triển

[Pipeline](docs/pipeline/README.md) · [BACKLOG](docs/pipeline/BACKLOG.md); dữ liệu/decision còn thiếu ở [PROJECT_STATUS](docs/PROJECT_STATUS.md#việc-còn-cần-chủ-shop).

## File chia sẻ và cách duy trì

[Documentation policy](AGENTS.md#automatic-documentation-and-session-handoff) · [env/local artifacts](docs/LOCAL_DEVELOPMENT.md) · [deploy targets](docs/operations/STAGING.md).
