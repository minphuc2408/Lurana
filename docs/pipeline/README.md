# Pipeline Lunara MVP — hiện trạng và kế hoạch

Cập nhật: **14/10/2026**. Tech stack giữ nguyên như [TECH_STACK.md](../TECH_STACK.md): React 18 + Vite 6 + React Router 7 + Tailwind 4 (đã có) • Hono + Cloudflare Workers • Zod • Cloudflare D1 • Cloudinary • Turnstile.

Pipeline mô tả đích MVP và các phase tiếp theo; nó không tự cho phép thực hiện tất cả phase. Phase 0 chỉ dựng Worker local và health API. Storefront/admin tiếp tục dùng fixtures, PHP/₱ và Asia/Manila đến Phase 5. Chủ dự án đã đăng ký Cloudflare, đăng nhập Wrangler và tạo D1 remote `lunara-db` còn trống ngoài lượt Phase 0; không cần làm lại các bước đó.

**Trạng thái:** Phase 0 DONE (6/6 tiêu chí) · Phase 1 DONE (5/5 tiêu chí, D1 local) · Phase 2 DONE (8/8 tiêu chí, API local) · Phase 3–6 PLANNED. [Hiện trạng / gaps / đầu vào chủ shop](../PROJECT_STATUS.md). Lịch 2 ngày và gói Free là ước lượng kế hoạch, không phải cam kết thời gian/chi phí.

## 1. Mục tiêu MVP

Khách vào web, xem hoa, thêm giỏ, **đặt hàng COD** (không cần tài khoản), tra đơn bằng mã + số điện thoại. Chủ shop đăng nhập admin, xem đơn, đổi trạng thái, sửa giá/tồn kho.

| Trong MVP | Không làm (xem [BACKLOG](BACKLOG.md)) |
| --- | --- |
| Catalog song ngữ vi/en, 3 size S/M/L, ảnh | Đặt hoa theo yêu cầu (wizard) |
| Giỏ hàng ở trình duyệt, server báo giá lại | Đăng ký/đăng nhập khách, profile, wishlist server |
| Checkout COD, trừ tồn nguyên tử, chống đơn trùng | Thanh toán online, coupon thật, review |
| Phí giao theo phường/khu vực + khung giờ giao + thiệp | Upload ảnh từ admin (MVP dán URL ảnh) |
| Admin: đăng nhập, đơn hàng, sản phẩm/tồn kho, phí giao | Dashboard số liệu thật, thông báo, audit log |
| Tiền VND, địa chỉ tỉnh/phường | Tồn kho ledger, nhiều chi nhánh |

## 2. Quyết định đã chốt

| Chủ đề | Quyết định |
| --- | --- |
| Thanh toán | Chỉ COD. `payment_status` UNPAID → PAID khi giao xong |
| Tiền / múi giờ | VND (số nguyên) / Asia/Ho_Chi_Minh. FE hiện PHP/₱ phải chuyển (Phase 5) |
| Địa chỉ | `province_name` + `ward_name` + `address_line`, không có quận/huyện |
| Tồn kho | Theo từng variant (size): `product_variants.stock_quantity`, trừ khi đặt, hoàn khi hủy |
| Phí giao | Bảng `delivery_zones` (khớp phường, không có thì mặc định tỉnh) + phụ phí theo phương thức (config) |
| Auth admin | Một mật khẩu dài ngẫu nhiên trong secret + cookie JWT HttpOnly; không dùng bcrypt/argon2 trong thiết kế MVP; Phase 4 chưa triển khai |
| Auth khách | Bảng `users` dựng sẵn, chưa dùng. Better Auth/Auth khác làm sau |
| Backend | Cùng repo, **một Worker** vừa phát file tĩnh vừa chạy `/api/*` (cùng origin, không CORS) |
| Ảnh | Seed bằng URL; Cloudinary upload làm sau |
| Cart | `localStorage` có version; server không tin giá/tồn từ client |

## 3. Các phase

| Phase | File | Trạng thái | Ước lượng | Cổng nghiệm thu |
| --- | --- | --- | --- | --- |
| 0 | [PHASE_0_PREPARE](PHASE_0_PREPARE.md) | DONE | 1 giờ | FE + health/JSON 404 + SPA reload + D1 local + build/typecheck pass |
| 1 | [PHASE_1_DATABASE](PHASE_1_DATABASE.md) | DONE | 1 giờ | Canonical 10 bảng; migration + seed local, 13/13 nhóm verify pass |
| 2 | [PHASE_2_API_CATALOG](PHASE_2_API_CATALOG.md) | DONE | 2,5 giờ | Catalog ≤3 queries; phí giao/quote; 53 tests + smoke 16/16 |
| 3 | [PHASE_3_CHECKOUT_ORDERS](PHASE_3_CHECKOUT_ORDERS.md) | PLANNED | 3 giờ | COD, tồn, idempotency, tra đơn, hủy |
| 4 | [PHASE_4_ADMIN](PHASE_4_ADMIN.md) | PLANNED | 2 giờ | Admin login + đơn/sản phẩm/tồn/phí giao |
| 5 | [PHASE_5_FRONTEND](PHASE_5_FRONTEND.md) | PLANNED | 4,5 giờ | FE dùng API, VND, thay fixture ở luồng MVP |
| 6 | [PHASE_6_DEPLOY](PHASE_6_DEPLOY.md) | PLANNED | 1,5 giờ | Deploy + remote smoke + dữ liệu thật |

