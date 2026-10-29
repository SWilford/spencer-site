import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

const names = ["history.sqlite3", "apple.json", "apple-enrichment.json", "catalog.json"];

/** Prepare and verify everything before an upload. Artwork never rewrites pinned history assets. */
export async function publicationAssets(directory, artworkOnly = false) {
  if (artworkOnly) {
    const data = gzipSync(await readFile(new URL("spotify/catalog-display.json", directory)));
    return [{ name: "catalog.json", asset: { sha256: createHash("sha256").update(data).digest("hex"), bytes: data.length }, data }];
  }
  const manifest = JSON.parse(await readFile(new URL("hosted/manifest.json", directory), "utf8"));
  if (Object.keys(manifest).length !== names.length || Object.keys(manifest).some(name => !names.includes(name))) {
    throw new Error("Invalid publication manifest");
  }
  return Promise.all(names.map(async name => {
    const asset = manifest[name];
    if (!asset || !/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.bytes) || asset.bytes < 1 || asset.bytes > 30 * 1024 * 1024) {
      throw new Error("Invalid publication asset");
    }
    const data = await readFile(new URL(`hosted/${name}.gz`, directory));
    if (data.length !== asset.bytes || createHash("sha256").update(data).digest("hex") !== asset.sha256) {
      throw new Error(`Asset checksum mismatch: ${name}`);
    }
    return { name, asset, data };
  }));
}
