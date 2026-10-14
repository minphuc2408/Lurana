# Lunara Flower Shop

Storefront + admin từ thiết kế Flower Shop Figma. **UI: Lunara · GitHub: Lurana**.

| Keyword | Hiện trạng |
| --- | --- |
| Frontend | React/React DOM 18.3.1 · React Router 7.18.4 · Vite 6.4.4 · Tailwind 4.1.12 |
| Worker | Hono + `@cloudflare/vite-plugin`; Phase 2 local, Zod validation và middleware/lỗi chuẩn |
| API | Health; categories/products/product detail; delivery options; checkout quote lấy giá D1 và tính tiền VND; API lạ → JSON 404 |
| D1 | Binding `DB` local; canonical 10 bảng, migration/seed/verifier Phase 1; remote chưa truy cập |
| Commerce | Auth/cart/checkout/stock/orders/requests: frontend demo, chưa nối API |
| Locale | EN mặc định + VI; giữ PHP/₱ và Asia/Manila khi đổi ngôn ngữ |
| Build | Frontend `dist/client/` · Worker + Wrangler config `dist/lunara/` |
| Môi trường đã dùng | Node 24.11.1 · npm 11.6.3; Wrangler hiện yêu cầu Node ≥22 |

Health xác nhận Worker phản hồi, chưa kiểm tra DB. Reload khôi phục cart fixture; role/session trong trình duyệt chưa phải authorization production.

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

Phase 2 đã có `GET /api/categories`, `GET /api/products`, `GET /api/products/:slug`, `GET /api/delivery/options` và `POST /api/checkout/quote`. Catalog dùng tối đa 3 truy vấn D1; quote đọc giá/tồn từ DB, gộp variant trùng và trả `issues`, chưa ghi đơn hoặc trừ tồn. `shared/` ở root giữ constants/schema Zod dùng chung; frontend nối API ở Phase 5. [Contract](docs/pipeline/API_CONTRACT.md) và [nghiệm thu/output Phase 2](docs/pipeline/PHASE_2_API_CATALOG.md).

`worker/config.ts` chứa giả định để chủ shop chỉnh: phụ phí Standard/Express/Same-day lần lượt 0/30.000/50.000 VND, giờ chốt 16:00, chuẩn bị tối thiểu 120 phút, khung giờ 08:00–20:00. Giới hạn API: 15 dòng giỏ, 20 sản phẩm mỗi variant sau gộp, ngày giao tối đa +30 ngày theo Asia/Ho_Chi_Minh.

Bạn có thể [test thủ công API trên 5173](docs/pipeline/PHASE_2_API_CATALOG.md#test-thủ-công-trên-host-5173). Giao diện `/shop`/`cart` vẫn dùng fixture; các chức năng Phase 2 mới kiểm bằng `/api/*` hoặc `npm run smoke`. [Điều kiện Phase 3](docs/pipeline/PHASE_3_CHECKOUT_ORDERS.md#điều-kiện-bắt-đầu--đã-kiểm-14102026) đã đủ để bắt đầu triển khai local.

## Tài liệu và phần tiếp theo

| Cần tra | File |
| --- | --- |
| Hiện trạng, khoảng trống, đầu vào cần chủ dự án bổ sung | [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) |
| Routes, component, data ownership, giới hạn demo | [PROJECT_GUIDE.md](PROJECT_GUIDE.md) |
| Instructions + skill | [AGENTS.md](AGENTS.md) · [lunara-flower-shop](.agents/skills/lunara-flower-shop/SKILL.md) |
| Phase 0 → deploy | [Pipeline](docs/pipeline/README.md) · [Phase 0](docs/pipeline/PHASE_0_PREPARE.md) |
| Stack + entity map | [TECH_STACK.md](docs/TECH_STACK.md) · [FRONTEND_ENTITIES.md](docs/FRONTEND_ENTITIES.md) |
| Database + đối chiếu v1/v2 | [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) · [Canonical SQL](migrations/0001_mvp.sql) |

MVP: **Hono/Workers · D1/SQLite · Cloudinary · Zod · COD khách vãng lai**. Phase 1 chốt nguyên DDL v2 thành `migrations/0001_mvp.sql`, nguồn schema duy nhất; hai file SQL schema cũ chỉ chứa chú thích dẫn về migration. `delivery_zones` trong MVP; `custom_requests` deferred. Phase 2 hoàn tất catalog/phí giao/quote local; đặt đơn/tồn/idempotency, admin auth, cart localStorage và chuyển frontend sang VND/múi giờ Việt Nam thuộc các phase tiếp theo; wishlist server ngoài MVP. Phase 0–2 chưa truy cập D1 remote hoặc deploy.

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
