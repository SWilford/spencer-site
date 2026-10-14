# Page-transition directions

Selected and implemented: irregular sector decoding. Incoming content is revealed through randomized polygon patches, rather than a uniform block fill. Earlier proposals below remain alternatives.

The current treatment can make long text look skewed and create competing text layers during overlap. The next pass should keep the background and navigation continuous, use one short handoff, and honor reduced motion and interrupted navigation.

1. Shallow hinged handoff (recommended): keep the left hinge and rightward departure, reduce rotation to roughly 12–18 degrees, reduce incoming depth to about 100–160px, and complete in 400–450ms. Incoming content becomes readable early; outgoing content fades sooner.
2. Camera glide: a small rightward/forward camera impression using opposing 16–28px movements and a restrained scale change. More spatial continuity, less page distortion.
3. Lateral relay: old content moves right and fades while the next enters from the left. About 320ms, very little depth, clear and fast.
4. Focus pull: current content softens slightly and recedes; next content sharpens into place. Small scale change, bounded 2px blur, about 350ms.
5. Scan-plane reveal: one narrow muted-red vertical edge traverses the foreground, revealing the next page. The grid remains live underneath; no fullscreen flash or tactical UI panels.
6. Shared heading handoff: move emphasis from the selected navigation label to the incoming page title, then resolve the body with a short fade. Most editorial option, least spatial movement.

Keep transitions on page content only. The header, cursor, and grid must remain persistent. Do not replay the homepage name or typed summary after completed entrances. Reduced motion uses immediate navigation or a brief opacity-only change. No long timers or router interception.

## Tactical and futuristic transition brainstorm

These are visual concepts, not implementations. Keep the spatial field live, the header usable, and text readable; avoid fake loading, flashing, random glitch spam, or tactical labels added to ordinary content. Each transition should complete in roughly 300–500ms, with reduced-motion fallback.

1. Target acquisition: a corner bracket briefly contracts around the selected nav item, then opens into the incoming content boundary as the old content fades. Links the reticle identity to navigation.
2. Depth-plane transfer: the old content peels toward front-right while the next page advances from a shallow back-left plane, aligned with grid flow. Retains the original spatial idea with less text distortion.
3. Radar sweep: one thin red scanning line crosses the content and resolves the next page behind it. A faint short-lived sweep edge, no fullscreen overlay.
4. Sector assembly: the next page resolves in a few broad staggered rectangular regions, echoing the existing three-row block-fill language. Text remains on a stable final baseline.
5. Wireframe-to-content: a sparse geometric outline sketches the incoming content plane, then becomes real type while the outline disappears. Echoes shapes assembling from nodes.
6. Aperture shutters: two angular masks separate to expose the new page, with a brief mechanical acceleration/deceleration. No heavy panel chrome on the actual page.
7. Coordinate snap: incoming content makes a short diagonal approach and lands with a precise bracket confirmation, no bounce. Crisp HUD-like navigation.
8. Signal resolve: a single short scan displacement passes through departing content, then the incoming page resolves cleanly. No repeated glitching or unreadable randomized text.
9. Vector handoff: a short route-aligned red vector travels from the selected navigation item toward the new heading; body content follows with a short opacity reveal.
10. Contour scan: heading strokes appear as thin red contours then settle into solid type; body content appears together below. Avoid replaying the full name entrance.

Best fit: Target acquisition plus a restrained Depth-plane transfer. Alternative with more tactical character: Radar sweep plus Sector assembly. Select one central motif rather than stacking all of these.

Verified implementation: three geometry/keyframe tests pass across desktop, mobile and ultrawide sizes; lint, type checking and production build pass. A native browser capture confirms fragmented incoming content during the handoff and a fully settled page afterward. Long-page mobile navigation completes without overflow, and repeated header navigation reaches the intended destination. Previous door code has been removed.
