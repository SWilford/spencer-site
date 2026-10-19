import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { MusicPlay, MusicSnapshot } from "./music-stats";

type AppleInput = { schemaVersion: number; runKey: string; source: string; plays: MusicPlay[] };
type CatalogMatch = { status: string; id?: string; name?: string; image?: string | null; url?: string; artists?: MusicPlay["artists"]; albumId?: string; album?: string; artworkOnly?: boolean };
type AppleEnrichment = { schemaVersion: number; runKey: string; artists: Record<string, CatalogMatch>; albums: Record<string, CatalogMatch>; tracks?: Record<string, CatalogMatch> };
const normalized = (value: string) => value.normalize("NFC").toLocaleLowerCase("en-US").trim().replace(/\s+/g, " ");

// IMPORTANT: Apple is a ONE-TIME FILE IMPORT. Never add Apple API/auth/sync.
// This is an internal inclusion switch, never a public request parameter.
export function includeAppleImport(snapshot: MusicSnapshot, input: AppleInput, enabled: boolean, enrichment?: AppleEnrichment): MusicSnapshot {
  if (!enabled) return snapshot;
  if (input.schemaVersion !== 1 || input.source !== "one-time-apple-file-import" || !/^[a-f0-9]{64}$/.test(input.runKey) || !Array.isArray(input.plays)) throw new Error("Invalid Apple dashboard input");
  if (enrichment && (enrichment.schemaVersion !== 1 || enrichment.runKey !== input.runKey)) throw new Error("Apple catalog cache belongs to another import");
  const artistProfiles = { ...snapshot.artistProfiles };
  for (const match of Object.values(enrichment?.artists ?? {})) {
    if (match.status === "matched" && match.id && /^[A-Za-z0-9]{22}$/.test(match.id)) artistProfiles[match.id] = { image: match.image ?? artistProfiles[match.id]?.image ?? null, url: `https://open.spotify.com/artist/${match.id}` };
  }
  const spotify = snapshot.plays.filter(p => p.provider !== "apple");
  const artists = new Map<string, Map<string, MusicPlay["artists"][number]>>();
  const tracks = new Map<string, Map<string, MusicPlay>>();
  const albums = new Map<string, Map<string, MusicPlay>>();
  const trackKey = (p: MusicPlay) => JSON.stringify([normalized(p.name), normalized(p.album ?? ""), p.artists.map(a => normalized(a.name)).sort()]);
  const albumKey = (p: MusicPlay) => JSON.stringify([normalized(p.album ?? ""), p.artists.map(a => normalized(a.name)).sort()]);
  for (const play of spotify) {
    for (const artist of play.artists) {
      const key = normalized(artist.name), rows = artists.get(key) ?? new Map();
      rows.set(artist.id, artist); artists.set(key, rows);
    }
    const key = trackKey(play), rows = tracks.get(key) ?? new Map();
    rows.set(play.trackId, play); tracks.set(key, rows);
    if (play.albumId) {
      const key = albumKey(play), rows = albums.get(key) ?? new Map();
      rows.set(play.albumId, play); albums.set(key, rows);
    }
  }
  const seen = new Set<string>();
  const imported = input.plays.map(source => {
    let play = source;
    if (play.provider !== "apple" || typeof play.id !== "string" || !play.id.startsWith("apple:") || seen.has(play.id) ||
        !Number.isFinite(Date.parse(play.at)) || !Number.isSafeInteger(play.actualMs) || play.actualMs! < 0 ||
        ![0, 1].includes(play.streamCount!) || typeof play.trackId !== "string" || typeof play.name !== "string" ||
        !Array.isArray(play.artists) || play.artists.some(a => typeof a.id !== "string" || typeof a.name !== "string")) throw new Error("Invalid Apple fragment");
    seen.add(play.id);
    const track = enrichment?.tracks?.[play.trackId];
    const album = play.albumId ? enrichment?.albums[play.albumId] : undefined;
    if (track?.status === "matched" && track.id) play = { ...play, trackId: track.id, albumId: track.albumId ?? play.albumId, artwork: track.image ?? null, url: track.url ?? play.url, artists: track.artists ?? play.artists };
    if (album?.status === "matched") play = { ...play, artwork: play.artwork ?? album.image ?? null, albumId: album.artworkOnly ? play.albumId : album.id ?? play.albumId };
    play = { ...play, artists: play.artists.map(artist => {
      const match = enrichment?.artists[artist.id];
      return match?.status === "matched" && match.id ? { id: match.id, name: artist.name } : artist;
    }) };
    const candidates = [...(tracks.get(trackKey(play))?.values() ?? [])].filter(p => p.songLengthMs !== null && play.songLengthMs !== null && Math.abs(p.songLengthMs - play.songLengthMs) <= 1000);
    const match = candidates.length === 1 ? candidates[0] : undefined;
    const albumRows = [...(albums.get(albumKey(play))?.values() ?? [])];
    return { ...play, trackId: match?.trackId ?? play.trackId, artwork: match?.artwork ?? play.artwork, url: match?.url ?? play.url,
      albumId: match?.albumId ?? (albumRows.length === 1 ? albumRows[0].albumId : play.albumId),
      artists: play.artists.map(artist => {
        const matches = [...(artists.get(normalized(artist.name))?.values() ?? [])];
        return matches.length === 1 ? matches[0] : artist;
      }) };
  });
  // Replacing the Apple subset makes inclusion idempotent. Spotify stays untouched.
  return { ...snapshot, artistProfiles, plays: [...spotify, ...imported] };
}

const localInputs = new WeakMap<MusicSnapshot, { key: string; value: MusicSnapshot }>();
export async function withLocalAppleImport(snapshot: MusicSnapshot) {
  if (process.env.MUSIC_INCLUDE_APPLE_IMPORT !== "true") return snapshot;
  const filename = path.join(process.cwd(), "private-data/music/apple/apple-dashboard.json");
  const info = await stat(filename);
  if (info.size > 25000000) throw new Error("Apple dashboard input exceeds limit");
  const enrichmentFile = path.join(process.cwd(), "private-data/music/apple/spotify-enrichment.json");
  let enrichmentModified = 0;
  try { enrichmentModified = (await stat(enrichmentFile)).mtimeMs; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const key = `${info.mtimeMs}:${info.size}:${enrichmentModified}`;
  const cached = localInputs.get(snapshot);
  if (cached?.key === key) return cached.value;
  const input = JSON.parse(await readFile(filename, "utf8")) as AppleInput;
  let enrichment: AppleEnrichment | undefined;
  try { enrichment = JSON.parse(await readFile(enrichmentFile, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const value = includeAppleImport(snapshot, input, true, enrichment);
  localInputs.set(snapshot, { key, value });
  return value;
}
