---
name: lunarra-design
description: "Adapt a user-provided Stitch/Google Studio design, screenshots, or external visual reference into the existing Lunarra React UI, and explicitly requested visual audits or theme/interaction refactors. Use when the user asks for $lunarra-design or clearly authorizes this design skill; preserve product flows and existing component ownership."
---

# Lunarra Design

**Invocation:** The existing `agents/openai.yaml` sets `policy.allow_implicit_invocation: false`. Use this skill when the owner explicitly calls `$lunarra-design` or otherwise explicitly requests this skill. For ordinary store feature work, follow `lunara-flower-shop` instead.

## 1. Source and scope

- Work within the repository containing this skill (repo root `../../..`). Read root `AGENTS.md`, the design sections of `docs/ui-ux/DESIGN_SYSTEM.md`, and relevant parts of `.agents/skills/lunara-flower-shop/SKILL.md`.
- Inspect the actual React components, theme registry and tokens before editing. Use CodeGraph for discoverable source when a local index exists; CSS, docs and assets may need direct inspection.
- Treat the owner's latest approved screenshot/instructions as the requested visual target. `D:/Download/lunara`, if present and explicitly relevant, is a **read-only local reference**, not a codebase to copy or run. Do not assume this path exists in every environment.
- When using Stitch/Google Studio, retrieve a reference through an available supported integration if needed; do not modify the source design unless authorized.
- Differentiate **reference appearance**, **current implementation**, and **proposed changes**. Ask only when conflicting references leave a material choice unresolved.

## 2. Keep the existing product and code

- Adapt only the requested surface/flow. Preserve React Router, APIs, database content, real product images, auth, checkout, admin and existing business behavior.
- Reuse `src/shared/ui/`, feature components/services, Lucide icons, `cn` and semantic Tailwind classes. Do not introduce a second design system, duplicate state, copy sample fixtures into production, or add fake customer/order data.
- Keep Lunarra branding and the existing locale typography unless the owner explicitly changes it: EN Fraunces/Inter; VI Lora/Be Vietnam Pro. Maintain EN/VI copy and responsive breakpoints.
- Use the repository's image assets and provenance documented in `ATTRIBUTIONS.md`. Do not silently replace assets or change product content to make a mockup look better.

## 3. Theme and color system

- Theme registry: `src/shared/theme/themes.ts`; state: `src/shared/theme/theme-store.ts`; tokens/styles: `src/styles/brand.css` and `src/styles/theme.css`.
- There are **21 light themes**, not a pink-only identity. Original is green/white-mist in current code. `rose/cream/blush` are backward-compatible **names**, not literal color instructions.
- Palette HEX values belong in registry/semantic mapping; **components use role-based tokens**, not direct HEX values or conditional branches on theme ID.
- Preserve the IDs, `lunara.theme.v1` persistence, 16 earlier palettes and their approved appearance unless explicitly instructed otherwise.
- Design target for multicolor themes: neutral/off-white canvas and flower photography establish the visual hierarchy. Primary governs CTA, important actions and selected navigation. Secondary/tertiary provide sparing, consistent micro-accents (logo details, one small icon/mark or short tag), not full-width brightly colored sections or competing CTA colors.
- Do not equate "three accents exist" with "each accent must occupy a large visible area." Avoid arbitrary colors by product index, step, page region or theme-specific component branching.
- Map semantics once in the theme system. Use distinct tokens for surface/foreground, button/hover, links, selected state, focus ring, muted, border, neutral cards, and genuine status colors. Avoid direct foreground/light assumptions (especially white over pale secondary/tertiary colors).
- **Legacy test caveat:** `tests/themes.test.mjs`, `scripts/check-ui-creative-colors.mjs` and dated UI specs may still enforce old utility/Hero/Journey accent fills. When asked to refactor, revise the color **contract and tests together**, retaining actual compatibility and contrast coverage. Never silently falsify test evidence.

## 4. Interaction and accessibility audit

- Distinguish pointer hover, keyboard focus-visible, checked/selected values and current route; do not stack strong outlines, backgrounds and borders unnecessarily.
- Radix `Dropdown` and menu items use `data-[highlighted]` and `data-[state=checked]`; inspect `src/shared/ui/dropdown.tsx`, `ThemeSwitcher.tsx`, `StorefrontNavigation.tsx` and the global focus rules in `brand.css` when fixing highlight defects.
- Preserve a visible keyboard focus indicator (>=3:1 for applicable non-text indicators), meaningful icon-button labels, keyboard traversal/Escape and hit targets. Normal text contrast >=4.5:1; large text >=3:1 where applicable.
- Review desktop/mobile layout, clipping, sticky header/dropdown portals, overflow, loading/empty/error states and reduced motion. Do not solve style defects by hiding functional controls.

## 5. Verification and delivery

- For a visual adaptation, compare target/current/result at desktop and mobile with the **same content and images**, including representative interaction states.
- For shared theme changes, inspect all 5 creative themes and regression-check all 21 light themes. Test at 390px and 1440px, EN and VI, and relevant Product/Card/Cart/Checkout/Admin surfaces as affected.
- Follow `AGENTS.md` for typecheck, architecture, tests, build, required UI scripts, documentation and permissions. If checks or screenshot comparison cannot run, say so.
- State which visual decisions were changed, which existing behavior was preserved, and any unresolved visual differences. Update owning design docs only for implemented decisions, not desired-but-unimplemented targets.
- Do not commit, push, deploy, or change remote data without authorization for this task.
