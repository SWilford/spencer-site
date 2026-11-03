import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MusicHistoryStore } from "../src/lib/music-history-store.ts";
import { musicEntityKey } from "../src/lib/music-entity-key.ts";

const artist = { id: "catalog:artist:example", name: "Example band" };
const trackId = `spotify:track:${"a".repeat(22)}`;
const base = { id: "live", provider: "spotify", at: "2026-10-14T12:00:00.567Z", actualMs: null, songLengthMs: 180000,
  trackId, name: "Example", artists: [{ ...artist, id: "b".repeat(22) }], albumId: "album", album: "Example album", artwork: "https://i.scdn.co/image/test", url: "https://open.spotify.com/track/test" };
const snapshot = plays => ({ generatedAt: "2026-10-16T16:00:00Z", lastCollection: "2026-10-16T16:00:00Z", collectionError: null, collectionStartedAt: null, truncated: false, plays });

function fixture(run, duplicate = false) {
  const folder = mkdtempSync(path.join(os.tmpdir(), "spotify-history-")), file = path.join(folder, "events.sqlite3");
  const db = new DatabaseSync(file);
  db.exec(`create table events(event_key text primary key,fingerprint text,occurrence integer,at integer,day text,hour integer,weekday integer,
    milliseconds integer,stream_count integer,track_id text,name text,artists_json text,album_id text,album text,url text);
    create index event_track_time on events(track_id,at);`);
  const insert = db.prepare("insert into events values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  insert.run("source", "hash", 1, Date.parse("2026-10-14T12:00:00Z"), "2026-10-14", 8, 2, 40000, 1, trackId, "Example", JSON.stringify([artist]), "source-album", "Example album", null);
  if (duplicate) insert.run("source2", "hash", 2, Date.parse("2026-10-14T12:00:00Z"), "2026-10-14", 8, 2, 40000, 1, trackId, "Example", JSON.stringify([artist]), "source-album", "Example album", null);
  db.close();
  let store;
  try { store = run(file); } finally { store?.close(); rmSync(folder, { recursive: true, force: true }); }
}
test("exported actual time replaces overlap estimates while new plays and Apple remain", () => fixture(file => {
  const plays = [base, { ...base, id: "later", at: "2026-10-15T12:00:00Z" },
    { ...base, id: "apple", provider: "apple", at: "2026-10-13T12:00:00Z", actualMs: 20000, streamCount: 0 }];
  const store = new MusicHistoryStore(file, snapshot(plays));
  const stats = store.stats({ start: "2026-10-13", end: "2026-10-16" });
  assert.equal(store.reconciliation.matched, 1);
  assert.equal(stats.summary.streams, 2);
  assert.equal(stats.summary.milliseconds, 240000);
  assert.equal(stats.summary.tracks, 1);
  assert.equal(stats.summary.artists, 1);
  assert.equal(stats.summary.albums, 1);
  assert.equal(stats.daily.reduce((s, d) => s + d.milliseconds, 0), 240000);
  assert.equal(stats.hours[8].minutes, 4);
  assert.equal(stats.rankings.tracks[0].count, 2);
  assert.equal(JSON.stringify(stats).includes('"source"'), false);
  assert.equal(store.stats({ start: "2026-10-14", end: "2026-10-14" }).summary.milliseconds, 40000);
  return store;
}));
test("ambiguous same-second records retain export occurrences without adding an API estimate", () => fixture(file => {
  const store = new MusicHistoryStore(file, snapshot([base]));
  assert.equal(store.reconciliation.ambiguous, 1);
  assert.equal(store.stats({ start: "2026-10-14", end: "2026-10-14" }).summary.milliseconds, 80000);
  return store;
}, true));
test("namesake artist IDs do not force historical generic credits onto either profile", () => fixture(file => {
  const store = new MusicHistoryStore(file, snapshot([
    { ...base, trackId: `spotify:track:${"d".repeat(22)}`, at: "2026-10-15T12:00:00Z" },
    { ...base, trackId: `spotify:track:${"e".repeat(22)}`, id: "namesake", at: "2026-10-15T13:00:00Z", artists: [{ id: "c".repeat(22), name: artist.name }] },
  ]));
  try {
    const historical = store.stats({ start: "2026-10-14", end: "2026-10-14" });
    assert.equal(historical.rankings.artists[0].id, artist.id);
    assert.equal(historical.rankings.artists[0].artwork, null);
  } finally { store.close(); }
}));

test("detail queries use the same reconciled export, Apple and canonical artist facts as rankings", () => fixture(file => {
  const store = new MusicHistoryStore(file, snapshot([base, { ...base, id: "later", at: "2026-10-15T12:00:00Z" },
    { ...base, id: "apple", provider: "apple", at: "2026-10-13T12:00:00Z", actualMs: 20000, streamCount: 0 }]));
  const range = { start: "2026-10-14", end: "2026-10-14" };
  const row = store.stats(range).rankings.artists[0];
  const detail = store.detail(range, { kind: "artists", key: row.key });
  assert.equal(detail.stats.summary.streams, row.count);
  assert.equal(detail.stats.summary.milliseconds, row.milliseconds);
  assert.equal(detail.lifetime.streams, 2);
  assert.equal(detail.lifetime.milliseconds, 240000);
  const track = detail.stats.rankings.tracks[0];
  assert.equal(store.detail(range, { kind: "tracks", key: track.key }).stats.summary.milliseconds, 40000);
  const album = detail.stats.rankings.albums[0];
  assert.equal(store.detail(range, { kind: "albums", key: album.key }).stats.summary.milliseconds, 40000);
  assert.equal(store.detail(range, { kind: "tracks", key: musicEntityKey("tracks", "absent") }), null);
  assert.equal(JSON.stringify(detail).includes('"source"'), false);
  return store;
}));
