# Lunara Flower Shop

Storefront + admin từ thiết kế Flower Shop Figma. **UI: Lunara · GitHub: Lurana**.

| Keyword | Hiện trạng |
| --- | --- |
| Frontend | React/React DOM 18.3.1 · React Router 7.18.4 · Vite 6.4.4 · Tailwind 4.1.12 |
| Worker | Hono + `@cloudflare/vite-plugin`; Phase 0–3 DONE local, Zod validation và middleware/lỗi chuẩn |
| API | Health/catalog/delivery/quote; `POST /api/orders`, `POST /api/orders/lookup`; service `transitionOrder` nội bộ; API lạ → JSON 404 |
| D1 | Binding `DB` local; canonical 10 bảng, migration/seed/verifier Phase 1; remote chưa truy cập |
| Commerce | Home/Shop/Cart/Delivery/Quote dùng D1 local; UI gửi/tra đơn chưa nối; auth/admin và các tính năng ngoài preview tạm ẩn |
| Locale | EN mặc định + VI; catalog/giỏ hiển thị VND; Worker dùng Asia/Ho_Chi_Minh |
| Build | Frontend `dist/client/` · Worker + Wrangler config `dist/lunara/` |
| Môi trường đã dùng | Node 24.11.1 · npm 11.6.3; Wrangler hiện yêu cầu Node ≥22 |

Health xác nhận Worker phản hồi, chưa kiểm tra DB. Giỏ bắt đầu rỗng, lưu variant ID/số lượng trong localStorage; giá và phí được báo lại từ server. Backend đặt đơn COD/tra đơn đã có ở Phase 3; UI checkout/tra đơn còn thuộc Phase 5. API auth/admin thuộc Phase 4, chưa triển khai.

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

Database chỉ local: migration tạo 10 bảng; seed gồm 4 categories, 8 products, 24 variants, 8 images, 4 zones. `db:verify` kiểm 13 nhóm trên D1 local, dùng database tạm cho phép thử ghi/xóa; xem [output nghiệm thu Phase 1](docs/pipeline/PHASE_1_DATABASE.md). Khu vực/phí, ảnh và giá/tồn seed là dữ liệu mẫu. Không áp `docs/sql/deferred/0002_custom_requests.sql`.

Phase 2 đã có `GET /api/categories`, `GET /api/products`, `GET /api/products/:slug`, `GET /api/delivery/options` và `POST /api/checkout/quote`. Catalog dùng tối đa 3 truy vấn D1; quote đọc giá/tồn từ DB, gộp variant trùng và trả `issues`, luôn chỉ đọc. `shared/` ở root giữ constants/schema Zod dùng chung; frontend catalog/cart/quote đã nối sớm một phần Phase 5. [Contract](docs/pipeline/API_CONTRACT.md) và [nghiệm thu/output Phase 2](docs/pipeline/PHASE_2_API_CATALOG.md).

Phase 3 hoàn tất local: API đặt đơn COD có UUID v4 `Idempotency-Key`, server tự tính tiền/phí, batch trừ tồn không điều kiện + CHECK rollback; API tra đơn bằng mã + SĐT; `transitionOrder` hoàn tồn một lần và đánh dấu COD PAID khi DELIVERED. Giỏ 15 dòng: success 35 statements, nhánh CHECK/unique diagnostic 36, retry được chặn trong giới hạn 40. `npm test` 92/92; smoke 10/10 ca Phase 3, tổng 27/27; typecheck/architecture/build pass. [Checklist/output Phase 3](docs/pipeline/PHASE_3_CHECKOUT_ORDERS.md#bằng-chứng-lệnh--14102026).

`npm run smoke` giữ 16 nhóm catalog trên URL local được truyền vào, rồi tự tạo HTTP loopback + D1 `persist:false`, `remoteBindings:false` để chạy 10 ca order và đối chiếu tồn/query budget. Không sửa seed persisted hoặc remote. Turnstile verifier đã có khi Worker cấu hình secret, test provider bằng mock; site key/widget/secret thật chưa cấu hình.

`worker/config.ts` chứa giả định để chủ shop chỉnh: phụ phí Standard/Express/Same-day lần lượt 0/30.000/50.000 VND, giờ chốt 16:00, chuẩn bị tối thiểu 120 phút, khung giờ 08:00–20:00. Giới hạn API: 15 dòng giỏ, 20 sản phẩm mỗi variant sau gộp, ngày giao tối đa +30 ngày theo Asia/Ho_Chi_Minh.

Bạn có thể test ngay `/shop`/`cart` trên 5173 với D1 local: chọn size, thêm giỏ, reload và đổi khu vực/phương thức để nhận báo giá VND. UI hiện chỉ báo giá; nút gửi đơn và trang tra đơn chưa nối API Phase 3. [Backup và kiểm kê frontend](docs/pipeline/FE_AUDIT.md) · [test API catalog/quote](docs/pipeline/PHASE_2_API_CATALOG.md#test-thủ-công-trên-host-5173). Bước kế tiếp là [Phase 4 auth/admin](docs/pipeline/PHASE_4_ADMIN.md), sau đó hoàn thiện Phase 5 rồi Phase 6.

## Tài liệu và phần tiếp theo

| Cần tra | File |
| --- | --- |
| Hiện trạng, khoảng trống, đầu vào cần chủ dự án bổ sung | [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) |
| Routes, component, data ownership, giới hạn demo | [PROJECT_GUIDE.md](PROJECT_GUIDE.md) |
| Instructions + skill | [AGENTS.md](AGENTS.md) · [lunara-flower-shop](.agents/skills/lunara-flower-shop/SKILL.md) |
| Phase 0 → deploy | [Pipeline](docs/pipeline/README.md) · [Phase 0](docs/pipeline/PHASE_0_PREPARE.md) |
| Stack + entity map | [TECH_STACK.md](docs/TECH_STACK.md) · [FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md) |
| Database + đối chiếu v1/v2 | [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) · [Canonical SQL](migrations/0001_mvp.sql) |

MVP: **Hono/Workers · D1/SQLite · Cloudinary (chưa tích hợp) · Zod · COD khách vãng lai**. Phase 1 chốt nguyên DDL v2 thành `migrations/0001_mvp.sql`, nguồn schema duy nhất; hai file SQL schema cũ chỉ chứa chú thích dẫn về migration. `delivery_zones` trong MVP; `custom_requests` deferred. **Phase 0–3 DONE local; Phase 4 PLANNED; Phase 5 PARTIAL; Phase 6 PLANNED.** VND và cart localStorage đã có ở preview; phần còn lại là auth/admin và UI gửi/tra đơn. Wishlist server ngoài MVP; Phase 0–3 chưa truy cập D1 remote hoặc deploy.

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
