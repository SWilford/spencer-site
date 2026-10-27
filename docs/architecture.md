# Architecture and delivery plan

October 14 music update: prospective Spotify collection now precedes the historical dashboard while the extended export is prepared. Use a dedicated free Supabase project in Spencer's personal organization, a private scheduled Edge Function, and initially Supabase Storage if original files fit its limits. R2 remains optional. The portfolio stays unpublished. See [music-collector.md](music-collector.md) for current setup state and live-verification gates.

## Initial decisions

Start with one Next.js application. React Server Components render content; small client components own interactive navigation and projected 3D canvas motion. TypeScript and native CSS provide the current foundation. Avoid a monorepo and unnecessary infrastructure until the second server-backed project is understood.

Use repository-backed Markdown/MDX and typed metadata for the first content workflow. This is a recommendation, not yet a confirmed authoring preference. An authenticated editor can follow if browser-based publishing is desired. Only trusted owner-authored MDX may execute; never compile uploaded visitor MDX.

The core website needs no database. Later, use Supabase's established Postgres database with our own schema and owner authentication. R2 is recommended for original private music exports and large photo/media files. Small optimized public assets can live in the repository initially. Separate private exports and public media buckets/access paths.

## Route map

| Route | Purpose | Access |
| --- | --- | --- |
| / | Standalone professional introduction and interactive background | Public |
| /experience | Experience and education | Public |
| /resume | Printable web résumé summary | Public |
| /contact | Email and social links | Public |
| /projects | Project index; individual case studies planned | Public |
| /journal | Writing placeholder; individual posts planned | Public published content only |
| /photos | Photography and other visual material | Public selected media |
| /music | Guitar/music content, later selected listening summaries | Public selected content |
| /admin | Owner editing, uploads, catalog corrections, private dashboard | Owner only; not built yet |
| /api/internal/music/collect | Scheduled Spotify ingestion | Server secret; not built yet |

The user requested separate tab pages and permits filler for the visual draft. Creative routes explicitly identify their unfinished state; Home does not stack the other routes' content. Contact uses supplied email/social links.

## Phases and acceptance gates

1. **Repository and local foundation.** Clone, scaffold, lock dependencies, add scripts/CI and this plan. Verify local HTTP, type checking, lint, and production build. No deployment credentials needed.
2. **Choose design and build core site.** Professional-first homepage, responsive navigation, portfolio/about/experience, project and writing templates, media presentation, coherent tokens. A single signature interaction or 3D scene earns its place. Verify keyboard/touch, reduced motion, desktop/mobile rendering, and loading/empty/error states. Use real supplied content or visibly identified design-preview content.
3. **Content and launch preparation.** Fill real résumé/projects/photos, SEO/social preview, metadata, image sizes, content authoring, accessibility and performance review. Verify domain availability and registration/renewal prices with a registrar, then choose. Provision/publish only when requested.
4. **Music imports and private data.** Inspect real Spotify and Apple files; inventory schemas, timestamps, duration units, identifiers, and missing fields. Implement immutable private upload storage, import audit reports, versioned parsers, and reprocessing. Authenticate owner, enforce limits, and validate accuracy using export fixtures.
5. **Listening dashboard.** Implement metrics and charts over normalized data. Independent summary/top-list date ranges; data quality labels, coverage, freshness, manual catalog corrections, and public allowlist. Verify calculations against known fixtures.
6. **Spotify collection.** Confirm current developer-access rules and actual credentials/scopes. Start recent-history ingestion with an external scheduler, database lock/lease, persisted cursor and overlap window, idempotent writes, refresh-token handling, rate-limit backoff, and failure visibility. Reconcile with later extended-history imports.
7. **Advanced tracking and migration.** Investigate Spotify playback observations separately; frequent observation is approximate. Apple is exclusively a one-time supplied-file import, with no API, auth or automation planned. Inspect the other project's runtime, persistence, auth, domains, and deployment requirements before choosing migration strategy.

## Performance and interaction budget

