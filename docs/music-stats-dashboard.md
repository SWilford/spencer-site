# Music Stats dashboard

Documentation captured October 14, 2026. This surface extends the existing site under `PRODUCT.md`, `DESIGN.md`, and `.impeccable/music-stats-contract.md`. The established design system and `.impeccable/design.json` remain unchanged.

## Confirmed scope

The user authorized public listening summaries and rankings. `/music` now presents those aggregates from saved Spotify records through `/api/music-stats`; it is no longer a loopback-only private preview. The portfolio remains unpublished. Individual playback history, event timestamps, original imports, exports, credentials, administration, and collector controls remain private. Hosted owner authentication remains future work.

The supplied Apple archive is preserved and staged; its segments are not counted in dashboard totals. Extended Spotify history is pending. Lifetime describes the available saved snapshot, not complete lifetime listening history. Experimental displays remain later work.

## Implemented surface

The heading is **Music Stats**, with functional Stats and Top Artists view buttons and a **Last collected** timestamp in Eastern time. The simplified surface has no explanatory subtitle, private-preview badge, refresh button, or visible duration-warning panel.

Both views share one sticky timeframe control. Day, Week, Month, Year, and Lifetime are direct choices; More contains Past year, Year to date, and Custom. Previous/next controls navigate day, week, month, and year. Weeks begin Monday, custom endpoints are inclusive, Past year covers 365 calendar dates, and current calendar periods end on the saved snapshot's Eastern date. The API validates dates and limits a requested range to 30 years. Changing the range hides the preceding range's results while the new request is pending or fails.

Stats includes:

- Eight metric tiles: streams, different tracks, minutes, different artists, hours, different albums, days of listening, and active days. Eligible non-Lifetime metrics show change against the preceding period of the same length when prior data supplies a denominator.
- Two 24-hour listening clocks, for streams and minutes, using America/New_York.
- Average streams and minutes per calendar day, including dates without saved plays.
- Daily and Cumulative charts, each showing streams and minutes together. Ranges exceeding 730 dates use monthly chart bins; each chart's expandable Chart data table matches the plotted values. A single-date series has visible points.
- Streams by weekday, month, and year. A year bar remains visible when the selected data contains only one year; no year section is rendered when there are no year rows.

Top Artists opens artwork-led rankings with Artists selected. Tracks, Artists, and Albums each support listening-time or stream-count sorting, list or grid layouts, and three, four, or five grid columns. Thirty results appear initially; Show more adds thirty. The column selector remains available on small screens. Track links open Spotify where available; artist artwork is associated album artwork rather than an asserted artist portrait. Empty rankings show a timeframe-specific message.

The public ranking projection includes the union of the top 200 entities by time and top 200 by count for each ranking kind. It does not expose an unlimited catalog. Ties use name ordering.

## Evidence and interpretation

The UI's **streams** are saved playback entries, not verified complete listens or a duration-qualified stream definition. Track identity follows provider identity, so different versions can remain distinct. Artist collaborations credit each artist; artist totals overlap. Overall listening counts each entry once. Distinct album totals require known album IDs; rankings can retain unknown albums.

Time aggregation prefers actual duration when available, then falls back to song length; unknown duration contributes no invented time. Recent Spotify records provide song lengths, so minutes, hours, days, and time rankings can overstate listening after skips or pauses. The public payload retains machine-readable `timeBasis`, and time tiles, minute charts/clocks, and ranking values retain title-tooltip provenance. There is no measured-only selector or qualification-threshold control in this surface.

Records belong to their playback timestamp's Eastern date/hour; estimates are not distributed across elapsed clock intervals. Empty dates mean no saved records, not confirmed silence. Period comparisons do not establish equal collection coverage.

The protected snapshot query selects the latest 25,000 saved plays. Its truncation flag becomes the public payload's `partial` flag, without a visible warning panel. Earlier records can remain stored while summaries, Lifetime, earliest date, and rankings describe only the returned snapshot. This cap and pending imports limit completeness.

