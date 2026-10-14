import { readFile } from "node:fs/promises";
import path from "node:path";
import { canReadLocalMusic } from "@/lib/music-local-access";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "Vary": "Origin, Host", "X-Content-Type-Options": "nosniff" };
  if (!canReadLocalMusic(request.headers, process.env.MUSIC_LOCAL_PREVIEW === "1", Boolean(process.env.VERCEL))) {
    return Response.json({ error: "Private listening data is available only in the enabled local preview. Owner sign-in will be added before hosting." }, { status: 403, headers });
  }
  try {
    const config = JSON.parse(await readFile(path.join(process.cwd(), "private-data/music/collector-bootstrap.json"), "utf8"));
    const response = await fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect`, {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "dashboard" }),
    });
    if (!response.ok) throw new Error("unavailable");
    return Response.json(await response.json(), { headers });
  } catch {
    return Response.json({ error: "Saved statistics could not be loaded. Try refreshing; the collector continues independently." }, { status: 503, headers });
  }
}
