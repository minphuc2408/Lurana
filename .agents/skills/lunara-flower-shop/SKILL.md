---
name: lunara-flower-shop
description: Implement or review storefront, cart/checkout, order lookup and admin work in this repo. Use for feature, UI, or flow changes here. For adapting external designs (Stitch, screenshots) use lunarra-design instead.
---

# Lunara Flower Shop

Working rules are in AGENTS.md. This skill only routes you to context and lists traps.

## Read before changing code
- Architecture, module boundaries, ownership: PROJECT_GUIDE.md (relevant section only).
- Routes: src/app/router.tsx. Code is authoritative over docs.
- Visual work: src/styles/brand.css and src/shared/theme/themes.ts. Token names
  `rose/cream/blush` are legacy; the values are green/white-mist. Never hardcode
  pink or hex colors; use semantic tokens so all 21 themes work.
- Contracts: docs/pipeline/API_CONTRACT.md, docs/DATABASE_DESIGN.md.
- Security/bot protection: docs/BOT_PROTECTION.md. Ops: docs/OPERATIONS.md.
- Use CodeGraph first if `.codegraph/` exists; otherwise skip it.

## Traps (do not violate)
- One cart only: CartProvider, variant ID as line identity. No second cart.
- Checkout/lookup PII and order intent stay in memory, never in browser storage.
- Order confirmation comes from the API response, never a simulated order.
- Stock edits use stock_delta. After an ambiguous failure, lock the row and
  require a successful GET before another edit; never auto-retry a delta.
- Money is numeric, formatted at the display boundary. Locale never changes
  IDs, quantities, VND, or timezone.
- Reuse shared/ui primitives and existing feature public APIs before creating new ones.
- Customer auth, custom request, and admin customers/settings stay hidden by flags.
- Do not claim success before persistence or provider confirmation exists.

## Deliver
- Run the checks required by AGENTS.md for the kind of change.
- Update only the doc that owns the topic, per the AGENTS.md documentation policy.
- Report to the owner in Vietnamese: result, checks run, real limitations.