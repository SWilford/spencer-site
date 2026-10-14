---
name: Spencer Wilford
description: Open professional content over a responsive angular spatial field.
colors:
  background: "#202022"
  surface: "#2b2b2e"
  foreground: "#ede8e8"
  muted: "#b7b3b3"
  accent: "#bd6866"
  accent-light: "#d17d79"
typography:
  display:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "clamp(65px,6.25vw,96px)"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(45px,6.25vw,80px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(30px,3.3vw,43px)"
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: "-.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  introduction:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(17px,1.3vw,19px)"
    fontWeight: 400
    lineHeight: 1.85
  credentials:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(16px,1.3vw,20px)"
    fontWeight: 400
    lineHeight: 1.6
  navigation:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  focus: "2px"
  print-button: "4px"
  disclosure: "6px"
  route-face: "8px"
spacing:
  content-gutter: "6vw"
  content-gap: "7vw"
  wide-content-gap: "10vw"
  desktop-section: "54px"
  mobile-section: "40px"
components:
  text-link:
    textColor: "{colors.accent-light}"
    size: "16px"
  navigation:
    textColor: "{colors.foreground}"
    typography: "{typography.navigation}"
  navigation-current:
    textColor: "{colors.accent-light}"
    typography: "{typography.navigation}"
  fun-disclosure:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.disclosure}"
    padding: "10px 0"
    width: "182px"
  print-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.print-button}"
    padding: "10px 18px"
    size: "14px"
  hero-button:
    backgroundColor: "linear-gradient(135deg,rgba(237,232,232,.025),rgba(189,104,102,.035) 45%,rgba(189,104,102,.055)),transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.route-face}"
    padding: "15px 24px"
    size: "15px"
  photo-placeholder:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    padding: "20px"
    size: "14px"
---

# Design System: Spencer Wilford

## Overview

**Creative North Star: "Open content over a tactical graph"**

The approved open-layout-v6 direction places clear, warm typography over a quiet technical background. Foreground content is unboxed, left aligned, and spacious. Soft charcoal and dusty red temper the angular geometry; the professional portfolio leads the site’s identity.

Movement belongs to the spatial field and the name’s first entrance. A shared world-space projection carries a five-plane lattice and a restrained mix of large and small angular bodies from back left toward front right, advancing rightward and nearer the camera. Shape nodes begin at snapped lattice intersections, assemble once into rotating forms with anchor tethers, then keep their selected shape until fracture or right-edge exit. Bright beacons pulse at intersections. The lattice projection stays independent of the pointer. Forms receive rigid cursor impulses and spin, followed by damped flight. Only body and wall collisions accumulate stress; readable foreground content stays stable. Decorative content icons are excluded, while functional header controls and GitHub, LinkedIn, and email icons remain.

**Key Characteristics:**
- Open typography and asymmetric whitespace.
- Soft charcoal, dusty red, and warm gray.
- Angular background depth with restrained pointer response.
- Individual letter entrances that settle into readable text.
- Functional navigation and truthful, intentionally blank media placeholders.

## Colors

The palette combines warm dark neutrals with one muted red accent family. Frontmatter values are normative; the canvas reuses the accent RGB channels at varying alpha.

### Primary
- **Dusty Red** (`accent`): wireframe edges, square nodes, faint faces, and the brief letter scan.
- **Light Dusty Red** (`accent-light`): text links, active navigation, dates, hover color, and keyboard focus.

### Neutral
- **Warm Charcoal** (`background`): the body and expanded mobile navigation.
- **Raised Charcoal** (`surface`): the desktop disclosure, print button, and photo placeholders.
- **Warm Gray** (`foreground`): names, headings, navigation, and primary text.
- **Muted Warm Gray** (`muted`): descriptions, categories, metadata, and footer text.

**The One Accent Rule.** Use the existing dusty red family for interaction and geometry; do not introduce a second competing accent.

## Typography

