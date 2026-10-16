# Rà soát tài liệu — 16/10/2026

Phạm vi: **26 file Markdown đã có trong Git**, 4 file SQL tham chiếu/seed/deferred trong docs và canonical migration. Báo cáo này là file Markdown thứ27. Không chỉnh runtime, dependency, DDL, seed hoặc dữ liệu; không commit/push/deploy trong lượt rà soát tài liệu.

## Nguồn đối chiếu

- Source đã push tới `1fecd26`; package.json/lockfile, wrangler.jsonc, env public, script staging và CodeGraph current source.
- Bằng chứng local gần nhất cùng phiên: typecheck, architecture 215, tests 166, build/dry-run2 env PASS; bundle keys/targets/canonical/noindex riêng; smoke 40/40 PASS, persisted D1 giữ nguyên. Lượt tài liệu không chạy lại suite runtime.
- Cloudflare chỉ đọc16/10: production version `26d0811c-f2f0-4f7f-a0fa-7cb175035d06` (15/10 19:52VN); staging `e984d962-076f-492c-b2e3-c5cac5f52ec3` (16/10 13:31VN). Đối chiếu version/binding metadata, tên secrets và HTTP public. Không đọc secret values hoặc đơn khách.
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) được đối chiếu lại 16/10; account quotas/billing thực tế chưa được owner xác nhận.

## Các nội dung đã sửa

| Tài liệu | Kết quả |
| --- | --- |
| [README](../README.md) | Branding Lunara Shop, current checks, hai lệnh deploy và secret setup một lần; bỏ các đoạn trạng thái staging cũ lặp lại |
| [PROJECT_GUIDE](../PROJECT_GUIDE.md) | Đúng ownership features/admin/inventory/orders, MetadataLayout/Turnstile, admin query windows, chẩn đoán log; trạng thái current tách lịch sử |
| [AGENTS](../AGENTS.md), [repo skill](../.agents/skills/lunara-flower-shop/SKILL.md) | Đồng bộ trạng thái cloud, keys/build modes, local evidence và nguyên tắc không suy diễn counts/provider acceptance |
| [PROJECT_STATUS](PROJECT_STATUS.md) | Nguồn trạng thái chuẩn; bảng riêng local/production/staging, version/timestamp/counts public và những việc chưa nghiệm thu |
| [TECH_STACK](TECH_STACK.md) | Phiên bản pinned, kiến trúc/ownership/stock_delta/storage, two-environment build và limits đã đối chiếu |
| [STAGING](STAGING.md) | Sửa chưa deploy/chưa migrate/secrets; đúng `.env.staging`/Vite mode, target guard, không full seed lại, chưa có delivery zones |
| [CLOUDINARY](CLOUDINARY.md) | Staging có config/secrets names/deployment; production thiếu; không khẳng định preset/credentials hoặc upload thật đã pass |
| [BOT_PROTECTION](BOT_PROTECTION.md), [HARDENING](HARDENING.md) | Hai widget/key riêng, TURNSTILE_SECRET còn thiếu, staging có hardening/bindings/TTL/handler; Cron execution và cloud CPU/quota chưa xác minh |
| [OPERATIONS](OPERATIONS.md) | Target prod/staging, đúng cặp key/secret, restock có điều kiện, quota date và giới hạn snapshot |
| [DATABASE_DESIGN](DATABASE_DESIGN.md) | D1 remote đã migrate cả hai; counts cũ ghi lịch sử, upload signed đã có; không đổi canonical DDL |
| [FRONTEND_ENTITIES](FRONTEND_ENTITIES.md) | Admin date filters/period_days, tự sinh slug/upload flow, API 1–5 variants so với UI 3 size |
| [Design guidelines](../guidelines/Guidelines.md) | Bỏ trạng thái Phase 5 PARTIAL/UI chưa nối; đồng bộ branding và trạng thái MVP |
| [Pipeline index](pipeline/README.md) | Current phase/source/cloud, conditional restock, signed upload và từng môi trường |
| [Phase 0](pipeline/PHASE_0_PREPARE.md), [Phase 1](pipeline/PHASE_1_DATABASE.md) | Mẫu config/checklist local được đánh dấu lịch sử, không hướng dẫn ghi đè cấu hình mới hoặc migrate lại |
| [Phase 2](pipeline/PHASE_2_API_CATALOG.md) | Phase 6/current UI state, ≤3 catalog queries và safe diagnostics; giữ nguyên output nghiệm thu cũ |
| [Phase 3](pipeline/PHASE_3_CHECKOUT_ORDERS.md), [Phase 4](pipeline/PHASE_4_ADMIN.md) | Context current, token3 form/login8192, conditional restock; giữ nguyên output cũ theo ngày |
| [Phase 5](pipeline/PHASE_5_FRONTEND.md), [FE_AUDIT](pipeline/FE_AUDIT.md) | Phase 5 DONE/Phase 6 IN PROGRESS; preview chưa checkout được ghi rõ là thời điểm trước tích hợp |
| [Phase 6](pipeline/PHASE_6_DEPLOY.md) | Local checks mới, snapshot cloud mới và việc còn thiếu; acceptance vẫn5/7, không biến public read thành nghiệm thu write |
| [API_CONTRACT](pipeline/API_CONTRACT.md) | Contract code hiện tại, lỗi rate-limit/cap PENDING, conditional Turnstile, state/TTL và upload deployment scope |
| [BACKLOG](pipeline/BACKLOG.md) | Bỏ đề xuất unsigned upload/public_id persistence; phân biệt metadata đã có với product page/prerender còn thiếu |
| [ATTRIBUTIONS](../ATTRIBUTIONS.md) | Đã rà: attribution shadcn/ui/Unsplash vẫn phù hợp; giữ nguyên |
| [SQL pointer1](sql/MVP_SCHEMA.sql), [SQL pointer2](pipeline/MVP_SCHEMA.sql) | Đúng link canonical, không chứa bản DDL thứ hai; giữ nguyên |
| [Seed](sql/MVP_SEED_DEV.sql), [Deferred](sql/deferred/0002_custom_requests.sql) | Seed mẫu/deferred vẫn đúng phạm vi; giữ nguyên, không áp remote |
| [Canonical migration](../migrations/0001_mvp.sql) | SHA256 vẫn `9ee756750b15b50f902e17db41a3ef75a2c0e5437c9eb56b7a9253a83c9aa4e0`; không chỉnh |

