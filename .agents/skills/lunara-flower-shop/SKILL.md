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

Use CodeGraph first to locate code and its dependents when `.codegraph/` exists. Query the symbols that span the requested flow, for example `useProducts useCartState useCheckout` or `AuthProvider useAuthState AdminLayout`. If retrieval omits the target source, use the local `node --file` command documented in `AGENTS.md`.

## Implement visual and component work

- Match the existing soft floral layout: cream backgrounds, dusty rose accents, dark warm text, editorial serif headings, clean sans-serif forms, rounded cards, and pill CTAs.
- Read `src/styles/brand.css` and use its semantic tokens/utilities for new work. The legacy `theme.css` primary is a generic dark color; do not mistake it for the Lunara brand.
- Search the guide's component inventory before inventing primitives. Prefer retained `shared/ui` shadcn/Radix wrappers, `cn`, and Lucide icons, with brand-specific classes. ProductCard/ProductGrid/FilterBar, a shared CartProvider and the canonical Shop service already exist; a generic domain StatusBadge does not.
- Default to local changes. Extract a domain component when more than one affected surface needs the same behavior; maintain one canonical data source when connecting Shop, Cart, Stock, or Dashboard.
- Use the stronger rose token for small white CTA text. Ensure readable labels, visible keyboard focus, accessible icon buttons, useful image alt text, and reduced-motion behavior if animations are added.

## Implement commerce and admin behavior

- Determine whether the requested action affects UI state, demo data, or a real backend before choosing storage. The current app has no API, real checkout, or server authorization.
- Follow the existing route boundaries in `app/router.tsx`: customer pages use `MainLayout`, admin pages use `AdminLayout`, and standalone auth pages stay outside both. Do not create a duplicate route tree.
- Shop Add, Cart and navbar already share CartProvider. Use the canonical product IDs and product/size line IDs; do not create an independent cart. Providers retain this in-memory demo across route changes, and reload restores the fixtures.
- Keep amounts numeric and format at display boundaries. Preserve PHP/₱ defaults unless localization is requested. Validate quantities, inventory, delivery choices, recipient/contact fields, and empty states relevant to the change.
- Client-side demo auth may control visible UI only. If production auth/payment is requested, design and implement the needed server/provider boundary; never ship fixture credentials or browser role checks as the security solution.
- Avoid claiming success before persistence or provider confirmation exists. If work remains a demo, explain that fact in the delivery notes.

## Brainstorm and deliver

Ground proposals in the actual missing flow, reusable primitives, and current visual language. State user benefit, dependencies, and what would demonstrate completion. Separate current functionality from suggested work; do not implement unrequested roadmap items.

Verify affected behavior, build runtime changes, audit dependency changes, and sync the graph. Maintain the guide and Git allowlist when adding shared files. Give the owner a short Vietnamese report with the result, checks performed, and material limitations.
