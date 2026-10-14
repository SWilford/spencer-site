import test from "node:test";
import assert from "node:assert/strict";
import { includeAppleImport } from "../src/lib/music-apple-import.ts";
import { publicMusicStats } from "../src/lib/music-public.ts";

const spotify = { id: "spotify-event", provider: "spotify", at: "2026-10-14T15:00:00Z", songLengthMs: 180000, actualMs: null,
  trackId: "spotify-track", name: "Example", artists: [{ id: "spotify-artist", name: "Artist" }], albumId: "spotify-album", album: "Album", artwork: "album-cover", url: null };
const snapshot = { generatedAt: "2026-10-14T20:00:00Z", lastCollection: "2026-10-14T20:00:00Z", collectionError: null, collectionStartedAt: "2026-10-14T15:00:00Z", truncated: false, plays: [spotify] };
const apple = { ...spotify, id: "apple:attempt:1", provider: "apple", at: "2026-08-01T03:59:30Z", actualMs: 30000, streamCount: 1,
  trackId: "apple:catalog:123", artists: [{ id: "apple:artist:1", name: "Artist" }], albumId: "apple:album:1", artwork: null };
const input = { schemaVersion: 1, runKey: "a".repeat(64), source: "one-time-apple-file-import", plays: [apple, { ...apple, id: "apple:attempt:2", at: "2026-08-01T04:00:00Z", actualMs: 60000, streamCount: 0 }] };

test("internal switch excludes Apple completely when off and repeated inclusion is idempotent", () => {
  assert.equal(includeAppleImport(snapshot, input, false), snapshot);
  const included = includeAppleImport(snapshot, input, true);
  assert.equal(included.plays.length, 3);
  assert.deepEqual(includeAppleImport(included, input, true), included);
  assert.deepEqual(included.plays[0], spotify);
  assert.equal(snapshot.plays.length, 1);
});

test("hour fragments preserve cross-midnight time without creating extra streams", () => {
  const included = includeAppleImport(snapshot, input, true);
  const july = publicMusicStats(included, { start: "2026-07-31", end: "2026-07-31" });
  const august = publicMusicStats(included, { start: "2026-08-01", end: "2026-08-01" });
  assert.equal(july.summary.streams, 1);
  assert.equal(july.summary.milliseconds, 30000);
  assert.equal(july.hours[23].count, 1);
  assert.equal(august.summary.streams, 0);
  assert.equal(august.summary.milliseconds, 60000);
  assert.equal(august.hours[0].minutes, 1);
  assert.equal(august.daily[0].count, 0);
  assert.equal(august.rankings.tracks[0].count, 0);
  const all = publicMusicStats(included, { start: "2026-07-31", end: "2026-10-14" });
  assert.equal(all.summary.streams, 2);
  assert.equal(all.summary.milliseconds, 270000);
  assert.equal(all.summary.tracks, 1);
  assert.equal(all.summary.artists, 1);
  assert.equal(all.summary.albums, 1);
  assert.equal(JSON.stringify(all).includes("apple:attempt"), false);
});

test("ambiguous catalog matches and different versions are not forced together", () => {
  const ambiguous = { ...snapshot, plays: [spotify, { ...spotify, id: "repeat", trackId: "other-track" }] };
  assert.equal(includeAppleImport(ambiguous, input, true).plays[2].trackId, apple.trackId);
  const live = { ...input, plays: [{ ...apple, name: "Example (Live)" }] };
  assert.equal(includeAppleImport(snapshot, live, true).plays[1].trackId, apple.trackId);
});

test("duplicate fragments and invalid duration inputs fail instead of doubling totals", () => {
  assert.throws(() => includeAppleImport(snapshot, { ...input, plays: [apple, apple] }, true));
  assert.throws(() => includeAppleImport(snapshot, { ...input, plays: [{ ...apple, actualMs: -1 }] }, true));
});