## Ranh giới bằng chứng

Staging hiện4 categories/1 active product/0delivery provinces; production public4 categories/8 active products/2delivery provinces. Các số đơn/tồn/FK15/10 không được coi là hiện tại. Staging có config/secret names không chứng minh upload thật; scheduled handler/TTL không chứng minh Cron tick đã thực chạy; cả hai Worker chưa có TURNSTILE_SECRET.

Giữ output lịch sử 125/136/143/148/150/158/160 tests trong phase đúng mốc, không sửa log để giả chạy lại. Browser Phase 5 và hardening targeted khác phạm vi responsive toàn bộ; lỗi Shop320px chưa được xác nhận đã hết. Phase 6 vẫn còn dữ liệu mở bán thật và xác nhận operator quota.

Các audit/evidence riêng tư đang ignored như SECURITY_REVIEW.md, .security-review/, backup, browser profiles và secrets không phải tài liệu current dùng chung; không đưa vào Git hoặc sửa bằng chứng để thay lịch sử. [PROJECT_STATUS](PROJECT_STATUS.md) là nơi tra current state.

## Thay đổi tiếp theo sau lượt rà docs-only

Người dùng tiếp tục yêu cầu sửa fail-closed Turnstile và kiểm headers live. Source hiện có patch local chưa commit/deploy; current170tests/215files/40smoke, native verifier3cấu hình và22phản hồi header live đã kiểm. Các mô tả docs-only/166tests bên trên là phạm vi mốc rà tài liệu trước patch runtime này. [Bằng chứng mới](HARDENING.md#turnstile-fail-closed-và-header-live-16102026).

## Kiểm tra tài liệu tại mốc docs-only trước patch runtime

Rà đường dẫn/link Markdown nội bộ, anchor, schema pointers, inclusion allowlist và `git diff --check`. Chỉ tài liệu và exception chính xác cho báo cáo này trong .gitignore được thay đổi; không cần chạy lại tests/build cho thay đổi chỉ gồm tài liệu.

Kết quả rà soát: **PASS 27 Markdown, 369 link/anchor nội bộ, 2 SQL schema pointers, SHA256 canonical migration không đổi và git diff --check**. Output fenced Phase0–5 giữ nguyên; không có file runtime hoặc dữ liệu bị thay đổi. Link ngoài được giữ nguồn; chưa kiểm HTTP toàn bộ URL ngoài.
