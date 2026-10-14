# Music Stats dashboard

Documentation captured October 14, 2026. This is an ordinary extension of the existing site, governed by `PRODUCT.md`, `DESIGN.md`, and `.impeccable/music-stats-contract.md`. It does not replace the site's visual system. `DESIGN.md` and `.impeccable/design.json` remain unchanged.

## Confirmed scope

The user confirmed **Music Stats**, **America/New_York**, and regular statistical displays now, with fun experiments later. `/music` presents real saved Spotify history in a private local preview. The portfolio remains unpublished. Hosted owner authentication, public statistics selection, and public sharing are future work.

The Apple archive is preserved and staged for reconciliation; its playback segments are not included in dashboard totals. The extended Spotify history export is still pending. “All connected sources” currently contains the available Spotify records only. “Lifetime” means records available to this preview, not the owner's complete lifetime listening history.

## Implemented surface

- Heading, private-preview status, collection freshness, and a refresh action that rereads saved statistics.
- Independent summary and top-list ranges: Day, Week, Month, Year, Past year, Year to date, Lifetime, and Custom. Year accepts a selected year; custom dates are inclusive. Week begins Monday; Past year covers 365 calendar dates. Current-period ranges end on the snapshot's Eastern date.
- An open overview strip for recorded plays, estimated or measured listening, distinct tracks, artists, known albums, and active days. Supporting metrics cover qualified streams, listening duration expressed in days, and daily averages with calendar-day or active-day denominators.
- Daily or cumulative activity, switchable between recorded plays and listening minutes. Ranges exceeding 370 dates use monthly visual bins while the expandable table retains daily data.
- A 24-hour listening clock and weekday/month/year patterns using the summary range and Eastern time with daylight saving changes.
- Tracks, artists, and albums ranked by recorded plays or listening time; ten rows initially, with ten more on demand. Saved album artwork accompanies rows; artist artwork is explicitly an album-art fallback. Available track links open Spotify.
- Coverage and preceding-period comparison with explicit coverage qualifications, plus loading, error/retry, empty-range, and unavailable-time states.

## Evidence and interpretation

Recorded plays count saved playback entries. They are not verified complete listens. Track identities remain provider identities, so different Spotify versions remain distinct. Collaborations credit each artist; artist totals overlap, while overall listening time counts each entry once. Album counts require known album IDs.

The default time view is **Song-length estimates**. Recent Spotify history supplies song duration, not the duration actually listened; skipping and pausing can make those estimates too high. When a measured duration exists, aggregation uses it before falling back to song length in estimated mode. Unknown duration preserves the recorded-play count and contributes no invented time.

**Measured only** never substitutes song length. No measured Spotify listening duration is currently available, so time and qualified-stream fields show unavailable states. The editable qualification threshold is a local analytical control, not a confirmed universal stream definition. Qualified streams require measured-duration evidence regardless of the selected time view.

Charts assign records to their playback timestamp's Eastern date/hour; they do not distribute an estimated song across elapsed clock intervals. Empty dates indicate no saved records, not confirmed silence. Daily averages use inclusive range dates or days with records, as selected. Period comparison is qualified because collection coverage can differ.

The snapshot is capped at the latest 25,000 saved plays. When truncated, the interface warns that earlier records remain stored and lifetime totals in the preview are partial. Freshness is based on the last successful collection, with delayed collection indicated after 30 minutes. An open visible page rereads the saved snapshot once per minute; collection runs independently every ten minutes.

## Access and data path

The browser requests `/api/music-stats` with caching disabled. The server requires `MUSIC_LOCAL_PREVIEW=1`, a loopback host, compatible same-origin request headers, and no Vercel hosting marker. Forwarded-header mismatches and non-loopback hops are rejected. The preview server must bind to loopback. These controls support this local preview; hosted private access requires owner authentication first.

The server calls the existing protected collector function's dashboard action to read its saved snapshot through a service-role-only database RPC. That action does not fetch listening history from Spotify or trigger collection. Credentials stay server-side; private source files, snapshots, and original imports must stay out of Git and build output. API responses use `Cache-Control: private, no-store`; the route metadata also disables indexing. Indexing metadata is supplementary, not access control.

The scheduled collector remains the independent ingestion path. Operational details and import-reconciliation constraints are documented in `music-collector.md`.

## Visual inheritance and responsive behavior

Music Stats inherits Manrope, the charcoal neutrals, and dusty-red accent family from the site. Accent identifies estimates, chart marks, interaction states, and selected controls. Existing page chrome, background geometry, cursor behavior, and transitions remain the site's authority.

The dashboard adds compact controls, tabular numerals, a wide activity plot, an adjacent listening clock, and artwork-led rankings. Quiet charcoal chart surfaces keep data legible over the persistent background. This density and grouping are local to the statistics surface; they are not a new global card or typography system.

At the dashboard's narrower breakpoints, metrics reduce from six columns to three and then two; main chart/list columns stack, controls wrap, and the sidebar becomes a single column on small screens. Small-screen inputs have a 44px minimum height, custom date fields stack, and SVG labels increase their internal sizes for readability. Controls have labels, selected segment state uses `aria-pressed`, charts have accessible names, the daily table is expandable, and reduced-motion disables dashboard transitions.

## Documentation and review evidence

Checked directly for this document:

- Product and design authorities: `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, and `.impeccable/music-stats-contract.md`.
- Surface implementation: `src/app/music/page.tsx`, `src/components/music-dashboard.tsx`, and `src/app/music/music-stats.css`.
- Aggregation and access boundaries: `src/lib/music-stats.ts`, `src/lib/music-local-access.ts`, and `src/app/api/music-stats/route.ts`.
- Existing operational documentation, package scripts, and the invented-fixture cases in `tests/music-stats.test.mjs`.

The implementation handoff reports nine passing music tests, successful lint/typecheck/production build, successful separate Deno checking, desktop/mobile captures, and two resolved finish-review corrections. This documentation pass did not rerun those checks or independently repeat the browser review. Review captures are available at `.impeccable/review/desktop.png` and `.impeccable/review/mobile.png`; no private data or secrets were read for this pass.

Advisory design drift remains visible in the source: the dashboard introduces compact local type sizes and weights outside the root typography roles, 5px control/artwork radii, and 12px chart/error-panel radii. The root design describes open foreground content and narrower rounding roles. These are recorded as surface-level drift for later review, not promoted into normative tokens or repaired here. The documentation leaves `DESIGN.md` and its sidecar intact.

**Documentation verdict:** complete for the implemented local preview, with source-backed behavior and explicit provenance, coverage, access, and review limits. Hosted access, reconciled imports, public sharing, and experimental displays remain pending.
