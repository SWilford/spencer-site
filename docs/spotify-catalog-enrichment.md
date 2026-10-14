# Spotify metadata for the one-time Apple import

Apple-only entries can use saved Spotify artist profiles and album/track artwork even when that music has never appeared in the recent-history collector. This is Spotify catalog enrichment of an offline file import, not Apple API access or another listening source.

`scripts/music/enrich-apple-spotify.mjs` builds a resumable, ignored `private-data/music/apple/spotify-enrichment.json`. Searches run only from this owner-operated script. Public page/API requests read saved matches and never invoke catalog searches or collection. The cache is tied to the normalization run and written atomically; source files, reported durations, stream qualifications and timestamps remain unchanged.

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

# After the saved retry time, perform a small bounded batch (40 lookups by default):
node scripts/music/enrich-apple-spotify.mjs --max-lookups 40
node scripts/music/enrich-apple-spotify.mjs --cached-only
```

The initial bulk attempt returned 700 successful search responses before an HTTP 429. After offline matching, 194 of 245 named artists and 307 albums have saved matches. Sabaton and Linkin Park both have verified Spotify profile-image URLs. Requests not yet performed, including the unknown-artist track phase, remain pending. Cache/review files and personal catalog data stay out of Git.

**Operational state, October 14:** Spotify supplied a retry time around October 15, 2026 at 22:07:46 UTC (6:07:46 PM Eastern). The shared app backoff is persisted and no further Spotify requests were made after it. This temporarily delays ongoing collection too; the existing ten-minute scheduler resumes after backoff expires. Last successful history collection before the cooldown was October 14 at 22:11:45 UTC. Extended imports must reconcile any resulting coverage gap. Do not clear the backoff or retry early. No automatic follow-up enrichment job was created.

## Credential and execution boundary

The existing protected `spotify-collect` function now accepts bounded catalog batches (up to 20 queries, search limit 10, US market). It uses the existing lease and stores refresh-token rotation before searching; credentials never return to the script/browser. `catalog_finish` releases the fenced lease and records catalog status without advancing playback cursors or changing collection freshness. A due history sync takes priority over catalog batches. A 429 persists shared application backoff; other catalog failures do not claim successful history collection.

The control RPC remains denied to anon/authenticated roles and requires both the service role and collector key. Supabase security advisors show only the existing intentional no-policy informational findings for private tables. No portfolio deployment, new project, storage bucket or paid service was created.

Verification: 26 music tests include namesakes, version-sensitive covers, unknown-artist duration matching, enrichment conservation, duplicate inclusion, token rotation before search, lease release and 429 behavior. Lint, type checking, production build and strict Deno checks passed. The real local API retained exactly 6,924 Apple streams and 1,296,848,377 song milliseconds and returned both requested artist photos.

References: [Spotify Search](https://developer.spotify.com/documentation/web-api/reference/search), [artist profiles](https://developer.spotify.com/documentation/web-api/reference/get-an-artist), [rate limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits).
