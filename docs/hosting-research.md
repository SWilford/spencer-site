# Hosting research

Checked against vendor documentation on October 12, 2026. Proposed services only; no resources provisioned. Recheck pricing and account usage before committing.

| Service | Starting approach | Important limits and cost |
| --- | --- | --- |
| Vercel | Hobby for eligible personal use | Free; 100 GB fast data transfer, 1 million function invocations, 4 active CPU hours and 360 GB-hours provisioned memory included. Usage caps are independent. Hobby is restricted to personal noncommercial use. |
| Supabase | Free when music development begins | 500 MB database, 1 GB file storage, 5 GB egress; inactivity can pause projects after one week. No automatic backups on Free. Pro starts at $25/month, includes credits covering one Micro compute instance; additional usage/projects can add cost. |
| Cloudflare R2 | Standard storage when needed | Free allowance: 10 GB-month storage, 1 million Class A and 10 million Class B operations monthly; internet egress free. Standard storage beyond allowance $0.015/GB-month; operation charges also apply. |

Sources: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Supabase pricing](https://supabase.com/pricing), [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

Vercel Hobby built-in cron jobs have a minimum interval of once daily and imprecise hourly scheduling. A protected ordinary endpoint can instead be called by an external scheduler; invocations still consume normal function quotas. At ten-minute intervals, one job runs 144 times/day, or 4,320 times in 30 days before retries. Low invocation count does not guarantee all CPU, memory, network, and database limits fit. [Cron usage](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Vercel has a 4.5 MB function request/response body limit. Do not route large privacy ZIP uploads through a function body. Use direct private object uploads and bounded processing instead. [Function limitations](https://vercel.com/docs/functions/limitations).

Start the core site at $0 infrastructure cost within eligible free quotas, excluding domain registration and optional services. Music storage viability depends on real export size, normalized row count, indexes, retained evidence, and traffic. Measure these before choosing a paid plan. Establish a monthly budget and backup policy before production music ingestion.

External scheduler pricing/reliability is not verified yet. Spotify developer access and collection feasibility also require current-policy verification when credentials are available. No promise of automatic Apple collection or privacy ZIP downloading.

## Domain decision deferred

Candidates: spencerwilford.com, swilford.com, sawilford.com. Availability and registrar-specific first-year/renewal prices remain unverified. Do not equate absence of a website or DNS records with availability. Compare total renewal cost, privacy fees, transfer policy, and premium status at purchase time. No domain purchase or DNS changes authorized.
