# Lunara Flower Shop — project instructions

## Context and communication

- Communicate with the owner in Vietnamese. UI supports English and Vietnamese through react-i18next; keep locale JSON in shared/i18n and preserve English fallback. Product names use name_en/name_vi, with name_vn accepted as a Vietnamese alias. Do not translate customer-entered data or change currency/timezone with locale.
- This is Lunara, a flower shop storefront and admin UI. The GitHub repository is named `Lurana`; preserve existing UI branding as `Lunara`.
- Read the relevant section of `PROJECT_GUIDE.md` for project context. Current code is authoritative when the guide and implementation diverge; update the guide when an architectural or product decision changes.
- Before declaring a phase complete, synchronize progress across README.md, PROJECT_GUIDE.md, docs/PROJECT_STATUS.md, docs/TECH_STACK.md, affected pipeline/contract/entity/database docs, and these instructions/the repo skill when their context changes. Separate backend completion from frontend integration, local evidence from remote acceptance, and historical outputs from current counts. Do not mark later phases complete from partial preview work.
- For UI, component, storefront, checkout, admin, or flower shop planning work, use the repo skill at `.agents/skills/lunara-flower-shop/SKILL.md`. Read it directly if the current session has not discovered newly added skills yet.
- Implement authorized local work without asking again about established conventions. State reasonable assumptions; ask only for missing decisions that materially affect the result. Report changes, verification, and actual limitations concisely.

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool**: use `codegraph_explore` with this repository's absolute `projectPath`. Name a file or symbol in the query. Treat returned source as already read.
- **Local CLI fallback**: `npm run graph:explore -- "useProducts useCartState useCheckout"`. For exact source when explore omits the requested file, use `node scripts/codegraph.mjs node --file src/features/shop/hooks/useProducts.ts --offset 1 --limit 100`.
- Check `npm run graph:status -- --json` when the index may be stale, then `npm run graph:sync`. Untracked files blocked by the Git allowlist are not indexed: review them and add their exact paths to `.gitignore` before syncing.
- CSS, Markdown, JSON, and other files absent from the graph may be inspected with ordinary file tools. If no index exists, `npm run assistant:setup` initializes this project; do not index unrelated repositories.

The wrapper uses the pinned project dependency, fixes the working directory to the root, disables telemetry, and disables fallback downloads. The generated `.codegraph/` database stays local.
<!-- CODEGRAPH_END -->

## Architecture and behavior

- React 18 + TypeScript/TSX, React Router 7, Vite 6, Tailwind CSS 4. Keep the pinned versions and npm lockfile consistent; do not migrate frameworks or add a second UI stack for routine changes.
- Routing lives in `src/app/router.tsx`. The current D1 preview exposes Home/Shop/Cart under MainLayout; features outside this preview render FeatureUnavailable and their menu links are hidden. Order APIs exist, but checkout/lookup UI is not connected yet. Legacy admin/auth/customer feature source is retained. AppProviders composes I18nextProvider, CatalogProvider and CartProvider; demo AuthProvider is inactive in this preview.
- Pages in `src/pages/` only compose feature views/hooks. State, business actions, services, types and fixtures live in `src/features/`; primitives and generic helpers live in `src/shared/`. Dependencies flow `pages → features → shared`; cross-feature imports use the feature's `index.ts`. App layouts keep their menu/routing state in app hooks.
- The Hono Worker in `worker/` is integrated with Vite by `@cloudflare/vite-plugin`. Phase 2 provides local D1 categories/products/product detail, delivery options and read-only checkout quotes, plus health and JSON API 404. Health checks Worker liveness only, not database readiness. Root `shared/` holds API constants/Zod schemas; delivery fees, slots and cutoff in `worker/config.ts` are initial assumptions for the owner to adjust.
- Phase 3 is complete locally: `POST /api/orders` uses UUID v4 Idempotency-Key, server pricing and one D1 batch with unconditional stock subtraction and CHECK rollback; `POST /api/orders/lookup` matches order number and sender/recipient phone. `worker/services/orders.ts` provides internal `transitionOrder` with stock release exactly once and DELIVERED → PAID; no transition/admin/customer-cancel route exists. Fifteen lines use 35 statements, CHECK/unique diagnostic paths 36; retries must remain within 40 including every submitted batch statement. Turnstile verification is conditional on TURNSTILE_SECRET and tested with mocks; production setup is pending. Quote stays read-only and does not reserve stock.
- `wrangler.jsonc` binds D1 as `DB`; `remoteBindings: false` in Vite keeps dev/preview local. Build outputs are `dist/client/` and `dist/lunara/`. Worker types use `tsconfig.worker.json`, `worker/env.ts`, and generated `worker-configuration.d.ts`; run `npm run cf:typegen` after binding changes. Phase 0–3 are DONE local; Phase 4 auth/admin is PLANNED; Phase 5 is PARTIAL (catalog/cart/delivery/quote adapters, VND and localStorage done; checkout/lookup/admin UI pending); Phase 6 deployment is PLANNED. Do not expose legacy fixtures or simulated success as real operations. `migrations/0001_mvp.sql` is the single canonical DDL for 10 MVP tables; the two schema files in docs are pointers. `custom_requests` stays deferred; do not apply deferred/0002 as part of MVP. Follow `docs/pipeline/README.md` for scope and `docs/DATABASE_DESIGN.md` for the v1/v2 decision.
- `AdminRoute` exists but is not wired into the router. Client-side role checks and `sessionStorage` do not provide production authorization.
- Keep short-lived UI state local. CatalogProvider loads categories/products once per reload/retry through Shop service; no fixture fallback. CartProvider owns cart lines across routes, keyed by variant ID. localStorage `lunara.cart.v1` stores only variantId/quantity, validated with Zod; quote owns current price/fee/totals. Backups in temp stay local/ignored. See docs/pipeline/FE_AUDIT.md.
- The owner authorized D1 preview pricing in VND. Preserve EN default/fallback and customer-entered data; locale changes formatting only, not currency/timezone. Legacy PHP/settings source stays hidden. Delivery fees/cutoff/slots remain initial assumptions requiring owner decisions before opening sales.

