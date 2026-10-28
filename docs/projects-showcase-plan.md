# Projects showcase direction

## Confirmed direction — October 28, 2026

- THAW is no longer live. Its repository remains available; investigate rebuilding a hosted interactive demo from its source rather than describing it as a live service.
- Byte-Builder no longer feels representative of Spencer's strongest work. Proposed: remove it from the featured lineup; final archival treatment remains undecided.
- JMU Men's Rugby remains live. Spencer wants a portfolio-hosted copy of his implementation that remains available if the original domain later redirects to a replacement site. A simple iframe of the original live domain would not preserve this.
- Include the complete live portfolio as Spencer Site. Leave the self-reference as an easter egg; no visible Inception name or level explanations.

## Agreed presentation

Use three substantial project showcases, with brief factual descriptions of Spencer's contribution, source links where public, and an explicit Launch demo control. A miniature browser frame can preview each project and expand into a usable demo. Preserve the site's existing charcoal/red identity and open foreground layout. Do not start several full applications/background canvases automatically on the Projects landing page.

THAW: inspect the actual repository and dependencies before choosing what can run. Clearly distinguish a restored demo from its former live service. Prefer representative demo records and a defined interaction flow; real model/API calls, paid usage and account access require a separate bounded design.

Rugby: retain a versioned build of Spencer's original frontend, independent of redirects at the existing domain. Spencer confirmed retaining the existing public-data connections in an embedded-looking copy. Admin editing is disabled in the showcase, including for a visitor with valid credentials; this restriction applies to the demo build and does not revoke real team administrators. Exclude admin routes and editing modules from the demo build, rather than merely hiding navigation. Existing rugby infrastructure remains unchanged.

Spencer Site: embed the full live portfolio, with all real pages and features. Keep recursion bounded internally without presenting a reduced recreation or explanatory level labels.

## Evidence and next decisions

The existing Projects page uses typed profile entries and placeholder images. A local React/Vite rugby checkout exists and points to SWilford/jmu-rugby-site. It has not been modified. THAW was not present in the connected account's own-repository listing; its source was subsequently supplied at https://github.com/sambriggs262/thaw and inspected. Rugby should keep its public-data connections; demo admin editing is disabled. THAW should use the same embedded presentation, with actual dependency availability verified from its source. The original repositories and backend infrastructure remain unchanged. The restored copies are built independently inside the portfolio workspace.

## Implemented draft

The Projects page features Rugby, THAW and Inception; Byte-Builder is removed from the featured lineup. Each uses a browser-style frame and explicit Launch, Expand/Collapse, Restart and Close controls. Only one top-level project iframe exists at a time. No demo app is loaded before a visitor launches it.

`showcase/build.mjs` builds pinned source snapshots into static `public/demos/` artifacts using a separate, locked Vite build toolchain. The original repositories remain unchanged; no new Vercel service or database is required. The main Next build serves the committed static artifacts. `npm run build:showcases` regenerates them after the original repositories and public configuration are prepared; see showcase/README.md.

Rugby uses the original frontend with HashRouter, no admin routes/imports/nav, no persisted auth, and a custom fetch that rejects writes/auth/functions and forces the existing anonymous public key on all REST reads. THAW reuses the original landing page, match cards, sample profiles and deterministic matching/narrative functions. Perspective, search, saved cards and profile details work locally. No Auth0, Supabase service credentials, Gemini or outreach code enters that demo bundle. The original service is not represented as live.

Spencer Site embeds the real website at /. Resume, Music Stats and the other routes work as on the main site. It uses the same-origin framing policy already used by the portfolio. The other restored applications remain in strict opaque-origin sandboxes.

The restored Rugby and THAW demos are sandboxed with scripts only, both in iframe attributes and an HTTP CSP sandbox. They cannot access parent sessions, submit forms or open popups. Static demo CORS permits module/font loads from the opaque sandbox origin. Demos are noindex and excluded from robots discovery; the portfolio’s global frame restriction remains on non-demo routes. This changes no existing backend permissions. Defense-in-depth client restrictions do not revoke legitimate administrators on the real rugby site.

## Portfolio preview correction

Spencer rejected a reduced recreation and any visible Inception/level explanation. The Spencer Site project now embeds the real portfolio at /, with all real routes, Resume downloads and public Music Stats intact. Only this trusted same-origin site iframe is unsandboxed; the separately restored Rugby and THAW apps retain their scripts-only sandbox and response CSP. Global SAMEORIGIN framing remains on the portfolio. A hidden depth guard changes the next launch into a normal new tab after three embedded levels; it removes no pages or features within any loaded copy. There is no separate Inception build or fake Resume/Music screen. Expanding a preview scrolls its browser toolbar into view.
