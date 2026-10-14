# Spotify collection bootstrap

Updated October 14, 2026.

## Confirmed direction

Spencer currently listens on Spotify. Apple Music history covers a break of a couple of months. Request Spotify Extended Streaming History now and begin prospective collection while the export is prepared. Do not assume the export ends at its request date: inspect its actual coverage on arrival and reconcile overlapping evidence without counting the same play twice.

The user created and authorized the dedicated `spencer-music` project in `spencer-personal`. The rugby organization and its existing website project remain untouched. The portfolio remains unpublished.

Use Supabase Postgres for collected records, Supabase Vault for refresh credentials, and a scheduled Supabase Edge Function for recent-history collection. Supabase supports scheduling functions through pg_cron and pg_net. This removes the immediate need for Vercel deployment and a separate scheduler. Initially target one run every ten minutes (4,320 runs per 30 days); actual quotas and end-to-end reliability must be checked before activation. Rate limits, unavailable recent history, offline listening, and outages can still produce gaps. A free project is not an uptime guarantee.

Supabase Storage is the preferred initial private export store, subject to real file sizes. Free currently includes 1 GB storage and a maximum 50 MB per file. R2 is optional if original exports or other media exceed those limits; do not alter or discard originals to fit a limit. Local private originals suffice while imports are developed.

## Prepared locally

- `scripts/music/connect-spotify.mjs`: a ten-minute loopback OAuth callback with PKCE, random state, minimal recent-history scope, no client secret, and no token logging. Saves authorization only to Git-ignored `private-data/music/spotify-authorization.json`. This is a local secret file; do not upload or commit it. Existing authorization is never silently overwritten.
- `scripts/music/spotify-client.mjs`: token exchange, refresh-token preservation, and bounded recent-history pagination. Raw pages are preserved in memory; track duration is never relabeled as listening duration. Unexpected pagination origins/paths, redirects, repeated URLs, and malformed pages fail closed. Rate-limit errors preserve Retry-After for the future runner.
- `npm run test:music`: focused security/provenance tests using invented fixtures only.

## Live collector

The private collector is deployed in the dedicated project. Spotify authorization, real token refresh, first collection, a zero-duplicate rerun, and a scheduler-triggered run were verified on October 14. The permanent schedule runs every ten minutes through Supabase pg_cron/pg_net. A temporary one-minute verification schedule was removed after its successful end-to-end run.

Private tables store raw API pages, recorded plays, cursor/backoff, and fenced run leases. Refresh tokens live in Vault. The hosted function uses its built-in service-role credential internally; this credential is never returned to the local helper or public client. The endpoint implements its own random bearer-key authentication, so platform JWT verification is intentionally disabled. The database RPC is executable only by service_role; anon and authenticated roles have no table/schema or control-function access. RLS is enabled with no allow policies, deliberately denying ordinary clients.

Song length is saved as a full-song estimate; measured listening duration and qualified-stream status stay null for recent-history records. The public aggregate dashboard is documented in `music-stats-dashboard.md`; full import reconciliation and a coverage guarantee remain unavailable.

Artist metadata is stored privately in `music_private.artist_profiles`, with retry state in `music_private.artist_catalog_state`. After history commits durably, the collector requests up to 40 missing or stale profiles with three workers through Spotify's single-artist `GET /v1/artists/{id}` endpoint; it avoids the deprecated several-artists endpoint. Profile metadata, including validated image URLs, is cached for seven days. A 404 caches a missing image for that interval; a 429 stops further work and defers metadata requests using Retry-After, bounded to 60 seconds–24 hours. Other metadata failures also defer work. Metadata failure cannot turn committed history into a failed collection. Dashboard reads use stored metadata only and make no Spotify API requests; missing profiles remain neutral placeholders without album-art fallback.

The original Apple ZIP is backed up in the private `music-imports` bucket. Its checksum is validated before upload, and the stored object's byte length was verified. Its reports have also been staged locally in Git-ignored SQLite with an audit JSON. Local staging preserves starts, end segments, lyric events, daily rows, conflicts, and original timestamps without merging overlapping reports. Apple end segments are not automatically counted as streams. Library/identifier metadata remains preserved inside the original ZIP for the catalog-matching phase.

The supplied database password was not needed for this setup and was not saved. After successful hosted handoff, remove the temporary local Spotify authorization file. The local collector bearer key remains in Git-ignored `private-data/music/collector-bootstrap.json` for private operational commands.

Commands from the repository:

```sh
node scripts/music/hosted-collector.mjs status
node scripts/music/hosted-collector.mjs collect
```

