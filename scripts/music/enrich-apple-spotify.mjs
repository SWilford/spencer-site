import { readFile, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { catalogName, matchArtist, matchAlbum, matchTrack, quoted } from "./spotify-catalog.mjs";

if (!process.argv.includes("--cached-only")) throw new Error("Authenticated catalog lookups are disabled to protect collection. Use cache-music-artwork.mjs for public metadata, or --cached-only here.");

const directory = new URL("../../private-data/music/apple/", import.meta.url);
const input = JSON.parse(await readFile(new URL("apple-dashboard.json", directory), "utf8"));
const config = JSON.parse(await readFile(new URL("../collector-bootstrap.json", directory), "utf8"));
const filename = new URL("spotify-enrichment.json", directory);
const budgetFlag = process.argv.indexOf("--max-lookups");
const budget = budgetFlag < 0 ? 40 : Number(process.argv[budgetFlag + 1]);
if (!Number.isInteger(budget) || budget < 1 || budget > 100) throw new Error("Use --max-lookups 1..100 (default 40)");
let lookups = 0;
let saved;
try { saved = JSON.parse(await readFile(filename, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
saved ??= { schemaVersion: 1, runKey: input.runKey, artists: {}, albums: {}, searches: {} };
saved.tracks ??= {};
if (saved.runKey !== input.runKey) throw new Error("Enrichment belongs to another import run");
const artistRows = new Map(), albumRows = new Map();
for (const play of input.plays) {
  for (const artist of play.artists) {
    const row = artistRows.get(artist.id) ?? { ...artist, milliseconds: 0 };
    row.milliseconds += play.actualMs; artistRows.set(artist.id, row);
  }
  if (play.albumId && play.album && play.artists.length) {
    const row = albumRows.get(play.albumId) ?? { id: play.albumId, name: play.album, artists: play.artists.map(a => a.name), milliseconds: 0 };
    row.milliseconds += play.actualMs; albumRows.set(play.albumId, row);
  }
}
const save = async () => {
  const temporary = new URL("spotify-enrichment.next.json", directory);
  await writeFile(temporary, JSON.stringify(saved), { mode: 0o600 });
  await rename(temporary, filename);
};
async function search(queries) {
  if (process.argv.includes("--cached-only")) return queries.map(q => saved.searches[q.key]);
  const results = [];
  for (let offset = 0; offset < queries.length; offset += 20) {
    const batch = queries.slice(offset, offset + 20);
    const missing = batch.filter(q => !saved.searches[q.key]);
    if (missing.length) {
      if (lookups + missing.length > budget) throw new Error("Catalog lookup budget reached; progress is saved. Use --cached-only to apply saved matches.");
      if (saved.retryAt && Date.parse(saved.retryAt) > Date.now()) throw new Error(`Catalog backoff until ${saved.retryAt}; rerun afterwards.`);
      const invoke = action => fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(120000),
        headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(action === "catalog" ? { queries: missing.map(({ type, q }) => ({ type, q })) } : {}) }),
      });
      let response = await invoke("catalog"), body = await response.json();
      if (body.state === "collection_due") {
        const collection = await invoke("collect");
        const status = await collection.json();
        if (!collection.ok || status.state || status.error) throw new Error("Catalog yielded to history collection; rerun after collection is available.");
        response = await invoke("catalog"); body = await response.json();
      }
      for (let i = 0; i < (body.results?.length ?? 0); i++) saved.searches[missing[i].key] = body.results[i];
      lookups += body.results?.length ?? 0;
      if (body.retry_seconds) saved.retryAt = new Date(Date.now() + body.retry_seconds * 1000).toISOString();
      await save();
      if (!response.ok || body.state || body.error) throw new Error(body.error ?? `Catalog ${body.state ?? response.status}; saved progress can be resumed.`);
      console.log(JSON.stringify({ phase: "catalog-search", completed: Object.keys(saved.searches).length }));
    }
    results.push(...batch.map(q => saved.searches[q.key]));
  }
  return results;
}
const query = (type, q) => ({ type, q: q.slice(0, 250), key: createHash("sha256").update(`${type}:${q.slice(0, 250)}`).digest("hex") });
const artists = [...artistRows.values()].sort((a, b) => b.milliseconds - a.milliseconds);
const albums = [...albumRows.values()].sort((a, b) => b.milliseconds - a.milliseconds);
if (!saved.knownArtists) {
  const response = await fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect`, {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "dashboard" }),
  });
  if (!response.ok) throw new Error("Saved Spotify catalog unavailable");
  const snapshot = await response.json();
  saved.knownArtists = [...new Map(snapshot.plays.flatMap(p => p.artists).map(a => [a.id, a])).values()];
  await save();
}
const knownIds = name => saved.knownArtists.filter(a => catalogName(a.name) === catalogName(name)).map(a => a.id);
// Save matches after every batch, so a rate limit never loses earlier progress.
for (let offset = 0; offset < artists.length; offset += 20) {
  const batch = artists.slice(offset, offset + 20), data = await search(batch.map(a => query("artist", `artist:"${quoted(a.name)}"`)));
  batch.forEach((a, i) => { if (data[i]) saved.artists[a.id] = matchArtist(a.name, data[i].artists?.items ?? [], knownIds(a.name)); }); await save();
}
const unknownArtists = artists.filter(a => saved.artists[a.id]?.status === "no-match");
for (let offset = 0; offset < unknownArtists.length; offset += 20) {
  const batch = unknownArtists.slice(offset, offset + 20), data = await search(batch.map(a => query("artist", a.name)));
  batch.forEach((a, i) => { if (!data[i]) return; const match = matchArtist(a.name, data[i].artists?.items ?? [], knownIds(a.name)); if (match.status === "matched") saved.artists[a.id] = match; }); await save();
}
if (!process.argv.includes("--artists-only")) {
  for (let offset = 0; offset < albums.length; offset += 20) {
    const batch = albums.slice(offset, offset + 20), data = await search(batch.map(a => query("album", `album:"${quoted(a.name)}" artist:"${quoted(a.artists[0])}"`)));
    batch.forEach((a, i) => { if (data[i]) saved.albums[a.id] = matchAlbum(a.name, a.artists, data[i].albums?.items ?? []); }); await save();
  }
  // A plain album search catches punctuation/search-token differences, while
  // the same title/credit checks still prevent unrelated artwork substitutions.
  const unresolved = albums.filter(a => saved.albums[a.id]?.status !== "matched");
  for (let offset = 0; offset < unresolved.length; offset += 20) {
    const batch = unresolved.slice(offset, offset + 20), data = await search(batch.map(a => query("album", a.name)));
    batch.forEach((a, i) => { if (!data[i]) return; const match = matchAlbum(a.name, a.artists, data[i].albums?.items ?? []); if (match.status === "matched") saved.albums[a.id] = match; }); await save();
  }
  for (const artist of artists.filter(a => saved.artists[a.id]?.status !== "matched")) {
    const ids = albums.filter(a => a.artists.some(n => catalogName(n) === catalogName(artist.name))).flatMap(a => saved.albums[a.id]?.artists ?? []).filter(a => catalogName(a.name).replace(/^the /, "") === catalogName(artist.name).replace(/^the /, "")).map(a => a.id);
    const votes = new Map(); for (const id of ids) votes.set(id, (votes.get(id) ?? 0) + 1);
    const ranked = [...votes].sort((a, b) => b[1] - a[1]);
    if (ranked.length && (ranked.length === 1 || ranked[0][1] > ranked[1][1])) {
      const data = await search([query("artist", `artist:"${quoted(artist.name)}"`)]);
      const plain = saved.searches[query("artist", artist.name).key];
      saved.artists[artist.id] = matchArtist(artist.name, [...(data[0]?.artists?.items ?? []), ...(plain?.artists?.items ?? [])], [ranked[0][0]]);
    }
  }
  await save();
  const tracks = [...new Map(input.plays.filter(p => !p.artists.length).map(p => [p.trackId, p])).values()];
  for (let offset = 0; offset < tracks.length; offset += 20) {
    const batch = tracks.slice(offset, offset + 20), data = await search(batch.map(p => query("track", `track:"${quoted(p.name)}" album:"${quoted(p.album)}"`)));
    batch.forEach((p, i) => { if (data[i]) saved.tracks[p.trackId] = matchTrack(p, data[i].tracks?.items ?? []); }); await save();
  }
  const profiles = new Map(Object.values(saved.artists).filter(a => a.status === "matched").map(a => [a.id, a]));
  const recovered = [...new Map(Object.values(saved.tracks).filter(t => t.status === "matched").flatMap(t => t.artists).filter(a => !profiles.has(a.id)).map(a => [a.id, a])).values()];
  for (let offset = 0; offset < recovered.length; offset += 20) {
    const batch = recovered.slice(offset, offset + 20), data = await search(batch.map(a => query("artist", `artist:"${quoted(a.name)}"`)));
    batch.forEach((a, i) => { if (!data[i]) return; const match = matchArtist(a.name, data[i].artists?.items ?? [], [a.id]); if (match.status === "matched" && match.id === a.id) saved.artists[a.id] = match; }); await save();
  }
}
saved.updatedAt = new Date().toISOString(); await save();
const review = { updatedAt: saved.updatedAt, retryAt: saved.retryAt ?? null,
  artists: artists.filter(a => saved.artists[a.id]?.status !== "matched").map(a => ({ name: a.name, status: saved.artists[a.id]?.status ?? "pending" })),
  albums: albums.filter(a => saved.albums[a.id]?.status !== "matched").map(a => ({ name: a.name, artists: a.artists, status: saved.albums[a.id]?.status ?? "pending" })),
  tracks: [...new Map(input.plays.filter(p => !p.artists.length && saved.tracks[p.trackId]?.status !== "matched").map(p => [p.trackId, { name: p.name, album: p.album, status: saved.tracks[p.trackId]?.status ?? "pending" }])).values()] };
await writeFile(new URL("spotify-enrichment-review.json", directory), JSON.stringify(review, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ artists: artists.length, artists_matched: Object.values(saved.artists).filter(a => a.status === "matched").length,
  albums: albums.length, albums_matched: Object.values(saved.albums).filter(a => a.status === "matched").length,
  examples: artists.filter(a => ["sabaton", "linkin park"].includes(catalogName(a.name))).map(a => ({ name: a.name, ...saved.artists[a.id] })) }));
