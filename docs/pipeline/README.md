# Pipeline Lunara MVP — hiện trạng và kế hoạch

> Rà soát 16/10/2026: [hiện trạng chuẩn](../PROJECT_STATUS.md), [contract hiện tại](API_CONTRACT.md). Phase 0–5 DONE local, Phase 6 IN PROGRESS5/7. Local170 tests/215 source files/40 smoke; staging đã deploy bản mới13:31 ngày 16/10, production vẫn bản 15/10. Output/checklist ghi ngày cũ bên dưới là lịch sử, không phải trạng thái cloud hiện tại.


B2/B3 đã có trong source; staging deploy 16/10, production chưa cập nhật: Turnstile checkout/lookup/login, rate-limit bindings, cap PENDING, xử lý khách từ chối nhận và Cron 24 giờ/mỗi giờ đã chốt trong cấu hình local. Phase 6 vẫn 5/7; cấu hình cloud và hạn mức WAF Free xem [runbook](../BOT_PROTECTION.md).

Cập nhật: **16/10/2026**. Tech stack giữ nguyên như [TECH_STACK.md](../TECH_STACK.md): React 18 + Vite 6 + React Router 7 + Tailwind 4 (đã có) • Hono + Cloudflare Workers • Zod • Cloudflare D1 • Cloudinary • Turnstile.

Pipeline mô tả đích MVP và các phase tiếp theo; nó không tự cho phép thực hiện tất cả phase. **Phase 0–5 đã xong local**. Phase 5 nối đủ Checkout COD, gửi/retry/xác nhận, tra đơn và admin từ API Phase 3–4, giữ catalog/variant cart/localStorage/delivery/quote/VND cùng English default/fallback. Source deferred còn giữ và ẩn bằng cờ/API readiness. Chủ dự án đã đăng ký Cloudflare, đăng nhập Wrangler và tạo D1 remote `lunara-db`; Phase 6 đã migrate/seed/backup, deploy và smoke API live/public browser rồi cleanup; không làm lại các bước chuẩn bị tài khoản.

**Trạng thái:** Phase 0 DONE (6/6 tiêu chí) · Phase 1 DONE (5/5 tiêu chí, D1 local) · Phase 2 DONE (8/8 tiêu chí, API local) · Phase 3 DONE (5/5 tiêu chí, local) · Phase 4 DONE local (9/9 tiêu chí) · Phase 5 DONE local (6/6 tiêu chí) · **Phase 6 IN PROGRESS (5/7 tiêu chí): deploy/secrets và API live 7/7 + public browser/10 kết quả MVP PASS; cleanup xong, còn dữ liệu thật và xác nhận quota**. [Hiện trạng / gaps / đầu vào chủ shop](../PROJECT_STATUS.md). Lịch 2 ngày và gói Free là ước lượng kế hoạch, không phải cam kết thời gian/chi phí.

## 1. Mục tiêu MVP

Khách vào web, xem hoa, thêm giỏ, **đặt hàng COD** (không cần tài khoản), tra đơn bằng mã + số điện thoại. Chủ shop đăng nhập admin, xem đơn, đổi trạng thái, sửa giá/tồn kho.

| Trong MVP | Không làm (xem [BACKLOG](BACKLOG.md)) |
| --- | --- |
| Catalog song ngữ vi/en, 3 size S/M/L, ảnh | Đặt hoa theo yêu cầu (wizard) |
| Giỏ hàng ở trình duyệt, server báo giá lại | Đăng ký/đăng nhập khách, profile, wishlist server |
| Checkout COD, trừ tồn nguyên tử, chống đơn trùng | Thanh toán online, coupon thật, review |
| Phí giao theo phường/khu vực + khung giờ giao + thiệp | Upload ảnh từ admin (MVP dán URL ảnh) |
| Admin: đăng nhập, đơn hàng, sản phẩm/tồn kho, phí giao, dashboard tóm tắt | Biểu đồ/KPI nâng cao, thông báo, audit log |
| Tiền VND, địa chỉ tỉnh/phường | Tồn kho ledger, nhiều chi nhánh |

## 2. Quyết định đã chốt

