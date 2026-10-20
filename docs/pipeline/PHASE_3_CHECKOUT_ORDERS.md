# Phase 3 — Đặt hàng COD, tồn kho, idempotency và tra đơn

Hồ sơ dành cho backend/QA: **DONE local, 5/5 tiêu chí, 14/10/2026**. Phạm vi tạo đơn/tra đơn và service transition, chưa gồm frontend/admin. Contract tại [API_CONTRACT](../reference/API_CONTRACT.md); rationale batch/CHECK/CAS/budget tại [ARCHITECTURE](../ARCHITECTURE.md#worker-và-dữ-liệu-bền-vững); Turnstile/cap/expiry tại [BOT_PROTECTION](../operations/BOT_PROTECTION.md).

Đầu vào đã kiểm: base 0001/seed, verifier 13/13 nhóm (46 assertions), Phase 2 53 tests và 16/16 smoke. Không sửa DDL hoặc tạo tài nguyên remote. Các bổ sung cap/Turnstile/coverage sau mốc này có owner hiện hành ở các link trên; không gán kết quả kiểm cũ cho chúng.

## Kịch bản smoke bắt buộc

| # | Kịch bản cần giữ khi kiểm hồi quy |
| --- | --- |
| 1 | COD hợp lệ →201, tổng server, snapshot/history và trừ đúng tồn. |
| 2 | Cùng UUID v4 →200 replayed, không thêm đơn/trừ tồn lần nữa. |
| 3 | Hai key mua tồn cuối 1 song song →đúng 201 +409 OUT_OF_STOCK, tồn 0 và không đơn treo. |
| 4 | Giá/phí/tổng giả từ client bị bỏ qua. |
| 5 | Vượt tồn →409 với requested sau gộp/available; database không đổi. |
| 6 | Phường active đúng phí/ngưỡng miễn phí; ngoài coverage →422 NO_DELIVERY_ZONE. Không phục hồi fallback tỉnh lịch sử. |
| 7 | SAME_DAY ngày mai/ngày quá khứ →422 INVALID_DELIVERY_SLOT. |
| 8 | Lookup chấp nhận SĐT người đặt/người nhận; sai mã/SĐT cùng NOT_FOUND. |
| 9 | Thiếu/sai UUID/không v4 →400, không ghi. |
| 10 | Full transition đến DELIVERED/PAID, đủ history; hủy hoàn đúng một lần, lần hai INVALID_TRANSITION. |

Phase 3 kiểm transition service trực tiếp; Phase 4 bổ sung boundary admin và ca qua API. Không có HTTP customer-cancel route.

## Tiêu chí nghiệm thu

- [x] 10 kịch bản smoke PASS tại mốc nghiệm thu.
- [x] Order/items/history/tồn nhất quán; mức tồn giảm bằng lượng item của đơn chưa hủy.
- [x] Giỏ 15 dòng: success 35 statements, CHECK/unique race 36; collision dừng an toàn ở 35, mọi failed batch/retry tính trong budget ≤40.
- [x] Input luôn bind; đã thử customer text giống SQL trong batch binds.
- [x] Typecheck và tests PASS.

## Bằng chứng lệnh — 14/10/2026

| Nhóm | Kết quả đã ghi nhận |
| --- | --- |
| Build/tests | Typecheck, architecture 178 source files, **92/92 tests** và build PASS. |
| HTTP/D1 | **27/27 smoke** =16 catalog +10 order +1 budget/stock reconciliation; catalog kiểm dev/preview, ghi order qua HTTP loopback và binding workerd thật. |
| Race mua/replay | Tồn cuối: 201/409, orders/items/history 1/1/1; cùng key: 201/200 replayed và trừ tồn một lần. Submitted statements 7/8 ở giỏ một dòng. |
| Rollback/budget | Giỏ 15 dòng success 35, CHECK failure 36; không còn order/items/history, các decrement trước lỗi được rollback. Collision 15 dòng chỉ một batch/35 statements. |
| Transition | History đủ năm trạng thái, PAID và paid_at=delivered_at; hủy từ PENDING/CONFIRMED/PREPARING hoàn một lần. |
| Tranh chấp hủy | Hai pre-read PENDING: một thành công, một INVALID_TRANSITION, một history hủy; race CONFIRMED/CANCELLED và variant xóa cứng đã kiểm. |
| Đối soát | 24 variants khớp tổng lượng các đơn chưa hủy; dangling orders 0, FK sạch, 8 đơn test trong DB cô lập. |

Workerd D1 dùng persist:false/remoteBindings:false; HTTP server/proxy được đóng sau kiểm, không reset/chỉnh seed persisted hoặc ghi remote. Source schemas/IDs, ngày lịch, normalize phone và public projection đã review tại mốc này; không dùng kết quả local làm xác nhận provider hoặc CPU cloud.

Raw logs có thể khôi phục trong Git. Kết quả mới và deployment ở [PROJECT_STATUS](../PROJECT_STATUS.md), UX tra đơn ở [ORDER_TRACKING](../features/ORDER_TRACKING.md).
