# V1 readiness review — October 29, 2026

This review covers the existing portfolio, project demos and public Music Stats. New creative pages, admin tools and experimental displays are outside v1. Spencer completed Search Console setup; indexing is processing.

## Results

| Area | Evidence and result |
| --- | --- |
| Responsive UI | Home, Experience, Projects, Resume, Contact and Music page shells fit 390, 768 and 1440px viewports. Loaded ranking lists exposed an intrinsic grid sizing bug; corrected with a bounded grid column and shrinkable rows. Mobile navigation/disclosures, Escape handling, compact timeframe choices and keyboard chart tooltips were exercised. |
| Project demos | Actual screenshots load directly. Rugby schedule/public content and expand/close work; no admin links are present. THAW's two plain-anchor dashboard CTAs were pointing at the portfolio's missing /dashboard; the source adapter now keeps them in the demo hash router. Full portfolio preview reaches the actual Resume page and PDF. |
| Performance | Sampled public page HTML responses took 0.17–0.29 seconds. Cached stats took 0.08–0.12 seconds; sampled cache misses took 0.72 seconds for Day and 1.34 seconds for Lifetime. These are request samples, not real-device frame-rate measurements or guaranteed cold starts. Inactive demos create no iframe. The background stops while hidden and respects reduced motion in source. |
| Collector | At review, all 144 runs in the preceding 24 hours succeeded; the largest start-to-start gap was about 603 seconds. No current error or backoff. A read-only health endpoint is approved for external email monitoring. Collector code, tokens, scheduling, leases and playback records are unchanged. UptimeRobot monitor 804473283 is enabled and its first external check reported Up. |
| Content | Core pages have a single h1, descriptive metadata and named controls. Contact targets match the supplied profiles/email. Public resume is one page with selectable text; no phone pattern or clearance line was found. THAW's description incorporates the confirmed backend and interface-polish contributions. |
| Search | Canonicals, Open Graph image, Twitter card, robots.txt and six-page sitemap return correctly. Demo pages have noindex headers. Missing routes return 404/noindex. No Search Console changes were made. |
| Recovery | Original Spotify and Apple ZIPs passed archive integrity checks and also exist in private Supabase Storage. Five local SQLite files passed quick_check. The hosted read replica was downloaded read-only, checksum verified and opened in memory: 200,783 records, integrity ok. Current hosted artwork also checksum verified. Recurring backups of new plays are deferred; they were not configured during this review. |

Browser verification used Chromium at responsive viewport sizes. Physical iPhone/Android testing, Safari/Firefox rendering, a full WCAG audit and a simulated production outage were not performed; do not describe these as completed.

## Approved fixes and verification

- Music list columns constrain long track/artist text rather than widening the document.
- THAW dashboard calls to action stay inside the embedded application.
- Artwork-only publication prepares its payload in memory without replacing the catalog archive referenced by the historical manifest. Full publication validates every artifact before any upload. The previously overwritten local pinned catalog archive was restored from its verified private remote copy; current live artwork was not reverted.
- CI now includes the existing survey-scrollbar and showcase-security suites. Publication and health-check regression tests run in the music suite.

Lint, TypeScript and production build passed. Test totals: 53 music/publication/health, 10 scene, 3 scrollbar, 2 showcase security and 10 Python import tests. Python import tests use the existing private Python environment on Windows because the system interpreter lacks tzdata; Linux CI supplies timezone data. Dependency audits found no known production vulnerabilities in the root application or standalone showcase toolchain.

Native Node deployment imports are also checked in CI; the shared saved-data helper uses an explicit .mjs extension so build-time scripts work without the Next.js resolver. Output tracing: music-health contains no private files; music-stats retains only the nine approved site-bundle files. No collector bootstrap or authorization file is included in either function.

## Collection alert operation

`GET /api/music-health` reads the existing hosted saved-data snapshot using the website's read-only key. It returns only a status: HTTP 200 / ok, or HTTP 503 / stale or unavailable. More than 30 minutes since the last successful collection is stale. The latest song timestamp is never used, so not listening does not cause an alert. Reads are coalesced/cached for up to a minute; the HTTP cache is bounded to 30 seconds without stale-while-revalidate. Monitor checks may therefore lag the threshold by their polling interval plus the bounded caches.

The endpoint cannot call Spotify or control collection. Per-instance request limits and existing platform protections apply. The external monitor should check every five minutes and email sawilford2006@gmail.com for down/up status. The enabled monitor is [Spencer Site - Spotify collection](https://dashboard.uptimerobot.com/monitors/804473283). Its dashboard showed Up after a successful external HEAD check, with five-minute polling and the configured email contact. A test-notification request was triggered; receipt in the email inbox was not independently checked.

If alerted: inspect the private collector status and recorded error first. Respect provider retry times. Do not clear backoff, restart authorization, or disable collection merely to refresh artwork. If site health is unavailable while the collector is healthy, investigate website/read-key/snapshot access independently.

## Recovery and rollback runbook

1. **Frontend regression:** select a previous Ready production deployment for spencer-site in Vercel and roll back, or revert the offending Git commit and deploy through the existing pipeline. Verify Home, Projects, the PDF, Music Stats and collection health afterward. This does not roll back or restart the independent Supabase collector.
2. **Historical display artifacts:** retain the original archives and normalized SQLite files. Rebuild the compact replica with `python scripts/music/prepare-hosted-history.py`, verify conservation, then publish with `node scripts/music/publish-hosted-history.mjs`. Update the production history manifest and deploy only when deliberately replacing historical assets. Publish current display artwork with `--artwork-only` afterward if necessary. Owner write credentials remain private and never belong in the website.
3. **Artwork problem:** retry only the independent artwork publisher/worker. Its payload is separate from the pinned historical manifest; no history reimport or collector shutdown is needed.
4. **Collector outage:** fix the diagnosed authorization/provider/scheduler problem without deleting existing records. Recent-history collection cannot guarantee recovery beyond Spotify's available recent entries. A later extended-history export can be reimported and reconciled through the existing process; requesting it is a manual recovery path, not an automatic backup.
5. **Backup scope:** existing local/cloud original imports and the verified compact replica protect the imported period. They do not constitute a recurring independent backup of new collector records, database settings or credentials. Such a backup remains optional/deferred for v1 after discussion with Spencer. Never run a destructive production restore as a verification test.

Longer-term watch item: the saved live-data snapshot has a 25,000-record limit. This is well above the current live-record count, but historical reconciliation/archival should be revisited before reaching it.
