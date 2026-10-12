# spencer-site

Spencer's professional portfolio and personal creative space. Core site first; private listening-history imports and selected public music statistics later.

## Local development on Windows

Node.js 22.20 or a supported newer LTS release. From this repository:

```powershell
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1
```

Open http://localhost:3000. Press Ctrl+C to stop. The interactive draft has a separate Home, Experience, Projects, Résumé, Contact, Music, Photos, and Journal. The background morphs between angular 3D arrangements and reacts to the pointer; the name has a letter-by-letter entrance. Reduced-motion preferences are respected. No cloud credentials or database are required.

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
- DESIGN.md: implemented palette, typography, layout and motion rules.
- .impeccable/: approved concept, surface brief, design records and local review captures.

Never commit exports, listening history, tokens, credentials, or private assets. Place future private input under ignored private-data/, not public/. GitHub holds code and deliberately public material only.

## Status

First interactive draft based on the approved image. The homepage uses an open foreground over a native-canvas 3D graph. Styling uses native CSS; the starter's faulty Tailwind loader is bypassed. Experience/project summaries come from the supplied résumé. Project images and creative content remain placeholders. A printable web résumé is at /resume; the original Word file is not copied into the repository. Nothing deployed; no Spotify or Apple integration yet.

## Dependency audit

Production dependencies audit clean. The Next.js ESLint toolchain transitively includes braces 3.0.3, flagged by GHSA-vfj7-8cjw-p6xm for deeply nested glob patterns. Five high audit entries trace to this single development-only issue. The registry currently offers no patched braces release. npm audit fix --force proposes an incompatible major downgrade of the Next ESLint configuration; do not apply it blindly. Track the upstream fix, use trusted lint patterns, and recheck before release.
