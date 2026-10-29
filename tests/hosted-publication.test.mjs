import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { publicationAssets } from "../scripts/music/hosted-publication-assets.mjs";

async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), "publication-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, "hosted")); await mkdir(path.join(dir, "spotify"));
  const manifest = {};
  for (const name of ["history.sqlite3", "apple.json", "apple-enrichment.json", "catalog.json"]) {
    const data = gzipSync(Buffer.from(`original ${name}`));
    await writeFile(path.join(dir, "hosted", `${name}.gz`), data);
    manifest[name] = { sha256: createHash("sha256").update(data).digest("hex"), bytes: data.length };
  }
  await writeFile(path.join(dir, "hosted/manifest.json"), JSON.stringify(manifest));
  await writeFile(path.join(dir, "spotify/catalog-display.json"), '{"newArtwork":true}');
  return { dir, url: pathToFileURL(dir + path.sep) };
}

test("publishing new artwork preserves the pinned catalog and full-history manifest", async t => {
  const { dir, url } = await fixture(t);
  const before = await publicationAssets(url);
  const manifest = await readFile(path.join(dir, "hosted/manifest.json"));
  const [artwork] = await publicationAssets(url, true);
  assert.equal(gunzipSync(artwork.data).toString(), '{"newArtwork":true}');
  assert.notEqual(artwork.asset.sha256, before.find(x => x.name === "catalog.json").asset.sha256);
  assert.equal(createHash("sha256").update(artwork.data).digest("hex"), artwork.asset.sha256);
  assert.deepEqual(await readFile(path.join(dir, "hosted/manifest.json")), manifest);
  assert.deepEqual(await publicationAssets(url), before);
});

test("a damaged artifact rejects the whole publication before uploads can begin", async t => {
  const { dir, url } = await fixture(t);
  await writeFile(path.join(dir, "hosted/catalog.json.gz"), "incomplete file");
  await assert.rejects(publicationAssets(url), /Asset checksum mismatch: catalog.json/);
});
