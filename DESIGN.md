---
name: Spencer Wilford
description: Open professional content over a responsive angular spatial field.
colors:
  background: "#242426"
  surface: "#303033"
  foreground: "#ede8e8"
  muted: "#b7b3b3"
  accent: "#c77370"
  accent-light: "#dd8b87"
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
    fontSize: "clamp(19px,1.7vw,25px)"
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

Movement belongs to the spatial field and the name’s first entrance. A shared world-space projection carries a five-plane lattice and three angular clusters from back left toward front right, advancing rightward and nearer the camera. Shape nodes begin at snapped lattice intersections, assemble into rotating forms, grow, morph, split, and dissolve back into the lattice with anchor tethers. Bright beacons pulse at intersections. Pointer influence bends both grid and forms while fading disrupted faces; readable foreground content stays stable. Decorative content icons are excluded, while functional header controls and GitHub, LinkedIn, and email icons remain.

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

Chakra Petch supplies the homepage name at weight (600), with tracking (-.025em). Manrope supplies the remaining headings, navigation, and body text. Both load through Next.js with sans-serif fallbacks. The angular name contrasts with the quieter supporting type; no monospace or editor-style text treatment is implemented.

- **Display:** the two-line name, using the frontmatter display role on desktop. The letters are real text with one accessible full-name label.
- **Headline:** interior page headings, with a short muted introduction beneath.
- **Title:** general section headings; project headings use a fixed (30px), experience headings (27px), and résumé headings their local scale.
- **Body:** regular text; experience descriptions use a slightly looser line height (1.7). Small mobile body text becomes (16px).
- **Introduction:** homepage copy, distinct from ordinary body copy.
- **Navigation and labels:** compact regular text without uppercase decoration.

At widths up to (850px), the name uses `clamp(61px,11vw,86px)`. At widths up to (580px), it uses `clamp(57px,15.5vw,82px)` with line height (1.03). The small-mobile introduction is (19px), line height (1.5), and maximum width (270px).

**The Readable Finish Rule.** Entrance animation must resolve to stable, unobscured text; the full name remains available to assistive technology throughout.

## Layout

The content and footer share a maximum width (1324px) and a fluid width of `calc(100% - 12vw)`. The header has its own wider limit (1480px), horizontal padding (5vw), and minimum height (78px). It is transparent and positioned at the page top, rather than sticky.

Desktop Home is a single introduction viewport. Its hero starts at (112px), uses a minimum height of `calc(100svh - 90px)`, and leaves (66px) below. The name’s desktop line height is (0.90); introduction and action margins are (10px) and (15px). Home is separate from the experience, projects, résumé, contact, and creative routes.

Interior pages begin at (150px), with (80px) bottom padding and heading groups capped at (800px). Experience uses two open columns; projects use unequal columns, staggered vertical placement, and a wider final entry. Photo placeholders use unequal columns and a vertical offset. These are content arrangements, not bordered cards.

At (1050px), header spacing tightens and content briefly uses a (5vw) gutter. At (850px), the mobile navigation becomes an expandable vertical list, header height becomes (68px), content returns to a (6vw) gutter, and Home starts at (130px). At (580px), content columns stack, interior top padding becomes (135px), and the hero’s introduction/action spacing becomes (20px)/(22px). Responsive values override the desktop token roles rather than replacing the visual identity.

## Elevation & Depth

Foreground content is flat. Depth comes from the fixed canvas beneath semantic content: one shared perspective projection for grid and forms, a five-plane advancing lattice, angular cluster lifecycles, faint filled faces, square nodes, and bright intersection beacons. The canvas is noninteractive in the document hit-test layer and hidden from assistive technology; a subtle reading scrim sits above it.

The desktop “For fun” disclosure is the sole recurring raised UI surface. Its shadow is `0 16px 32px rgba(16,17,19,.3)`; on mobile its background becomes transparent and its shadow is removed. There are no card shadows.

**The Background Geometry Rule.** Keep tactical lines and grids behind the content. Foreground sections remain open and unboxed.

## Shapes

Background geometry is angular: icosahedron, cuboctahedron, twisted-prism, bipyramid, and stellated-prism targets with straight connectors and square nodes. Supporting-plane hull computation supplies closed polygon faces; completion shading fades during morphing and cursor disruption. The foreground uses plain text and rectangular media spaces. Small rounding is limited to focus outlines, the print button, and the desktop disclosure; it does not establish a rounded-card system.

## Components

### Navigation

The wordmark and compact text links sit in one horizontal desktop header. Current page links use Light Dusty Red; link hover uses the same color. The “For fun” disclosure toggles music, photos, and journal links, closes on outside pointer activity or Escape, and returns focus to its trigger when Escape dismisses it. Mobile navigation has an explicit labeled toggle and expansion state. The three social icons are Phosphor components with accessible labels; icon buttons shift upward (2px) on hover.

### Text links

Actions are unboxed text in Light Dusty Red. The base link size is (16px), while the Home action is (19px), becoming (17px) on small mobile. Current rendered content links are text-only; unused arrow styling in the stylesheet does not imply decorative arrows should be added.

### Print button

The résumé has a small Raised Charcoal button labeled “Print / save PDF.” It calls the browser print flow and disappears in print output. It uses the shared keyboard focus treatment; no distinct filled primary-action system is implemented.

### Media placeholders

Project and photo preview rectangles are intentional placeholders for assets that have not been supplied. Project previews use an aspect ratio (1.8), changing to (1.65) on small mobile, with subdued project-specific dark fills and an honest “Project image to come” label. Photo placeholders use an aspect ratio (1.4) and “Photo to come.” Neither is a card enclosing the surrounding copy. No raster asset ships in the current interface.

### Animated name

Each of the (14) letters has its own entrance: print-up, typed, fizzle, extrude, fold-in, stencil, assemble, print-down, decoded, ignite, depth-in, hinge, scan-across, and converge. Entrances last (1.1s), using `cubic-bezier(.16,1,.3,1)` or per-letter stepped timing. Delays begin at (80ms) and increase by (50ms). A brief accent scan or type cursor lasts (900ms); transient extrusion shadows settle away. Reduced-motion disables these effects.

### Spatial background

Three clusters each contain (12) vertices and share the lattice’s world-space perspective projection. A five-plane lattice advances rightward and toward the camera; bright intersection beacons pulse across its depth. Clusters travel from back left to front right over (42s), with travel phases staggered by one third and faded recycling. Their (14s) lifecycles are offset by (1.7) stages: nodes rest at actual snapped lattice anchors, assemble and rotate, grow and morph through five targets, split, then dissolve back into the lattice. Faint tethers connect displaced vertices to their anchors. Closed-face shading strengthens with assembly and completion, then fades during splitting, morphing, and pointer disruption.

Rendering is capped near (30fps) with pixel ratio capped at (1.75). Pointer proximity bends the shared lattice projection and further disrupts form vertices, changing edge brightness and fading faces; influence decays on exit or window blur. Touch does not activate pointer influence. Reduced-motion draws a settled frame, hidden tabs stop rendering, and a missing canvas context leaves the text and controls usable.

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
