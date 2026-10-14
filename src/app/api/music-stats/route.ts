import { readFile } from "node:fs/promises";
import path from "node:path";
import { publicMusicStats, calendarRange, validMusicDate } from "@/lib/music-public";
import { dayKey, rangeDays, type MusicSnapshot } from "@/lib/music-stats";
import { withLocalAppleImport } from "@/lib/music-apple-import";

let cached: { snapshot: MusicSnapshot; expires: number } | undefined;

export async function GET(request: Request) {
  const headers = { "Cache-Control": "public, max-age=30, s-maxage=60", "X-Content-Type-Options": "nosniff" };
  try {
    let snapshot = cached && cached.expires > Date.now() ? cached.snapshot : undefined;
    if (!snapshot) {
      const config = process.env.MUSIC_COLLECTOR_KEY && process.env.MUSIC_SUPABASE_PROJECT_ID
        ? { key: process.env.MUSIC_COLLECTOR_KEY, project_id: process.env.MUSIC_SUPABASE_PROJECT_ID }
        : JSON.parse(await readFile(path.join(process.cwd(), "private-data/music/collector-bootstrap.json"), "utf8"));
      const response = await fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect`, {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "dashboard" }),
    });
      if (!response.ok) throw new Error("unavailable");
      snapshot = await response.json() as MusicSnapshot;
      cached = { snapshot, expires: Date.now() + 60000 };
    }
    snapshot = await withLocalAppleImport(snapshot);
    const params = new URL(request.url).searchParams;
    const today = dayKey(snapshot.generatedAt);
    const earliest = snapshot.plays.length ? snapshot.plays.map(p => dayKey(p.at)).sort()[0] : today;
    const preset = params.get("preset") ?? "month";
    if (!["day", "week", "month", "year", "past-year", "ytd", "lifetime", "custom"].includes(preset)) {
      return Response.json({ error: "Choose a supported timeframe." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const anchor = params.get("anchor") ?? today;
    if (!validMusicDate(anchor) || anchor > today) return Response.json({ error: "Choose a valid date up to today." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const range = preset === "custom" ? { start: params.get("start") ?? "", end: params.get("end") ?? "" } : calendarRange(preset, anchor, today, earliest);
    if (!validMusicDate(range.start) || !validMusicDate(range.end) || range.start > range.end || range.end > today || rangeDays(range) > 10958) {
      return Response.json({ error: "Choose a valid range of up to 30 years." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json(publicMusicStats(snapshot, range), { headers });
  } catch {
    return Response.json({ error: "Statistics are temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