`status` reports connection, last success, last error, backoff, and recorded-play count. `collect` is a private manual trigger, not a public-page action. A project pause, revoked authorization, or outage requires intervention; no off-platform alerting is configured yet.

## Verification and schema sources

- `supabase/music-collector.sql` is the initial schema template, with a placeholder key hash. It must not be rerun on an existing project.
- `supabase/music-schedule.sql` records the dedicated project's schedule/bucket setup and initial pg_net namespace correction. Do not rerun the extension reinstall after activation.
- `supabase/music-artist-profiles.sql` records the private profile cache, metadata retry state, and service-role-only catalog RPC. The supplied live verification reports 38 profiles with 38 images and denied RPC execution for anon and authenticated roles. RLS remains enabled without allow policies; the advisor reported only the intended no-policy informational findings. Collector version 6 is deployed with 404/Retry-After handling. A repeat real collection inserted zero plays and updated zero profiles, confirming duplicate protection and cache reuse. Final verification passed twelve music tests, lint, typecheck, production build, and strict Deno checking.
- `supabase/test-collector.sql` runs rollback-only fixtures covering duplicate ingestion, duration provenance, concurrent leases, stale writes, persisted backoff, and anonymous access isolation. No synthetic plays remain in the database.
- `tests/test_apple_archive.py` covers exact duplicates, conflicting event IDs, exclusion of lyric durations, preservation of original UTC timestamps across a DST boundary, null stream counts, repeat-import idempotence, and unsafe archive paths. It does not yet test analytics timezone conversion or Spotify/export reconciliation, which are not implemented.
- `npm run check` verifies lint, site typechecking, and production build. Supabase/Deno functions are separate from the Next.js TypeScript compilation.
- The deployed Edge Function also passes strict checking with `npm exec --yes --package=deno@2.9.6 -- deno check --config supabase/functions/spotify-collect/deno.json supabase/functions/spotify-collect/index.ts`.

## Connect locally

1. Create `spencer-music` in the Spotify Developer Dashboard, selecting Web API. Register exactly `http://127.0.0.1:43821/callback` as a redirect URI. Use an explicit loopback address, not localhost.
2. Supply the public Client ID through the `SPOTIFY_CLIENT_ID` environment variable, then run `npm run music:connect` in this repository.
3. Open the printed Spotify authorization link and approve access as Spencer. The callback saves tokens privately; they never appear in the terminal or browser response.
4. Transfer the refresh credential to the dedicated project's Vault through a private setup path. Do not paste tokens into chat, SQL tooling outputs, or committed migration files. Remove the local token file after a verified hosted handoff.

The client ID is public. The refresh token is a secret. The helper must be running on this computer when approving the loopback callback.

## Before scheduled collection is considered live

1. Select the personal organization explicitly and verify the project quote is free before creation. No paid upgrade without authorization.
2. Create private ingestion tables with no public access, run/lease state, durable raw source records, and separate duration evidence. Store timestamps in UTC, retaining original source values.
3. Implement the hosted runner with protected invocation, atomic lease and fencing, refresh-token rotation persisted before further requests, bounded API work, overlap queries, idempotent record persistence, and cursor advancement only after durable writes. A raw-response snapshot and normalized event identity serve different purposes; do not deduplicate legitimate repeat plays using track ID alone.
4. Preserve rate-limit backoff across invocations and surface revoked authorization, missed runs, cap exhaustion, and suspected coverage gaps. Never log provider bodies containing secrets or full listening history.
5. Run an immediate real collection; verify saved records, a no-duplicate rerun, access isolation, and a subsequent scheduler-triggered run. Confirm a future run succeeds after an access-token refresh.
6. Provide a private freshness/health check before relying on collection. Record the verified start time and coverage limitations.

## Import reconciliation

Recent-history timestamps and export timestamps can have different semantics. Spotify documents extended-history timestamps as stream end times; do not match them blindly against API played_at. Inspect source semantics, identifiers, duration, ordering, and plausible intervals, retaining ambiguous matches for review. Keep import records immutable and evidence linked; never add an export duration and a song-length estimate as two listening sessions. Unknown/estimated durations must remain distinguishable from export-reported played milliseconds.

Apple is a one-time supplied-file import only: no Apple API, login or automatic collection is needed or planned. Its local, versioned reconstruction pipeline now feeds Music Stats behind the internal inclusion switch; see [Apple import processing](apple-import.md). Spotify is the sole ongoing collector.

## Primary references

- [Spotify PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [Spotify redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri)
- [Spotify recent history](https://developer.spotify.com/documentation/web-api/reference/get-recently-played)
- [Spotify extended export fields](https://support.spotify.com/us/article/understanding-your-data/)
- [Supabase scheduled functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase storage file limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
