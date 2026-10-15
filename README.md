# Lunara Flower Shop

Storefront + admin từ thiết kế Flower Shop Figma. **UI: Lunara · GitHub: Lurana**.

| Keyword | Hiện trạng |
| --- | --- |
| Frontend | React/React DOM 18.3.1 · React Router 7.18.4 · Vite 6.4.4 · Tailwind 4.1.12 |
| Worker | Hono + `@cloudflare/vite-plugin`; Phase 0–3 DONE local, Phase 4 backend đã DONE local (9/9 tiêu chí) |
| API | Health/catalog/delivery/quote/orders/lookup; auth và quản trị `/api/admin/*` dùng JWT cookie; API lạ → JSON 404, admin thiếu cookie → 401 |
| D1 | Binding `DB`; canonical 10 bảng; migration/seed remote đã áp 15/10/2026, backup thử mở lại được; chưa có dữ liệu thật |
| Commerce | Home/Shop/Cart/Delivery/Quote, checkout COD, tra đơn và admin đã nối API local; Phase 5 DONE local (6/6 tiêu chí) |
| Locale | EN mặc định + VI; catalog/giỏ hiển thị VND; Worker dùng Asia/Ho_Chi_Minh |
| Build | Frontend `dist/client/` · Worker + Wrangler config `dist/lunara/` |
| Môi trường đã dùng | Node 24.11.1 · npm 11.6.3; Wrangler hiện yêu cầu Node ≥22 |

Health xác nhận Worker phản hồi, chưa kiểm tra DB. Giỏ bắt đầu rỗng, lưu variant ID/số lượng trong localStorage; giá và phí được báo lại từ server. Checkout COD trong `/cart` có form, duyệt đơn, gửi/retry và xác nhận mã đơn từ API Phase 3; `/orders/track` tra đơn bằng mã + SĐT. Admin đăng nhập tại `/admin/login`, quản lý đơn, sản phẩm/tồn, phí giao và dashboard tóm tắt qua API Phase 4. Phase 5 đã nghiệm thu đầy đủ local; deployment remote thuộc Phase 6.

Footer: cấu hình tên cửa hàng, địa chỉ và link bản đồ trong `src/shared/i18n/locales/en/common.json` và `vi/common.json` (khóa `Main Store`/`HCMC Store`/`Hanoi Branch`, hậu tố `address`/`map URL`). Zalo ở góc phải dùng icon tự vẽ; viền xanh mở rộng 60→208px khi hover/focus/bấm mở bằng transition width 400ms (reduced motion 200ms), chữ không có hiệu ứng riêng. Link Zalo thật vẫn chờ chủ shop cung cấp.

## Chạy local

```bash
npm ci
# Lần đầu: tạo .dev.vars từ .dev.vars.example, chỉ dùng giá trị demo.
npm run dev
# Terminal khác trên PowerShell:
curl.exe http://127.0.0.1:5173/api/health
npm run smoke
```

Dev: http://127.0.0.1:5173. Preview: http://127.0.0.1:4173. Port bận: dùng URL Vite in ra. `.npmrc`: npm registry HTTPS chính thức, `ignore-scripts=true`.

PowerShell: dùng `npm.cmd`/`npx.cmd` khi truyền đối số qua `--`; dùng `curl.exe` cho curl thật.

## Kiểm tra và build

```bash
npm run cf:typegen
npm run db:migrate:local
npm run db:seed:local
npm run db:verify
npm run typecheck
npm run check:architecture
npm test
npm run build
npm audit
npm run preview
# Terminal khác khi preview đang chạy:
npm run check:ui -- http://127.0.0.1:4173
```

`cf:typegen`: bindings, `--include-runtime=false`; runtime types từ `@cloudflare/workers-types`. `check:ui`: Edge headless trên Windows, chặn ảnh/font ngoài ở chế độ mặc định; evidence local ở `.security-review/`. Chạy audit khi đổi dependency. Chưa có ESLint.

Database local và remote đã áp migration tạo 10 bảng; seed gồm 4 categories, 8 products, 24 variants, 8 images, 4 zones. `db:verify` kiểm 13 nhóm trên D1 local, dùng database tạm cho phép thử ghi/xóa; xem [output nghiệm thu Phase 1](docs/pipeline/PHASE_1_DATABASE.md). Khu vực/phí, ảnh và giá/tồn seed là dữ liệu mẫu. Không áp `docs/sql/deferred/0002_custom_requests.sql`.

