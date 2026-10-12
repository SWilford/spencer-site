# spencer-site

Spencer's professional portfolio and personal creative space. Core site first; private listening-history imports and selected public music statistics later.

## Local development on Windows

Node.js 22.20 or a supported newer LTS release. From this repository:

```powershell
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000. Press Ctrl+C to stop. The initial page is a minimal scaffold while image concepts are reviewed; it is not the finished portfolio. No cloud credentials or database are required.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1
```

npm.cmd run check runs lint, types, and production build. Use npm.cmd if PowerShell blocks npm.ps1. Commit package-lock.json and use npm ci on other computers.

## Project map

- src/app/: Next.js App Router.
- PRODUCT.md: confirmed priorities and constraints.
- docs/architecture.md: route map, phases, music correctness and security.
- docs/hosting-research.md: dated costs/limits and deferred decisions.
- docs/design-exploration.md: draft visual options and tradeoffs.
- .impeccable/: design records and concept images; proposals require selection before portfolio implementation.

Never commit exports, listening history, tokens, credentials, or private assets. Place future private input under ignored private-data/, not public/. GitHub holds code and deliberately public material only.

## Status

Local foundation established. Image concepts in review. Nothing deployed; Vercel, Supabase, Cloudflare, and domains have not been changed. No Spotify or Apple integration implemented yet.

## Dependency audit

Production dependencies audit clean. The Next.js ESLint toolchain transitively includes braces 3.0.3, flagged by GHSA-vfj7-8cjw-p6xm for deeply nested glob patterns. Five high audit entries trace to this single development-only issue. The registry currently offers no patched braces release. npm audit fix --force proposes an incompatible major downgrade of the Next ESLint configuration; do not apply it blindly. Track the upstream fix, use trusted lint patterns, and recheck before release.
