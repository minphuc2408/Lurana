# Phase 6 — Deploy và nghiệm thu remote

Hồ sơ dành cho operator/QA: **mốc production 15/10/2026 đạt 5/7 tiêu chí**, chưa đóng Phase 6. Giữ bằng chứng ban đầu; phiên bản/migration/secret metadata mới hơn ở [PROJECT_STATUS](../PROJECT_STATUS.md), lịch sử ngoài phase ở [archive](../archive/VERIFICATION_HISTORY.md). Không dùng staging/local PASS để nâng nghiệm thu production.

Target/build/migrate thuộc [STAGING](../operations/STAGING.md), thao tác smoke/backup/restore/rollback/secrets/quota thuộc [OPERATIONS](../operations/OPERATIONS.md). Checklist không cấp quyền ghi remote; mỗi đợt cần đúng target/phạm vi đã được owner cho phép.

## Tiêu chí nghiệm thu — mốc production 15/10/2026

- [x] URL workers.dev truy cập được; reload Shop/Tra đơn vẫn hiển thị SPA.
- [x] D1 remote có base 0001, đủ 10 bảng nghiệp vụ, không còn migration chờ của artifact khi đó; không suy migration mới đã áp.
- [x] 10 kết quả MVP trên bản deploy bằng API live + browser public; smoke remote 7/7.
- [x] Owner đặt secrets server/Cloudflare và nhập prompt ẩn; không lưu giá trị vào source/Git/log. Fail-closed kiểm native local, không xóa secrets production để test.
- [ ] Dữ liệu mở bán thật: catalog/ảnh/giá/SKU/tồn, khu vực/phí/ngưỡng/cutoff/slots cần chốt; mẫu chưa ẩn/tắt tại mốc nghiệm thu.
- [x] SQL backup remote đã mở thử offline thành công.
- [ ] Bàn giao quota: runbook/hướng dẫn đã có, còn owner xác nhận biết theo dõi Workers/D1 hằng ngày.

## Bằng chứng thực thi — 15/10/2026

| Phạm vi | Kết quả lịch sử |
| --- | --- |
| Preflight | Typecheck, architecture 207 source files, 143/143 tests (136 Phase 5 +7 smoke-remote tests local), audit 0 advisory, build/dry-run PASS. UI preview 17 routes/0 exceptions, gồm fee fallback lịch sử. |
| Native auth local | 9/9 cấu hình hợp lệ/thiếu/trống/ngắn/trùng secret; fail 401/không cookie khi cấu hình sai. Không đo CPU cloud. |
| Harness remote runner | HTTP loopback/D1 cô lập kiểm ba SMOKE orders, race 201/409 và đối soát; 7/7 tests này là kiểm local, tách smoke live bên dưới. |
| Database ban đầu | Production base 0001:25 commands; seed 48 queries; categories/products/variants/images/zones=4/8/24/8/4, orders 0, FK sạch. Không sửa DDL/áp deferred. |
| Backup | .security-review/phase6-remote-initial-20261015.sql mở SQLite in-memory integrity=ok/FK sạch/counts khớp. Không restore remote hoặc chia sẻ signed download URL. |
| Local isolation | Verifier 13/13 (46 assertions), smoke 40/40 PASS trên D1 mới cô lập; không reset state preview, không đổi persisted seed. |
| Secrets/build | Không có real admin secrets trong Git/client/upload bundle. Plugin có thể tạo .dev.vars trong dist/lunara ignored để preview, không nằm dist/client hoặc upload bundle. |

### Production smoke và browser — 15/10/2026

Run `d2e606fe-d499-41fd-84d0-ab55e44f2b4d`, **17:39–17:40 giờ Việt Nam**, origin [production](https://lunara.minphuc2408.workers.dev), chỉ variant **1/BPB-S**. Owner xác nhận cửa sổ chưa có giao dịch khách/chỉnh tồn đồng thời và tự nhập password production qua prompt ẩn; không đọc lại .dev.vars.

| # MVP | Kết quả trên deployment | Phạm vi bằng chứng |
| --- | --- | --- |
| 1 | PASS catalog/detail/VND | API + Home/Shop EN/VI browser. |
| 2 | PASS Add/reload variant 1,qty 1 | Browser Cart; storage chỉ ID/quantity. |
| 3 | PASS COD/mã đơn/tổng/trừ tồn | API live + D1. |
| 4 | PASS món cuối song song 201/409 | API live OUT_OF_STOCK. |
| 5 | PASS replay không thêm đơn/tồn | API live/order count. |
| 6 | PASS bỏ giá/phí/tổng giả | API live/snapshot. |
| 7 | PASS phí tại mốc 15/10 | Phí phường/mặc định tỉnh/NO_DELIVERY_ZONE; fallback tỉnh đã bị thay sau đó. |
| 8 | PASS lookup đúng/sai SĐT | API live; browser chỉ form/reload. |
| 9 | PASS auth HTTPS/transitions/PAID/hủy | API live; chưa nghiệm thu đủ admin UI remote. |
| 10 | PASS runtime VND/không fixture FE | Browser public/API; D1 seed vẫn là mẫu, chưa đạt dữ liệu mở bán. |

Smoke live **7/7 PASS**, tạo đúng ba SMOKE orders: một DELIVERED/PAID, hai CANCELLED/UNPAID và stock_released=1. Trước cleanup, xác minh đúng run/variant 1, cả 24 variant khớp baseline, variant 1=20 và FK sạch. Cleanup đã được duyệt tại bước 6.9; sau dọn orders/items/history/SMOKE orders=0, tồn 24variant vẫn khớp, FK sạch. DELETE không tự hoàn tồn; lần này không cộng bù thêm.

Browser chỉ GET public/POST quote: Home/Shop/Cart EN/VI/VND, hard reload giỏ/track, navigation deferred ẩn, 0 exceptions; không nhập credential hoặc ghi order/admin từ browser. Evidence riêng tư ở .security-review/phase6-live-20261015-01 cùng phase6-public-cart-track-1792060890541.json và phase6-deployed-public-1792060819630.json. Cart assertion đầu chạy trước quote-ready, đã kiểm lại PASS; artifact không cần tồn tại trên clone khác để đọc kết quả tổng hợp.

## Đầu vào cần để tiếp tục

- **6.10 — Dữ liệu thật:** owner nhập bộ catalog/ảnh/giá/SKU/tồn và zone/phí/ngưỡng đã duyệt; ẩn sản phẩm mẫu, tắt zone ví dụ. Không full seed để ghi đè. Điều chỉnh chính sách config trong source khi có yêu cầu riêng, test rồi deploy đúng target.
- **6.11 — Bảo vệ trước mở bán:** nghiệm thu ba challenge Turnstile đúng action/hostname, upload preset/provider, Cron tick/expiry và CPU/quota cloud theo [Bot](../operations/BOT_PROTECTION.md)/[Hardening](../operations/HARDENING.md).
- **6.13 — Bàn giao quota:** owner xác nhận xem được Requests/Errors/CPU và D1 rows/storage theo [runbook](../operations/OPERATIONS.md#8-kiểm-hạn-mức-hằng-ngày-và-sự-cố). Có yêu cầu hướng dẫn chưa phải xác nhận; không tự tạo nhắc lịch.
- Domain/WAF là tùy chọn cần quyết định hạ tầng/chi phí riêng. Khi đổi domain kiểm HTTPS/SPA/cookie/Origin và hostname widget.

Mốc cleanup/authorization 15/10 không cho phép chạy lại trên dữ liệu hiện tại. Raw logs cũ còn trong Git; checks hoặc deployment sau đó không ghi chồng vào hồ sơ phase này.
