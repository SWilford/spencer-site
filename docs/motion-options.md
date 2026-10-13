# Motion explorations - proposals, not implemented

Approved baseline: checkpoint-home-magnetic-v1 at d057f7e. Current trial adds glass navigation and viewport-sized grid coverage. Name and page-transition proposals below remain choices for Spencer.

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

Preferred starting set: 1 on the name and 9 on summary words. Leave idle motion off initially. Keep complete text readable, touch usable, and reduced-motion alternatives.

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

Preferred starting set: 1 with a restrained amount of 2; reserve 10 for project details. Target 220-300ms for routine navigation, preserve keyboard focus and browser history, and never hold navigation waiting for a flourish. Avoid new loops or replaying the entire name on every page change. Actual implementation must follow installed Next/React support rather than assuming a transition API.