| Chủ đề | Quyết định |
| --- | --- |
| Thanh toán | Chỉ COD. `payment_status` UNPAID → PAID khi giao xong |
| Tiền / múi giờ | VND (số nguyên) / Asia/Ho_Chi_Minh; toàn UI MVP dùng formatter chung. EN mặc định/fallback, đổi locale không đổi currency/timezone/dữ liệu khách; PHP/₱ chỉ còn source legacy ẩn |
| Địa chỉ | `province_name` + `ward_name` + `address_line`, không có quận/huyện |
| Tồn kho | Theo từng variant (size): `product_variants.stock_quantity`, trừ khi đặt; early cancel mặc định hoàn, IN_TRANSIT cancel cần lý do/restock mặc định false |
| Phí giao | Bảng `delivery_zones` (khớp phường, không có thì mặc định tỉnh) + phụ phí theo phương thức (config) |
| Auth admin | Phase 4 local: một mật khẩu dài ngẫu nhiên trong secret, SHA-256/timingSafeEqual + JWT HS256 cookie HttpOnly/SameSite=Strict 12h; requireAdmin/requireSameOrigin; không bcrypt/argon2 hoặc bảng mới |
| Auth khách | Bảng `users` dựng sẵn, chưa dùng. Better Auth/Auth khác làm sau |
| Backend | Cùng source, mỗi môi trường có một Worker phục vụ static assets và `/api/*` cùng origin; prod/staging tách Worker/D1/secrets |
| Ảnh | Signed direct Cloudinary upload đã code/staging deploy; production config và provider acceptance còn chờ, lưu image.url |
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

