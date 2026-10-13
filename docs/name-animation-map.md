# Current name-letter animations

Source of truth: `nameEffects` in `src/components/animated-name.tsx`, with `src/app/name-motion.css`. Chakra Petch 600 uses actual glyph paths and contour edges from `src/content/name-glyphs.json`. S and W last 2600ms; all other effects last 1900ms. Standard delay is 120ms + index × 100ms; W overrides this to 360ms. Reduced motion shows the complete static name.

| Word | Position | Letter | Effect key | Implemented effect |
| --- | --- | --- | --- | --- |
| Spencer | 1 | S | `explode` | Eight clipped pieces explode/rotate into the real glyph |
| Spencer | 2 | p | `water` | Outlined stencil traces, then a rising wave-shaped fill completes the glyph |
| Spencer | 3 | e | `pixels` | Nine pixel tiles assemble into the glyph |
| Spencer | 4 | n | `print` | Left-to-right print reveal with a moving print head |
| Spencer | 5 | c | `dots` | Twenty-five pieces with dot-matrix masks scale into place |
| Spencer | 6 | e | `sand` | Twenty-four pieces arranged in six columns with a sand-grain mask rise into place |
| Spencer | 7 | r | `radar` | Three sweeps reveal successive glyph bands with an outline trace |
| Wilford | 1 | W | `blueprint` | Real contour edge segments grow from lit start points |
| Wilford | 2 | i | `decode` | Alternating skew and opacity resolve the signal |
| Wilford | 3 | l | `binary` | Four vertical binary-rain columns accompany a bottom-resolving glyph |
| Wilford | 4 | f | `graph` | Contour graph segments grow from lit start points |
| Wilford | 5 | o | `integral` | Actual contour trace resolves into the solid glyph |
| Wilford | 6 | r | `search` | Four staggered quadrant pieces lock into place |
| Wilford | 7 | d | `raster` | Twelve staggered vertical raster columns assemble |

The name has one accessible “Spencer Wilford” label; glyph/effect layers are hidden from assistive technology. Temporary SVG layers settle to solid glyphs. Glyph data records the Chakra Petch project copyright. The matching license ships at `public/licenses/Chakra-Petch-OFL.txt`.

Only the Home introduction and “View experience” link use `TypedText`, at 34ms per character with stable pre-laid-out width. Their start delays are 850ms and 1600ms. Header, navigation, and footer remain static. A separate screen-reader string provides complete text, and reduced motion reveals characters immediately.
