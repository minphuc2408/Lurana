# Phase 2 — API nền và catalog

Hồ sơ dành cho backend/QA: **DONE local, 8/8 tiêu chí, 14/10/2026**. Phạm vi Hono middleware/validation, catalog/delivery options và quote chỉ đọc. Request/DTO/limits hiện hành thuộc [API_CONTRACT](../reference/API_CONTRACT.md); setup/smoke thuộc [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md).

**Khác biệt lịch sử:** nghiệm thu 14/10 còn fallback phí mặc định tỉnh. Từ 16/10, coverage chỉ gồm phường có zone active hợp danh mục, không fallback; [DELIVERY_ADDRESS](../features/DELIVERY_ADDRESS.md) sở hữu quy tắc hiện hành. Không dùng ví dụ seed hoặc checklist cũ để bật coverage.

## Tiêu chí nghiệm thu

- [x] Catalog seed tại mốc này: 4 categories, 8 products, mỗi sản phẩm S/M/L và một cover.
- [x] HIDDEN biến mất khỏi danh sách và detail trả 404.
- [x] Danh sách sản phẩm dùng ≤3 statements, không N+1.
- [x] Delivery options đọc khu vực/phí từ DB.
- [x] Quote dùng giá DB, bỏ giá/tổng client; phí theo dữ liệu giao tại mốc nghiệm thu.
- [x] Giới hạn 15 dòng/20 mỗi dòng; giỏ 16, quantity 0/21 bị từ chối đúng contract.
- [x] Lỗi JSON an toàn, không lộ stack trace.
- [x] Unit tests và typecheck PASS.

## Triển khai và phạm vi kiểm chứng — 14/10/2026

| Nhóm | Bằng chứng đã ghi nhận |
| --- | --- |
| Catalog | 3 statements khi có sản phẩm; 1 khi rỗng/404. Dataset 118 sản phẩm trả tối đa 100; child query ≤100 bind parameters. Public không trả tồn chính xác/public ID. |
| Quote | Một query variants + một query phí; gộp ID trùng, thiếu tồn trả issue, không ghi order/tồn. Giá giả bị bỏ: unit/subtotal 450000, phí phường 20000, tổng 470000 trong seed. |
| Coverage lịch sử | Fallback tỉnh 35000 đã PASS ngày 14/10; tỉnh lạ trả 422 NO_DELIVERY_ZONE. Đây là bằng chứng hành vi cũ đã thay thế, không phải acceptance coverage hiện tại. |
| Tests | 35 ca mới (catalog 8, pricing/delivery 14, validation 6, Hono 6, D1 1), tổng **53 tests PASS**; typecheck, architecture 170 source files và build PASS. |
| HTTP smoke | **16/16 nhóm PASS** trên dev và build preview: health/JSON 404/SPA/catalog/filter/options/quote/limits/validation/deferred routes tại mốc này. |
| Isolation | Các ca thay trạng thái/tồn dùng SQLite in-memory hoặc workerd D1 persist:false/remoteBindings:false; persisted seed không đổi, không ghi remote/đổi DDL/dependency. |

Middleware đã xử lý payload bị bỏ qua để tránh socket lỗi của proxy Miniflare khi POST không đọc body rồi GET tiếp theo. Probe preview 100 request =25 cặp POST orders → GET admin và 25 cặp quote text/plain → GET health: lần lượt 404/404 và 400/200, không 500/fetch failed. Hành vi drain thuộc [hardening HTTP](../operations/HARDENING.md#http-headers-và-payload).

## Bằng chứng lệnh — 14/10/2026

Các lệnh kiểm tra exit 0; terminal logs gốc còn trong Git. Số test/smoke là mốc Phase 2, không cộng kết quả Phase 3–5 vào đây. Khi đó Home/Shop/Cart mới đọc catalog/quote; orders/admin còn deferred. Nghiệm thu này không chứng minh checkout/provider/cloud hoặc trạng thái deployment hiện tại.

Chính sách ban đầu (phụ phí 0/30000/50000, cutoff 16:00, chuẩn bị 120 phút, sáu slots 08:00–20:00, ngày +30, VND/giờ VN) được giữ ở [API contract](../reference/API_CONTRACT.md#quy-tắc-kiểm-tra-dữ-liệu-đặt-hàng); vẫn cần owner chốt trước mở bán. [Status](../PROJECT_STATUS.md) giữ checks mới, [OPERATIONS](../operations/OPERATIONS.md#3-smoke-trên-deployment-và-cleanup) giữ guard nghiệm thu deployment.
