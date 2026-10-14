# Music Stats

Mode: Operate. Refine the established charcoal/dusty-red site using the user's seven stats.fm screenshots as layout references. Preserve the homepage, background shapes, cursor, and transitions.

## Direction contract

THESIS: A simple listening dashboard with numbers, charts, and artwork carrying the interface. No explanatory subtitle, private-preview badge, refresh button, or visible duration-warning panel.
OWN-WORLD: Existing Manrope, charcoal surfaces, muted red chart marks and selected controls; quiet rounded metric tiles follow the explicit reference.
STORY: Visitors choose one timeframe, inspect Stats, then switch to Top without losing that range. Collection freshness stays visible.
FIRST VIEWPORT: Music Stats title with bar-chart Stats and rising-line Top buttons; Last collected below; shared sticky date navigation; metric tiles or ranking controls beneath.
FORM: User-directed refinement of the existing dashboard; code-led with supplied screenshots as functional/compositional references, not exact cross-brand replicas. Two listening clocks, averages, daily/cumulative charts, weekday/month/year bars; Tracks/Artists/Albums with time/count sorting and list or 3/4/5-column grids.
FINISH: unreviewed and undocumented is unfinished.

Data: Saved Spotify records only for now; Apple remains staged, extended Spotify history pending. Eastern dates/hours; daily averages include inactive calendar dates. Duration provenance stays in internal data and title tooltips. Public aggregate projection is explicitly authorized; raw events, timestamps, exports, administration, tokens, and collector controls stay private. Public browsing never calls Spotify collection. Portfolio publication remains unauthorized.

Verification: public allowlist, timezone/date ranges, sorting, shared range state, mobile overflow, desktop/mobile captures, fresh finish review. Preserve DESIGN.md and its sidecar; document this surface's local exceptions.


## October 14 interaction refinement

Use Top rather than Top Artists in view navigation; hide secondary control text at compact widths. Extended widths expose all date choices, normal widths use a restrained anchored overflow menu, compact widths put secondary dates behind a three-line icon. No native select styling. Funnel controls ranking sort; one layout button cycles 3/4/5/list with responsive defaults (5 extended, 4 normal, 3 compact). Keep sticky filter and menu positioning coherent. Clocks highlight hour sectors with floating time/value tooltips; charts use a crosshair, highlighted points, and floating date/value bubble. Keyboard arrows inspect every value without visible chart-data disclosures. Month bars always fit available width. Maintain the existing palette and typography. Voronoi navigation experiments with opaque charcoal sector veils and thin red seams disappearing as matching sectors decode; keep existing timing and reduced motion. This is interface alignment, not a Git branch rebase or a new visual world.

Implemented behavior: extended means at least 1280px, normal is 681–1279px, and compact is at most 680px. Compact direct dates are Day/Month/Lifetime; its overflow also includes Week and Year. Sort and date disclosures close on selection, outside interaction, focus departure, or Escape; closed contents are inert. Clock and chart SVGs support Left/Right and Home/End inspection with live value readouts, and Escape clears the highlight. The minutes clock and chart bubbles also display hours. Responsive grid defaults apply until an explicit layout choice; the single control cycles 3 → 4 → 5 → list → 3. Month bars fit their container, using abbreviated visible labels on compact screens.

Finish evidence: final lint, typecheck, production build, and three existing sector-decode tests passed according to the implementation handoff. The fresh scoped finish review passed; desktop/phone interaction captures are recorded in docs/music-stats-dashboard.md. The transition capture verifies settled cleanup only, with no in-flight visual claim. This pass did not alter backend access or data projection, publish the portfolio, or promote dashboard styling into DESIGN.md or its sidecar.
