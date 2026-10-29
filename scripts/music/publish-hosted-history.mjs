// Owner-only publication; never reads collector credentials or calls Spotify.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { publicationAssets } from "./hosted-publication-assets.mjs";
const directory = new URL("../../private-data/music/", import.meta.url);
const access = JSON.parse(await readFile(new URL("site-access.json", directory), "utf8"));
const artworkOnly = process.argv.includes("--artwork-only");
const assets = await publicationAssets(directory, artworkOnly);
if (artworkOnly) {
  const checksum = assets[0].asset.sha256;
  try { if ((await readFile(new URL("hosted/published-artwork.sha", directory),"utf8")) === checksum) process.exit(0); } catch { /* first publication */ }
}
for (const { name, asset, data } of assets) {
  const url = new URL("https://ijoeuoebqxsiqpyiqqoz.supabase.co/functions/v1/music-site-data");
  url.searchParams.set("asset", `${name}.gz`); url.searchParams.set("sha", asset.sha256);
  const signed = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${access.writeKey}` }, redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!signed.ok) throw new Error(`Upload signing failed: HTTP ${signed.status}`);
  const signature = await signed.json();
  const upload = new URL(signature.url.startsWith("/object/") ? `/storage/v1${signature.url}` : signature.url, "https://ijoeuoebqxsiqpyiqqoz.supabase.co");
  if (upload.origin !== "https://ijoeuoebqxsiqpyiqqoz.supabase.co" || !upload.pathname.startsWith("/storage/v1/object/upload/sign/music-imports/site/")) throw new Error("Unsafe upload destination");
  const result = await fetch(upload, { method: "PUT", headers: { "Content-Type": "application/gzip" }, body: data, redirect: "error", signal: AbortSignal.timeout(180000) });
  if (!result.ok && result.status !== 400 && result.status !== 409) throw new Error(`Private upload failed: ${name} HTTP ${result.status}`);
  const check = await fetch(url, { headers: { Authorization: `Bearer ${access.readKey}` }, redirect: "error", signal: AbortSignal.timeout(120000) });
  if (!check.ok || createHash("sha256").update(Buffer.from(await check.arrayBuffer())).digest("hex") !== asset.sha256) throw new Error("Hosted object verification failed");
  if (name === "catalog.json") {
    url.searchParams.set("activate","1");
    const activated = await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${access.writeKey}`},redirect:"error",signal:AbortSignal.timeout(30000)});
    if (!activated.ok) throw new Error("Artwork activation failed");
    await writeFile(new URL("hosted/published-artwork.sha",directory),asset.sha256,{mode:0o600});
  }
  console.log(JSON.stringify({ asset: name, bytes: data.length, verified: true }));
}
