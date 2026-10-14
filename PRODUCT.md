# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The user requested an initial stack choice and local setup. Initial choice: Next.js App Router, React, TypeScript, Tailwind CSS, npm with a committed lockfile. Portfolio hosting is intended for Vercel but publication is not yet authorized. A dedicated private Supabase Postgres collector and private Supabase Storage are now authorized for music data. Owner dashboard authentication will follow. Cloudflare R2 remains optional for larger exports/media.

## Users

Spencer owns and edits the site. Public visitors first see a professional portfolio; creative interests follow. The listening dashboard is primarily for Spencer; selected summaries may be public while detailed history and administration stay private.

## Product Purpose

A personal website for professional projects, experience, résumé, writing, works in progress, photos, music, and guitar. The homepage should establish Spencer's professional portfolio within the first ten seconds, then invite exploration of the creative material.

## Operating Context

Development and testing happen locally before publishing. GitHub repository: https://github.com/SWilford/spencer-site. Core site comes first; listening imports and Spotify collection come later. An existing server-backed project may migrate in a future phase after its requirements are inspected.

## Capabilities and Constraints

- Build a highly responsive site with modern, fluid interactions and room for a meaningful 3D experience.
- Portfolio/about, experience/résumé, projects, blog/showcase, photography, and music/guitar content.
- Reserve /music for music content and a future listening dashboard; private administration is separate.
- Import Spotify Extended Streaming History JSON and actual Apple Music privacy-export ZIP files. Inspect supplied files before assuming Apple's schema or historical coverage. No Apple login, device, MusicKit, or developer membership is needed for file parsing.
- Preserve original imports, prevent duplicate records, keep unmatched data, and distinguish exported durations from observed estimates and song-length estimates.
- Public visitors must never trigger collection. Secrets and private history stay server-side and out of Git.
- Keep the portfolio unpublished; do not buy domains or alter Vercel/Cloudflare resources without authorization. The dedicated personal Supabase music collector and private storage are now authorized; the unrelated rugby project is outside scope.

## Evidence on Hand

The user supplied an updated Word resume dated 8.10.26, LinkedIn profile, and public email. Experience and the resume now use that updated source. The user authorized a public copy without phone/clearance: sanitized DOCX, PDF, and page preview may be committed; the private original, phone number, and clearance details stay out of the repository. An Apple Media Services export has now been supplied and privately preserved; Spotify extended history is requested but not received. Photos, portraits, and guitar recordings have not been supplied; do not invent them.

## Brand Commitments

Professional portfolio first, creative content afterwards. Modern, reactive, fluid, and visually distinctive. The user explicitly requested GrillMe, Taste, and Impeccable workflows.

Confirmed visual constraints: soft dark gray and soft muted red, avoiding stark black/crimson contrast. Draft image concepts before implementation. Blank portrait placeholders are permitted. A background graphic or 3D object responding to mouse movement is desired.

Additional user steering from the concept chooser: likes the interactive-field concept C, wants it more technical while still visually cool; requested a bolder exploration. The earlier re-roll was an exploration request, not approval to implement a design.

Latest confirmed refinement: precise 3D geometry and responsive motion lead the technical feel. Animated typography is desired. Experience and résumé should appear before projects; creative content follows professional content. Code/editor-style decoration is not the selected direction.

The geometric graphic must form the background behind the page content, not sit in a separate side panel. It should remain responsive to mouse movement. Keep foreground text/navigation readable and stable while the background responds.

Latest visual correction: less flowing; more graph-like, militaristic, and futuristic. Use rigid/angular graph geometry and restrained tactical framing, replacing waves/ribbons. Keep the earlier soft charcoal/red palette, background placement, mouse response, animated typography, and experience-first order.

The background is the only gridded/tactical layer. Foreground text layout should be open and free-flowing, without boxy sections or card/table compartmentalization. Wireframes move passively and change angular shapes/designs, then react to the cursor. Use Taste together with Impeccable to preserve both layers' distinct roles.

## Product Principles

- Real work and truthful content establish credibility.
- Interactions support exploration and stay usable on touch devices.
- Build the core website before data collection.
- Private source data and explicitly public summaries have separate access paths.
- Data coverage and precision are visible rather than implied.

## Open Decisions

Music update (October 14, 2026): Spencer currently listens on Spotify; Apple history covers a break of a couple of months. The extended-history request is submitted. The user created and authorized spencer-music in spencer-personal; the rugby organization/project remains untouched. Private Spotify collection is live every ten minutes in Supabase, with real authorization/refresh, duplicate prevention, and a scheduler-triggered run verified. The supplied Apple ZIP is preserved locally and in private Supabase Storage; its observed history schema is staged locally without equating end segments to streams. R2 is optional. The portfolio stays unpublished. See docs/music-collector.md for setup state and verification gates.

The open-layout-v6 visual concept is approved for a first code draft. Latest user correction: match the reference first, Home is separate from all navigation pages, and remove decorative content icons. Keep the requested GitHub/LinkedIn/email header icons. Content-editing workflow, remaining assets, domain, monthly budget, stream threshold, listening timezone, and public statistics selection remain undecided. Do not treat the operating system's timezone as an approved statistics preference.
