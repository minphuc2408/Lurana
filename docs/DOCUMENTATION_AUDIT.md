# Audit tài liệu — 17/10/2026

Phạm vi: **32 file Markdown được Git quản lý**, hai SQL schema pointers và SQL seed/deferred/migrations làm nguồn đối chiếu. Đã đọc tài liệu và source liên quan trước khi chỉnh; không thay source, SQL, dependency, cấu hình triển khai hoặc dữ liệu. Không chạy lại tests/build, đọc cấu hình/DB cloud hoặc commit/push/deploy. Chỉ có HTTP công khai để kiểm liên kết, không dùng làm nghiệm thu chức năng.

## Phân công nội dung tài liệu

| Tài liệu | Nội dung thuộc phạm vi |
| --- | --- |
| [README](../README.md) | Giới thiệu, cách chạy và mục lục, contributors; không làm deployment log |
| [PROJECT_GUIDE](../PROJECT_GUIDE.md) | Bản đồ module/routes, ownership, component/design system và quy trình phát triển |
| [AGENTS](../AGENTS.md) | Quy tắc làm việc và các ràng buộc cần giữ; không tích lũy biên bản từng lượt |
| [Repo skill](../.agents/skills/lunara-flower-shop/SKILL.md), [design skill](../.agents/skills/lunarra-design/SKILL.md) | Quy trình trợ lý theo phạm vi skill; tham chiếu hướng dẫn/chính sách dự án |
| [TECH_STACK](TECH_STACK.md) | Công nghệ, phiên bản/package lock, build/types/tooling và ranh giới kiến trúc |
| [PROJECT_STATUS](PROJECT_STATUS.md) | Nghiệm thu, deployment/snapshot đã ghi nhận theo ngày, bằng chứng local/remote và việc còn thiếu |
| [API_CONTRACT](pipeline/API_CONTRACT.md) | Endpoint, payload/DTO, validation/lỗi và tác dụng phía server; không liệt kê route đề xuất như đã có |
| [DATABASE_DESIGN](DATABASE_DESIGN.md) | Schema/migrations, quan hệ/ràng buộc và quyết định dữ liệu |
| [FRONTEND_ENTITIES](FRONTEND_ENTITIES.md) | DTO/model, nguồn dữ liệu, state/storage và source deferred |
| [ORDER_TRACKING](ORDER_TRACKING.md) | UX Tra đơn, tiến trình, trạng thái lỗi và memory-only privacy; dẫn contract và trạng thái nghiệm thu |
| [CHECKOUT_UI](CHECKOUT_UI.md) | Luồng giỏ/checkout/review/xác nhận và state giữa routes |
| [DELIVERY_ADDRESS](DELIVERY_ADDRESS.md) | Provenance danh mục, coverage/fee và cách chọn/chuẩn hóa địa chỉ |
| [CATEGORY_IMAGES](CATEGORY_IMAGES.md) | Asset danh mục, migration/gán URL và rollback |
| [CLOUDINARY](CLOUDINARY.md) | Cấu hình provider, signed-upload/gallery, giới hạn/lỗi và lifecycle asset |
| [BOT_PROTECTION](BOT_PROTECTION.md) | Turnstile/rate-limit/cap đơn chờ/hủy/restock/expiry và điều kiện nghiệm thu |
| [HARDENING](HARDENING.md) | Headers/CSP/SEO/log/query/image constraints; dẫn cơ chế bảo vệ sang BOT_PROTECTION |
| [STAGING](STAGING.md), [OPERATIONS](OPERATIONS.md) | Target/build/deploy; thao tác smoke/backup/rollback/secrets/quota/reconciliation |
| [Pipeline index](pipeline/README.md), [Phase0](pipeline/PHASE_0_PREPARE.md), [Phase1](pipeline/PHASE_1_DATABASE.md), [Phase2](pipeline/PHASE_2_API_CATALOG.md), [Phase3](pipeline/PHASE_3_CHECKOUT_ORDERS.md), [Phase4](pipeline/PHASE_4_ADMIN.md), [Phase5](pipeline/PHASE_5_FRONTEND.md), [Phase6](pipeline/PHASE_6_DEPLOY.md) | Scope/đầu vào/tiêu chí nghiệm thu phase; bằng chứng lịch sử gắn đúng ngày, không thay current status |
| [FE_AUDIT](pipeline/FE_AUDIT.md), [BACKLOG](pipeline/BACKLOG.md) | Ranh giới dữ liệu/fixture/privacy và backup frontend; ý tưởng chưa triển khai |
| [Guidelines](../guidelines/Guidelines.md), [ATTRIBUTIONS](../ATTRIBUTIONS.md) | Quy ước thiết kế; nguồn/license tài nguyên |
| Báo cáo này | Kết quả audit và ranh giới xác minh, không thêm bản sao trạng thái chức năng |

## Nội dung đã hợp nhất và dọn dẹp