## Access and data path

The public route reads a saved snapshot through the protected collector function's dashboard action, then serializes an explicit aggregate allowlist in `src/lib/music-public.ts`. The browser receives summary and previous-period totals, date-level series, hourly/weekday/month/year aggregates, freshness, range metadata, provenance/partial flags, and ranking metadata. It receives no individual plays, private record IDs, per-play timestamps, tokens, or collector controls. Requested range dates and collection freshness are intentionally public metadata.

`MUSIC_COLLECTOR_KEY` and `MUSIC_SUPABASE_PROJECT_ID` are server-only configuration. For local development the route can fall back to the ignored `private-data/music/collector-bootstrap.json`; do not commit that file or credentials. No public Supabase RPC was introduced. The protected snapshot RPC remains behind the server and collector action.

The server caches the saved snapshot for 60 seconds. Successful aggregate responses use `Cache-Control: public, max-age=30, s-maxage=60`; validation and unavailable responses use `no-store`. A visible open page rerequests saved statistics every 60 seconds. The public route never triggers Spotify collection; scheduled ingestion remains independent. Operational details are in `music-collector.md`.

## Visual inheritance and responsive behavior

The surface keeps the site's Manrope, warm charcoal, dusty red, page chrome, background field, cursor, and transitions. Numbers, charts, and artwork carry its hierarchy. The user-supplied stats.fm screenshots guide composition and functionality within the existing visual world.

Local exceptions are intentional: rounded metric tiles, quiet charcoal content grouping, compact controls and type, a sticky range bar, and rounded artwork/list surfaces. These implement the explicit dashboard reference; they do not replace the site's open foreground rule or become global tokens. Metric tiles use four columns at wide widths and two below 1000px. Daily/cumulative and weekday/month chart pairs stack below that breakpoint. Below 680px, the title shrinks, view-button text hides, the range controls wrap, and ranking options occupy a second row. Long bar sets scroll horizontally inside their section.

Controls expose labels and pressed states. Clocks and line charts have accessible names; short line series support focus readouts, and both line charts supply captioned data tables for keyboard and assistive-technology access. Bar labels and values remain text in the document. Custom inputs and selects retain visible focus styling. Reduced-motion disables dashboard transitions. These source features do not by themselves constitute a full accessibility audit.

## Documentation and review evidence

This pass read the contract, product/design authorities and sidecar, `src/app/music/page.tsx`, `src/components/music-stats-view.tsx`, `src/app/music/music-simplified.css`, `src/lib/music-public.ts`, `src/lib/music-stats.ts`, `src/app/api/music-stats/route.ts`, and the protected snapshot query. It did not read private data or secrets, run checks, or repeat browser interaction.

The final implementation handoff reports eleven passing music tests and successful post-fix lint, typecheck, and production build. The fresh finish reviewer confirmed that three identified P2 issues are resolved: one-year bars, stale range results, and line-chart data accessibility. This is a fix-scoped verdict, not approval of every surface or a full accessibility audit. The reviewer also confirmed a clean four-column ranking recapture after the earlier capture contained sticky-filter/focused-skip-link artifacts. The handoff reports a successful production HTTP response with the public cache header, all three ranking kinds, and no raw plays or selected records; an invalid-date request returned HTTP 400. The production build was restarted locally for verification; no hosting deployment occurred.

Reported browser evidence is saved locally in `.impeccable/review/`: `simple-stats-desktop.png`, `simple-stats-mobile.png`, `simple-top-desktop.png` (four columns), `simple-top-five-desktop.png` (five columns), `simple-top-mobile.png` (three columns), and `simple-list-mobile.png`. This document records the supplied capture inventory without claiming independent visual verification.

Documentation covers the current public aggregate surface and its implementation limits. Portfolio publication, owner administration/authentication, reconciled Apple data, extended Spotify imports, and experimental displays remain pending.
