import test from "node:test";
import assert from "node:assert/strict";
import { publicMusicDetail, validMusicSelection } from "../src/lib/music-entity-details.ts";
import { musicEntityKey } from "../src/lib/music-entity-key.ts";
import { publicMusicStats } from "../src/lib/music-public.ts";

const play = (extra = {}) => ({ id: "private-source-event", at: "2026-10-10T14:00:00Z", provider: "spotify", actualMs: 60000, songLengthMs: null,
  trackId: "track-one", name: "One", artists: [{ id: "artist-a", name: "Same name" }], albumId: "album-one", album: "Album", artwork: null, url: null, streamCount: 1, ...extra });
const snapshot = { generatedAt: "2026-11-03T14:00:00Z", lastCollection: "2026-11-03T14:00:00Z", collectionError: null, collectionStartedAt: null, truncated: false,
  plays: [play(), play({ id: "older", at: "2026-09-01T14:00:00Z", actualMs: 120000 }), play({ id: "namesake", artists: [{ id: "artist-b", name: "Same name" }], actualMs: 900000 }), play({ id: "skip", actualMs: 5000, streamCount: 0 })] };

test("entity details separate namesakes, retain skipped time and scope graphs to the selected range", () => {
  const selection = { kind: "artists", key: musicEntityKey("artists", "artist-a") };
  const detail = publicMusicDetail(snapshot, { start: "2026-10-01", end: "2026-10-31" }, selection);
  assert.equal(detail.stats.summary.streams, 1);
  assert.equal(detail.stats.summary.milliseconds, 65000);
  assert.equal(detail.lifetime.streams, 2);
  assert.equal(detail.lifetime.milliseconds, 185000);
  assert.equal(detail.stats.daily.reduce((sum, row) => sum + row.milliseconds, 0), 65000);
  assert.equal(detail.firstDay, "2026-10-10");
  assert.equal(detail.lastDay, "2026-10-10");
  assert.equal(JSON.stringify(detail).includes("private-source-event"), false);
  assert.equal("plays" in detail.stats, false);
});

test("stable unmatched references survive ranking order changes and missing items return null", () => {
  const unknown = { ...snapshot, plays: [play({ trackId: "f".repeat(64), albumId: null })] };
  const row = publicMusicStats(unknown, { start: "2026-10-01", end: "2026-10-31" }).rankings.tracks[0];
  assert.notEqual(row.key, "f".repeat(64));
  const detail = publicMusicDetail(unknown, { start: "2026-10-01", end: "2026-10-31" }, { kind: "tracks", key: row.key });
  assert.equal(detail.entity.id, "unmatched"); assert.equal(detail.stats.summary.streams, 1);
  assert.equal(publicMusicDetail(unknown, { start: "2026-10-01", end: "2026-10-31" }, { kind: "artists", key: "0".repeat(64) }), null);
  assert.equal(musicEntityKey("tracks", "a".repeat(22)), musicEntityKey("tracks", `spotify:track:${"a".repeat(22)}`));
});

test("detail selection rejects partial, invalid and oversized identifiers before any history read", () => {
  assert.equal(validMusicSelection(new URLSearchParams()), null);
  for (const input of ["entityKind=artists", "entityKey=" + "a".repeat(64), "entityKind=plays&entityKey=" + "a".repeat(64), "entityKind=tracks&entityKey=" + "a".repeat(65)]) assert.equal(validMusicSelection(new URLSearchParams(input)), false);
});
