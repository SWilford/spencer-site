import { dailySeries, dayKey, durationMs, playbackCount, rank, rangeDays, shiftDay, summarize, type DateRange, type MusicSnapshot } from "./music-stats";

function totals(snapshot: MusicSnapshot, range: DateRange) {
  const s = summarize(snapshot.plays, range, "estimated");
  // Explicit allowlist: never serialize selected/raw listening records.
  return { streams: s.count, milliseconds: s.milliseconds, tracks: s.tracks, artists: s.artists,
    albums: s.albums, activeDays: s.activeDays, days: s.days };
}
export function publicMusicStats(snapshot: MusicSnapshot, range: DateRange) {
  const summary = summarize(snapshot.plays, range, "estimated");
  const hours = Array.from({ length: 24 }, (_, hour) => ({ label: String(hour), count: 0, minutes: 0 }));
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(label => ({ label, count: 0 }));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(label => ({ label, count: 0 }));
  const years = new Map<string, number>();
  const hourFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" });
  const weekdayFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" });
  for (const p of summary.selected) {
    const date = dayKey(p.at), hour = Number(hourFormat.format(new Date(p.at)));
    const count = playbackCount(p);
    hours[hour].count += count; hours[hour].minutes += durationMs(p, "estimated") / 60000;
    weekdays.find(d => d.label === weekdayFormat.format(new Date(p.at)))!.count += count;
    months[Number(date.slice(5, 7)) - 1].count += count;
    years.set(date.slice(0, 4), (years.get(date.slice(0, 4)) ?? 0) + count);
  }
  const rankings = (kind: "tracks" | "artists" | "albums") => {
    const rows = new Map([...rank(snapshot.plays, range, "estimated", kind, "time").slice(0, 200),
      ...rank(snapshot.plays, range, "estimated", kind, "plays").slice(0, 200)].map(row => [row.id, row]));
    return [...rows.values()].map((row, index) => ({ ...row,
      ...(kind === "artists" ? { artwork: snapshot.artistProfiles?.[row.id]?.image ?? null, url: snapshot.artistProfiles?.[row.id]?.url ?? (/^[A-Za-z0-9]{22}$/.test(row.id) ? `https://open.spotify.com/artist/${row.id}` : null) } : {}),
      id: /^[a-f0-9]{64}$/.test(row.id) || row.id.startsWith("unknown:") ? `unmatched-${index}` : row.id }));
  };
  return {
    today: dayKey(snapshot.generatedAt), earliest: snapshot.plays.length ? snapshot.plays.map(p => dayKey(p.at)).sort()[0] : dayKey(snapshot.generatedAt),
    range, lastCollection: snapshot.lastCollection,
    summary: totals(snapshot, range),
    previous: totals(snapshot, { start: shiftDay(range.start, -rangeDays(range)), end: shiftDay(range.start, -1) }),
    daily: dailySeries(snapshot.plays, range, "estimated"), hours, weekdays, months,
    years: [...years].sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => ({ label, count })),
    rankings: {
      tracks: rankings("tracks"), artists: rankings("artists"), albums: rankings("albums"),
    },
    // Machine-readable provenance without a repeated visual warning.
    timeBasis: snapshot.plays.some(p => p.actualMs === null && p.songLengthMs !== null) ? "song-length-estimate" : "export-reported",
    partial: snapshot.truncated,
  };
}
export type PublicMusicStats = ReturnType<typeof publicMusicStats>;

export function calendarRange(preset: string, anchor: string, today: string, earliest: string): DateRange {
  switch (preset) {
    case "day": return { start: anchor, end: anchor };
    case "week": {
      const start = shiftDay(anchor, -((new Date(`${anchor}T12:00:00Z`).getUTCDay() + 6) % 7));
      return { start, end: shiftDay(start, 6) > today ? today : shiftDay(start, 6) };
    }
    case "month": {
      const d = new Date(`${anchor.slice(0, 7)}-01T12:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0);
      const end = d.toISOString().slice(0, 10);
      return { start: `${anchor.slice(0, 7)}-01`, end: end > today ? today : end };
    }
    case "year": return { start: `${anchor.slice(0, 4)}-01-01`, end: `${anchor.slice(0, 4)}-12-31` > today ? today : `${anchor.slice(0, 4)}-12-31` };
    case "past-year": return { start: shiftDay(today, -364), end: today };
    case "ytd": return { start: `${today.slice(0, 4)}-01-01`, end: today };
    default: return { start: earliest, end: today };
  }
}
export function validMusicDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0, 4)) >= 2000 &&
    Number(value.slice(0, 4)) <= 2100 && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
