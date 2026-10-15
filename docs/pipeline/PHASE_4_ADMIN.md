# Phase 4 — Admin: đăng nhập và API quản trị

**Mục tiêu:** chủ shop đăng nhập an toàn, quản lý đơn, sản phẩm/tồn kho, phí giao. Hợp đồng: [API_CONTRACT.md](API_CONTRACT.md) (mục Admin).

**Trạng thái:** DONE local · **9/9 tiêu chí**, 14/10/2026. Auth cookie và toàn bộ API admin đã triển khai/nghiệm thu local. Cập nhật ngữ cảnh **15/10/2026:** frontend Phase 5 cũng DONE local (6/6 tiêu chí), AuthProvider/AdminRoute và login/orders/products/stock/delivery/summary UI đã nối cookie/API; customer fixture/sessionStorage source vẫn giữ ẩn. [Hiện trạng](../PROJECT_STATUS.md) · [Nghiệm thu frontend Phase 5](PHASE_5_FRONTEND.md). Secret trong `.dev.vars.example` chỉ là demo; không phải credentials production. [Output backend lịch sử](#bằng-chứng-lệnh--14102026).

**Đầu vào đã có:** `worker/services/orders.ts` export createOrder, lookupOrder và `transitionOrder(db, orderNumber, newStatus, actorLabel = 'ADMIN', note?)`; máy trạng thái/PAID/hoàn tồn một lần và các race đã kiểm D1 local cô lập. Phase 4 bổ sung authorization và routes quản trị gọi lại service này, không viết lại thuật toán hoàn tồn. lookupOrder public không trả admin_note/stock_released; admin detail cần projection có quyền riêng. [Nghiệm thu Phase 3](PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026).

## Thiết kế đăng nhập — đã triển khai local

Sizing pipeline giả định **10 ms CPU/request**; kiểm tra gói/runtime thực tế trước deploy. Thiết kế MVP tránh bcrypt/argon2, dùng **một tài khoản admin** với **mật khẩu dài ngẫu nhiên** trong secret. Workers hỗ trợ [WebCrypto timingSafeEqual](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#timingsafeequal); JWT dùng [Hono helper](https://hono.dev/docs/helpers/jwt) đã có trong dependency:

1. `POST /api/admin/login { password }`: băm SHA-256 cả mật khẩu gửi lên và `env.ADMIN_PASSWORD` bằng `crypto.subtle.digest`, so sánh bằng `crypto.subtle.timingSafeEqual`.
2. Đúng → ký JWT HS256 bằng `env.JWT_SECRET` (`hono/jwt`): `{ role: 'ADMIN', iat, exp: +12h }`; đặt cookie `lunara_admin`: `HttpOnly`, `SameSite=Strict`, `Path=/`, `Max-Age=43200`, `Secure` khi chạy HTTPS (local HTTP `127.0.0.1` bỏ Secure).
3. Middleware `requireAdmin` xác thực HS256/role ADMIN/iat/exp bắt buộc, hạn tối đa 12h cho `/api/admin` và mọi `/api/admin/*` (trừ đúng `POST /login`), kể cả unknown route/logout. Sai/hết hạn → `UNAUTHORIZED`; kiểm auth trước body/Origin.
4. Request ghi, kể cả login/logout: bắt buộc `Content-Type: application/json` (chấp nhận charset) và header `Origin` bằng scheme/host/port của URL request. Thiếu/sai Origin → 403; thiếu/sai Content-Type → 400. Login body tối đa 4096 byte/password 1–1024 ký tự để giới hạn phần xử lý.
5. Không dùng bảng `users` ở MVP; lịch sử trạng thái ghi `actor_label = 'ADMIN'`, `actor_id = NULL`.

**Yêu cầu bảo mật:**
- [NGƯỜI] Mật khẩu admin ≥ 24 ký tự ngẫu nhiên (`openssl rand -base64 24`); `JWT_SECRET` ≥ 32 ký tự ngẫu nhiên, khác mật khẩu. Vì không có băm chậm nên **độ dài/ngẫu nhiên của mật khẩu là lớp bảo vệ chính**.
- Hạn chế dò mật khẩu: bật Turnstile cho form đăng nhập nếu kịp; nếu có tên miền riêng, cân nhắc rule rate limit ở dashboard Cloudflare (kiểm tra gói Free có hỗ trợ không). Không thêm bảng đếm lần đăng nhập (tốn lượt ghi D1).
- Không log mật khẩu, JWT hay cookie.
- `ADMIN_PASSWORD`/`JWT_SECRET` thiếu/trống, ngắn hơn 24/32 ký tự sau trim hoặc trùng nhau → từ chối đăng nhập 401 `INVALID_CREDENTIALS`, không set cookie; đã test fail closed. Giá trị demo local không dùng production. Password gửi vào được giữ nguyên, không trim.
- JSON response không chứa credentials/JWT/secret; JWT được trả đúng qua header HttpOnly `Set-Cookie`. Log unexpected error chỉ có request_id/error_name, không dump error message/stack/cookie/request. Cookie logout được xóa; JWT đã sao chép vẫn có hiệu lực tới exp vì MVP stateless, xoay JWT_SECRET vô hiệu hóa toàn bộ session.
- Khi cần nhiều tài khoản/vai trò: chuyển sang Better Auth hoặc dịch vụ ngoài (xem [BACKLOG](BACKLOG.md)); đừng tự viết băm mật khẩu trong Worker Free.

## Việc cần làm

| # | Ai | Việc |
| --- | --- | --- |
| 4.1 | AGENT | `worker/lib/auth.ts`: `checkPassword`, `signSession`, `requireAdmin`, `requireSameOrigin` |
| 4.2 | AGENT | `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me` |
| 4.3 | AGENT | `GET /api/admin/summary` (đếm đơn theo trạng thái, đơn hôm nay giờ VN, số variant tồn ≤ ngưỡng) — 3 truy vấn gộp tối đa |
| 4.4 | AGENT | `GET /api/admin/orders` (lọc `status`, `date` = `delivery_date`, `q`; `limit ≤ 50`, `offset`; sắp `placed_at DESC`; trả `total`). Escape `%` và `_` trong `q` khi dùng `LIKE ... ESCAPE '\'`. `GET /api/admin/orders/:orderNumber` (kèm items, timeline, `admin_note`) |
| 4.5 | AGENT | `PATCH .../status` gọi `transitionOrder` (Phase 3); map lỗi sang `INVALID_TRANSITION`. `PATCH .../note` |
| 4.6 | AGENT | `GET /api/admin/products` (mọi trạng thái, có `stock_quantity` chính xác, 3 truy vấn) |
| 4.7 | AGENT | `POST /api/admin/products`: một `batch` gồm insert sản phẩm, N variant, 1 ảnh; trùng slug/SKU → `CONFLICT` |
| 4.8 | AGENT | `PATCH /api/admin/products/:id` (tên, mô tả, badge, featured, `status`, ảnh chính bằng URL). Đổi `ARCHIVED` ghi `archived_at` |
| 4.9 | AGENT | `PATCH /api/admin/variants/:id`: `stock_delta` → `UPDATE ... SET stock_quantity = stock_quantity + ?` (nếu vi phạm `CHECK` → `VALIDATION_ERROR` "Tồn kho không thể âm"); `stock_quantity` tuyệt đối chỉ khi không có `stock_delta`; `compare_at_price ≥ price` phải được kiểm tra trước khi ghi |
| 4.10 | AGENT | `GET/POST /api/admin/delivery-zones`, `PUT /api/admin/delivery-zones/:id` (xóa = `is_active = 0`) |
| 4.11 | AGENT | Mở rộng `scripts/smoke.mjs`: đăng nhập sai/đúng, truy cập không cookie bị 401, ghi với `Origin` lạ bị 403, đi hết máy trạng thái, hủy hoàn tồn đúng một lần (qua API), `stock_delta` âm quá tồn bị từ chối |
| 4.12 | NGƯỜI | **Còn lại trước sử dụng thật:** tự đặt `ADMIN_PASSWORD` ≥24 ký tự ngẫu nhiên, `JWT_SECRET` ≥32 ký tự ngẫu nhiên và khác nhau trong `.dev.vars`; không gửi secret qua chat/Git. Kiểm thử local dùng demo/synthetic riêng, không cần secret thật. Production secrets thuộc Phase 6 |

Các việc AGENT 4.1–4.11 đã xong. Không tạo bảng/migration, không đổi package.json/package-lock hay thêm dependency. `users` không được dùng cho auth này. Schema admin dùng root `shared/admin-order-schemas.ts` và `shared/admin-catalog-schemas.ts`; services/routes tương ứng nằm trong `worker/services`/`worker/routes`. Order status gọi lại service Phase 3. Product create dùng N+2 statements/batch (1–5 variants →3–7); admin products/summary mỗi request 3 statements.

## Tiêu chí nghiệm thu

- [x] Không cookie → mọi `/api/admin/*` (trừ login) trả 401; sai mật khẩu → `INVALID_CREDENTIALS`; đúng → cookie `HttpOnly; SameSite=Strict`.
- [x] Request ghi từ `Origin` khác → 403; thiếu `Content-Type: application/json` → bị từ chối.
- [x] Máy trạng thái đúng bảng chuyển; chuyển sai (ví dụ `PENDING → DELIVERED`) → `INVALID_TRANSITION`.
- [x] `DELIVERED` → `payment_status = PAID`, có `paid_at`, `delivered_at`. Hủy đơn → tồn hoàn đúng; hủy lần hai không cộng thêm.
- [x] `stock_delta` làm tồn âm bị từ chối; `stock_delta` hợp lệ cộng/trừ đúng và không ghi đè thay đổi do đơn mới.
- [x] Tạo sản phẩm mới xuất hiện ở `GET /api/products`; ẩn/archived thì biến mất khỏi public nhưng còn ở admin.
- [x] Sửa phí giao ở admin có hiệu lực ngay ở báo giá.
- [x] Không JSON response nào chứa mật khẩu, JWT hay secret; JWT nằm trong header HttpOnly Set-Cookie theo thiết kế.
- [x] `npm run typecheck`, `npm test`, `npm run smoke` pass.

## Bằng chứng lệnh — 14/10/2026

Output dưới đây giữ nguyên tại mốc backend Phase 4 (**125 tests, architecture 178 source files**). Source hiện tại đã có frontend Phase 5: **136 tests, architecture 207 source files, smoke 40/40, UI 17 routes/0 exceptions và Phase 5 10/10+2/2 kịch bản**; xem [bằng chứng hiện tại](PHASE_5_FRONTEND.md). Các kết quả local không thay nghiệm thu remote Phase 6.

```text
npm run typecheck
tsc --noEmit && tsc -p tsconfig.worker.json --noEmit
PASS

npm run check:architecture
Architecture checked: 178 source files; layer boundaries, public APIs, presentation state, and Tailwind page styles.

npm test
tests 125
pass 125
fail 0
cancelled 0
skipped 0

npm run build
Worker: 165 modules transformed; dist/lunara/index.js
Client: 1816 modules transformed; dist/client/
PASS (existing Zod Rollup annotation warnings only)

npm run smoke
Catalog smoke: 16/16 PASS, 0 FAIL.
Phase 3 mandatory smoke: 10/10 PASS, 0 FAIL.
Phase 4 mandatory smoke: 12/12 PASS, 0 FAIL.
Local smoke: 40/40 PASS, 0 FAIL; persisted seed untouched.

npm run check:ui -- http://127.0.0.1:4173
routes=15; D1 catalog/quote; products=8; variants=24
locales=en,vi; widths=320,390,768,1024; hiddenRoutes=8; exceptions=0

npm run graph:sync
Synced 12 changed files; Added: 12
Final sync: Modified: 2; index up to date; files=234
```

40 nhóm smoke =16 catalog +10 order +1 đối chiếu tồn Phase 3 +12 admin +1 đối chiếu snapshot persisted categories/products/delivery. Smoke đã pass trên dev5173 và build preview4173; catalog read-only trên URL đó, mọi ca ghi chạy HTTP loopback riêng với D1 thật `persist:false`, `remoteBindings:false`, Wrangler chỉ nạp `.dev.vars.example` và app dùng credentials synthetic riêng. Không reset hoặc ghi seed persisted, không truy cập remote. Tests Node dùng shim timingSafeEqual để mô phỏng extension WebCrypto Workers; D1 tests vẫn chạy binding workerd thật.

| Bằng chứng Phase 4 | Output/đối chiếu |
| --- | --- |
| Auth/CSRF/JWT | wrong/missing/blank/short/equal →401; no cookie tất cả routes →401; expired/tampered/wrong role →401; Origin sai →403; thiếu/sai JSON Content-Type →400; HttpOnly/Strict/Path/12h; HTTPS Secure |
| Native Worker auth riêng | Vite workerd local5173: no-cookie/wrong401; login/me/logout200; cross-origin403; SHA-256/timingSafeEqual native; D1 writes=0; `.dev.vars` chỉ đối chiếu demo `.example`, không in giá trị/cookie/JWT |
| Summary/list/detail/note | summary đúng3 aggregate statements; ngày VN gồm ca UTC hôm qua; list filtered total/pagination; `%`, `_`, `\` literal; ghi chú nội bộ không có trong public lookup |
| Status/hủy | PENDING→DELIVERED409; full flow PAID/có paid_at+delivered_at UTC; actor_label ADMIN/actor_id NULL; hủy sequential/race200,409, hoàn đúng1 lần/history1 dòng |
| Tồn kho | delta +5/−2 đúng; delta ưu tiên absolute; âm400 và không đổi tồn; đồng thời delta +4/order −1 →+3; compare_at_price<price400; D1 thật: 20 − 2 + 5 =23 |
| Products | list3 statements; create1 variant batch3; SKU/slug409 rollback; ACTIVE xuất hiện public; HIDDEN/ARCHIVED chỉ còn admin; archive timestamp/primary image atomic; malformed URL400 |
| Delivery | phí admin20000→23000, quote kế tiếp23000; default zone mới17000; deactivate→NO_DELIVERY_ZONE, dòng vẫn còn |
| Privacy/integrity | mọi JSON smoke quét credentials/JWT/secret/SQL/stack; FK sạch; không tồn âm; persisted snapshot không đổi |

Đây là nghiệm thu backend local tại mốc Phase 4; admin UI đã được nối và nghiệm thu riêng trong Phase 5 sau đó. Rate limit/Turnstile login và deployment/nghiệm thu remote vẫn chưa có. Sau nghiệm thu backend, chủ dự án đã cấu hình secret local riêng và đã kiểm điều kiện độ dài/khác nhau; tests/UI acceptance dùng synthetic secrets cô lập, không lưu secret thật trong tài liệu/Git. Không băm mật khẩu nặng; 10ms CPU là giới hạn thiết kế, chưa đo/khẳng định CPU trên cloud. Secrets thật do [NGƯỜI] quản lý; tests/smoke vẫn dùng demo riêng và không cần secret thật để đạt các tiêu chí local trên.

### Chỉnh storefront trước khi kết Phase 4 — 15/10/2026

- Zalo giữ icon tự vẽ sau rollback logo widget theo yêu cầu; cố định bên phải, mặc định icon. Viền xanh summary animate trực tiếp chiều rộng 60→208px khi hover/focus/bấm mở trong 400ms (reduced motion 200ms), thu ngược khi đóng/rời nút; bỏ fade/slide riêng của chữ. Popup chờ link thật căn phải, giữ keyboard/touch access.
- Footer tên cửa hàng/địa chỉ/map URL chuyển sang `src/shared/i18n/locales/en/common.json` và `vi/common.json`; config TS chỉ giữ ID/thứ tự/khóa locale. English fallback và ba URL bản đồ giữ theo yêu cầu chủ dự án.
- Typecheck/architecture/build pass; suite 125/125 pass. UI preview mặc định 15 routes/0 exceptions; kiểm riêng icon tự vẽ, hover/focus/click/góc phải/popup và nội dung JSON EN/VI ở 320/390/768/1024/1440px; đo chiều rộng viền giữa transition mở và đóng, xác nhận 60→giữa→208px, cả normal và reduced motion (20 trường hợp). Evidence screenshot giữ local trong `.security-review/`.
- Hai test D1 Phase 2/3 được giới hạn `envFiles` về `.dev.vars.example` để không nạp ambient secret thật; focused 10/10 pass, giữ `persist:false`/`remoteBindings:false`.
- Trạng thái tại mốc chỉnh storefront này: Phase 4 DONE local 9/9; Phase 5 khi đó PARTIAL, Phase 6 PLANNED. Hiện tại Phase 5 đã DONE local theo nghiệm thu riêng ở [PHASE_5_FRONTEND.md](PHASE_5_FRONTEND.md); Phase 6 vẫn PLANNED.
