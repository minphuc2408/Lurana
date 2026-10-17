---
name: lunara-flower-shop
description: Build, review, or plan Lunara Flower Shop storefront and admin features using this repository's existing components, floral design system, and demo behavior boundaries.
---

# Lunara Flower Shop

Use this skill for product UI, component reuse, shopping flows, admin features, and feature brainstorming in this repository. The repository's `AGENTS.md` contains shared working rules; do not turn this skill into permission to publish, change unrelated settings, or implement the entire roadmap.

## Find the relevant context

The maintained project reference is [PROJECT_GUIDE.md](../../../PROJECT_GUIDE.md) at the repository root. Read only the sections needed:

- **Hiện trạng và bản đồ dự án** and **Trang và luồng nghiệp vụ** for routing, data ownership, and current functionality.
- **Bộ nhận diện và token thiết kế** and **Component có sẵn** for visual work and reuse.
- **Tiêu chuẩn khi phát triển** for behavior, forms, responsive UI, security, and validation.
- **Brainstorm và thứ tự phát triển** for planning; those entries are proposals, not implemented features or automatically authorized work.

Resolve the guide relative to this skill folder, not to the shell's current subdirectory. If documentation is stale, inspect current code and update the relevant reference with the changed behavior.

Use CodeGraph first to locate code and its dependents when `.codegraph/` exists; if absent, skip it and do not initialize an index without owner request. Query the symbols that span the requested flow, for example `useProducts useCartState useCheckout` or `AuthProvider useAuthState AdminLayout`. If retrieval omits the target source, use the local `node --file` command documented in `AGENTS.md`.

## Implement visual and component work

- Match the existing soft floral layout: cream backgrounds, dusty rose accents, dark warm text, editorial serif headings, clean sans-serif forms, rounded cards, and pill CTAs.
- English typography: Fraunces 500/500 Italic headings/logo with automatic optical sizing, Inter body/UI and hero label; Vietnamese follows the read-only reference D:/Download/lunara: Lora Regular 400 headings/logo including italic, Be Vietnam Pro body/UI; html defaults to the locale body token and font-sans/font-serif aliases follow locale tokens so portals inherit correctly. Google Fonts stylesheet/preconnect lives in `index.html`.
- Read `src/styles/brand.css` and use its semantic tokens/utilities for new work. The legacy `theme.css` primary is a generic dark color; do not mistake it for the Lunara brand.
- Search the guide's component inventory before inventing primitives. Prefer retained `shared/ui` shadcn/Radix wrappers, `cn`, and Lucide icons, with brand-specific classes. ProductCard/ProductGrid/FilterBar, a shared CartProvider and the canonical Shop service already exist; a generic domain StatusBadge does not.
- Home/source reference and shared design rules live in PROJECT_GUIDE.md. Reuse existing hero/category assets and DB product content; do not copy reference fixtures or substitute generated order/customer data. Asset provenance is in ATTRIBUTIONS.md; feature-specific details belong in the relevant UI document.
- Default to local changes. Extract a domain component when more than one affected surface needs the same behavior; maintain one canonical data source when connecting Shop, Cart, Stock, or Dashboard.
- Use the stronger rose token for small white CTA text. Ensure readable labels, visible keyboard focus, accessible icon buttons, useful image alt text, and reduced-motion behavior if animations are added.

## Implement commerce and admin behavior

- Determine whether the request affects UI, business behavior or a backend before choosing storage. Use the current router, feature public APIs and shared schemas; retain deferred source without exposing fixtures. Do not infer implementation or cloud acceptance from a preview. Architecture/routes/components: [PROJECT_GUIDE](../../../PROJECT_GUIDE.md); current evidence and pending acceptance: [PROJECT_STATUS](../../../docs/PROJECT_STATUS.md).
- Follow AGENTS.md security invariants for admin cookies, same-origin writes, parameterized SQL and safe diagnostics. Turnstile/provider setup and expiry/stock-release behavior are in [BOT_PROTECTION](../../../docs/BOT_PROTECTION.md); HTTP payloads/errors are in [API_CONTRACT](../../../docs/pipeline/API_CONTRACT.md). Keep secrets and customer data out of source, browser storage, screenshots and logs.
- Follow the existing route boundaries in `app/router.tsx`: storefront and `/orders/track` use `MainLayout`; `/admin/login` uses `AuthLayout`; `AdminRoute` wraps `AdminLayout` for `/admin/dashboard`, `/admin/orders`, `/admin/stock`, `/admin/delivery-zones`. `/admin` redirects to dashboard and `/admin/products` to stock. AuthProvider uses `/api/admin/me/login/logout`, same-origin cookies and 401 state clearing; server middleware provides authorization. Do not create a duplicate route tree or reactivate sessionStorage fixture auth.
- Shop Add, Cart and navbar already share CartProvider. Use canonical variant IDs as cart line identity; do not create an independent cart. CatalogProvider owns the API snapshot; CartProvider persists only variant IDs and quantities in versioned localStorage, and quote refreshes price/fee after reload. Keep checkout/lookup PII and order intent in memory. Checkout uses UUID v4 per payload and preserves that key on retry of the same payload; confirmation must use the API response, never a simulated order.
- Inventory edits use stock_delta. If a write has an ambiguous NETWORK/TIMEOUT/BAD_RESPONSE/INTERNAL failure, clear its entered delta, lock the row and require a successful GET recheck before another edit; never automatically repeat a delta that may already have been applied. Explain this recheck to the operator in EN/VI.
- Use shared/i18n hooks and EN/VI locale JSON for interface copy; preserve English fallback and customer-entered content. Product names use name_en/name_vi; name_vn is a Vietnamese compatibility alias. Locale must not change IDs, quantities or VND currency; preserve English default/fallback and customer-entered data. Entity and database references are in docs/FRONTEND_ENTITIES.md and docs/DATABASE_DESIGN.md.
- Keep amounts numeric and format at display boundaries. The owner requested D1/VND preview; preserve server currency/timezone when switching EN/VI. Legacy PHP/demo features stay hidden. Validate quantities, inventory, delivery choices, recipient/contact fields, and empty states relevant to the change.
- Client-side demo auth may control visible UI only. If production auth/payment is requested, design and implement the needed server/provider boundary; never ship fixture credentials or browser role checks as the security solution.
- Avoid claiming success before persistence or provider confirmation exists. If work remains a demo, explain that fact in the delivery notes.

## Brainstorm and deliver

Use [STAGING](../../../docs/STAGING.md) for guarded environment-specific builds/deploys and [OPERATIONS](../../../docs/OPERATIONS.md) for smoke, backup and reconciliation. Local evidence does not establish provider success, cloud quota or remote acceptance; those claims need separately recorded evidence.

Ground proposals in the actual missing flow, reusable primitives, and current visual language. State user benefit, dependencies, and what would demonstrate completion. Separate current functionality from suggested work; do not implement unrequested roadmap items.

Verify affected behavior; run the required typecheck/architecture/tests/build checks for runtime changes, local smoke for Worker changes, audit for dependency changes, and sync CodeGraph after code changes. Documentation changes need link/path review. Maintain the guide and Git allowlist when adding shared files. Give the owner a short Vietnamese report with the result, checks performed, and material limitations. Keep documentation scoped: edit the owning reference, link from indexes and put test/deploy evidence in PROJECT_STATUS instead of appending the same log to every document.