Static/server-rendered content comes first. Load a 3D module separately; preserve a meaningful fallback when WebGL is unavailable and under reduced motion. Pause rendering while hidden, cap pixel ratio, avoid continuous React state updates for pointers, and avoid scroll hijacking. Prefer transform/opacity motion. Keep reading and navigation usable while effects load.

Targets to validate after implementation: LCP <2.5 s, INP <200 ms, CLS <0.1 at the 75th percentile. These are goals, not claimed measurements. Start with representative mobile hardware/network testing; confirm real-user performance after launch.

## Global survey scrollbar

The ruler is vertically centered in the viewport with equal top and bottom insets of `clamp(28px,6vh,64px)`, independently of the header.

`src/components/survey-scrollbar.tsx` progressively enhances native page scrolling on fine-pointer, hover-capable desktops. The viewport-fitted ruler has 61 ticks, a longer mark every five intervals, and a muted-red thumb proportional to the visible page (minimum 44px). It fades after 1,100ms of idle time, reappears on edge hover, and remains visible during focus or captured pointer dragging. Track clicks reposition the thumb; Arrow keys move 48px, Page keys move 85% of the viewport, and Home/End reach the boundaries. The scrollbar exposes its position through ARIA without adding visible percentages or HUD labels.

Passive scroll events schedule measurements through requestAnimationFrame; ResizeObserver tracks body and rail size changes. Native scrollbars remain available on coarse pointers, in forced colors, and without JavaScript. Reduced motion removes the rail's transitions and translation. This extends the existing visual world with current color tokens; DESIGN.md and `.impeccable/design.json` remain authoritative and unchanged. It changes no page content, music data access, or hosting configuration.

The boundary correction shares `src/lib/scrollbar-geometry.ts` between thumb rendering and pointer mapping: travel runs from the first SVG tick at 10/980 to the last at 970/980 of rail height. The sensor cursor treats the rail as an interactive control and preserves its reticle during hover or captured scrolling; ordinary page scrolling still hides a stale cursor. Supplied browser checks placed the top cap on the first mark and the bottom cap within 0.1px inside the last mark, with End reporting ARIA 100. A midpoint track click reported 50 and retained the custom cursor. Three geometry tests, lint, type checking, and production build passed. The capture is `.impeccable/review/scrollbar-aligned-bottom.png`; physical dragging remains source-reviewed because the browser tool does not support it.

Review passed with no blocking findings (`detector: []`). Browser checks recorded PageDown at scrollY 850 / ARIA 60, End at 100, Home at 0, a track click at 50, idle opacity 0, and no narrow-screen horizontal overflow. Captures are in `.impeccable/review/scrollbar-desktop.png`, `scrollbar-idle.png`, and `scrollbar-mobile.png`. Physical dragging, coarse-pointer behavior, and forced-colors fallback were reviewed in source only. `npm run check` completed successfully, including lint, type checking, and the production build.

## Module boundaries

The October 16 Spotify extended import uses read-only local SQLite analytics in `src/lib/music-history-store.ts` over immutable source records, temporary saved-live/Apple overlays, and indexed fact tables. It preserves the existing public aggregate response. The original export is privately backed up in Supabase Storage; the normalized local database is not a hosted deployment artifact. See [spotify-history-import.md](spotify-history-import.md) for provenance, reconciliation, thresholds and hosting limits. The live collector now makes no catalog calls; artwork uses an independent public preview/catalog worker with no Spotify app credentials or collector lease/backoff access.

For Music Stats, `src/lib/music-chart-series.ts` derives display points from existing public aggregates. Any single-day range, including Day and same-date Custom, uses the clocks' 24 Eastern wall-clock hour buckets: Daily places hourly values at bin midpoints; Cumulative starts at zero at midnight and adds 24 end-of-hour totals, ending at the full day's total at the next midnight. Repeated daylight-saving hours share their wall-clock bucket. Multi-day daily/monthly series remain unchanged. This changes no API, database, or collection behavior; see [music-stats-dashboard.md](music-stats-dashboard.md) for interaction and verification evidence.

Keep website content, music ingestion, music analytics, and provider adapters separate. A provider adapter returns source records with provenance, never precomputed public UI state. Analytics read our normalized catalog/history, not live provider APIs. The public UI reads saved, allowlisted aggregate output. Imports and collection never run as a side effect of a public page load.

