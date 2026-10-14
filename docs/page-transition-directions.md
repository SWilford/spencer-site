# Page-transition directions

Current behavior is still the existing concurrent 3D door: 58-degree opposing rotations, a large incoming depth offset, 440ms departure and 600ms arrival. No replacement selected in this pass.

The current treatment can make long text look skewed and create competing text layers during overlap. The next pass should keep the background and navigation continuous, use one short handoff, and honor reduced motion and interrupted navigation.

1. Shallow hinged handoff (recommended): keep the left hinge and rightward departure, reduce rotation to roughly 12–18 degrees, reduce incoming depth to about 100–160px, and complete in 400–450ms. Incoming content becomes readable early; outgoing content fades sooner.
2. Camera glide: a small rightward/forward camera impression using opposing 16–28px movements and a restrained scale change. More spatial continuity, less page distortion.
3. Lateral relay: old content moves right and fades while the next enters from the left. About 320ms, very little depth, clear and fast.
4. Focus pull: current content softens slightly and recedes; next content sharpens into place. Small scale change, bounded 2px blur, about 350ms.
5. Scan-plane reveal: one narrow muted-red vertical edge traverses the foreground, revealing the next page. The grid remains live underneath; no fullscreen flash or tactical UI panels.
6. Shared heading handoff: move emphasis from the selected navigation label to the incoming page title, then resolve the body with a short fade. Most editorial option, least spatial movement.

Keep transitions on page content only. The header, cursor, and grid must remain persistent. Do not replay the homepage name or typed summary after completed entrances. Reduced motion uses immediate navigation or a brief opacity-only change. No long timers or router interception.
