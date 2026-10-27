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