Import jobs may need chunked background processing outside an HTTP request. Large ZIPs should upload directly to private object storage through scoped short-lived authorization. Archive parsing must limit compressed/uncompressed size, entry count, compression ratio, processing time, file types, paths, and nesting. Never extract untrusted archive paths to arbitrary disk locations.

## Future music data model

Plan entities before writing SQL: import_files (checksum, object key, parser version), import_jobs, immutable source_records, provider_accounts, catalog_tracks/artists/albums, provider_identifiers, match_candidates/manual_overrides, play_events, duration_evidence, collection_runs/cursors, coverage_intervals, and published_summaries.

Store source records even when normalization fails. Preserve source timestamps and units alongside normalized UTC timestamps. File hashes prevent identical imports; source-record keys prevent replay within an import; event-level reconciliation handles overlapping imports and sync. Timestamp/title hashes alone are insufficient because repeat plays and cross-service matches can collide. Record ambiguous matches instead of silently merging them.

An event can carry multiple duration evidence records: exported_actual, observed_estimate, full_song_estimate, or unknown. Reconciliation links evidence to a single play, preserves prior evidence, and promotes the preferred source without summing duplicates. Never imply a full-song estimate was actually listened. Unknown duration contributes to recorded-play counts but not invented minutes.

Prefer explicit identifiers and ISRC where available, then normalized metadata with confidence and manual review. ISRC and titles are evidence, not universal uniqueness keys. Preserve live/remastered/clean/explicit versions deliberately. Multi-artist credit allocation must be defined before computing artist time so a track's entire duration is not accidentally counted several times in global totals.

## Analytics semantics to resolve

- Configurable stream qualification threshold, with separate raw recorded-play count. Specify behavior for unknown/estimated durations.
- Timezone-aware date boundaries using IANA zones and DST; distinguish calendar year, past year, YTD, rolling ranges, and custom ranges.
- Summary and top-list filters independent; comparison periods have explicit lengths and timezone boundaries.
- Define whether time crosses midnight by splitting intervals or assigning to a source event timestamp. Some exports may not supply enough interval information for precise splitting.
- Daily averages can include all days in the chosen range or active days; expose the denominator and exclude unknown coverage from silently appearing as zero listening.
- Minutes/hours/days are conversions of the same duration total. Daily/cumulative graphs, weekday/month/year breakdowns, listening clock, trends, unique catalog counts, and actual-time/count sorting use consistent filters.
- Artwork from supported metadata sources, cached within provider rules. Artist pictures and optional static video thumbnails depend on actual supported sources; fall back to album art or a truthful empty state.
- Coverage and collection freshness always visible. Import date span alone does not prove complete coverage.

## Security and operation

Owner-only authorization on every admin request; a generic authenticated user is not automatically the owner. Use Supabase RLS for exposed tables, private schemas for raw data, and a deliberate aggregate public API. Public summaries must avoid leaking excluded detail through filtering, cache keys, or shared pages. Private responses must never enter a public cache.

Collection endpoint checks a server secret, rate limits, and an atomic database lease with expiry. Use run IDs/fencing where needed so stale executions cannot overwrite a newer cursor. Tokens stay server-side; refresh failures and revoked access become visible collection states. Respect provider retry timing and backoff; never print secrets in logs.

Use structured redacted diagnostics and import/collection status. Retain original files until Spencer chooses retention policy. Plan database and object-storage backups/restore together before relying on this as the sole history archive.

## Plain navigation motion

Header text links, For Fun trigger, social icons and mobile toggle retain their existing appearance. Only inner faces move: 2px lift, local 26px mouse attraction (at most 3.5px horizontal / 2px vertical), nearest target only, and short weighted press. Hit areas and focus outlines remain fixed. Pointer work is requestAnimationFrame-throttled without React state or idle animation. Hidden navigation is excluded; scroll, blur, exit and visibility changes reset it. Touch has press feedback, reduced motion disables translation. The Music Stats glass dropdown item remains unchanged.
