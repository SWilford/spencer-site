import { createMusicHealthCheck } from "@/lib/music-health";
import { fetchSavedMusic, hostedMusicEnabled } from "@/lib/music-saved-data.mjs";
import { createMusicRequestLimit } from "@/lib/music-request-limit";

const admit = createMusicRequestLimit();
const health = createMusicHealthCheck(async () => {
  if (!hostedMusicEnabled()) throw new Error("Hosted saved data is not configured");
  return fetchSavedMusic();
});

export async function GET(request: Request) {
  const client = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (!admit(client)) return Response.json({ status: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
  const body = await health();
  return Response.json(body, { status: body.status === "ok" ? 200 : 503, headers: {
    "Cache-Control": "public, max-age=0, s-maxage=30, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  } });
}
