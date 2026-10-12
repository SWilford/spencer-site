# Open foreground and autonomous background motion

Confirmed user correction: only the background is griddy. The homepage's text layout must be free-flowing and not boxy. Military-tech wireframes should move and form different shapes during passive viewing, then react to the cursor. Taste and Impeccable are used together.

## Division of visual roles

The background owns coordinate geometry, angular wireframes, connected nodes, and tactical depth. The foreground owns readable professional content, expressive type, asymmetry, and negative space. No table-like experience rows, repeated section frames, boxed navigation, card compartments, or forced text alignment to graphic intersections. Experience/résumé still precede projects; creative material comes afterwards. Keep soft charcoal/red.

Taste supplies composition rhythm, typography, responsive layout and interaction isolation. Its industrial/tactical guidance applies only to the background grammar, not the whole foreground. Impeccable keeps the user-selected visual world and exact composition grounded in the reviewed draft, then verifies reading hierarchy and real behavior at implementation.

## Planned motion contract

1. **Passive:** a low-amplitude autonomous timeline morphs vertices between several angular polyhedral/graph arrangements. Different depth layers rotate slowly with staggered timing. Keep straight edges and technical geometry; avoid cloth/wave deformation. The system changes arrangements over time rather than simply looping a global wobble.
2. **Pointer engaged:** smoothly add a bounded local vertex response, edge/node highlighting, and depth parallax around the normalized pointer position. Autonomous motion continues underneath; the cursor contribution blends in rather than interrupting or restarting the scene.
3. **Pointer leaves:** cursor influence decays smoothly and the autonomous geometry continues from its current phase. No snap, jump, or reset to frame zero.
4. **Touch:** background remains autonomously animated; touch interaction never captures scroll or creates a hover dependency for navigation.
5. **Reduced motion:** settle geometry and text into a static readable state. Pause rendering while hidden. Cap renderer pixel ratio and provide a non-WebGL fallback.

Use renderer uniforms/typed geometry buffers or motion values for continuous inputs rather than React state updates per frame. Prefer a bounded family of compatible vertex arrangements; changes in edge topology can crossfade so no invalid polygons appear mid-transition. Foreground remains stable, clicks pass through the background layer, and reading-region contrast remains sufficient in every motion state.

Heading animation is a separate single entrance that finishes in readable text. No perpetual scrambling or text jitter. Hover/keyboard feedback belongs to functional links, not randomly animated content.

## Scope

The current artifact is a static layout draft. These are implementation requirements, not claims that animation is running. After the composition is selected, verify passive morphing, cursor response, pointer exit, hidden-tab pausing, touch scrolling, reduced motion, and non-WebGL fallback in the actual browser.