**Schema đã thống nhất ở Phase 1:** dùng nguyên DDL v2 cho 10 bảng, có `delivery_zones`, idempotency và các ràng buộc; `custom_requests` deferred. [`migrations/0001_mvp.sql`](../../migrations/0001_mvp.sql) là nguồn DDL duy nhất; hai file `MVP_SCHEMA.sql` cũ chỉ dẫn về migration. [Đối chiếu v1/v2 và lý do](../DATABASE_DESIGN.md). Seed và migration đã áp D1 local; `npm run db:verify` pass 13/13 nhóm trên binding D1 local, dùng database cô lập cho ca ghi/xóa thử. Verifier Python tham chiếu cũ đã được thay bằng script Node này, không còn suite tự áp deferred/0002. [Output nghiệm thu](PHASE_1_DATABASE.md#bằng-chứng-lệnh--14102026). Đây là phạm vi Phase 1 local lịch sử; Phase 6 sau đó đã áp0001 trên hai D1 remote.

**Lịch 2 ngày:** Ngày 1 = Phase 0 → 3 (+ bắt đầu 4). Ngày 2 = Phase 4 → 6.

**Phase 2 local đã nghiệm thu:** khung Hono/Zod, catalog 4 danh mục/8 sản phẩm, DTO an toàn, phí giao và quote lấy giá DB. Các ca HIDDEN/giới hạn/lỗi kiểm trên SQLite bộ nhớ và binding workerd D1 `persist: false`; smoke chỉ đọc DB local đã seed. [Checklist/output](PHASE_2_API_CATALOG.md#bằng-chứng-lệnh--14102026). Không đổi DDL, dependency, frontend, D1 remote hoặc triển khai đặt đơn/admin.

**Phase 3 local đã nghiệm thu:** 5/5 tiêu chí; API COD/lookup và service transitionOrder, trừ tồn/CHECK rollback, UUID idempotency/replay và hoàn tồn một lần. Test D1 thật cô lập kiểm race mua món cuối, cùng key và hủy đồng thời. `npm test` 92/92, smoke 10/10 ca order + 16 nhóm catalog + đối chiếu tồn = 27/27. Giỏ 15 dòng success 35 statements, CHECK/unique diagnostic 36; retry tính nguyên failed batch và dừng trước khi vượt 40. Tại mốc Phase 3 mới có verifier/mock; code hiện có widget3 form, hai Site keys riêng; staging đã deploy nhưng cả hai thiếu TURNSTILE_SECRET. [Output](PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026). DDL/dependency/frontend/remote giữ nguyên trong lượt Phase 3.

**Phase 4 DONE local (9/9 tiêu chí):** secret/JWT cookie và middleware quyền/Origin, summary/orders/products/variants/delivery-zones; status tái sử dụng transitionOrder, stock_delta nguyên tử, product batch, phí giao có hiệu lực ở quote mới. **Tại mốc backend Phase 4:** 125/125 tests, 40/40 smoke dev/preview (12/12 nhóm admin), typecheck/architecture/build/UI preview pass; auth native workerd đã kiểm local. Mốc đó chưa nối UI admin; Phase 5 phía dưới đã hoàn tất phần này. Không thêm dependency/bảng/DDL hoặc thay đổi remote; chưa đo CPU cloud. Smoke admin dùng secret demo riêng và D1 cô lập. [Checklist/output lịch sử](PHASE_4_ADMIN.md). **[NGƯỜI]** quản lý secret thật trong `.dev.vars` và production Phase 6; agent chỉ dùng credentials tổng hợp để test.

**Phase 5 DONE local (6/6 tiêu chí):** đã thực hiện 5.0 → 5.16, không thay phần catalog/cart/storage/quote đã có. UI COD/lookup, cookie auth và admin đơn/sản phẩm/tồn/phí/dashboard đã nối thật. Intent UUID giữ key khi retry cùng nội dung, chặn bấm đúp; lost response sau commit không tạo đơn trùng. Ghi tồn chưa rõ kết quả khóa Save đến GET Recheck, tránh cộng/trừ delta lần nữa. **Tại mốc Phase 5: 136/136 tests, architecture 207 files, 40/40 smoke, UI preview 17 routes/0 exceptions và Phase 5 10/10 kịch bản + 2/2 nhóm mở rộng PASS.** [Kết quả 10 kịch bản](PHASE_5_FRONTEND.md#kết-quả-10-kịch-bản--15102026) · [audit/backup](FE_AUDIT.md). UI test dùng Edge/CDP, D1 workerd cô lập và credentials tổng hợp; snapshot SQL readonly xác nhận D1 persisted không đổi. Bridge Node dùng shim timingSafeEqual; local evidence không thay native/remote acceptance.

**Phase 6 hiện 5/7 tiêu chí:** owner đã deploy/đặt secrets; API Production 7/7 + browser public EN/VI/VND/cart reload PASS, 10/10 kết quả MVP (phân biệt API với checkout/admin UI). Đã dọn 3 SMOKE orders, orders/items/history = 0; variant 1 tồn 20/cả 24 variant khớp baseline/FK sạch. Còn dữ liệu/khu vực/policy thật và owner xác nhận đã nắm cách xem quota; không suy ra DONE từ smoke. [Bằng chứng/đầu vào](PHASE_6_DEPLOY.md) · [OPERATIONS](../OPERATIONS.md). Các output Phase 2/preview/3/4/5 là bằng chứng từng mốc, không phải nghiệm thu deploy.

**Chỉnh giao diện trước khi kết Phase 4:** Zalo giữ icon tự vẽ góc phải; animate chiều rộng viền xanh khi hover/focus/click (400ms, reduced motion 200ms); footer tên/địa chỉ/link bản đồ chuyển sang JSON EN/VI. Đây là chỉnh storefront, không nối các UI Phase 5 còn thiếu. [Cấu hình](../../PROJECT_GUIDE.md) · [nghiệm thu](PHASE_4_ADMIN.md).

**Phase 0–5 làm local, không cần tài khoản Cloudflare.** Phase 6 dùng tài khoản/D1 đã được chủ dự án tạo; đăng ký/login/create lại chỉ khi còn thiếu.

**Phạm vi đã nghiệm thu:** không cắt tra đơn, quản lý phí giao hoặc form tạo sản phẩm; các mục này đã có ở Phase 5. Turnstile thật và vận hành remote vẫn thuộc Phase 6. Tính tiền server, tồn nguyên tử và idempotency luôn là yêu cầu bắt buộc.

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
7. Phường có phí riêng → phí đúng; phường chưa có dòng riêng → mặc định tỉnh; không có cả ward và mặc định tỉnh active → NO_DELIVERY_ZONE rõ ràng.
8. Tra đơn bằng mã + SĐT đúng thấy đơn; SĐT sai báo không tìm thấy.
9. Admin đăng nhập, đổi trạng thái đúng thứ tự; giao xong → `PAID`; hủy → tồn hoàn đúng một lần.
10. Không còn ký hiệu ₱ hay dữ liệu fixture ở các luồng trên.

M1–M9 (15/10/2026) đã sửa local, chưa deploy: mọi đơn hôm nay chuẩn bị ≥120 phút; low-stock chỉ hàng đang bán; CSP/static headers; browser locale và metadata/robots/sitemap/OG; log D1 theo allowlist, observability 10%; summary 30 ngày, tra đơn mặc định90/tối đa366 ngày với index sẵn có; URL ảnh HTTPS Cloudinary/Unsplash. Public Turnstile key owner đã cấu hình .env.production; secret/hostname/deploy còn chờ owner. Không thêm dependency/DDL, Phase 6 giữ 5/7. 166/166 tests, smoke 40/40 và preview CSP/SDK test-key PASS; [chi tiết](../HARDENING.md).

Bổ sung owner-requested16/10: ảnh danh mục dùng migration0002_category_images.sql sau base0001, đã áp local/staging; không phải deferred/0002_custom_requests.sql.4 URL image_url được UPDATE riêng, không full seed.172 tests/215 files/smoke40 hiện tại;Phase6 vẫn5/7,production chưa migrate. [Runbook](../CATEGORY_IMAGES.md).
