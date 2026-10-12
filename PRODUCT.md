# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The user requested an initial stack choice and local setup. Initial choice: Next.js App Router, React, TypeScript, Tailwind CSS, npm with a committed lockfile. Hosting is intended for Vercel but no deployment or service provisioning is authorized yet. Database recommendation: Supabase Postgres and owner authentication, added when music data needs persistence. Object-storage recommendation: Cloudflare R2 for large media and private original exports, added later.

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
- Do not publish, buy domains, provision services, or alter Vercel/Supabase/Cloudflare resources yet.

## Evidence on Hand

The scope and priorities are confirmed in chat. No résumé, real project descriptions, photos, portraits, guitar recordings, or playback exports have been supplied. Do not invent employers, degrees, job titles, accomplishments, testimonials, or real listening statistics.

## Brand Commitments

Professional portfolio first, creative content afterwards. Modern, reactive, fluid, and visually distinctive. The user explicitly requested GrillMe, Taste, and Impeccable workflows.

Confirmed visual constraints: soft dark gray and soft muted red, avoiding stark black/crimson contrast. Draft image concepts before implementation. Blank portrait placeholders are permitted. A background graphic or 3D object responding to mouse movement is desired.

Additional user steering from the concept chooser: likes the interactive-field concept C, wants it more technical while still visually cool; requested a bolder exploration. The earlier re-roll was an exploration request, not approval to implement a design.

Latest confirmed refinement: precise 3D geometry and responsive motion lead the technical feel. Animated typography is desired. Experience and résumé should appear before projects; creative content follows professional content. Code/editor-style decoration is not the selected direction.

The geometric graphic must form the background behind the page content, not sit in a separate side panel. It should remain responsive to mouse movement. Keep foreground text/navigation readable and stable while the background responds.

Latest visual correction: less flowing; more graph-like, militaristic, and futuristic. Use rigid/angular graph geometry and restrained tactical framing, replacing waves/ribbons. Keep the earlier soft charcoal/red palette, background placement, mouse response, animated typography, and experience-first order.

## Product Principles

- Real work and truthful content establish credibility.
- Interactions support exploration and stay usable on touch devices.
- Build the core website before data collection.
- Private source data and explicitly public summaries have separate access paths.
- Data coverage and precision are visible rather than implied.

## Open Decisions

Visual concept, content-editing workflow, real content/assets, public contact channels, domain, monthly budget, stream threshold, listening timezone, and public statistics selection are undecided. Do not treat the operating system's timezone as an approved statistics preference.
