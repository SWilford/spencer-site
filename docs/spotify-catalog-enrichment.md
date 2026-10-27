## October 26: artwork isolation and unattended resume

Collection remains hosted and scheduled every ten minutes. The local artwork runner
no longer reads collector credentials or calls its dashboard/collection endpoint.
It consumes only the saved local snapshot and immutable imported catalog. All
metadata HTTP requests pass an allowlist for credential-free Spotify oEmbed,
MusicBrainz and Wikidata; Authorization, cookies, redirects and collector/API hosts
are rejected before a request. Provider cooldowns remain exclusively in the local
artwork checkpoint. No cloud collector configuration or tokens were changed.

The old runner ended after 150 batches (375 images). It now continues until complete
or explicitly stopped, with exponential waits after failed batches, capped at thirty
minutes. It retains one-runner locking and atomic catalog checkpoints. Use `--once`
on the runner for one bounded batch. Each normal batch processes up to ten artist
attempts, with saved Spotify IDs prioritized before external discovery. Missing
images are retryable after seven days rather than permanently marked complete;
individual discovery errors defer the affected artist for one hour. Provider-wide
MusicBrainz/preview cooldowns respect numeric and HTTP-date Retry-After values.
Cached matches and all listening evidence remain intact.

This is still a local worker: the computer must remain awake for artwork progress.
Closing it does not stop the independent hosted listening collector. Status/logs
are private under `private-data/music/spotify/artwork-*-status.json` and `work/`.
No admin interface or owner chores are required for ordinary retries. Hosted
historical analytics, database pagination and optional correction tools remain
separate future work.

Verification: 40 music tests passed, including blocked collector/API requests,
credential rejection, Retry-After formats, disabled authenticated catalog access,
history-only collection and its own rate-limit handling. The real detached worker
advanced from 375 to 392 saved artist images. During that work, a hosted scheduled
collection succeeded at 2026-10-27 01:00 UTC (October 26, 9 PM Eastern), advancing
saved recent plays from 588 to 590 with no error or retry deadline. Targeted ESLint
and `git diff --check` also passed.

# Catalog artwork without collector quota usage

**October 16 supersedes the original bulk lookup design.** Spotify development quota is shared across a developer account, so a second Client ID does not isolate it. The deployed collector (version 9) now makes only token-refresh and recent-history requests. Its catalog action returns HTTP 403 before acquiring credentials; post-collection artist lookups are removed. The ten-minute scheduler remains active and successful runs were verified while artwork processing was underway.

The independent `cache-music-artwork.mjs` worker uses saved metadata, public Wikidata/MusicBrainz catalog links and Spotify's official public oEmbed thumbnails. It makes zero authenticated Spotify API requests and cannot modify collector leases, cursors or retry state. Provider throttles/timeouts affect artwork only. MusicBrainz is paced at one request per 1.1 seconds; ambiguous identities remain review items.

Ignored `private-data/music/spotify/catalog-enrichment.json` preserves resumable lookup state. Atomic `catalog-display.json` contains only profiles/covers for analytics. `run-artwork-worker.mjs` runs bounded batches in a hidden local process, with progress in `artwork-runner-status.json` and `artwork-worker-status.json`. The computer must stay on for artwork work; hosted listening collection continues with the computer off. Public browsing reads cached metadata and never starts lookup jobs.

An initial independent cache had 266 profile images; more than 30 additional photos were resolved before the background queue continued. Some public catalog queries timed out or returned HTTP 503; those delays did not interrupt collection. See [extended-history import](spotify-history-import.md) for the imported Spotify data. Ingestion completion does not imply every photo is resolved.

Apple-only entries can use saved Spotify artist profiles and album/track artwork even when that music has never appeared in the recent-history collector. This is Spotify catalog enrichment of an offline file import, not Apple API access or another listening source.

`scripts/music/enrich-apple-spotify.mjs` now accepts only `--cached-only`, retaining results obtained on October 14. Its authenticated search mode is disabled. Cache data is tied to the normalization run; source timestamps, durations and qualification remain unchanged.

## Matching

- Artists use actual Spotify artist images. Names normalize case, spacing, accents and punctuation. Namesakes require context from already-recorded Spotify artists or matching Apple album credits. Artist cards never borrow an album cover.
- Albums match title and artist credits, preferring the exact edition. A deluxe/remaster/expanded edition can borrow a close cover while retaining its original album identity and release label; live/other version labels are preserved.
- Unknown-artist tracks can be recovered using title, album, duration and non-conflicting artist identities. This phase is pending because Spotify rate-limited the initial pass before it began.
- Status distinguishes matched, ambiguous, no matching candidate from a completed query, and not searched/pending. None of these unresolved states proves absence from Spotify. A review file lists remaining work; images stay placeholders until a reliable match is saved.

`src/lib/music-apple-import.ts` applies the cache behind the existing internal Apple inclusion flag. Unique catalog IDs can unify exact matches; cover-only edition matches do not merge recordings. Enrichment is metadata-only and never invents listening events or duration.

## Run and resume

```powershell
# Apply already-saved responses without any Spotify requests, including during backoff:
node scripts/music/enrich-apple-spotify.mjs --cached-only

# One independent public metadata batch:
node scripts/music/cache-music-artwork.mjs --wikidata --limit 50 --covers

# Continue resumable batches locally (one runner at a time):
node scripts/music/run-artwork-worker.mjs
```

The initial bulk attempt returned 700 successful search responses before an HTTP 429. After offline matching, 194 of 245 named artists and 307 albums have saved matches. Sabaton and Linkin Park both have verified Spotify profile-image URLs. Requests not yet performed, including the unknown-artist track phase, remain pending. Cache/review files and personal catalog data stay out of Git.

**Operational state, October 14:** Spotify supplied a retry time around October 15, 2026 at 22:07:46 UTC (6:07:46 PM Eastern). The shared app backoff is persisted and no further Spotify requests were made after it. This temporarily delays ongoing collection too; the existing ten-minute scheduler resumes after backoff expires. Last successful history collection before the cooldown was October 14 at 22:11:45 UTC. Extended imports must reconcile any resulting coverage gap. Do not clear the backoff or retry early. No automatic follow-up enrichment job was created.

## Historical credential and execution boundary (superseded October 16)

The previous function accepted bounded catalog batches and used the shared lease/refresh credentials. This is disabled as of October 16; the historical `catalog_finish` control action is retained for prior run records but no active artwork path uses it.

The control RPC remains denied to anon/authenticated roles and requires both the service role and collector key. Supabase security advisors show only the existing intentional no-policy informational findings for private tables. No portfolio deployment, new project, storage bucket or paid service was created.

Verification: 26 music tests include namesakes, version-sensitive covers, unknown-artist duration matching, enrichment conservation, duplicate inclusion, token rotation before search, lease release and 429 behavior. Lint, type checking, production build and strict Deno checks passed. The real local API retained exactly 6,924 Apple streams and 1,296,848,377 song milliseconds and returned both requested artist photos.

References: [Spotify Search](https://developer.spotify.com/documentation/web-api/reference/search), [artist profiles](https://developer.spotify.com/documentation/web-api/reference/get-an-artist), [rate limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits).