- Bỏ thông báo Tra đơn được chép đồng loạt lên tài liệu database, provider, operations, phase và skill. Liên kết tính năng chỉ giữ ở mục lục/route hoặc nơi thật sự liên quan.
- Giữ mô tả UX tại ORDER_TRACKING; payload/lỗi tại API_CONTRACT. Đưa phần ghi nhận deploy/test về PROJECT_STATUS, không chép toàn bộ log sang tài liệu khác.
- Gộp lịch sử local/remote rải trong guide/instructions/status thành bảng bằng chứng và snapshot có ngày. Giữ nghiệm thu production/phase, giới hạn provider và provenance; bỏ preview port đã hết tác dụng, permission một lần, checkpoint đang làm và kết quả lặp đã được thay thế.
- Bỏ khẳng định “hiện tại chưa deploy/thiếu secret/không có vùng giao” suy từ snapshot cũ. Không lấy source config làm bằng chứng cloud; các snapshot cần giữ được ghi rõ lịch sử.
- Giữ hướng dẫn backup/rollback, source/license và migration bất biến; không tạo file archive, không chạy SQL hoặc sửa log test để giả chạy lại.

## Sai khác với source đã xử lý

| Nhóm | Sửa tài liệu |
| --- | --- |
| Tra đơn | Public dùng OrderLookupResult, admin giữ OrderDetailView; mô tả snapshot tra theo yêu cầu, không suy thành polling/tracking thời gian thực |
| Contract/gallery | Category có image_url; admin gallery/public IDs và list-cover/detail-gallery đã có; loại customer-cancel đề xuất khỏi danh sách API active |
| Địa chỉ | D1 administrative catalog và zone active, không JSON hai-city runtime hay fallback mặc định tỉnh |
| Routing/storage | /cart và /checkout tách routes, draft chung memory-only; sửa route/detail/entity và deferred ownership |
| Typography/UI | Fraunces/Inter cho EN, Lora/Be Vietnam Pro cho VI; có Dropdown/Combobox; sửa kích thước hero/grid và placeholder footer theo source |
| Config/SEO | Phân biệt public vars trong source với Worker đã deploy, client product metadata với sitemap/metadata HTML; about noindex không phải access control |
| Vận hành | Sửa mẫu backup theo schema10/12bảng, smoke token stdin và đối chiếu lỗi ghi; giữ hướng dẫn đúng target |
| Nguồn dữ liệu | Bổ sung credit Open Admin Data/CC BY4.0; tránh lặp commit/dataset metadata giữa attribution và domain reference |

## Kiểm tra sau chỉnh sửa

- **32 Markdown đã rà, 30 file sửa**; giữ README và design skill vì đang đúng phạm vi. Không thêm/xóa file tài liệu. Bảng phân công ở trên liệt kê toàn bộ tài liệu và vai trò.
- **387 liên kết/anchor nội bộ: PASS**, không thiếu path, heading hoặc reference. Hai SQL pointers vẫn dẫn đúng chuỗi migrations;0001–0003 không đổi so với HEAD sau chuẩn hóa newline.
- **67 tham chiếu URL ngoài** đã kiểm cú pháp;49 URL HTTP duy nhất được thử truy cập công khai (không tính local127.0.0.1).45 trả2xx/3xx;Figma cần GET vì HEAD trả404.
- **4 URL chưa xác minh được:** hai link PR1/PR2 trả404 khi truy cập ẩn danh, Unsplash và trang license trả401 cả HEAD/GET. Giữ URL nguồn/credit vì phản hồi thiếu quyền không chứng minh link sai. Kiểm authenticated GitHub bằng kho credential bị automatic approval review từ chối; không đọc credential hoặc thử lách giới hạn. Không suy ra nội dung nguồn/license đã được tái thẩm định chỉ từ HTTP200.
- `git diff --check`: PASS. Toàn bộ diff chỉ là Markdown;source/config/SQL/dependency không đổi. Không còn đoạn prose dài bị chép nguyên giữa các file. Tests/build không chạy lại cho thay đổi docs-only.

## Chưa thể xác minh từ source

- Secret values, provider preset/hostname đúng, Turnstile/Cloudinary success flow, Cron cloud thực chạy, quota/billing/CPU và counts DB hiện tại.
- Trạng thái production mới hơn các mốc đã ghi; không tái kiểm cloud hoặc suy trạng thái live từ config local.
- Tính pháp lý/chính xác kinh doanh của địa chỉ/map, MST001, hotline, nội dung story/giờ mở cửa, chính sách và dữ liệu bán hàng.
- Kết quả tests/browser cũ chỉ là evidence có ngày. Audit tài liệu không thay nghiệm thu runtime và không nâng mức hoàn tất phase.

Báo cáo audit16/10 đã lỗi thời về counts/deployment được thay bằng báo cáo này; bằng chứng phase và các snapshot còn giá trị được giữ tại tài liệu sở hữu tương ứng. Không bổ sung file tài liệu mới.
