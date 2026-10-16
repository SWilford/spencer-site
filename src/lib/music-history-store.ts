import { DatabaseSync } from "node:sqlite";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { dayKey, durationMs, playbackCount, rangeDays, shiftDay, type DateRange, type MusicSnapshot } from "./music-stats";
import type { PublicMusicStats } from "./music-public";

type Value = string | number | null;
type Row = Record<string, Value>;
type Statement = { all(...args: Value[]): Row[]; get(...args: Value[]): Row | undefined; run(...args: Value[]): unknown };
type Database = { exec(sql: string): void; prepare(sql: string): Statement; close(): void };
export const metadataName = (name: string) => name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
type Profile = { id?: string; name?: string; image?: string | null; url?: string; status?: string };
export type HistoryMetadata = { artists: Record<string, Profile>; covers: Record<string, string> };
const uri = (id: string) => /^[A-Za-z0-9]{22}$/.test(id) ? `spotify:track:${id}` : id;
const signature = (name: string, album: string | null, artists: string[]) => JSON.stringify([metadataName(name), metadataName(album ?? ""), artists.map(metadataName).sort()]);

export class MusicHistoryStore {
  private db: Database;
  private results = new Map<string, PublicMusicStats>();
  readonly reconciliation = { matched: 0, ambiguous: 0, liveRetained: 0 };
  readonly earliest: string;
  constructor(filename: string, private snapshot: MusicSnapshot, metadata: HistoryMetadata = { artists: {}, covers: {} }) {
    this.db = new DatabaseSync(filename, { readOnly: true });
    const db = this.db;
    db.exec(`
      pragma temp_store=memory;
      create temp table live(id text,at integer,day text,hour integer,weekday integer,milliseconds integer,stream_count integer,
        track_id text,name text,artists_json text,album_id text,album text,url text,artwork text,estimated integer);
      create temp table catalog(track_id text primary key,name text,artists_json text,album_id text,album text,url text,artwork text);
      create temp table artist_alias(source_id text primary key,target_id text,name text,image text,url text);
    `);
    const catalog = db.prepare("insert or replace into catalog values(?,?,?,?,?,?,?)");
    const alias = db.prepare("insert or replace into artist_alias values(?,?,?,?,?)");
    const profiles = new Map<string, { id: string; name: string; image: string | null; url: string | null }>();
    const ambiguousNames = new Set<string>();
    for (const [name, p] of Object.entries(metadata.artists)) if (p.id && p.status === "matched") profiles.set(name, { id: p.id, name: p.name ?? name, image: p.image ?? null, url: p.url ?? `https://open.spotify.com/artist/${p.id}` });
    for (const play of snapshot.plays) for (const artist of play.artists) {
      const profile = snapshot.artistProfiles?.[artist.id];
      if (/^[A-Za-z0-9]{22}$/.test(artist.id)) {
        const key = metadataName(artist.name), previous = profiles.get(key);
        if (!previous || previous.id === artist.id) profiles.set(key, { ...artist, image: profile?.image ?? previous?.image ?? null, url: profile?.url ?? `https://open.spotify.com/artist/${artist.id}` });
        else ambiguousNames.add(key);
      }
    }
    const addArtists = (artists: { id: string; name: string }[]) => {
      for (const artist of artists) {
        const named = profiles.get(metadataName(artist.name));
        const direct = snapshot.artistProfiles?.[artist.id];
        const p = /^[A-Za-z0-9]{22}$/.test(artist.id)
          ? { ...artist, image: direct?.image ?? (named?.id === artist.id ? named.image : null), url: direct?.url ?? `https://open.spotify.com/artist/${artist.id}` }
          : ambiguousNames.has(metadataName(artist.name)) ? undefined : named;
        alias.run(artist.id, p?.id ?? artist.id, artist.name, p?.image ?? null, p?.url ?? null);
      }
    };
    const signatures = new Map<string, Set<string>>();
    db.exec("begin");
    try {
      const albums = new Map<string, Set<string>>();
      for (const p of snapshot.plays) if (p.provider === "spotify" && p.albumId) {
        const key = signature("", p.album, p.artists.map(a => a.name));
        const ids = albums.get(key) ?? new Set<string>(); ids.add(p.albumId); albums.set(key, ids);
      }
      const hasCatalog = db.prepare("select 1 n from sqlite_master where name='track_catalog'").get();
      const historyCatalog = db.prepare(hasCatalog ? "select * from track_catalog" : "select track_id,name,artists_json,album_id,album,url,max(at) from events group by track_id").all();
      for (const row of historyCatalog) {
        const artists = JSON.parse(String(row.artists_json)) as { id: string; name: string }[];
        addArtists(artists);
        const key = signature(String(row.name), row.album as string | null, artists.map(a => a.name));
        const ids = signatures.get(key) ?? new Set<string>(); ids.add(String(row.track_id)); signatures.set(key, ids);
        const albumIds = albums.get(signature("", row.album as string | null, artists.map(a => a.name)));
        const albumId = albumIds?.size === 1 ? [...albumIds][0] : row.album_id;
        const coverKey = signature("", row.album as string | null, artists.map(a => a.name));
        catalog.run(row.track_id, row.name, row.artists_json, albumId ?? null, row.album, row.url, metadata.covers[String(row.track_id)] ?? metadata.covers[coverKey] ?? null);
      }
      // Even reconciled live entries remain useful catalog metadata.
      for (const p of snapshot.plays.filter(p => p.provider === "spotify")) {
        addArtists(p.artists);
        catalog.run(uri(p.trackId), p.name, JSON.stringify(p.artists), p.albumId, p.album, p.url, p.artwork);
      }
      const find = db.prepare("select event_key,at from events where track_id=? and at>=? and at<=?");
      const insert = db.prepare("insert into live values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
      const hourFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" });
      for (const p of snapshot.plays) {
        const at = Date.parse(p.at);
        let trackId = uri(p.trackId);
        if (p.provider === "spotify") {
          // Observed API played_at matches the export's truncated end timestamp.
          // One-to-one only: ambiguous evidence stays outside totals for review.
          const matches = find.all(trackId, at - 1000, at + 1000);
          if (matches.length) { this.reconciliation[matches.length === 1 ? "matched" : "ambiguous"]++; continue; }
        } else {
          const ids = signatures.get(signature(p.name, p.album, p.artists.map(a => a.name)));
          if (ids?.size === 1) trackId = [...ids][0];
          addArtists(p.artists);
        }
        const day = dayKey(p.at), date = new Date(`${day}T12:00:00Z`);
        insert.run(p.id, at, day, Number(hourFormat.format(new Date(at))), (date.getUTCDay() + 6) % 7,
          durationMs(p, "estimated"), playbackCount(p), trackId, p.name, JSON.stringify(p.artists), p.albumId, p.album, p.url, p.artwork,
          p.actualMs === null && p.songLengthMs !== null ? 1 : 0);
        this.reconciliation.liveRetained++;
      }
      db.exec("commit");
    } catch (error) { db.exec("rollback"); db.close(); throw error; }
    db.exec(`create temp view all_plays as
      select e.event_key id,e.at,e.day,e.hour,e.weekday,e.milliseconds,e.stream_count,e.track_id,
        coalesce(c.name,e.name) name,coalesce(c.artists_json,e.artists_json) artists_json,
        coalesce(c.album_id,e.album_id) album_id,coalesce(c.album,e.album) album,coalesce(c.url,e.url) url,c.artwork,0 estimated
      from events e left join catalog c on c.track_id=e.track_id
      union all
      select l.id,l.at,l.day,l.hour,l.weekday,l.milliseconds,l.stream_count,l.track_id,
        coalesce(c.name,l.name),coalesce(c.artists_json,l.artists_json),coalesce(c.album_id,l.album_id),coalesce(c.album,l.album),
        coalesce(c.url,l.url),coalesce(c.artwork,l.artwork),l.estimated from live l left join catalog c on c.track_id=l.track_id;`);
    db.exec(`create temp table timeline as select *,coalesce((select group_concat(value->>'name',', ') from json_each(p.artists_json)),'Unknown artist') artist_detail from all_plays p;
      drop view all_plays; alter table timeline rename to all_plays;
      create index temp.all_plays_day on all_plays(day);
      create temp table artist_facts as select p.day,coalesce(m.target_id,a.value->>'id') id,min(a.value->>'name') name,
        sum(p.stream_count) count,sum(p.milliseconds) milliseconds,max(m.image) artwork,max(m.url) url
        from all_plays p,json_each(p.artists_json) a left join artist_alias m on m.source_id=a.value->>'id'
        group by p.day,coalesce(m.target_id,a.value->>'id');
      create index temp.artist_facts_day on artist_facts(day);
      create temp table time_facts as select day,hour,weekday,sum(milliseconds) milliseconds,sum(stream_count) stream_count from all_plays group by day,hour,weekday;
      create index temp.time_facts_day on time_facts(day);
      create temp table track_facts as select day,track_id id,min(name) name,min(artist_detail) detail,sum(milliseconds) milliseconds,sum(stream_count) count,max(artwork) artwork,max(url) url from all_plays group by day,track_id;
      create index temp.track_facts_day on track_facts(day);
      create temp table album_facts as select day,coalesce(album_id,'unknown:'||track_id) id,min(coalesce(album,'Unknown album')) name,min(artist_detail) detail,sum(milliseconds) milliseconds,sum(stream_count) count,max(artwork) artwork,null url,max(album_id is not null) known from all_plays group by day,coalesce(album_id,'unknown:'||track_id);
      create index temp.album_facts_day on album_facts(day);
      drop table all_plays;`);
    this.earliest = String(db.prepare("select min(day) day from time_facts").get()?.day ?? dayKey(snapshot.generatedAt));
  }
  close() { this.db.close(); }
  private totals(range: DateRange) {
    const row = this.db.prepare(`select coalesce(sum(stream_count),0) streams,coalesce(sum(milliseconds),0) milliseconds,
      count(distinct day) activeDays from time_facts where day between ? and ?`).get(range.start, range.end)!;
    const tracks = this.db.prepare("select count(distinct id) n from track_facts where day between ? and ?").get(range.start, range.end)!;
    const albums = this.db.prepare("select count(distinct id) n from album_facts where known=1 and day between ? and ?").get(range.start, range.end)!;
    const artists = this.db.prepare("select count(distinct id) n from artist_facts where day between ? and ?").get(range.start, range.end)!;
    return { streams: Number(row.streams), milliseconds: Number(row.milliseconds), tracks: Number(tracks.n), artists: Number(artists.n),
      albums: Number(albums.n), activeDays: Number(row.activeDays), days: Math.max(1, rangeDays(range)) };
  }
  stats(range: DateRange): PublicMusicStats {
    const key = `${range.start}:${range.end}`, cached = this.results.get(key);
    if (cached) return cached;
    const args = [range.start, range.end];
    const groups = (column: string) => this.db.prepare(`select ${column} label,sum(stream_count) count,sum(milliseconds) milliseconds from time_facts where day between ? and ? group by ${column}`).all(...args);
    const days = new Map(groups("day").map(r => [String(r.label), r]));
    const hours = new Map(groups("hour").map(r => [Number(r.label), r]));
    const weekdays = new Map(groups("weekday").map(r => [Number(r.label), r]));
    const months = new Map(groups("cast(substr(day,6,2) as integer)").map(r => [Number(r.label), r]));
    const ranking = (kind: "tracks" | "artists" | "albums") => {
      const sql = kind === "artists" ? `select id,min(name) name,'Artist profile' detail,
        sum(count) count,sum(milliseconds) milliseconds,max(artwork) artwork,max(url) url
        from artist_facts where day between ? and ? group by id`
        : `select id,min(name) name,min(detail) detail,sum(count) count,sum(milliseconds) milliseconds,max(artwork) artwork,${kind === "tracks" ? "max(url)" : "null"} url
        from ${kind === "tracks" ? "track_facts" : "album_facts"} where day between ? and ? group by id`;
      return this.db.prepare(`with rows as (${sql}),ordered as (select *,row_number() over(order by milliseconds desc,name) t,row_number() over(order by count desc,name) s from rows)
        select id,name,detail,count,milliseconds,artwork,url from ordered where t<=200 or s<=200 order by milliseconds desc,name`).all(...args).map((r, index) => ({
          id: String(r.id).startsWith("unknown:") || /^[a-f0-9]{64}$/.test(String(r.id)) ? `unmatched-${index}` : String(r.id), name: String(r.name), detail: String(r.detail),
          count: Number(r.count), milliseconds: Number(r.milliseconds), artwork: r.artwork as string | null, url: r.url as string | null }));
    };
    const result: PublicMusicStats = { today: dayKey(this.snapshot.generatedAt), earliest: this.earliest, range, lastCollection: this.snapshot.lastCollection,
      summary: this.totals(range), previous: this.totals({ start: shiftDay(range.start, -rangeDays(range)), end: shiftDay(range.start, -1) }),
      daily: Array.from({ length: rangeDays(range) }, (_, i) => { const day = shiftDay(range.start, i), row = days.get(day); return { day, count: Number(row?.count ?? 0), milliseconds: Number(row?.milliseconds ?? 0) }; }),
      hours: Array.from({ length: 24 }, (_, hour) => ({ label: String(hour), count: Number(hours.get(hour)?.count ?? 0), minutes: Number(hours.get(hour)?.milliseconds ?? 0) / 60000 })),
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({ label, count: Number(weekdays.get(i)?.count ?? 0) })),
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((label, i) => ({ label, count: Number(months.get(i + 1)?.count ?? 0) })),
      years: groups("substr(day,1,4)").sort((a, b) => String(a.label).localeCompare(String(b.label))).map(r => ({ label: String(r.label), count: Number(r.count) })),
      rankings: { tracks: ranking("tracks"), artists: ranking("artists"), albums: ranking("albums") },
      timeBasis: this.db.prepare("select 1 n from live where estimated=1 limit 1").get() ? "song-length-estimate" : "export-reported", partial: this.snapshot.truncated };
    if (this.results.size >= 32) this.results.delete(this.results.keys().next().value!);
    this.results.set(key, result);
    return result;
  }
}

let cached: { key: string; store: MusicHistoryStore } | undefined;
export async function localMusicHistory(snapshot: MusicSnapshot) {
  const filename = path.join(process.cwd(), "private-data/music/spotify/spotify-history.sqlite3");
  let info;
  try { info = await stat(filename); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  const metaFile = path.join(process.cwd(), "private-data/music/spotify/catalog-display.json");
  let metadata: HistoryMetadata = { artists: {}, covers: {} }, modified = 0;
  try { modified = (await stat(metaFile)).mtimeMs; metadata = JSON.parse(await readFile(metaFile, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const key = `${info.mtimeMs}:${modified}:${snapshot.generatedAt}:${snapshot.plays.filter(p => p.provider === "apple").length}`;
  if (cached?.key !== key) {
    const previous = cached?.store;
    cached = { key, store: new MusicHistoryStore(filename, snapshot, metadata) };
    // Let already-resolved callers finish their synchronous range query first.
    if (previous) setTimeout(() => previous.close(), 0);
  }
  return cached.store;
}