Chakra Petch supplies the homepage name at weight (600), with tracking (-.025em). Manrope supplies the remaining headings, navigation, and body text. Both load through Next.js with sans-serif fallbacks. The angular name contrasts with the quieter supporting type; body copy has no editor-style treatment. A transient monospace binary-rain overlay appears only within the name’s “l” entrance.

- **Display:** the two-line name, using the frontmatter display role on desktop. The letters are real text with one accessible full-name label.
- **Headline:** interior page headings, with a short muted introduction beneath.
- **Title:** general section headings; project headings use a fixed (30px), experience headings (27px), and résumé headings their local scale.
- **Body:** regular text; experience descriptions use a slightly looser line height (1.7). Small mobile body text becomes (16px).
- **Introduction:** homepage copy, distinct from ordinary body copy.
- **Navigation and labels:** compact regular text without uppercase decoration.

At widths up to (850px), the name uses `clamp(61px,11vw,86px)`. At widths up to (580px), it uses `clamp(57px,15.5vw,82px)` with line height (1.03). Small-mobile credentials are (15px), and the summary is (16px) with line height (1.8).

**The Readable Finish Rule.** Entrance animation must resolve to stable, unobscured text; the full name remains available to assistive technology throughout.

## Layout

The content and footer share a maximum width (1324px) and a fluid width of `calc(100% - 12vw)`. The header has its own wider limit (1480px), horizontal padding (5vw), and minimum height (78px). It is transparent and positioned at the page top, rather than sticky.

Desktop Home is a single introduction viewport. Its hero starts at (112px), uses a minimum height of `calc(100svh - 90px)`, and leaves (66px) below. The name’s desktop line height is (0.90). Credentials sit (22px) beneath it, the four-sentence summary follows after (36px) with a maximum width (690px), and four static route buttons follow after (30px). Home is separate from the experience, projects, résumé, contact, and creative routes.

Interior pages begin at (150px), with (80px) bottom padding and heading groups capped at (800px). Experience uses two open columns; projects use unequal columns, staggered vertical placement, and a wider final entry. Photo placeholders use unequal columns and a vertical offset. These are content arrangements, not bordered cards.

At (1050px), header spacing tightens and content briefly uses a (5vw) gutter. At (850px), the mobile navigation becomes an expandable vertical list, header height becomes (68px), content returns to a (6vw) gutter, and Home starts at (130px). At (580px), content columns stack, interior top padding becomes (135px), and credentials and summary margins become (18px)/(28px), and route buttons form two flexible columns. Responsive values override the desktop token roles rather than replacing the visual identity.

## Elevation & Depth

Foreground content is flat. Depth comes from the fixed canvas beneath semantic content: one shared perspective projection for grid and forms, a five-plane advancing lattice, one-time angular body formation, faint filled faces, square nodes, and bright intersection beacons. The canvas is noninteractive in the document hit-test layer and hidden from assistive technology; a subtle reading scrim sits above it.

The desktop “For fun” disclosure and Home’s magnetic route-button faces are the raised UI surfaces. Its shadow is `0 16px 32px rgba(16,17,19,.3)`; on mobile its background becomes transparent and its shadow is removed. The current glass trial uses a translucent route face with blur (2.5px) with saturation (1.12), a muted red border, top reflection gradient, and inset upper rim. Route faces use `0 3px 9px rgba(13,13,15,.09),inset 0 1px 0 rgba(237,232,232,.10)`, flattening to `0 1px 3px rgba(13,13,15,.3),0 1px 0 #161619` while pressed. There are no card shadows.

**The Background Geometry Rule.** Keep tactical lines and grids behind the content. Foreground sections remain open and unboxed.

## Shapes

Background geometry is angular: large icosahedron, cuboctahedron, hexagonal antiprism, decagonal bipyramid, and hexagonal prism targets coexist with smaller trapezoidal prisms, cubes, triangular half-cube prisms, regular octahedra, and tetrahedra. All use straight connectors and square nodes. Supporting-plane hull computation supplies closed polygon faces and cached true face edges. Completion shading increases with the one-time assembly. The foreground uses plain text and rectangular media spaces. Small rounding is limited to focus outlines, the print button, and the desktop disclosure; it does not establish a rounded-card system.

