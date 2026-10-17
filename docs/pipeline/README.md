# Pipeline Lunara MVP

Cập nhật **17/10/2026**. File này định nghĩa phạm vi, thứ tự phase và cổng nghiệm thu. [PROJECT_STATUS](../PROJECT_STATUS.md) giữ trạng thái/checks/deployment hiện hành; các file phase giữ kết quả tại mốc nghiệm thu. Thực hiện một phase không tự cho phép commit, push, deploy hoặc ghi D1 remote.

## 1. Mục tiêu MVP

Khách vào web, xem hoa, thêm giỏ, **đặt hàng COD** (không cần tài khoản), tra đơn bằng mã + số điện thoại. Chủ shop đăng nhập admin, xem đơn, đổi trạng thái, sửa giá/tồn kho.

| Trong MVP | Không làm (xem [BACKLOG](BACKLOG.md)) |
| --- | --- |
| Catalog song ngữ vi/en, variants, ảnh và trang chi tiết | Đặt hoa theo yêu cầu (wizard) |
| Giỏ hàng ở trình duyệt, server báo giá lại | Đăng ký/đăng nhập khách, profile, wishlist server |
| Checkout COD, trừ tồn nguyên tử, chống đơn trùng | Thanh toán online, coupon thật, review |
| Phí giao từng phường + khung giờ/thiệp; signed upload/gallery admin | Xóa asset provider tự động |
| Admin: đăng nhập, đơn hàng, sản phẩm/tồn kho, phí giao, dashboard tóm tắt | Biểu đồ/KPI nâng cao, thông báo, audit log |
| Tiền VND, địa chỉ tỉnh/phường | Tồn kho ledger, nhiều chi nhánh |

## 2. Quyết định đã chốt

| Chủ đề | Quyết định |
| --- | --- |
| Thanh toán | Chỉ COD. `payment_status` UNPAID → PAID khi giao xong |
| Tiền / múi giờ | VND (số nguyên) / Asia/Ho_Chi_Minh; toàn UI MVP dùng formatter chung. Locale lưu → browser EN/VI → EN fallback; đổi locale không đổi currency/timezone/dữ liệu khách; PHP/₱ chỉ còn source legacy ẩn |
| Địa chỉ | `province_name` + `ward_name` + `address_line`, không có quận/huyện |
| Tồn kho | Theo từng variant (size): `product_variants.stock_quantity`, trừ khi đặt; early cancel mặc định hoàn, IN_TRANSIT cancel cần lý do/restock mặc định false |
| Phí giao | Hai bảng danh mục Hà Nội + `delivery_zones` từng phường active; không fallback tỉnh; phụ phí phương thức từ config |
| Auth admin | Một mật khẩu dài ngẫu nhiên trong secret, SHA-256/timingSafeEqual + JWT HS256 cookie HttpOnly/SameSite=Strict 12h; requireAdmin/requireSameOrigin; không bcrypt/argon2 hoặc bảng mới |
| Auth khách | Bảng `users` dựng sẵn, chưa dùng. Better Auth/Auth khác làm sau |
| Backend | Cùng source, mỗi môi trường có một Worker phục vụ static assets và `/api/*` cùng origin; prod/staging tách Worker/D1/secrets |
| Ảnh | Signed direct Cloudinary upload; D1 lưu URL/public ID, gallery tối đa 8 ảnh; [runbook](../CLOUDINARY.md) |
| Cart | `localStorage` có version; server không tin giá/tồn từ client |

## 3. Các phase

