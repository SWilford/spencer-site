import { publicMusicStats, type PublicMusicStats } from "./music-public";
import { musicEntityKey } from "./music-entity-key";
import { dayKey, rank, summarize, type DateRange, type MusicSnapshot, type RankingKind } from "./music-stats";

export type MusicRanking = PublicMusicStats["rankings"]["tracks"][number];
export type MusicSelection = { kind: RankingKind; key: string };
export type PublicMusicDetail = {
  kind: RankingKind; entity: MusicRanking; stats: PublicMusicStats;
  lifetime: PublicMusicStats["summary"]; firstDay: string | null; lastDay: string | null;
};

export function validMusicSelection(params: URLSearchParams): MusicSelection | null | false {
  const kind = params.get("entityKind"), key = params.get("entityKey");
  if (kind === null && key === null) return null;
  if (!["artists", "albums", "tracks"].includes(kind ?? "") || !/^[a-f0-9]{64}$/.test(key ?? "")) return false;
  return { kind: kind as RankingKind, key: key! };
}

export function publicMusicDetail(snapshot: MusicSnapshot, range: DateRange, selection: MusicSelection): PublicMusicDetail | null {
  const plays = snapshot.plays.filter(play => {
    const ids = selection.kind === "artists" ? play.artists.map(a => a.id)
      : [selection.kind === "tracks" ? play.trackId : play.albumId ?? `unknown:${play.trackId}`];
    return ids.some(id => musicEntityKey(selection.kind, id) === selection.key);
  });
  if (!plays.length) return null;
  const days = plays.map(play => dayKey(play.at)).sort();
  const lifetimeRange = { start: days[0], end: dayKey(new Date()) };
  const filtered = { ...snapshot, plays };
  const rows = rank(plays, lifetimeRange, "estimated", selection.kind, "time");
  const row = rows.find(item => musicEntityKey(selection.kind, item.id) === selection.key);
  if (!row) return null;
  const profile = selection.kind === "artists" ? snapshot.artistProfiles?.[row.id] : null;
  const entity = { ...row, key: selection.key,
    id: row.id.startsWith("unknown:") || /^[a-f0-9]{64}$/.test(row.id) ? "unmatched" : row.id,
    artwork: selection.kind === "artists" ? profile?.image ?? null : row.artwork,
    url: selection.kind === "artists" ? profile?.url ?? null : row.url };
  const total = summarize(plays, lifetimeRange, "estimated");
  const selectedDays = days.filter(day => day >= range.start && day <= range.end);
  return { kind: selection.kind, entity, stats: publicMusicStats(filtered, range),
    lifetime: { streams: total.count, milliseconds: total.milliseconds, tracks: total.tracks, artists: total.artists,
      albums: total.albums, activeDays: total.activeDays, days: total.days },
    firstDay: selectedDays[0] ?? null, lastDay: selectedDays.at(-1) ?? null };
}