## Components

### Navigation

The wordmark and compact text links sit in one horizontal desktop header. Current page links use Light Dusty Red; link hover uses the same color. The “For fun” disclosure shows only “More to come.”, with future creative destinations unsettled; it closes on outside pointer activity or Escape, and returns focus to its trigger when Escape dismisses it. Mobile navigation has an explicit labeled toggle and expansion state. The three social icons are Phosphor components with accessible labels; icon buttons shift upward (2px) on hover.

### Text links

Actions are unboxed text in Light Dusty Red. The base link size is (16px), while Home uses four static route buttons instead of a text action. Current rendered content links are text-only; unused arrow styling in the stylesheet does not imply decorative arrows should be added.

### Home route buttons

Four magnetic links lead to Experience, Projects, Résumé, and Contact. `MagneticActions` owns one passive window pointer-move listener. Only the nearest button within (44px) of its fixed rectangle attracts toward a mouse pointer, with squared distance falloff; other buttons reset. The inner face retains caps of (7px) horizontal/(5px) vertical attraction and (5deg)/(7deg) tilt. This nearby-pointer attraction does not trigger the fill; hover, focus, and press do. The glass trial faces use a reflection gradient over `transparent`, blur (2.5px) with saturation (1.12), a `rgba(209,125,121,.26)` border, radius (8px), minimum height (62px), minimum width (138px), padding (15px 24px), and a soft shadow with inset upper rim. Unsupported backdrop blur falls back to `rgba(189,104,102,.025)`. The outer link has minimum height (64px) and perspective (650px).

On hover, keyboard focus, or press, thirty accent blocks in ten columns and three rows scale in from the left; each column adds (24ms) and each row adds (16ms), reaching a maximum stagger (248ms). The readable label stays unchanged, shifting to dark text over the red fill. Pressing moves the face down (4px), back (-10px), and scales it to (.975) with a flatter shadow and (70ms) response. Pointer/touch and Enter press states reset on release, cancel, pointer leave, or blur. Reduced-motion removes face transforms and the global rule makes fill transitions instant. No portrait is currently included. The footer checks the active pathname and returns no footer on Home, avoiding the repeated name and Contact action; interior pages retain it. Button text disables selection during interaction.

### Print button

The résumé has a small Raised Charcoal button labeled “Print / save PDF.” It calls the browser print flow and disappears in print output. It uses the shared keyboard focus treatment; no distinct filled primary-action system is implemented.

### Media placeholders

Project and photo preview rectangles are intentional placeholders for assets that have not been supplied. Project previews use an aspect ratio (1.8), changing to (1.65) on small mobile, with subdued project-specific dark fills and an honest “Project image to come” label. Photo placeholders use an aspect ratio (1.4) and “Photo to come.” Neither is a card enclosing the surrounding copy. No raster asset ships in the current interface.

### Animated name

The (14) effects follow the exported `nameEffects` map, documented individually in `docs/name-animation-map.md`. S explodes into (8) pieces; W grows real contour edges outward from points. These two entrances last (2600ms); the remaining letters last (1900ms). Ordinary delays begin at (120ms) and increase by (100ms); W starts at (360ms). The first e preserves (9) pixel tiles and i preserves signal decode. Other effects include water fill within an outlined stencil, sideways printing, dot matrix, sand particles, three radar sweeps, binary rain, contour-edge graph growth, contour integration, search quadrants, and twelve raster columns.

SVG outlines and contour segments come from the actual Chakra Petch glyph data in `src/content/name-glyphs.json`, rather than generic rectangles. The glyph asset records the font copyright; the matching font license ships at `public/licenses/Chakra-Petch-OFL.txt`. Solid SVG letters resolve underneath the temporary effects; one full-name accessible label covers the visual letter layers. After the initial (4200ms) guard, initialized only once for an empty readiness array, mouse entry or a touch tap replays only that letter’s original effect with zero delay. Its cooldown is the effect duration plus (750ms). Reduced-motion disables replay, shows settled glyphs, and hides effect overlays.

