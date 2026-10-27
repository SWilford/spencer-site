import { catalogName } from "./spotify-catalog.mjs";
export const ARTWORK_USER_AGENT = "SpencerSiteMusicStats/1.0 (+https://github.com/SWilford/spencer-site)";
// This capability deliberately cannot call Spotify's authenticated API or our collector.
export function artworkFetch(url, options = {}, fetcher = fetch) {
  const target = new URL(url);
  const allowed = target.origin === "https://open.spotify.com" && target.pathname === "/oembed"
    || target.origin === "https://musicbrainz.org" && target.pathname.startsWith("/ws/2/")
    || target.origin === "https://query.wikidata.org" && target.pathname === "/sparql";
  const headers = new Headers(options.headers);
  if (!allowed || target.username || target.password || headers.has("authorization") || headers.has("cookie")) throw new Error("Artwork requests must use credential-free public metadata endpoints");
  return fetcher(target, { ...options, redirect: "error" });
}
export function retrySeconds(response, now = Date.now()) {
  const value = response.headers.get("retry-after");
  const seconds = value && /^\d+$/.test(value) ? Number(value) : (Date.parse(value ?? "") - now) / 1000;
  return Math.max(60, Number.isFinite(seconds) ? Math.ceil(seconds) : 600);
}
export function safeThumbnail(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "i.scdn.co" || /^image-cdn-[a-z-]+\.spotifycdn\.com$/.test(url.hostname)) ? url.href : null;
  } catch { return null; }
}
export async function spotifyPreview(type, id, fetcher = fetch) {
  if (!["artist", "track", "album"].includes(type) || !/^[A-Za-z0-9]{22}$/.test(id)) throw new Error("Invalid public Spotify entity");
  const url = new URL("https://open.spotify.com/oembed");
  url.searchParams.set("url", `https://open.spotify.com/${type}/${id}`);
  // Deliberately no Authorization, client ID, app token, collector lease or Web API.
  const response = await artworkFetch(url, { redirect: "error", signal: AbortSignal.timeout(15000), headers: { "User-Agent": ARTWORK_USER_AGENT, Accept: "application/json" } }, fetcher);
  if (response.status === 429 || response.status >= 500) {
    const error = new Error(`Preview HTTP ${response.status}`); error.retrySeconds = retrySeconds(response); throw error;
  }
  if (response.status === 404) return { status: "unavailable", image: null };
  if (!response.ok) throw new Error(`Preview HTTP ${response.status}`);
  const data = await response.json();
  return { status: "matched", title: String(data.title ?? ""), image: safeThumbnail(data.thumbnail_url), url: `https://open.spotify.com/${type}/${id}` };
}
export function spotifyArtistLink(entity) {
  const ids = new Set((entity.relations ?? []).map(r => r.url?.resource).filter(Boolean).flatMap(value => {
    try { const u = new URL(value); const m = /^\/artist\/([A-Za-z0-9]{22})\/?$/.exec(u.pathname); return u.hostname === "open.spotify.com" && m ? [m[1]] : []; } catch { return []; }
  }));
  return ids.size === 1 ? [...ids][0] : null;
}
export function artistFromRelease(name, album, releases) {
  const ids = new Set();
  for (const release of releases) if (catalogName(release.title) === catalogName(album)) {
    for (const credit of release["artist-credit"] ?? []) if (catalogName(credit.name ?? credit.artist?.name) === catalogName(name) || catalogName(credit.artist?.name) === catalogName(name)) ids.add(credit.artist?.id);
  }
  ids.delete(undefined);
  return ids.size === 1 ? [...ids][0] : null;
}

export async function publicArtistIds(names, fetcher = fetch) {
  if (names.length > 25 || names.some(n => typeof n !== "string" || n.length > 300)) throw new Error("Invalid public catalog batch");
  const labels = [...new Set(names.flatMap(n => [n, n.toLowerCase(), n.toUpperCase(), n.replace(/\b\p{L}/gu, c => c.toUpperCase())]))];
  const query = `PREFIX hint: <http://www.bigdata.com/queryHints#> SELECT ?name ?spotify WHERE { hint:Query hint:optimizer "None". VALUES ?name { ${labels.map(n => `${JSON.stringify(n)}@en`).join(" ")} } ?artist rdfs:label ?name. ?artist wdt:P1902 ?spotify. }`;
  const url = new URL("https://query.wikidata.org/sparql");
  url.search = new URLSearchParams({ format: "json", query }).toString();
  const response = await artworkFetch(url, { redirect: "error", signal: AbortSignal.timeout(60000), headers: { "User-Agent": ARTWORK_USER_AGENT, Accept: "application/sparql-results+json" } }, fetcher);
  if (!response.ok) throw new Error(`Public catalog HTTP ${response.status}`);
  const data = await response.json(), candidates = new Map();
  for (const row of data.results?.bindings ?? []) {
    const name = catalogName(row.name?.value), id = row.spotify?.value;
    if (!/^[A-Za-z0-9]{22}$/.test(id)) continue;
    const ids = candidates.get(name) ?? new Set(); ids.add(id); candidates.set(name, ids);
  }
  return Object.fromEntries(names.flatMap(name => { const ids = candidates.get(catalogName(name)); return ids?.size === 1 ? [[catalogName(name), [...ids][0]]] : []; }));
}