Phase 2 đã có `GET /api/categories`, `GET /api/products`, `GET /api/products/:slug`, `GET /api/delivery/options` và `POST /api/checkout/quote`. Catalog dùng tối đa 3 truy vấn D1; quote đọc giá/tồn từ DB, gộp variant trùng và trả `issues`, luôn chỉ đọc. `shared/` ở root giữ constants/schema Zod dùng chung; frontend catalog/cart/quote đã nối sớm một phần Phase 5. [Contract](docs/pipeline/API_CONTRACT.md) và [nghiệm thu/output Phase 2](docs/pipeline/PHASE_2_API_CATALOG.md).

Phase 3 hoàn tất local: API đặt đơn COD có UUID v4 `Idempotency-Key`, server tự tính tiền/phí, batch trừ tồn không điều kiện + CHECK rollback; API tra đơn bằng mã + SĐT; `transitionOrder` hoàn tồn một lần và đánh dấu COD PAID khi DELIVERED. Giỏ 15 dòng: success 35 statements, nhánh CHECK/unique diagnostic 36, retry được chặn trong giới hạn 40. Tại mốc Phase 3: `npm test` 92/92, smoke 10/10 ca order và tổng 27/27; typecheck/architecture/build pass. [Output lịch sử Phase 3](docs/pipeline/PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026).

Phase 4 DONE local (9/9 tiêu chí): đăng nhập bằng SHA-256 + `timingSafeEqual`, JWT HS256 trong cookie HttpOnly/SameSite=Strict 12 giờ, `requireAdmin`/`requireSameOrigin`, API summary/orders/products/variants/delivery-zones. Chuyển trạng thái gọi lại `transitionOrder`; chỉnh tồn ưu tiên `stock_delta` nguyên tử. Không thêm bảng hoặc dependency; không băm mật khẩu nặng trong Worker. **125/125 tests và 178 source files là mốc lịch sử Phase 4**; native workerd auth đã kiểm local, chưa đo CPU 10 ms trên cloud. [Checklist/output Phase 4](docs/pipeline/PHASE_4_ADMIN.md).

Phase 5 **DONE local (6/6 tiêu chí)**, cập nhật **15/10/2026**: frontend đã nối toàn bộ các API MVP; **136/136 tests**, typecheck, architecture **207 source files**, build và **40/40 smoke local** pass. UI kiểm **17 routes, 0 JS exceptions**; bộ nghiệm thu Phase 5 pass **10/10 kịch bản bắt buộc + 2/2 mở rộng**, snapshot D1 persisted giữ nguyên. [Bảng tiến độ, tiêu chí và bằng chứng Phase 5](docs/pipeline/PHASE_5_FRONTEND.md). Đây là nghiệm thu local, chưa deploy hoặc nghiệm thu remote.

`npm run smoke` giữ 16 nhóm catalog trên URL local được truyền vào, rồi tự tạo HTTP loopback + D1 `persist:false`, `remoteBindings:false` để chạy ca order/admin và đối chiếu tồn/query budget. Admin smoke dùng secret demo riêng trong bộ nhớ, không cần secret thật và không sửa seed persisted hoặc remote. Turnstile verifier đã có khi Worker cấu hình secret, test provider bằng mock; site key/widget/secret thật chưa cấu hình.

**Phase 6 hiện tại:** tests **143/143**, audit **0**, typecheck/architecture/build/dry-run PASS; verifier **13/13**, smoke local **40/40**, UI **17 routes/0 exceptions**, native auth fail-closed **9/9 cấu hình**. `node scripts/smoke.mjs --base-url https://TEN.SUBDOMAIN.workers.dev` mặc định chỉ đọc; ghi cần confirm origin/variant/exclusive window và mật khẩu qua prompt ẩn. Runner có 7 tests local với HTTP/D1 cô lập; chưa chạy trên URL deploy. Migration/seed và backup remote đã kiểm; chưa mở bán. Chủ dự án đã chọn tự deploy/đặt secrets rồi cung cấp URL; agent tiếp tục smoke và nghiệm thu sau bước đó. [Điều kiện tiếp tục Phase 6](docs/pipeline/PHASE_6_DEPLOY.md) · [Runbook](docs/OPERATIONS.md).

**[NGƯỜI]** Trước khi dùng admin với dữ liệu thật tại local, tự đặt `ADMIN_PASSWORD` ≥24 ký tự ngẫu nhiên và `JWT_SECRET` ≥32 ký tự ngẫu nhiên, khác mật khẩu, trong `.dev.vars`; không gửi giá trị qua chat hoặc ghi vào Git/`VITE_*`. Cấu hình secret production thuộc Phase 6. Secret thiếu/trống bị từ chối; demo chỉ phục vụ kiểm thử.