## Design and reuse

- Use the existing cream/rose floral direction: rose `#C17B8A`, cream `#FDF6F0`, ink `#3D2228`, body text `#6B4C55`, blush `#F9EDE9`, border `#F0DDD5`.
- New UI uses `src/styles/brand.css` tokens or its `lunara-*` Tailwind utilities. Use `font-display` for headings/logo and `font-body` for body/forms: EN uses Cormorant Garamond/Jost; VI uses Lora/Be Vietnam Pro through `html[lang='vi']`. Keep global shadcn tokens separate until a requested migration is scoped.
- The original rose with white text fails normal-text contrast. For new white-text CTAs, use `lunara-rose-strong` (`#9D586B`); preserve focus visibility and test actual foreground/background pairs. Do not use pale muted/status colors for essential small text.
- Check `src/shared/ui/` before creating a primitive. Retained primitives are `button`, `input` and `dialog`; unused modules were removed. `cn` lives in `shared/lib/utils.ts`, `useIsMobile` in `shared/hooks/use-mobile.ts`. Customize retained primitives for Lunara.
- Use Tailwind directly in presentation JSX; CSS holds global theme, brand tokens and focus styling. Reuse `features/shop` ProductCard/ProductGrid/FilterBar, feature sections, `ImageWithFallback`, and `shared/lib/format.ts`. Keep changes within the requested feature; do not reorganize unrelated modules for routine edits.
- Keep rounded cards, pill CTAs, restrained shadows, flower photography, and Lucide icons. Preserve responsive navigation, usable forms, loading/error/empty/success states, accessible labels, and keyboard access for changed flows.

## Tooling, security, and delivery

- Use `npm ci` for reproducible installs. `.npmrc` uses the official HTTPS registry and `ignore-scripts=true`; keep it. Run authorized build/dev commands explicitly. Never resolve install issues by globally enabling dependency scripts.
- Dev and preview bind to `127.0.0.1`; preserve this unless external access is explicitly requested. Preserve the Vite React/Tailwind plugins, `@` alias, and `figma:asset/` resolver.
- Keep `.dev.vars` and `.wrangler/` local; only demo placeholders belong in `.dev.vars.example`. Run `npm run smoke` against the running local server after Worker changes: catalog checks use that server, while Phase 3 writes run through a separate loopback HTTP server with isolated workerd D1 `persist:false`, `remoteBindings:false`. Preserve the local-only guard and persisted seed. D1 commands must use `--local` unless remote work is explicitly requested; reset removes local D1 state. Phase 1 seed is sample data. Run `npm run db:verify` after database changes; its destructive cases use isolated local D1 and leave the seeded database untouched. After the Phase 1 schema agreement, only change DDL for a demonstrated test failure and document the reason; use a new migration after remote application.
- Never put real secrets, payment credentials, customer data, or real passwords in source, `VITE_*` variables, screenshots, or docs. Only reviewed instruction files inside `.agents/` may enter Git; local `.codex/config.toml` and `.codegraph/` remain ignored.
- `.gitignore` is a default-deny allowlist. For a new shared file, add its exact path and any required parent-directory exceptions after reviewing its contents. Never use `git add -f` to bypass the policy.
- CodeGraph is a local navigation aid, not a security scanner. It must not index dependency/build/audit/secret folders; exclusions are in root `codegraph.json`.
- Use official OpenAI Docs MCP for Codex/OpenAI questions when available; otherwise read official OpenAI documentation. Do not inject unrelated OpenAI integration into this storefront.
- For runtime/style/build changes, run `npm run typecheck`, `npm run check:architecture`, `npm test`, `npm run build`, and verify affected flows. For dependency changes, also run `npm audit`. `npm run check:ui -- http://127.0.0.1:4173` checks a running preview with Edge headless on Windows. Vite build does not replace typecheck; no ESLint script is configured.
- Test behavior that can regress; documentation-only changes need link/path review, not a new test framework. Sync CodeGraph after code changes.
- Before commit/push, review `git status`, file inclusion, and `git diff --check`. Commit/push/deploy only when included in the current request or standing authorization; a previous one-time push is not blanket authorization for future pushes.
