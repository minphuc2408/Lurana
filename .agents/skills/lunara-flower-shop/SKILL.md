---
name: lunara-flower-shop
description: "Implement, review, debug, or plan Lunarra storefront, catalog, cart and checkout, order lookup, inventory, admin features, and routine shared UI changes in this repository. Use when working on flower-shop features and repository-specific workflows; for explicitly requested external design adaptation use lunarra-design."
---

# Lunara Flower Shop

This skill covers **repository-specific feature work and pitfalls**. `AGENTS.md` owns global working rules, security, documentation, authorizations, and required checks. This skill does not authorize unrelated roadmap work, commits, pushes, deployments, remote migrations, or provider changes.

## 1. Start with authoritative context

- Resolve repository paths relative to this skill's folder (`../../..`), not the current shell directory.
- Check the working tree/diff and relevant unfinished items in `docs/PROJECT_STATUS.md` when resuming work; read only pertinent sections of `docs/ARCHITECTURE.md`.
- Source code is authoritative if it disagrees with dated docs. Update the **owning** document only when a material behavior/design decision changes.
- If `.codegraph/` exists, use the CodeGraph workflow in `AGENTS.md` first to discover code and dependents; use the documented fallback when source is missing. If absent, skip it. Do not initialize an index without authorization.
- Locate actual module ownership before deciding whether to change UI, business logic, Worker/API, persistence, or data schema.

## 2. Architecture and reuse

- Route tree: `src/app/router.tsx`; layout orchestration: `src/app/layouts/`; page composition: `src/pages/`.
- Domain state/services: `src/features/`, shared primitives/utilities: `src/shared/`, shared schemas: root `shared/`.
- Reuse feature `index.ts` APIs, hooks, services, `shared/ui` wrappers, `cn`, Lucide icons and existing design tokens before adding a second abstraction.
- Do not duplicate catalog, cart, order, auth, stock, or checkout ownership. No production data fallback to demo fixtures.
- Respect existing feature flags: deferred customer auth/profile/custom-order and admin customers/settings/notifications are not automatically enabled. Check `src/shared/config/features.ts` and real API readiness before changing visibility.
- Keep changes within the requested flow; preserve EN/VI copy, responsive behavior, accessible labels, image alt text, keyboard interaction and reduced-motion handling when relevant.

## 3. Theme and UI guardrails

- The current registry has **21 light themes**: Original + 15 legacy palettes + 5 creative themes. Read `src/shared/theme/themes.ts`, `theme-store.ts` and `src/styles/brand.css` before visual changes.
- The `rose`, `cream`, `blush` token names are **legacy aliases**; do not infer pink/cream values from their names. The Original palette currently uses green/white-mist. Use semantic tokens; palette HEX definitions belong in the registry/theming layer, not individual components.
- Keep theme IDs, `lunara.theme.v1`, boot/persistence, and the appearance of the 16 pre-creative themes unless a change is requested. Status colors preserve meaning; the admin has separate surfaces/sidebar plus some theme-aware active tokens.
- Visual target for creative themes: neutral/off-white surfaces dominate; **primary** identifies CTA and key active actions; **secondary/tertiary** are localized, restrained brand accents. They should not automatically paint whole utility bars, Hero labels, Journey sections or all Footer headings.
- **Important current-state distinction:** the repository's creative-theme mapping and `scripts/check-ui-creative-colors.mjs` may still enforce the older large-accent treatment. Inspect actual implementation. When *authorized* to refactor it, update the corresponding semantic mapping and visual assertions; do not claim the target is already implemented or delete regression tests merely to pass.
- Keep `hover`, `selected/checked`, `active route` and `focus-visible` visually distinct. Never globally suppress keyboard outlines. Target WCAG AA: 4.5:1 for regular text, 3:1 for large text, and >=3:1 for applicable focus/control indicators. Verify contrast for real rendered state/background combinations.
- For explicitly requested transfer from Stitch, Google Studio, external screenshots or a design sample, use `.agents/skills/lunarra-design/SKILL.md` **when explicitly invoked**, honoring its invocation policy. Routine UI fixes can stay in this skill.
- Design references: `docs/ui-ux/LUNARA_MULTI_THEME_SPEC.md`, `docs/ui-ux/Extend_Lunara_Multi_Theme.md` and relevant `docs/ui-ux/DESIGN_SYSTEM.md` sections. Dated docs may describe the old visual mapping; code and current owner request decide actual scope.

## 4. Commerce and admin invariants

- `CatalogProvider` owns product API data. `CartProvider` owns cart lines using **canonical variant IDs**; persisted `lunara.cart.v1` contains only permitted variant IDs and quantities. Server quote recalculates amounts/fees.
- Checkout and order-lookup PII plus checkout intent stay **in memory**. Each submitted payload gets a UUID v4 idempotency key; retries of that same payload reuse it. Confirmation/status must use a verified API response, never a synthetic order.
- Inventory writes use `stock_delta`. Following ambiguous NETWORK/TIMEOUT/BAD_RESPONSE/INTERNAL failure, clear entered delta, lock the row and require a successful GET recheck before another write; do not auto-retry a possibly applied change.
- Preserve server-side admin authorization, HttpOnly cookie/session protections, same-origin write constraints, parameterized D1 SQL, Turnstile fail-closed and redacted diagnostics as defined in `AGENTS.md` and related contracts. Client role checks or fixtures do not replace server security.
- Prices remain numeric until formatting. EN/VI affects labels and formatting, never IDs, stock quantities, **VND** or server timezone (`Asia/Ho_Chi_Minh`). Do not translate customer-entered content.
- Contracts and behavior: `docs/reference/API_CONTRACT.md`, `docs/operations/BOT_PROTECTION.md`, `docs/reference/DATABASE_DESIGN.md`, and the owning feature document. Keep secrets and customer data out of source, screenshots, logs and browser storage.
- Never infer remote acceptance, payment, email, fulfillment or deployment success from a local preview or mocked smoke test.

## 5. Verification and handoff

- Run the required checks for the changed category as specified in `AGENTS.md`; do not equate `npm run build` with typecheck or API/cloud acceptance.
- For UI changes verify affected routes and interactive states, EN/VI, responsive desktop/mobile and keyboard accessibility. For shared theme changes, run regression across **all 21 themes** and visually inspect **all five creative themes** at 390px and 1440px (with representative routes/states).
- Use `scripts/check-ui-themes.mjs` and `scripts/check-ui-creative-colors.mjs` where supported. Replace **obsolete assertions** only when implementing a consciously revised visual contract; retain tests protecting the 16 earlier themes.
- For Worker writes use isolated/local smoke and follow remote-operation guards in `docs/operations/OPERATIONS.md` and `docs/operations/STAGING.md`.
- Follow the documentation ownership and Git allowlist policies in `AGENTS.md`. Report in Vietnamese: outcome, touched files, actual checks (PASS/FAIL/not run), relevant remaining limitations, and documentation updated/not needed.
