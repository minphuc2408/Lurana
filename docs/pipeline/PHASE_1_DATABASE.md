# Phase 1 — Database D1 local

Hồ sơ dành cho backend/QA: **DONE local, 5/5 tiêu chí, 14/10/2026**. Chốt DDL v2 cho 10 bảng base, migration/seed và constraints; không ghi D1 remote. Schema/decision v1 → v2 thuộc [DATABASE_DESIGN](../reference/DATABASE_DESIGN.md#quyết-định-base-schema-v1--v2-tại-phase-1); setup/verifier hiện hành thuộc [LOCAL_DEVELOPMENT](../LOCAL_DEVELOPMENT.md).

Base [0001_mvp.sql](../../migrations/0001_mvp.sql) có SHA-256 nghiệm thu `9ee756750b15b50f902e17db41a3ef75a2c0e5437c9eb56b7a9253a83c9aa4e0`. Không sửa DDL sau khi chốt; extensions ở migration mới, không áp custom_requests deferred. Mốc/counts bên dưới chỉ áp dụng base 0001; chuỗi migration hiện tại và từng môi trường xem [PROJECT_STATUS](../PROJECT_STATUS.md).

## Kiểm tra ràng buộc — 13 nhóm

| # | Điều kiện đã kiểm trên D1 local cô lập |
| --- | --- |
| 1 | Tổng đơn phải bằng subtotal − discount + fee. |
| 2 | Ngày giao phải đúng dạng YYYY-MM-DD; ngày lịch do service kiểm. |
| 3 | Idempotency key trùng bị chặn; nhiều NULL được phép. |
| 4 | Order number trùng bị chặn. |
| 5 | Trừ tồn âm gây CHECK và rollback batch thật: không còn order/items/history, mọi tồn giữ nguyên. |
| 6 | Line total = unit price × quantity. |
| 7 | Tối đa một primary image/product và địa chỉ mặc định/user. |
| 8 | Compare-at ≥ price, unique product/size và size hợp lệ. |
| 9 | Email chữ thường và unique. |
| 10 | Chỉ COD. |
| 11 | Xóa cứng catalog đặt FK item về NULL, giữ snapshot đơn. |
| 12 | Category còn sản phẩm không được xóa. |
| 13 | Chạy raw DDL rồi seed hai lần không nhân đôi, gồm đủ tám ảnh. |

Verifier dùng binding workerd thật `persist:false`, `remoteBindings:false` cho ca destructive; database seeded chỉ đọc. Verifier Python in-memory cũ đã bỏ, kết quả 28/28 cũ không dùng nghiệm thu. D1 binding từ chối `PRAGMA integrity_check` bằng SQLITE_AUTH nên verifier giữ `foreign_key_check`; phép integrity offline cho SQL backup là quy trình khác trong [OPERATIONS](../operations/OPERATIONS.md#4-sao-lưu-riêng-tư-và-mở-thử-offline).

## Tiêu chí nghiệm thu

- [x] 0001 áp sạch; migration history tại mốc này có đúng một migration.
- [x] Seed 4 categories/8 products/24 variants/8 images/4 zones; chạy lại không nhân đôi.
- [x] Verifier PASS đủ 13 nhóm.
- [x] Foreign key check rỗng.
- [x] Reference/schema pointers thống nhất; custom_requests chỉ là deferred.

## Bằng chứng lệnh — 14/10/2026

- Migration thực thi 25 commands; seed 48 commands mỗi lần; lần migrate kế tiếp không còn migration chờ. Verifier **13/13 nhóm, 46 assertions**, 10 bảng nghiệp vụ và FK sạch.
- Typecheck, architecture 170 source files, 18/18 tests và build PASS trên Node 24.11.1/Wrangler 4.150.0. Không đổi dependency; không chạy lại audit trong Phase 1.
- Counts và ràng buộc đã kiểm bằng truy vấn/binding D1; không thay Worker/UI hoặc remote. Dữ liệu seed là mẫu; khu vực/phí thật vẫn cần owner chốt trước mở bán.

Raw output đã có trong Git trước refactor; hồ sơ giữ tiêu chí và bằng chứng tổng hợp thay cho terminal logs. Quy ước SQL/bind/time/FK và lý do CHECK rollback ở [Database](../reference/DATABASE_DESIGN.md), [Architecture](../ARCHITECTURE.md#worker-và-dữ-liệu-bền-vững).