Tài liệu dùng chung: [API_CONTRACT](API_CONTRACT.md) • [BACKLOG](BACKLOG.md) • SQL: [migration canonical](../../migrations/0001_mvp.sql), [dev seed](../sql/MVP_SEED_DEV.sql).

**Schema đã thống nhất ở Phase 1:** dùng nguyên DDL v2 cho 10 bảng, có `delivery_zones`, idempotency và các ràng buộc; `custom_requests` deferred. [`migrations/0001_mvp.sql`](../../migrations/0001_mvp.sql) là nguồn DDL duy nhất; hai file `MVP_SCHEMA.sql` cũ chỉ dẫn về migration. [Đối chiếu v1/v2 và lý do](../DATABASE_DESIGN.md). Seed và migration đã áp D1 local; `npm run db:verify` pass 13/13 nhóm trên binding D1 local, dùng database cô lập cho ca ghi/xóa thử. Verifier Python tham chiếu cũ đã được thay bằng script Node này, không còn suite tự áp deferred/0002. [Output nghiệm thu](PHASE_1_DATABASE.md#bằng-chứng-lệnh--14102026). Không truy cập D1 remote.

**Lịch 2 ngày:** Ngày 1 = Phase 0 → 3 (+ bắt đầu 4). Ngày 2 = Phase 4 → 6.

**Phase 2 local đã nghiệm thu:** khung Hono/Zod, catalog 4 danh mục/8 sản phẩm, DTO an toàn, phí giao và quote lấy giá DB. Các ca HIDDEN/giới hạn/lỗi kiểm trên SQLite bộ nhớ và binding workerd D1 `persist: false`; smoke chỉ đọc DB local đã seed. [Checklist/output](PHASE_2_API_CATALOG.md#bằng-chứng-lệnh--14102026). Không đổi DDL, dependency, frontend, D1 remote hoặc triển khai đặt đơn/admin.

**Phase 0–5 làm local, không cần tài khoản Cloudflare.** Phase 6 dùng tài khoản/D1 đã được chủ dự án tạo; đăng ký/login/create lại chỉ khi còn thiếu.

**Nếu trễ, cắt theo thứ tự:** (1) trang admin sản phẩm chỉ giữ sửa giá/tồn, (2) bỏ admin sửa phí giao (sửa bằng SQL), (3) bỏ trang tra đơn khách (admin vẫn xem được), (4) bỏ Turnstile. **Không cắt:** tính tiền ở server, trừ tồn nguyên tử, idempotency.

## 4. Cách dùng với `/goal`

1. Mỗi lần chạy **một phase**. Dán mục **"Goal prompt"** cuối file phase vào `/goal`.
2. Các bước gắn nhãn **[NGƯỜI]** là việc agent không tự làm (đăng ký tài khoản, đăng nhập, đặt secret, deploy thật). Agent phải dừng và nhắc bạn.
3. Phase chỉ xong khi mọi mục trong **"Tiêu chí nghiệm thu"** tick đủ. Chạy `npm run typecheck`, `npm run check:architecture`, `npm test`, `npm run build`; chạy thêm `npm audit` khi đổi dependency. Repo không có script ESLint/lint.
4. Commit sau mỗi phase (`feat(phaseN): ...`) khi yêu cầu hiện tại bao gồm commit; commit/push/deploy không được suy ra từ việc thực hiện một phase.

## 5. Quy tắc chung cho mọi phase

- Không đổi phiên bản React/Vite/React Router/Tailwind đã pin. Chỉ thêm dependency nêu trong tài liệu.
- Mọi SQL dùng **prepared statement + bind**. Không nối chuỗi từ input.
- **Server tính tiền, phí, tồn.** Bỏ qua mọi `price`/`total`/`role` do client gửi.
- Migration đã áp lên D1 **remote** thì không sửa; thay đổi = file `migrations/000N_*.sql` mới.
- Không commit secret. `.dev.vars` nằm trong `.gitignore`.
- Sizing kế hoạch: **50 truy vấn D1/request**, **10 ms CPU/request**; kiểm tra quota thật trước deploy. Mỗi statement trong `batch()` tính riêng; giỏ tối đa 15 dòng theo thiết kế pipeline.
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
│  ├─ routes/                   # public.ts, orders.ts, admin/*.ts
│  ├─ services/                 # pricing.ts, orders.ts, delivery.ts
│  └─ lib/                      # errors.ts, ids.ts, auth.ts, validate.ts
├─ migrations/0001_mvp.sql      # nguồn DDL canonical duy nhất
├─ scripts/verify-schema.mjs    # 13 nhóm ràng buộc trên D1 local
├─ scripts/smoke.mjs            # kiểm thử end-to-end bằng fetch
├─ docs/                        # tài liệu (có pipeline/ và sql/)
├─ wrangler.jsonc
├─ vite.config.ts               # thêm plugin cloudflare()
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
7. Phường không thuộc khu vực giao → báo lỗi rõ ràng; phường có phí riêng → phí đúng.
8. Tra đơn bằng mã + SĐT đúng thấy đơn; SĐT sai báo không tìm thấy.
9. Admin đăng nhập, đổi trạng thái đúng thứ tự; giao xong → `PAID`; hủy → tồn hoàn đúng một lần.
10. Không còn ký hiệu ₱ hay dữ liệu fixture ở các luồng trên.
