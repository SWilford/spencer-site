export type MusicPlay = {
  id: string; at: string; provider: "spotify" | "apple"; songLengthMs: number | null;
  actualMs: number | null; trackId: string; name: string; url: string | null;
  artists: { id: string; name: string }[]; albumId: string | null; album: string | null; artwork: string | null;
};
export type MusicSnapshot = { generatedAt: string; lastCollection: string | null; collectionError: string | null;
  collectionStartedAt: string | null; truncated: boolean; plays: MusicPlay[] };
export type DateRange = { start: string; end: string };
export type RangePreset = "day" | "week" | "month" | "year" | "past-year" | "ytd" | "lifetime" | "custom";
export type DurationMode = "estimated" | "measured";
export type RankingKind = "tracks" | "artists" | "albums";
export const TIMEZONE = "America/New_York";
export const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" },
  { value: "year", label: "Year" }, { value: "past-year", label: "Past year" },
  { value: "ytd", label: "Year to date" }, { value: "lifetime", label: "Lifetime" }, { value: "custom", label: "Custom" },
];
const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
export function dayKey(instant: string | Date) {
  const parts = dayFormatter.formatToParts(new Date(instant));
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type)!.value).join("-");
}
export function shiftDay(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function rangeDays(range: DateRange) {
  return Math.round((Date.parse(`${range.end}T12:00:00Z`) - Date.parse(`${range.start}T12:00:00Z`)) / 86400000) + 1;
}
export function presetRange(preset: RangePreset, today: string, earliest: string, year = Number(today.slice(0, 4))): DateRange {
  const currentYear = Number(today.slice(0, 4));
  switch (preset) {
    case "day": return { start: today, end: today };
    case "week": return { start: shiftDay(today, -((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7)), end: today };
    case "month": return { start: `${today.slice(0, 7)}-01`, end: today };
    case "year": return { start: `${year}-01-01`, end: `${year}-12-31` < today ? `${year}-12-31` : today };
    case "past-year": return { start: shiftDay(today, -364), end: today };
    case "ytd": return { start: `${currentYear}-01-01`, end: today };
    case "lifetime": return { start: earliest, end: today };
    default: return { start: `${today.slice(0, 7)}-01`, end: today };
  }
}
export function inRange(play: MusicPlay, range: DateRange) {
  const day = dayKey(play.at);
  return day >= range.start && day <= range.end;
}
export function durationMs(play: MusicPlay, mode: DurationMode) {
  return mode === "measured" ? play.actualMs ?? 0 : play.actualMs ?? play.songLengthMs ?? 0;
}
export function summarize(plays: MusicPlay[], range: DateRange, mode: DurationMode) {
  const selected = plays.filter(p => inRange(p, range));
  return { selected, count: selected.length, milliseconds: selected.reduce((total, p) => total + durationMs(p, mode), 0),
    tracks: new Set(selected.map(p => p.trackId)).size,
    artists: new Set(selected.flatMap(p => p.artists.map(a => a.id))).size,
    albums: new Set(selected.map(p => p.albumId).filter(Boolean)).size,
    activeDays: new Set(selected.map(p => dayKey(p.at))).size,
    durationKnown: selected.filter(p => mode === "measured" ? p.actualMs !== null : p.actualMs !== null || p.songLengthMs !== null).length,
    days: Math.max(1, rangeDays(range)) };
}
export function dailySeries(plays: MusicPlay[], range: DateRange, mode: DurationMode) {
  const totals = new Map<string, { count: number; milliseconds: number }>();
  for (const p of plays.filter(p => inRange(p, range))) {
    const key = dayKey(p.at), value = totals.get(key) ?? { count: 0, milliseconds: 0 };
    value.count++; value.milliseconds += durationMs(p, mode); totals.set(key, value);
  }
  const days = rangeDays(range);
  if (days < 1 || days > 36525) return [];
  return Array.from({ length: days }, (_, index) => { const day = shiftDay(range.start, index); return { day, ...(totals.get(day) ?? { count: 0, milliseconds: 0 }) }; });
}
export function rank(plays: MusicPlay[], range: DateRange, mode: DurationMode, kind: RankingKind, sort: "plays" | "time") {
  const map = new Map<string, { id: string; name: string; detail: string; count: number; milliseconds: number; artwork: string | null; url: string | null }>();
  for (const p of plays.filter(p => inRange(p, range))) {
    const identities = kind === "artists" ? p.artists.map(a => ({ id: a.id, name: a.name, detail: "Album artwork" }))
      : kind === "albums" ? [{ id: p.albumId ?? `unknown:${p.trackId}`, name: p.album ?? "Unknown album", detail: p.artists.map(a => a.name).join(", ") }]
      : [{ id: p.trackId, name: p.name, detail: p.artists.map(a => a.name).join(", ") || "Unknown artist" }];
    for (const item of identities) {
      const row = map.get(item.id) ?? { ...item, count: 0, milliseconds: 0, artwork: p.artwork, url: kind === "tracks" ? p.url : null };
      row.count++; row.milliseconds += durationMs(p, mode); map.set(item.id, row);
    }
  }
  return [...map.values()].sort((a, b) => (sort === "plays" ? b.count - a.count : b.milliseconds - a.milliseconds) || a.name.localeCompare(b.name));
}
export function breakdown(plays: MusicPlay[], mode: DurationMode, grouping: "weekday" | "month" | "year" | "hour") {
  const format = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", hourCycle: "h23" });
  const map = new Map<string, number>();
  if (grouping === "weekday") for (const k of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) map.set(k, 0);
  if (grouping === "hour") for (let i = 0; i < 24; i++) map.set(String(i), 0);
  for (const p of plays) {
    const day = dayKey(p.at);
    const key = grouping === "hour" ? String(Number(format.format(new Date(p.at)))) : grouping === "weekday"
      ? new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "short" }).format(new Date(p.at))
      : grouping === "month" ? day.slice(0, 7) : day.slice(0, 4);
    map.set(key, (map.get(key) ?? 0) + durationMs(p, mode) / 60000);
  }
  const rows = [...map].map(([label, minutes]) => ({ label, minutes }));
  return grouping === "month" || grouping === "year" ? rows.sort((a, b) => a.label.localeCompare(b.label)) : rows;
}
