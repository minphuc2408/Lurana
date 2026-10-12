# Lunara Flower Shop — project instructions

## Context and communication

- Communicate with the owner in Vietnamese. Existing product copy is English; keep that convention unless the task requests localization.
- This is Lunara, a flower shop storefront and admin UI. The GitHub repository is named `Lurana`; preserve existing UI branding as `Lunara`.
- Read the relevant section of `PROJECT_GUIDE.md` for project context. Current code is authoritative when the guide and implementation diverge; update the guide when an architectural or product decision changes.
- For UI, component, storefront, checkout, admin, or flower shop planning work, use the repo skill at `.agents/skills/lunara-flower-shop/SKILL.md`. Read it directly if the current session has not discovered newly added skills yet.
- Implement authorized local work without asking again about established conventions. State reasonable assumptions; ask only for missing decisions that materially affect the result. Report changes, verification, and actual limitations concisely.

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool**: use `codegraph_explore` with this repository's absolute `projectPath`. Name a file or symbol in the query. Treat returned source as already read.
- **Local CLI fallback**: `npm run graph:explore -- "Shop toggleAdd Cart"`. For exact source when explore omits the requested file, use `node scripts/codegraph.mjs node --file src/app/pages/Shop.tsx --offset 1 --limit 100`.
- Check `npm run graph:status -- --json` when the index may be stale, then `npm run graph:sync`. Untracked files blocked by the Git allowlist are not indexed: review them and add their exact paths to `.gitignore` before syncing.
- CSS, Markdown, JSON, and other files absent from the graph may be inspected with ordinary file tools. If no index exists, `npm run assistant:setup` initializes this project; do not index unrelated repositories.

The wrapper uses the pinned project dependency, fixes the working directory to the root, disables telemetry, and disables fallback downloads. The generated `.codegraph/` database stays local.
<!-- CODEGRAPH_END -->

## Architecture and behavior

- React 18 + TypeScript/TSX, React Router 7, Vite 6, Tailwind CSS 4. Keep the pinned versions and npm lockfile consistent; do not migrate frameworks or add a second UI stack for routine changes.
- Routing lives in `src/app/routes.ts`. `Layout` wraps customer pages; `AdminLayout` wraps admin pages and performs its current UI role checks. `AuthProvider` wraps `RouterProvider` in `App.tsx`.
- This is a frontend demo: login accounts are fixtures; registration, checkout confirmation, requests, stock edits, and settings are not backed by a server. Do not describe these as real payment, account creation, email delivery, or durable storage.
- `AdminRoute` exists but is not wired into the router. Client-side role checks and `sessionStorage` do not provide production authorization.
- Keep short-lived UI state local. Shared catalog/cart behavior requires one shared source of truth; do not create another independent product list or another fake cart. No cart context or product service exists yet.
- Preserve existing PHP/₱ demo pricing and Asia/Manila settings unless requested otherwise. Currency conversion, real delivery cutoffs, and business policy require explicit product decisions.

## Design and reuse

- Use the existing cream/rose floral direction: rose `#C17B8A`, cream `#FDF6F0`, ink `#3D2228`, body text `#6B4C55`, blush `#F9EDE9`, border `#F0DDD5`.
- New UI uses `src/styles/brand.css` tokens or its `lunara-*` Tailwind utilities; headings/logo use `font-display` (Cormorant Garamond), body/forms use `font-body` (Jost). Keep global shadcn tokens separate until a requested migration is scoped.
- The original rose with white text fails normal-text contrast. For new white-text CTAs, use `lunara-rose-strong` (`#9D586B`); preserve focus visibility and test actual foreground/background pairs. Do not use pale muted/status colors for essential small text.
- Check `src/app/components/ui/` before creating a primitive. It already contains 46 UI modules plus `cn` and `useIsMobile`. Customize existing primitives for Lunara, rather than accepting their default dark button styling.
- Pages mostly use native HTML and inline styles today. Do not refactor all pages merely to make one change. Extract shared product cards, status badges, headers, or money formatting when the requested behavior actually needs reuse; these domain components do not exist yet.
- Keep rounded cards, pill CTAs, restrained shadows, flower photography, and Lucide icons. Preserve responsive navigation, usable forms, loading/error/empty/success states, accessible labels, and keyboard access for changed flows.

## Tooling, security, and delivery

- Use `npm ci` for reproducible installs. `.npmrc` uses the official HTTPS registry and `ignore-scripts=true`; keep it. Run authorized build/dev commands explicitly. Never resolve install issues by globally enabling dependency scripts.
- Dev and preview bind to `127.0.0.1`; preserve this unless external access is explicitly requested. Preserve the Vite React/Tailwind plugins, `@` alias, and `figma:asset/` resolver.
- Never put real secrets, payment credentials, customer data, or real passwords in source, `VITE_*` variables, screenshots, or docs. Only reviewed instruction files inside `.agents/` may enter Git; local `.codex/config.toml` and `.codegraph/` remain ignored.
- `.gitignore` is a default-deny allowlist. For a new shared file, add its exact path and any required parent-directory exceptions after reviewing its contents. Never use `git add -f` to bypass the policy.
- CodeGraph is a local navigation aid, not a security scanner. It must not index dependency/build/audit/secret folders; exclusions are in root `codegraph.json`.
- Use official OpenAI Docs MCP for Codex/OpenAI questions when available; otherwise read official OpenAI documentation. Do not inject unrelated OpenAI integration into this storefront.
- For runtime/style/build changes, run `npm run build` and verify the affected page or flow. For dependency changes, also run `npm audit`. There is currently no lint, typecheck, or test script; do not claim those passed or treat Vite build as a full typecheck.
- Test behavior that can regress; documentation-only changes need link/path review, not a new test framework. Sync CodeGraph after code changes.
- Before commit/push, review `git status`, file inclusion, and `git diff --check`. Commit/push/deploy only when included in the current request or standing authorization; a previous one-time push is not blanket authorization for future pushes.
