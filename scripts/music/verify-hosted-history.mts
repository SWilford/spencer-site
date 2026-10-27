import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";
import { MusicHistoryStore } from "../../src/lib/music-history-store";
import { withLocalAppleImport } from "../../src/lib/music-apple-import";
process.env.MUSIC_INCLUDE_APPLE_IMPORT = "true";
const directory = path.resolve("private-data/music");
const snapshot = await withLocalAppleImport(JSON.parse(await readFile(path.join(directory,"collector-snapshot.json"),"utf8")));
const metadata = JSON.parse(await readFile(path.join(directory,"spotify/catalog-display.json"),"utf8"));
const source = new MusicHistoryStore(path.join(directory,"spotify/spotify-history.sqlite3"),snapshot,metadata);
const hosted = new MusicHistoryStore(path.join(directory,"hosted/history.sqlite3"),snapshot,metadata);
for (const range of [{start:"2017-12-25",end:"2026-10-26"},{start:"2025-01-01",end:"2025-12-31"},{start:"2026-10-20",end:"2026-10-26"}]) {
  assert.deepEqual(hosted.stats(range),source.stats(range));
  console.log(JSON.stringify({range,totalsAndRankingsMatch:true,streams:hosted.stats(range).summary.streams}));
}
source.close();hosted.close();