### Typed supporting text

Only Home credentials and the four-sentence summary type beneath the approved name. Credentials read “CS @ JMU | Prev. SWE at NSWCDD, NGA” and reveal at (34ms) per character after (850ms); the summary reveals at (12ms) per character after (2300ms). It covers the supplied internships and HooHacks project, JMU CS ambassadorship and rugby, Eagle Scout, and interests in full-stack development, national security and defense, systems engineering, software architecture, and practical AI/ML. Experience, Projects, Résumé, and Contact buttons stay static. Text is already laid out before reveal, keeping its width stable. A separate screen-reader string preserves the complete accessible text while visual characters are hidden from assistive technology. Header, navigation, and footer text remain static on every route. Summary-word hover brightens to foreground and lifts (1px) over (180ms). Reduced-motion removes the lift and shows all characters immediately.

### Spatial background

The scene is capped at (5) bodies: two large and three small. Their initial births occur at (0s), (9s), (3.5s), (7s), and (12s) by body index, keeping entries staggered. The two larger bodies use medium size (.62); small sizes vary from (.18) to (.26), with mass proportional to size cubed. Each vertex starts at a distinct actual visible member of the same finite lattice used for drawing. Construction selects nearest unused nodes with fade above (.35), visible projection, and positions more than (12px) inside viewport edges. Stored identities contain `idX`, `idZ`, and `plane`; their positions reconstruct continuous grid movement, including recycling, independently of final size. Formation uses fixed geometry scale (.9 × body size); collision stress does not deform vertices. Shared perspective places all bodies within the same five-plane advancing lattice. Grid projection remains pointer-independent; cells keep continuous identities and fade near recycling edges. Horizontal extent adapts to viewport width and projection depth with a minimum radius (6), keeping the grid across the full viewport. Vertical connectors join every adjacent plane at every third X identity and every second Z identity, using alpha (.16 × depth fade). Drawing and construction share the expanded node set; lines with both endpoints outside the same viewport side are culled. Each body stores these anchors once per spawn; respawn clears them. After (.55s) of source-node activation, the (2.52s) assembly draws true face edges progressively as staggered partial segments. Anchor tethers remain visible throughout construction at alpha (.24 × birth fade), then are removed only when assembly is complete.

Bodies flow from back left to front right with randomized rate scales: (42–56s) for large forms and (22–32s) for small ones. These scales do not define lifetimes. Each body activates its source nodes for (.55s), then assembles once over (2.52s), using smoothstep formation that then remains complete. A shuffled shape order selects its first entry for the whole spawn: larger bodies select from five complex solids and smaller bodies from five simple solids. The selected solid rotates and travels without periodic morphing or dissolution; only fracture or exit respawn selects again. Closed hull faces and cached true face edges define each shape. Shape order, lane variation, spin, and flow rates use crypto randomness; formation age starts with each scheduled birth. Root-layout mounting preserves the scene across client-side page changes.

Cursor movement gives assembled bodies rigid impulses and spin, followed by damped flight; it does not add collision stress or directly deform vertices. Approximate spherical collisions use each body’s radius and mass for impulses and separation. Body and wall collisions accumulate stress; reaching (1.4) releases one fragment per current vertex and schedules that body’s replacement at the left after (1.5–4s). Projected bounds bounce against left, top, and bottom while the right remains open. Full right exit schedules the same independent delayed replacement. Each body replaces independently, without companion waves. Replacement refreshes flow rate, shape order, lane, and spin.

Fragments rotate, respond to cursor impulses, collide with assembled bodies using mass-weighted impulses, share the bounded sides/open right, and fade over (7s). At most (60) fragments are retained. Completion shading follows assembly. The canvas targets (20fps) for its first (2s), then (30fps), with pixel ratio capped at (1.75); these are scheduling limits, not measured performance claims. Touch does not activate cursor impulses. Reduced-motion settles the scene, hidden tabs stop rendering, and a missing canvas context leaves semantic content usable.

