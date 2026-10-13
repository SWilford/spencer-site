# Motion choices and implementation status

Approved baseline: checkpoint-home-magnetic-v1 at d057f7e. Current implementation adds transparent glass navigation and viewport-sized grid coverage. The user approved individual-letter replay, summary-word emphasis, and a foreground door transition. The remaining alternatives below remain proposals.

## Ten hero text effects
1. Individual letter replay: hovering a letter replays its existing authored effect; brief cooldown avoids constant restarting.
2. Cursor light: a soft local highlight crosses actual glyph shapes.
3. Precision tilt: small local 3D tilt returns to rest.
4. Scan pass: one thin sweep briefly traces the text, then settles.
5. Particle lift: tiny fragments lift from glyph edges and return without hiding the letter.
6. Contour echo: a faint duplicate outline trails the cursor behind the solid glyph.
7. Elastic spacing: nearby letters gently part and return; layout width stays reserved.
8. Blueprint reveal: the hovered letter briefly shows its real contours and construction nodes.
9. Word emphasis: hovered summary words brighten and lift by 1px.
10. Depth drift: a very slow, tiny shadow/depth change during idle; avoid continuous moving body copy.

Implemented: option 1 on the name (mouse entry/touch tap,4200ms initial guard,duration+750ms per-letter cooldown,zero-delay replay) and option9 on summary words (foreground emphasis/1px lift over180ms). Reduced motion disables replay and lift. Idle motion remains off.

## Page transition options
1. Foreground crossfade: old/new content fades while header and canvas continue.
2. Short depth exchange: incoming content approaches from slightly farther away, no full-screen zoom.
3. Directional drift: a small horizontal motion follows navigation direction.
4. Shared title: selected navigation label visually becomes the next page title.
5. Fine scan wipe: one narrow muted-red scan reveals the next foreground.
6. Block dissolve: small staggered tiles reveal the incoming content, echoing buttons.
7. Glass veil: a brief translucent foreground wash clears into the next page.
8. Editorial handoff: heading arrives first, then copy and media, with a short total sequence.
9. Masked slide: content passes through a fixed invisible aperture.
10. Shared media: a project thumbnail expands into its detail-page media.

Implemented transition: a stable React19.3 ViewTransition named page-content wraps foreground children only. Header and canvas continue outside; html has no root snapshot. The left45% pivot uses160vw perspective. Exit rotates-52deg/translates16vw and fades over280ms (opacity1 initially,.1 at40%,0 by60%); arrival starts48deg/-10vw and completes over400ms after150ms (total550ms). Reduced motion uses no animation; unsupported browsers navigate normally. Other listed options are unimplemented alternatives. Validation passed: full lint, TypeScript checks, and production build. Browser checks confirmed all 14 letters and both typed strings complete; returning to Home preserves the final character at opacity 1. S replay increments only its own counter, summary hover reaches foreground color with a -1px Y transform, and door pseudo-animation names appear during navigation. No browser errors were observed; a 390px mobile viewport had no overflow and computed blur(16px) saturate(1.1).

The stable page-content ViewTransition uses update="door" without a pathname key, preserving cached child state. Replay readiness initializes only while empty, so cached-page Activity visibility does not restart the name’s introduction guard. Browser observation confirmed actual door-depart/door-arrive pseudo animations during navigation; the latest timings reduce overlap.

Completed animations remain settled across cached-page visibility changes. TypedText records completion on its last character’s animation end and disables later typing animations. AnimatedName tracks completion separately for all 14 letters: the final raster/search piece, final binary column, or solid glyph is the terminal event. Completed letters hide decorative animation and keep the solid glyph visible; intentional replay clears only that letter’s completion and increments its key. This preserves full staggered-piece durations while preventing CSS animation restarts when a cached Activity becomes visible.
