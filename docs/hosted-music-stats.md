# Hosted Music Stats — October 26 launch

Production project: `spencer-site` (`prj_5UjfC9bRycY3tgkMSNNBU44gZj3o`), on Spencer's Vercel team. Canonical domain: https://spencerwilford.com. The unrelated rugby project is untouched.

## Data and access

The dedicated Supabase collector remains unchanged and runs every ten minutes. The new `music-site-data` Edge Function has no Spotify requests, Vault access, collector token, collector RPC or collector code dependency. Its two independent random keys are stored as SHA-256 digests in private RLS-protected tables. Neither anonymous nor authenticated browser roles can execute the site RPCs or read those tables. The function uses its own bearer authentication, so gateway JWT verification is intentionally disabled for this endpoint. GET requires the read key; POST requires a different owner key. Requests with the read key cannot upload, activate artwork or collect anything.

Vercel production receives only `MUSIC_SITE_READ_KEY`, `MUSIC_SUPABASE_PROJECT_ID`, `MUSIC_HISTORY_MANIFEST`, and the internal `MUSIC_INCLUDE_APPLE_IMPORT=true`. No collector key, Spotify token, service-role key or owner-upload key is installed in the website. Server environment values and private files never appear in browser responses. Public visitors receive only the existing aggregate/ranking contract at `/api/music-stats`; individual plays and downloadable source artifacts require private server access. Public GETs cannot invoke collection or provider artwork lookups.

Public responses use CDN caching (60 seconds plus a 120-second stale-while-revalidate window). The client refreshes once a minute while visible. Function-instance request limits allow sixty requests per visitor per minute and 240 total, with a sixty-second retry response. This is defense in depth, not a distributed abuse-prevention guarantee; Vercel's platform protections remain the outer layer. Invalid parameter names, dates and presets are rejected before loading historical data.

## Private historical read copy

`prepare-hosted-history.py` opens the immutable original SQLite database read-only. It creates a compact SQLite read replica with normalized event facts referencing shared catalog rows, excluding original raw JSON/source tables. It verifies record count, listening milliseconds, qualified streams and timestamp bounds. Original archives and the source database remain preserved. The replica's local event keys are row numbers, not replacements for original import provenance identities. Corrections/reconciliation continue to use original evidence; rerun the replica build when imports change.

The initial replica conserves all 200,783 music records, 16,880,066,005 reported milliseconds and 88,915 Spotify-qualified streams. Apple remains a one-time supplied-file import behind its internal switch. Compressed history, Apple reconstruction, Apple mappings and display catalog total about 11 MB in the existing private `music-imports` bucket. The bucket now accepts ZIP and gzip while remaining private. Objects are content-addressed; uploads use owner-authenticated short-lived signed Storage URLs and downloaded bytes are checksum verified.

The trusted Vercel build downloads/validates the pinned assets once, and includes the private read copy only in the Music Stats server function via output tracing. It is never placed in `public/`, committed to Git, or included in client JavaScript. Collector credentials and local raw/import directories are explicitly excluded from tracing. Warm runtime copies live under the platform's temporary directory; fallback downloads are single-flight, checksum-checked and decompression-bounded. The existing calculation engine and reconciliation policy are reused. No database storage engine was added.

## Freshness and artwork

Saved live plays come from a dedicated service-role-only snapshot RPC; it performs database reads only. Snapshot refresh is cached in memory in hosted functions, without writing into the read-only deployment filesystem. New plays are reconciled against exported actual durations through the existing matching logic. Publishing, downloading, rebuilding and serving stats cannot update collector leases/backoff or consume Spotify developer quota.

Artwork runs locally using public metadata sources. After each completed batch, the owner worker publishes only changed display metadata to private Storage and atomically activates its checksum. Hosted functions recheck artwork at most every five minutes and retain verified last-known images if refresh fails. The worker can retry publication without changing collection. Computer sleep stops further artwork discovery, but already published data and ongoing hosted listening collection remain available.

## Verification

Full-source versus compact-replica comparisons matched complete public results (totals, graphs and rankings) for lifetime, 2025 and the recent week. An initial cloud-only local production request returned 96,359 streams, earliest day 2017-12-25, and a current hosted collection timestamp; a warm request took 0.29 seconds. The original download-based cold path took 22.56 seconds, prompting build-time packaging to avoid repeating that transfer per function instance.

Actual unauthenticated endpoint access returned 401, as did an upload attempt using the website read key. Database checks denied anon/authenticated execution of snapshot RPCs and anonymous reads of credential hashes. The Supabase advisor reported only intentional informational deny-all RLS findings. Tests cover credential separation, path allowlists, corrupt-asset rejection/retry, anonymous access and bounded statistics requests, in addition to existing ingestion/reconciliation tests. Production checks and live release results are recorded with the release commit.

## Owner operations

- `python scripts/music/prepare-hosted-history.py`: rebuild artifacts and private manifest after a new import.
- `node scripts/music/publish-hosted-history.mjs`: publish and verify those artifacts (owner upload key stays locally private).
- Update the production manifest and deploy after historical imports change.
- `node scripts/music/publish-hosted-history.mjs --artwork-only`: publish changed artwork without a deployment. The running artwork parent invokes this automatically after batches.
- `node scripts/music/hosted-collector.mjs status`: existing independent collection health.

No routine admin UI is required. Database-backed historical aggregation/pagination can replace this private read replica later if history growth or cold query cost warrants it; existing original-source provenance remains the basis for that migration.

October 29 reliability review: artwork-only publication now builds an independent in-memory payload and leaves the pinned historical manifest and archives untouched. Full publication verifies all assets before beginning uploads. `/api/music-health` uses the existing website read capability only, returns status without playback records, and reports stale collection after 30 minutes. See [v1 readiness](v1-readiness.md) for the complete audit, monitoring setup and recovery runbook.


Release checks: 45 music/security tests passed; ESLint, TypeScript, Next.js production build and strict Deno checking passed. The dependency audit reports zero known vulnerabilities. Output tracing contains exactly nine private files, all inside site-bundle; no raw source directories, collector credential, owner-upload key or local snapshot is included. The mechanical UI scan's max-height animation finding was fixed with a bounded clip reveal; its survey-thumb stripe is the explicitly approved scrollbar indicator, and pre-existing palette/type advisories were left outside this scope.
