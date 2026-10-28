# Portfolio project showcases

These adapters restore source-based demos without deploying the original private services. Build output in public/demos is committed so the main Vercel application needs no additional service or build-time credentials.

## Sources

- Rugby: https://github.com/SWilford/jmu-rugby-site (revision pinned in build.mjs).
- THAW: https://github.com/sambriggs262/thaw at d0cb7fa468f7d1786927c6e63417645df65eb95c. The repository README declares MIT; attribution is retained in public/demos/ATTRIBUTION.txt.
- Inception: the portfolio’s original React components. Its recursive Projects preview stops at level three.

## Regeneration

1. Check out the pinned Rugby repository in a separate directory and set RUGBY_SHOWCASE_SOURCE to its absolute location. The default is the existing local checkout; the script verifies the pinned HEAD and only reads Git objects, never edits that checkout.
2. Clone the pinned THAW source into work/thaw-source. No secrets or env files are copied from either repository.
3. Put the existing, public rugby browser configuration into the ignored work/rugby-public-config.json: url, anonKey, media. Use only a publishable or role=anon key. The build rejects privileged keys; a service-role key is never needed. These values are already public in the live team site's JavaScript.
4. Build the main portfolio once to make its self-hosted font assets available to the standalone Inception build.
5. Run npm ci --prefix showcase --ignore-scripts, then npm run build:showcases. Outputs are confined to the three generated public/demos children; those children are replaced to remove stale chunks.
6. Run node --test tests/showcase.test.mjs and npm run check. Verify the embedded apps in the browser, including opaque-sandbox CORS, rugby public reads, THAW matching/saved profiles, and recursion limits. Commit the resulting assets with the adapter changes.

The root app does not compile these standalone adapters. Their source is built by the locked Vite toolchain. A generated provenance.json records the original source revisions. No raw project credentials or service files belong in public/.

## Security boundaries

Rugby’s admin module and route are excluded; its client never persists or imports authentication and only performs GET/HEAD requests to its public REST origin, forcing the anonymous key. THAW contains supplied sample profiles and local matching functions; no original server API routes, authentication, live messaging or paid model calls are built. Both demos remain separate documents behind iframe and response-header sandboxing. Static files allow CORS for the sandboxed module/font loads. None of this modifies the original team website, database permissions, or the music collector.
