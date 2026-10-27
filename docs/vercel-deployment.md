# Vercel project configuration

The GitHub import detected `scripts/music/requirements.txt` as a Python service.
Those files are owner-run archive/import utilities, not an HTTP application.
The repository has one web application: Next.js at the repository root.

`vercel.json` explicitly defines only `app` to resolve the Services import prompt.
The catch-all rewrite routes public requests to Next.js, including its existing
pages, assets and `/api/music-stats` handler. It adds no route prefix or new public
backend. Services is currently Vercel Beta; a standard single-framework project
is also sufficient if the project is imported outside the Services workflow.

No service bindings are needed: there is no second Vercel service to call. The
server-side saved-statistics reader calls the existing external Supabase endpoint
using its configured server environment; Vercel bindings are not used for external
Supabase services. Public browsing does not trigger Spotify collection.

The hosted Supabase collector and scheduler remain independent and unchanged.
Python imports and the public artwork worker are not deployed by this config.
Private archives, credentials and local databases stay ignored and out of Git.

This configuration alone does not make Music Stats ready for production. Its
historical SQLite/Apple/artwork data and writable local snapshot cache still need
a hosted persistence/read path. Do not ship a local private database or credentials
to fix that. The known Next.js security update also remains a launch prerequisite.

Before deployment, confirm the single service name `app`, public paths `/*`
owned by Next.js, no additional/internal Vercel service, and no bindings. Confirm
the deployment target and environment before changing the live project or DNS.


## October 26 production follow-up

The site is now published at spencerwilford.com with www redirecting to the canonical domain. Next.js and eslint-config-next are patched to 16.4.3 and Node is pinned to 22.x. The app service's trusted build command prepares the private music server read copy before `next build`; it does not define a Python/collector service or a binding. Historical hosting and production-only read credentials are described in [hosted-music-stats.md](hosted-music-stats.md), superseding the earlier launch-blocker paragraphs above.

Root and route metadata now provide canonical URLs, descriptions, Open Graph and Twitter cards. The authored charcoal/red social PNG and SW favicon accompany a sitemap of finished public routes and robots rules excluding API/admin and unfinished journal/photo routes. No fabricated modification timestamps, testimonials or professional claims were added. Search Console ownership/indexing remains an optional owner step.

The touch survey ruler is a non-intercepting indicator during native scrolling; desktop dragging and keyboard controls remain. The mobile menu uses a bounded clip reveal, morphing three-line toggle, smooth close, outside dismissal, Escape focus return and reduced-motion behavior. The For fun disclosure also animates both directions. These extend the existing design, without changing the homepage background or letter effects.