| Phase | File | Trạng thái | Ước lượng | Cổng nghiệm thu |
| --- | --- | --- | --- | --- |
| 0 | [PHASE_0_PREPARE](PHASE_0_PREPARE.md) | DONE | 1 giờ | FE + health/JSON 404 + SPA reload + D1 local + build/typecheck pass |
| 1 | [PHASE_1_DATABASE](PHASE_1_DATABASE.md) | DONE | 1 giờ | Canonical 10 bảng; migration + seed local, 13/13 nhóm verify pass |
| 2 | [PHASE_2_API_CATALOG](PHASE_2_API_CATALOG.md) | DONE | 2,5 giờ | Catalog ≤3 queries; phí giao/quote; tại mốc Phase 2: 53 tests + smoke 16/16 |
| 3 | [PHASE_3_CHECKOUT_ORDERS](PHASE_3_CHECKOUT_ORDERS.md) | DONE local | 3 giờ | COD/tồn/idempotency/lookup/transition; tại mốc Phase 3: 92 tests, smoke 27/27, budget ≤40 |
| 4 | [PHASE_4_ADMIN](PHASE_4_ADMIN.md) | DONE local (9/9 tiêu chí) | 2 giờ | Secret/JWT cookie + quyền/Origin; summary/orders/products/variants/delivery-zones; không bảng/dependency mới |
| 5 | [PHASE_5_FRONTEND](PHASE_5_FRONTEND.md) | DONE local (6/6 tiêu chí) | 4,5 giờ (ước lượng ban đầu) | Checkout/lookup/auth/admin thật; 136 tests, 40 smoke, 10/10 UI + 2/2 mở rộng, 0 exceptions |
| 6 | [PHASE_6_DEPLOY](PHASE_6_DEPLOY.md) | IN PROGRESS (5/7) | 1,5 giờ (ước lượng ban đầu) | Migrate/seed/backup + deploy/API live/public browser/cleanup đã PASS; chờ dữ liệu thật/xác nhận quota |

Tài liệu dùng chung: [API_CONTRACT](API_CONTRACT.md) • [BACKLOG](BACKLOG.md) • SQL: [migration canonical](../../migrations/0001_mvp.sql), [dev seed](../sql/MVP_SEED_DEV.sql).

Base [0001_mvp.sql](../../migrations/0001_mvp.sql) là DDL bất biến của 10 bảng MVP. Các mở rộng đã có trong source: 0002 category images và 0003 danh mục hành chính; [DATABASE_DESIGN](../DATABASE_DESIGN.md) giải thích schema, [PROJECT_STATUS](../PROJECT_STATUS.md) ghi migration đã áp từng môi trường. `custom_requests` vẫn deferred, không tự áp SQL tham khảo. Không chạy lại seed mẫu trên dữ liệu vận hành.

Tham chiếu hành vi: [CHECKOUT_UI](../CHECKOUT_UI.md), [ORDER_TRACKING](../ORDER_TRACKING.md), [DELIVERY_ADDRESS](../DELIVERY_ADDRESS.md). Quy trình vận hành/remote smoke: [OPERATIONS](../OPERATIONS.md). Kiểm local không thay nghiệm thu provider, CPU/quota hoặc giao dịch cloud.

## 4. Cách thực hiện một phase

1. Chọn một phase và phạm vi còn thiếu theo PROJECT_STATUS; đọc mục việc cần làm và tiêu chí nghiệm thu trong file tương ứng.
2. Các mục [NGƯỜI] cần đầu vào hoặc authorization của chủ dự án (tài khoản, dữ liệu kinh doanh, secrets và remote actions). Giữ authorization của yêu cầu hiện tại; không suy ra quyền từ checklist.
3. Phase hoàn tất khi đủ tiêu chí. Runtime changes chạy typecheck, architecture, tests, build và kiểm luồng; thêm audit khi đổi dependency, smoke local khi đổi Worker. Documentation-only kiểm nội dung, đường dẫn/liên kết.
4. Commit/push/deploy chỉ khi được yêu cầu riêng hoặc có standing authorization rõ ràng.

## 5. Quy tắc chung cho mọi phase

