import { DatabaseSync } from "node:sqlite";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { catalogName, quoted, imageUrl } from "./spotify-catalog.mjs";
import { ARTWORK_USER_AGENT, artistFromRelease, spotifyArtistLink, spotifyPreview, publicArtistIds } from "./public-artwork.mjs";

const directory = new URL("../../private-data/music/spotify/", import.meta.url);
const file = new URL("catalog-enrichment.json", directory);
const stateFile = new URL("artwork-worker-status.json", directory);
const database = new DatabaseSync(new URL("spotify-history.sqlite3", directory), { readOnly: true });
let saved;
try { saved = JSON.parse(await readFile(file, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
saved ??= { schemaVersion: 1, artists: {}, covers: {}, responses: {}, completed: {} };
saved.completed ??= {};
const rows = database.prepare(`select artists_json,album,track_id,sum(milliseconds) milliseconds from events group by artists_json,album,track_id order by milliseconds desc`).all();
const artists = new Map(), albums = new Map();
const coverKey = (album, credits) => JSON.stringify(["", catalogName(album ?? ""), credits.map(a => catalogName(a.name)).sort()]);
for (const row of rows) {
  const credits = JSON.parse(row.artists_json);
  for (const artist of credits) {
    const key = catalogName(artist.name), value = artists.get(key) ?? { key, name: artist.name, milliseconds: 0, topAlbum: row.album };
    value.milliseconds += row.milliseconds; artists.set(key, value);
  }
  const key = coverKey(row.album, credits), album = albums.get(key) ?? { key, name: row.album, credits, uri: row.track_id, milliseconds: 0 };
  album.milliseconds += row.milliseconds; albums.set(key, album);
}
const save = async () => {
  const temporary = new URL("catalog-enrichment.next.json", directory);
  saved.updatedAt = new Date().toISOString();
  await writeFile(temporary, JSON.stringify(saved), { mode: 0o600 }); await rename(temporary, file);
  const display = new URL("catalog-display.next.json", directory);
  await writeFile(display, JSON.stringify({ artists: saved.artists, covers: saved.covers, updatedAt: saved.updatedAt }), { mode: 0o600 });
  await rename(display, new URL("catalog-display.json", directory));
};
await mkdir(directory, { recursive: true });
// Reuse actual Spotify responses already obtained. No collector credentials read.
try {
  const old = JSON.parse(await readFile(new URL("../apple/spotify-enrichment.json", directory), "utf8"));
  const input = JSON.parse(await readFile(new URL("../apple/apple-dashboard.json", directory), "utf8"));
  for (const p of input.plays) {
    for (const artist of p.artists) {
      const key = catalogName(artist.name), queued = artists.get(key) ?? { key, name: artist.name, milliseconds: 0, topAlbum: p.album };
      queued.milliseconds += p.actualMs; artists.set(key, queued);
      const match = old.artists[artist.id];
      if (match?.status === "matched") saved.artists[catalogName(artist.name)] ??= match;
    }
    const album = old.albums[p.albumId];
    if (album?.status === "matched" && album.image) saved.covers[coverKey(p.album, p.artists)] ??= album.image;
  }
  const candidates = new Map();
  for (const response of Object.values(old.searches)) for (const artist of response.artists?.items ?? []) {
    const key = catalogName(artist.name), ids = candidates.get(key) ?? new Map(); ids.set(artist.id, artist); candidates.set(key, ids);
  }
  for (const [key, ids] of candidates) if (ids.size === 1 && artists.has(key) && !saved.artists[key]) {
    const a = [...ids.values()][0];
    saved.artists[key] = { status: "matched", id: a.id, name: a.name, image: imageUrl(a.images), url: `https://open.spotify.com/artist/${a.id}`, source: "saved-spotify-response" };
  }
} catch (error) { if (error.code !== "ENOENT") throw error; }
try {
  const recent = JSON.parse(await readFile(new URL("../collector-snapshot.json", directory), "utf8"));
  for (const p of recent.plays) {
    if (p.artwork) { saved.covers[p.trackId] = p.artwork; saved.covers[coverKey(p.album, p.artists)] = p.artwork; }
    for (const a of p.artists) if (/^[A-Za-z0-9]{22}$/.test(a.id)) {
      const key = catalogName(a.name), queued = artists.get(key) ?? { key, name: a.name, milliseconds: 0, topAlbum: p.album };
      queued.milliseconds += p.actualMs ?? p.songLengthMs ?? 0; artists.set(key, queued);
      const profile = recent.artistProfiles?.[a.id];
      saved.artists[catalogName(a.name)] ??= { ...a, status: "matched", image: profile?.image ?? null, url: `https://open.spotify.com/artist/${a.id}`, source: "saved-spotify-play" };
    }
  }
} catch (error) { if (error.code !== "ENOENT") throw error; }
await save();
const queue = [...artists.values()].sort((a, b) => b.milliseconds - a.milliseconds);
const state = { startedAt: new Date().toISOString(), status: "running", totalArtists: queue.length, completedArtists: 0, images: 0, authenticatedSpotifyRequests: 0 };
const report = async () => {
  state.images = queue.filter(a => saved.artists[a.key]?.image).length;
  state.completedArtists = queue.filter(a => saved.completed[a.key]).length;
  await writeFile(stateFile, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ status: state.status, images: state.images, processed: state.completedArtists, total: state.totalArtists }));
};
let lastBrainz = 0;
async function brainz(resource, params) {
  const url = new URL(`https://musicbrainz.org/ws/2/${resource}`);
  url.search = new URLSearchParams({ ...params, fmt: "json" }).toString();
  if (saved.responses[url.href]) return saved.responses[url.href];
  if (saved.brainzRetryAt && Date.parse(saved.brainzRetryAt) > Date.now()) throw new Error("MusicBrainz backoff active; collector is unaffected");
  await delay(Math.max(0, 1100 - (Date.now() - lastBrainz))); lastBrainz = Date.now();
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000), headers: { "User-Agent": ARTWORK_USER_AGENT, Accept: "application/json" } });
  if (response.status === 429 || response.status >= 500) { saved.brainzRetryAt = new Date(Date.now() + Math.max(60, Number(response.headers.get("retry-after")) || 600) * 1000).toISOString(); await save(); throw new Error(`MusicBrainz HTTP ${response.status}; only artwork is paused`); }
  if (!response.ok) throw new Error(`MusicBrainz HTTP ${response.status}`);
  return saved.responses[url.href] = await response.json();
}
const flag = process.argv.indexOf("--limit"), limit = flag >= 0 ? Number(process.argv[flag + 1]) : 200;
if (!Number.isInteger(limit) || limit < 1 || limit > 10000) throw new Error("Invalid artwork limit");
let attempted = 0;
try {
  if (process.argv.includes("--wikidata")) {
    saved.wikidataChecked ??= {};
    saved.wikidataFailures ??= {};
    const missing = queue.filter(a => !saved.artists[a.key]?.id && !saved.wikidataChecked[a.key] && !(Date.parse(saved.wikidataFailures[a.key] ?? "") > Date.now())).slice(0, limit);
    for (let offset = 0; offset < missing.length; offset += 10) {
      const batch = missing.slice(offset, offset + 10);
      let ids;
      try { ids = await publicArtistIds(batch.map(a => a.name)); }
      catch (error) {
        for (const artist of batch) saved.wikidataFailures[artist.key] = new Date(Date.now() + 6 * 3600000).toISOString();
        state.note = `Public catalog deferred: ${error.message}`; await save(); continue;
      }
      for (const artist of batch) {
        saved.wikidataChecked[artist.key] = true;
        if (ids[artist.key]) saved.artists[artist.key] = { status: "pending", id: ids[artist.key], name: artist.name, image: null, source: "wikidata-spotify-link" };
      }
      await save(); await report(); await delay(1100);
    }
  }
  if (!process.argv.includes("--seed-only")) for (const artist of queue) {
    if (saved.completed[artist.key] || saved.artists[artist.key]?.image) { saved.completed[artist.key] = true; continue; }
    if (attempted++ >= limit) break;
    let match = saved.artists[artist.key];
    if (!match?.id) {
      if (saved.brainzRetryAt && Date.parse(saved.brainzRetryAt) > Date.now()) continue;
      let mbid;
      try {
      if (artist.topAlbum) {
        const releases = await brainz("release-group", { query: `artist:"${quoted(artist.name)}" AND releasegroup:"${quoted(artist.topAlbum)}"`, limit: "10" });
        mbid = artistFromRelease(artist.name, artist.topAlbum, releases["release-groups"] ?? []);
      }
      if (!mbid) {
        const data = await brainz("artist", { query: `artist:"${quoted(artist.name)}"`, limit: "10" });
        const exact = (data.artists ?? []).filter(a => catalogName(a.name) === artist.key && Number(a.score) === 100);
        if (exact.length === 1) mbid = exact[0].id;
      }
      if (mbid) {
        const entity = await brainz(`artist/${mbid}`, { inc: "url-rels" });
        const id = spotifyArtistLink(entity);
        if (id) match = { id, name: artist.name, source: "musicbrainz-spotify-link", mbid };
      }
      } catch (error) {
        if (saved.brainzRetryAt && Date.parse(saved.brainzRetryAt) > Date.now()) { state.note = error.message; continue; }
        throw error;
      }
    }
    if (match?.id) {
      if (saved.previewRetryAt && Date.parse(saved.previewRetryAt) > Date.now()) throw new Error("Spotify previews are backing off; collector is unaffected");
      await delay(300);
      const preview = await spotifyPreview("artist", match.id);
      if (preview.status === "matched" && catalogName(preview.title) === artist.key) saved.artists[artist.key] = { ...match, status: "matched", image: preview.image, url: preview.url };
      else saved.artists[artist.key] = { ...match, status: "review", image: null };
    } else saved.artists[artist.key] = { status: "unresolved", name: artist.name, image: null };
    saved.completed[artist.key] = true;
    await save();
    if (attempted % 10 === 0) await report();
  }
  if (process.argv.includes("--covers")) for (const album of [...albums.values()].sort((a, b) => b.milliseconds - a.milliseconds).slice(0, 200)) {
    if (saved.covers[album.key] || !/^spotify:track:[A-Za-z0-9]{22}$/.test(album.uri)) continue;
    await delay(300);
    const preview = await spotifyPreview("track", album.uri.split(":")[2]);
    if (preview.image) saved.covers[album.key] = preview.image;
    await save();
  }
  state.status = process.argv.includes("--seed-only") ? "seeded" : queue.some(a => !saved.completed[a.key]) ? "partial" : "complete";
} catch (error) {
  if (error.retrySeconds) saved.previewRetryAt = new Date(Date.now() + error.retrySeconds * 1000).toISOString();
  state.status = "paused"; state.error = error.message; process.exitCode = 1;
} finally { await save(); await report(); database.close(); }
