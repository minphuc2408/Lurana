# Lunara Flower Shop

React + TypeScript storefront and admin UI from the Flower Shop Figma design. UI branding is **Lunara**; the GitHub repository is named **Lurana**.

Read [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for the Vietnamese handbook: routes, existing components, design tokens, demo limitations, working standards, and feature ideas. Codex uses [AGENTS.md](AGENTS.md) and the repo skill [lunara-flower-shop](.agents/skills/lunara-flower-shop/SKILL.md).

## Run and build

```bash
npm ci
npm run dev
npm run typecheck
npm run check:architecture
npm test
npm run build
npm run preview
```

Dev: http://127.0.0.1:5173. Preview: http://127.0.0.1:4173. Production output: `dist/`. Busy ports may cause Vite to select the next port.

Vite 6.4.4, React Router 7.18.4, React/React DOM 18.3.1, Tailwind CSS 4.1.12. Verified environment: Node.js 24.11.1 and npm 11.6.2. Dependency installation uses the official HTTPS npm registry with lifecycle scripts disabled by `.npmrc`.

This is a frontend demo. Auth, registration, checkout, inventory, orders, and custom requests are not backed by production services.

Pages in `src/pages` compose modules in `src/features`; generic UI/helpers live in `src/shared`. Cross-feature imports use each feature's `index.ts`. `src/app/router.tsx` owns routing, and `src/app/providers.tsx` composes auth and the shared cart. Admin routes are lazy-loaded. Shop, Cart and navbar share in-memory cart state; reload restores demo fixtures.

With preview running, `npm run check:ui -- http://127.0.0.1:4173` verifies routes and flows using Edge headless on Windows. This check blocks external image/font hosts; local evidence stays in `.security-review`. Run `npm audit` after dependency changes. No ESLint script is configured.

## Configure Codex and CodeGraph

```bash
npm run assistant:setup
npm run graph:status -- --json
npm run graph:explore -- "useProducts useCartState useCheckout"
```

Setup uses the pinned local CodeGraph 1.5.0 dependency, creates/syncs the root `.codegraph/` index, and generates ignored `.codex/config.toml` for CodeGraph and OpenAI Docs MCP. Open a new Codex session in this trusted project to load the configuration. Project commands disable CodeGraph telemetry and fallback downloads without changing global settings.

The Git allowlist shares only reviewed source, documentation, and skill files. Build output, dependencies, secrets, the index database, audit evidence, and local Codex configuration remain ignored. Review new shared files and add their exact paths to `.gitignore`.

## Attribution

Original Figma project: [Flower Shop Website Design](https://www.figma.com/design/0YRitOqUypqP0K0esw8sXL/Flower-Shop-Website-Design--Copy---Community-).

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for shadcn/ui and Unsplash attribution.
