# Project instructions

- Read PRODUCT.md and docs/architecture.md before feature work. Homepage is professional portfolio first, creative content afterwards.
- Use GrillMe for material unresolved intent; Taste and Impeccable for design. Keep confirmed choices durable and avoid re-interviewing settled facts.
- Work locally. Do not deploy, provision services, buy a domain, or change Vercel/Supabase/Cloudflare resources unless the user asks.
- Never invent professional claims, résumé content, listening data, or Apple export schemas. Mark demonstration content visibly.
- Apple Music is strictly the supplied one-time historical file import. Never add Apple API/auth/MusicKit/automatic collection. `MUSIC_INCLUDE_APPLE_IMPORT` is the internal server-only inclusion switch, enabled locally for exploration; preserve it and the import provenance. Spotify alone collects ongoing activity.
- Keep secrets, original music exports, personal history, and private content out of Git. Public and private access paths must be explicit.
- Isolate motion/3D in client components; preserve keyboard, touch, reduced-motion, and non-WebGL behavior.
- Run lint, typecheck, and build for foundation changes. Music ingestion needs meaningful fixtures proving duration, deduplication, timezone, and reconciliation behavior.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
