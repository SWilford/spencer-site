import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { musicDataUrl } from "./music-saved-data";
export { hostedMusicEnabled, musicDataUrl, fetchSavedMusic } from "./music-saved-data";
const files = { "history.sqlite3": "spotify/spotify-history.sqlite3", "apple.json": "apple/apple-dashboard.json", "apple-enrichment.json": "apple/spotify-enrichment.json", "catalog.json": "spotify/catalog-display.json" };
let pending: Promise<string> | undefined;
export function hostedMusicDirectory() {
  if (!pending) pending = load().catch(error => { pending = undefined; throw error; });
  return pending.then(async directory => { await refreshCatalog(directory); return directory; });
}
async function load() {
  const manifestText = process.env.MUSIC_HISTORY_MANIFEST;
  if (!manifestText) throw new Error("Hosted history manifest is missing");
  const manifest = JSON.parse(manifestText) as Record<string, { sha256: string; bytes: number }>;
  const version = createHash("sha256").update(manifestText).digest("hex").slice(0, 20);
  const directory = path.join(tmpdir(), `spencer-music-${version}`);
  const bundle = path.join(process.cwd(), "private-data/music/site-bundle");
  let bundled = false;
  try { bundled = await readFile(path.join(bundle,"manifest.json"),"utf8") === manifestText; } catch { /* development or runtime fallback */ }
  const results = await Promise.allSettled(Object.entries(files).map(async ([name, relative]) => {
    const record = manifest[name];
    if (!record || !/^[a-f0-9]{64}$/.test(record.sha256) || !Number.isSafeInteger(record.bytes) || record.bytes < 1 || record.bytes > 30 * 1024 * 1024) throw new Error("Invalid history manifest");
    const destination = path.join(directory, relative);
    // A completed file is immutable within this manifest version.
    try { await readFile(`${destination}.verified`); return; } catch { /* cold instance */ }
    if (bundled) {
      await mkdir(path.dirname(destination), {recursive:true});
      await copyFile(path.join(bundle,relative),`${destination}.next`);
      await rename(`${destination}.next`,destination);
      await writeFile(`${destination}.verified`,record.sha256,{mode:0o600});
      return;
    }
    const url = new URL(musicDataUrl());
    url.searchParams.set("asset", `${name}.gz`); url.searchParams.set("sha", record.sha256);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${process.env.MUSIC_SITE_READ_KEY}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error("Hosted history unavailable");
    const compressed = Buffer.from(await response.arrayBuffer());
    if (compressed.length !== record.bytes || createHash("sha256").update(compressed).digest("hex") !== record.sha256) throw new Error("Hosted history checksum mismatch");
    const data = gunzipSync(compressed, { maxOutputLength: 160 * 1024 * 1024 });
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(`${destination}.next`, data, { mode: 0o600 });
    await rename(`${destination}.next`, destination);
    await writeFile(`${destination}.verified`, record.sha256, { mode: 0o600 });
  }));
  const failure = results.find(result => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
  return directory;
}

let nextCatalogCheck = 0;
let catalogRefresh: Promise<void> | undefined;
async function refreshCatalog(directory: string) {
  if (catalogRefresh) return catalogRefresh;
  if (Date.now() < nextCatalogCheck) return;
  nextCatalogCheck = Date.now() + 300000;
  catalogRefresh = (async () => {
    try {
      const url = new URL(musicDataUrl()); url.searchParams.set("asset", "catalog.json.gz");
      const response = await fetch(url, { headers: { Authorization: `Bearer ${process.env.MUSIC_SITE_READ_KEY}` }, cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000) });
      if (!response.ok) return;
      const checksum = response.headers.get("x-content-sha256");
      const data = Buffer.from(await response.arrayBuffer());
      if (!checksum || !/^[a-f0-9]{64}$/.test(checksum) || data.length > 2 * 1024 * 1024 || createHash("sha256").update(data).digest("hex") !== checksum) return;
      const json = gunzipSync(data,{maxOutputLength:16000000});
      const parsed = JSON.parse(json.toString("utf8"));
      if (!parsed.artists || !parsed.covers) return;
      const target = path.join(directory,"spotify/catalog-display.json");
      await writeFile(`${target}.next`,json,{mode:0o600}); await rename(`${target}.next`,target);
    } catch { /* Keep the verified last-known artwork; collection is independent. */ }
  })().finally(()=> { catalogRefresh = undefined; });
  return catalogRefresh;
}