Completed animations remain settled across cached-page visibility changes. TypedText records completion on its last character’s animation end and disables later typing animations. AnimatedName tracks completion separately for all 14 letters: the final raster/search piece, final binary column, or solid glyph is the terminal event. Completed letters hide decorative animation and keep the solid glyph visible; intentional replay clears only that letter’s completion and increments its key. This preserves full staggered-piece durations while preventing CSS animation restarts when a cached Activity becomes visible.

### Page transitions

A stable React ViewTransition wraps only page children, with the `page-content` name, door update/enter/exit class, and default none; header and canvas remain outside. The wrapper has no pathname key and uses update="door", preserving Next’s cached client-page state instead of remounting children. The document root opts out of snapshots. Outgoing content rotates (-58deg) and translates (20vw) right and (6vw) nearer over (440ms), with opacity (1) initially, (.55) at (65%), and (0) at the end. Incoming content starts immediately at opacity (.35), rotation (58deg), and translation (-4vw, 0, -50vw); opacity reaches (.7) at (45%) and (1) at its normal position after (600ms). The old snapshot uses z-index (2) above the new snapshot at (1), revealing the next page early in depth during the concurrent transition. Both pivot at left (45%) with perspective (160vw). Reduced-motion disables transition animations; unsupported browsers navigate normally. No automatic idle text animation is implemented.

The 600ms door arrival uses cubic-bezier(.4,0,.3,1) for a slower initial depth approach. During the transition, snapshots ignore pointer events and the moving page-stage is inert; the header remains outside and clickable. Browser inspection at 160ms confirmed incoming depth near -574px behind outgoing opacity .73, with distinct transform matrices. Full checks and production build passed. The selected cursor combines sensor brackets, lock/click feedback, and a short vector trail, with no depth echo.

### Keyboard focus

Links and buttons share a Light Dusty Red outline (2px) with offset (6px). The skip link becomes visible on focus. Preserve these states whenever extending navigation or adding actions.

## Do's and Don'ts

### Do:
- **Do** keep text and navigation readable and stable above the reactive background.
- **Do** use Chakra Petch for the homepage name, Manrope for supporting type, and the existing charcoal/red palette across routes.
- **Do** preserve keyboard focus, expanded control states, and reduced-motion behavior.
- **Do** keep unsupplied media visibly identified as placeholders.
- **Do** place each navigation destination on its own page and keep Home as the introduction.

### Don't:
- **Don't** add decorative content icons; retain icons that serve header links or controls.
- **Don't** turn open foreground content into tactical panels, tables, or bordered cards.
- **Don't** substitute stark black/crimson contrast or flowing ribbon geometry for the chosen direction.
- **Don't** invent photographs, project screenshots, forms, or component variants absent from the implementation.

## Approved cursor implementation

Spencer selected 1 + 7 with a little 5; the initial depth echo was removed. SensorCursor mounts once in the root layout outside page transitions. The exact 3px center tracks immediately; a 25px corner frame follows with a 45ms exponential catch-up and contracts over links/buttons. Three short red vector segments cap at 14px each and disappear at rest. There is no offset depth frame. Primary clicks emit a 300ms expanding corner-bracket pulse. Pointer positions never trigger React renders; animation frames stop once settled. The overlay is decorative and cannot intercept input.

Only fine hover mouse pointers with no reduced-motion preference receive the cursor. Text and editable content retain the native browser cursor; the custom I-beam was removed. Special cursor contexts, keyboard use, scroll, blur, pointer exit and hidden tabs restore the native cursor. Touch and reduced-motion retain native behavior. Glass faces have no charcoal base, a 2.5% reflection with 3.5–5.5% red tint, 2.5px frosted blur, saturation 1.12 and the existing red outline; the block fill and magnetic/press behavior stay intact.

Palette exploration: slightly deeper charcoal (#202022), raised charcoal (#2b2b2e), muted dark red (#bd6866), and readable lighter red (#d17d79). Previous palette remains available in commit bba4407. Geometry, motion, glass alpha and blur are unchanged.