`worker/config.ts` chứa giả định để chủ shop chỉnh: phụ phí Standard/Express/Same-day lần lượt 0/30.000/50.000 VND, giờ chốt 16:00, chuẩn bị tối thiểu 120 phút, khung giờ 08:00–20:00. Giới hạn API: 15 dòng giỏ, 20 sản phẩm mỗi variant sau gộp, ngày giao tối đa +30 ngày theo Asia/Ho_Chi_Minh.

Bạn có thể test `/shop`/`cart` với D1 local: chọn size, thêm giỏ, reload, đổi khu vực/phương thức để nhận báo giá VND, điền form và duyệt đơn COD. Mỗi payload được gắn UUID v4; retry payload không đổi giữ nguyên key, xác nhận chỉ xuất hiện khi API trả mã đơn và tổng tiền thật. Form/đơn/SĐT/địa chỉ không lưu vào browser storage. Admin dùng cookie server, không dùng tài khoản fixture hoặc sessionStorage. Khi một lần chỉnh tồn mất phản hồi, UI xóa delta đã nhập, khóa dòng và yêu cầu tải lại tồn từ API trước lần chỉnh tiếp; không tự gửi lại delta chưa biết đã được áp dụng hay chưa. [Backup và kiểm kê frontend](docs/pipeline/FE_AUDIT.md) · [Nghiệm thu Phase 5](docs/pipeline/PHASE_5_FRONTEND.md).

## Tài liệu và phần tiếp theo

| Cần tra | File |
| --- | --- |
| Hiện trạng, khoảng trống, đầu vào cần chủ dự án bổ sung | [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) |
| Routes, component, data ownership, giới hạn demo | [PROJECT_GUIDE.md](PROJECT_GUIDE.md) |
| Instructions + skill | [AGENTS.md](AGENTS.md) · [lunara-flower-shop](.agents/skills/lunara-flower-shop/SKILL.md) |
| Phase 0 → deploy | [Pipeline](docs/pipeline/README.md) · [Phase 6](docs/pipeline/PHASE_6_DEPLOY.md) |
| Vận hành, backup/rollback, secrets và smoke/cleanup | [OPERATIONS.md](docs/OPERATIONS.md) |
| Stack + entity map | [TECH_STACK.md](docs/TECH_STACK.md) · [FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md) |
| Database + đối chiếu v1/v2 | [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) · [Canonical SQL](migrations/0001_mvp.sql) |

MVP: **Hono/Workers · D1/SQLite · Cloudinary (chưa tích hợp) · Zod · COD khách vãng lai**. Phase 1 chốt nguyên DDL v2 thành `migrations/0001_mvp.sql`, nguồn schema duy nhất; hai file SQL schema cũ chỉ chứa chú thích dẫn về migration. `delivery_zones` trong MVP; `custom_requests` deferred. **Phase 0–5 DONE local; Phase 6 IN PROGRESS.** Customer auth/profile/wishlist, custom request và admin customers/settings/notifications giữ source nhưng ẩn bằng cờ; `VITE_ENABLE_CUSTOMER_AUTH` mặc định false và API-ready gate vẫn false nên không bật lại fixture. Phase 6 đã migrate/seed D1 remote và thử backup; chưa deploy/nghiệm thu remote, đặt secrets production hoặc nhập dữ liệu thật. [Bằng chứng và điều kiện tiếp tục](docs/pipeline/PHASE_6_DEPLOY.md) · [Vận hành](docs/OPERATIONS.md).

## Codex và CodeGraph

```bash
npm run assistant:setup
npm run graph:status -- --json
npm run graph:explore -- "useProducts useCartState useCheckout"
```

Setup: CodeGraph 1.5.0 local → `.codegraph/` + `.codex/config.toml` cho CodeGraph/OpenAI Docs MCP. Mở phiên trusted mới để nạp cấu hình. Wrapper tắt telemetry/fallback download; không đổi global settings.

Git: allowlist exact paths sau review; source/docs/skill được chia sẻ. `.dev.vars`, `.wrangler/`, `.codex/`, `.codegraph/`, build/dependencies/evidence ở local. `.dev.vars.example` chỉ chứa placeholder demo. Commit/push/deploy cần yêu cầu hiện tại hoặc standing authorization.

## Attribution

Figma gốc: [Flower Shop Website Design](https://www.figma.com/design/0YRitOqUypqP0K0esw8sXL/Flower-Shop-Website-Design--Copy---Community-). Attribution shadcn/ui và Unsplash: [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
