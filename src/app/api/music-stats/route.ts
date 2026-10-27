import { readFile, writeFile, rename } from "node:fs/promises";
import { after } from "next/server";
import { createMusicRequestLimit } from "@/lib/music-request-limit";
const admit = createMusicRequestLimit();
import { hostedMusicEnabled, hostedMusicDirectory, fetchSavedMusic } from "@/lib/hosted-music-data";
export const maxDuration = 60;
import path from "node:path";
import { publicMusicStats, calendarRange, validMusicDate } from "@/lib/music-public";
import { dayKey, rangeDays, type MusicSnapshot } from "@/lib/music-stats";
import { withLocalAppleImport } from "@/lib/music-apple-import";
import { localMusicHistory } from "@/lib/music-history-store";
import { MusicSnapshotCache, StaleMusicSnapshotError } from "@/lib/music-snapshot-cache";

const snapshotFile = path.join(process.cwd(), "private-data/music/collector-snapshot.json");
const snapshots = new MusicSnapshotCache(async () => {
  if (hostedMusicEnabled()) return;
  try { return JSON.parse(await readFile(snapshotFile, "utf8")) as MusicSnapshot; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}, async () => {
  if (hostedMusicEnabled()) return await fetchSavedMusic() as MusicSnapshot;
  const config = process.env.MUSIC_COLLECTOR_KEY && process.env.MUSIC_SUPABASE_PROJECT_ID
    ? { key: process.env.MUSIC_COLLECTOR_KEY, project_id: process.env.MUSIC_SUPABASE_PROJECT_ID }
    : JSON.parse(await readFile(path.join(process.cwd(), "private-data/music/collector-bootstrap.json"), "utf8"));
  const response = await fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect`, {
    method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "dashboard" }),
  });
  if (!response.ok) throw new Error("unavailable");
  return await response.json() as MusicSnapshot;
}, async snapshot => {
  if (hostedMusicEnabled()) return;
  const temporary = `${snapshotFile}.web-next`;
  await writeFile(temporary, JSON.stringify(snapshot), { mode: 0o600 });
  await rename(temporary, snapshotFile);
});

export async function GET(request: Request) {
  const client = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (!admit(client)) return Response.json({ error: "Too many statistics requests. Please wait a minute." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
  const input = new URL(request.url).searchParams;
  if ([...input.keys()].some(key => !["preset", "anchor", "start", "end"].includes(key)) ||
      !["day", "week", "month", "year", "past-year", "ytd", "lifetime", "custom"].includes(input.get("preset") ?? "month") ||
      ["anchor", "start", "end"].some(key => input.has(key) && !validMusicDate(input.get(key)!))) {
    return Response.json({ error: "Choose a supported timeframe and valid dates." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const headers = { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120", "X-Content-Type-Options": "nosniff" };
  try {
    let snapshot = await snapshots.get();
    after(() => snapshots.refresh());
    const directory = hostedMusicEnabled() ? await hostedMusicDirectory() : undefined;
    snapshot = await withLocalAppleImport(snapshot, directory);
    const history = await localMusicHistory(snapshot, directory);
    const params = new URL(request.url).searchParams;
    const today = dayKey(new Date());
    const earliest = history?.earliest ?? (snapshot.plays.length ? snapshot.plays.map(p => dayKey(p.at)).sort()[0] : today);
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
    return Response.json(history ? history.stats(range) : publicMusicStats(snapshot, range), { headers });
  } catch (error) {
    return Response.json({ error: error instanceof StaleMusicSnapshotError
      ? "Couldn’t refresh saved stats from the cloud. The collector runs separately; this does not mean collection has stopped."
      : "Statistics are temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
