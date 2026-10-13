---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/wireframe-background.tsx","src/components/site-header.tsx"]
---

# Homepage draft

Visitor mode: Experience. Professional portfolio first; experience and resume before projects. Source content is Spencer's supplied resume; no phone number or clearance detail published. Creative content is explicitly unfinished.

## Direction contract

THESIS: Open professional content lives over an autonomous tactical graph. Only the background is griddy.
OWN-WORLD: Sampled charcoal #242426, warm red #c77370/#dd8b87, warm gray #ede8e8; Manrope content and Chakra Petch name, unframed text and asymmetric space. Angular lines and nodes belong to a separate canvas.
STORY: Home introduces Spencer alone. Experience, projects, resume, and contact remain separate routes; none are stacked on Home. Creative destinations are unsettled: For fun currently shows only “More to come.” Existing creative pages remain untouched pending the user’s direction. Decorative content icons are excluded.
FIRST VIEWPORT: Full-width spatial graph behind a left-aligned animated name, credentials “CS @ JMU | Prev. SWE at NSWCDD, NGA”, a four-sentence summary, and four static links: Experience, Projects, Résumé, Contact. No portrait is added without an asset. A compact text-only header carries Home, Experience, Projects, Resume, Contact, For fun, and right-aligned social icons. The approved fourteen name effects remain unchanged, then settle to readable letters.
FORM: Approved open-layout-v6 comp, evolved from seed 6c71a9ea. The user approved this look and requested a first code draft to evaluate feel, explicitly changing the name and header. This session builds a flexible interactive translation for review; the image remains the visual reference and source of layout/material discipline.
FINISH: documented and verified. Full lint, types, and production build pass. Browser checks confirm completed lettering/typing persist after return, isolated S replay, summary hover, actual door pseudo animations, no browser errors, and no overflow at 390px. The current glass computes blur(16px) saturate(1.1).

Signature interaction: the straight 3D lattice advances from distant left to nearer right. Five staggered bodies (two large, three small) assemble from stable grid nodes into ten verified geometric forms. Smaller forms have lower mass and faster varied flow; spinning fragments collide with cursor and forms. Only collision impulses affect cursor contact, and left/top/bottom bounce while right exits spawn delayed replacements on the left. The persistent root-layout scene remains continuous across pages. The approved name has fourteen material/CS entrances: S fragment assembly and W edges growing from real contour points at 2600ms; others 1900ms. Only credentials (34ms per character, delay850ms) and summary (12ms per character, delay2300ms) beneath the name type out. Header, navigation, footer, and the four portfolio buttons stay static. Reduced motion settles the scene and lettering; hidden tabs pause rendering.

Construction: drawing and seed selection share finite `gridNodes()` members. Each vertex selects a distinct nearest unused visible node (fade > .35 and projected at least12px within viewport), stores idX/idZ/plane, and follows `gridNodePosition()` through movement and recycling. Source nodes activate for .55s before one-time2.52s assembly; staggered edges grow and tethers fade at completion.

Home route links retain static text and a fixed hit area while their inner faces magnetically attract (7px/5px) and tilt (5deg/7deg). Thirty red blocks fill in a 10-column 3-row stagger (24ms columns, 16ms rows; maximum 248ms); pressed faces depress 4px/back 10px, scale .975 and flatten shadows over 70ms. Touch and Enter presses reset on release/cancel/leave/blur; reduced motion removes transforms and makes fill instant. The footer checks the active pathname and returns null only on Home; retained hidden Home DOM does not suppress interior footers. Button text disables selection during interaction. Routes, approved name, background, and For fun content are unchanged.

`MagneticActions` owns one passive window pointer-move listener; only the nearest fixed button rectangle within 44px receives attraction with squared falloff, while others reset. Attraction can begin before hover without triggering fill; hover, focus, and press activate the 30-block fill.

Current glass trial: route faces are 62px tall minimum/138px wide minimum, with 8px corners, reflection gradient over rgba(36,36,38,.22), 16px blur/saturation1.1, neutral .16 border and .16 upper inset rim, and soft7px/16px depth shadow; unsupported blur uses an opaque fallback. Magnetic attraction, pressed feedback, and30-block fill remain unchanged. The shared grid expands horizontally for viewport projection depth and connects all adjacent planes with repeated vertical lines; grid seed identities remain drawn members. Approved interactions are implemented: individual name-letter replay on mouse entry/touch tap after a 4200ms introduction guard, with duration+750ms cooldown and zero-delay replay; summary-word foreground emphasis and1px lift over180ms; foreground-only door transitions (280ms exit/400ms enter after150ms, total550ms) around the persistent header/canvas. Reduced motion disables replay/transforms/transitions. Automatic idle text remains unimplemented.

The stable page-content ViewTransition uses update="door" without a pathname key, preserving cached child state. Replay readiness initializes only while empty, so cached-page Activity visibility does not restart the name’s introduction guard. Browser observation confirmed actual door-depart/door-arrive pseudo animations during navigation; the latest timings reduce overlap.

Completed animations remain settled across cached-page visibility changes. TypedText records completion on its last character’s animation end and disables later typing animations. AnimatedName tracks completion separately for all 14 letters: the final raster/search piece, final binary column, or solid glyph is the terminal event. Completed letters hide decorative animation and keep the solid glyph visible; intentional replay clears only that letter’s completion and increments its key. This preserves full staggered-piece durations while preventing CSS animation restarts when a cached Activity becomes visible.