- Không đổi phiên bản React/Vite/React Router/Tailwind đã pin. Dependency mới cần lý do thuộc phạm vi đang được yêu cầu.
- Mọi SQL dùng **prepared statement + bind**. Không nối chuỗi từ input.
- **Server tính tiền, phí, tồn.** Bỏ qua mọi `price`/`total`/`role` do client gửi.
- Migration đã áp lên D1 **remote** thì không sửa; thay đổi = file `migrations/000N_*.sql` mới.
- Không commit secret. `.dev.vars` nằm trong `.gitignore`.
- Sizing kế hoạch: **50 truy vấn D1/request**, **10 ms CPU/request**; kiểm tra quota thật trước deploy. Cổng nghiệm thu order Phase 3 chặt hơn: **≤40 statements/request**, tính mọi statement trong failed/retried batch; giỏ tối đa 15 dòng.
- Worker tránh băm mật khẩu nặng, xử lý ảnh và vòng lặp lớn; đo luồng thật trước mở bán.
- Lỗi trả theo [API_CONTRACT](API_CONTRACT.md); không lộ stack trace hay SQL ra client.
- Mọi thay đổi hành vi nghiệp vụ phải cập nhật tài liệu liên quan trong `docs/`.

## 6. Giới hạn gói Free cần nhớ (kiểm tra lại trước khi deploy)

Tham số sizing của bản kế hoạch: Workers 100.000 requests/ngày, 10 ms CPU/request; D1 50 queries/request, 500 MB/database. Trước deploy, kiểm tra lại quota/chi phí, cách tính static assets và cơ chế reset khi vượt hạn mức theo [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) / [D1 limits](https://developers.cloudflare.com/d1/platform/limits/). Xem dashboard khi vận hành; Phase 0 local không kiểm chứng quota cloud.

## 7. Cấu trúc repo đích

```text
.
├─ src/                         # frontend hiện có (features/*)
├─ shared/                      # hằng số + schema Zod dùng chung FE/Worker (Phase 2)
├─ worker/
│  ├─ index.ts                  # Hono app, export default
│  ├─ config.ts                 # khung giờ, phụ phí, giới hạn giỏ (chủ shop chỉnh)
│  ├─ env.ts                    # kiểu Bindings
│  ├─ routes/                   # public.ts, orders.ts, admin-*.ts
│  ├─ services/                 # catalog/pricing/orders/delivery và admin-*.ts
│  └─ lib/                      # errors.ts, ids.ts, auth.ts, validate.ts
├─ migrations/                 # base 0001 bất biến + additive migrations
├─ scripts/verify-schema.mjs    # 13 nhóm ràng buộc trên D1 local
├─ scripts/smoke.mjs            # kiểm thử end-to-end bằng fetch
├─ docs/                        # tài liệu (có pipeline/ và sql/)
├─ wrangler.jsonc
├─ vite.config.ts               # React/Tailwind + cloudflare(), bindings local
└─ .dev.vars                    # secret local (không commit)
```

## 8. Định nghĩa "MVP xong"

Tất cả kịch bản sau pass trên bản **đã deploy**:

1. Xem danh sách/chi tiết sản phẩm, giá hiển thị VND.
2. Thêm vào giỏ, tải lại trang vẫn còn giỏ.
3. Đặt hàng COD thành công → có mã đơn; tồn giảm đúng.
4. Hai request mua nốt món cuối cùng song song → đúng một đơn thành công, một báo hết hàng.
5. Gửi lại cùng `Idempotency-Key` → không sinh đơn thứ hai.
6. Sửa giá trong request bằng tay → server bỏ qua, dùng giá DB.
7. Phường có zone active thuộc danh mục → phí đúng; chưa cấu hình, tắt hoặc ngoài danh mục → NO_DELIVERY_ZONE, không fallback tỉnh.
8. Tra đơn bằng mã + SĐT đúng thấy đơn; SĐT sai báo không tìm thấy.
9. Admin đăng nhập, đổi trạng thái đúng thứ tự; giao xong → `PAID`; hủy có restock → tồn hoàn đúng một lần; IN_TRANSIT mặc định không hoàn.
10. Không còn ký hiệu ₱ hay dữ liệu fixture ở các luồng trên.

Các thay đổi sau nghiệm thu phase và mức deploy được ghi tại PROJECT_STATUS; không dùng số test hoặc dữ liệu seed lịch sử làm số đếm hiện tại.
