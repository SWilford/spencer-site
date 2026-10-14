import test from "node:test";
import assert from "node:assert/strict";
import { publicMusicStats, calendarRange, validMusicDate } from "../src/lib/music-public.ts";

const fixture = { generatedAt: "2026-10-14T17:00:00Z", lastCollection: "2026-10-14T17:00:00Z", collectionError: null, collectionStartedAt: "2026-10-14T15:00:00Z", truncated: false,
  plays: [{ id: "private-event-id", at: "2026-10-14T12:00:00Z", provider: "spotify", songLengthMs: 180000, actualMs: null,
    trackId: "spotify:track:example", name: "Example track", url: null, artists: [{ id: "artist", name: "Example artist" }], albumId: "album", album: "Example album", artwork: null }] };

test("public response contains summaries and rankings, never individual playback records", () => {
  const result = publicMusicStats(fixture, { start: "2026-10-14", end: "2026-10-14" });
  assert.equal(result.summary.streams, 1);
  assert.equal(result.summary.milliseconds, 180000);
  assert.equal(result.timeBasis, "song-length-estimate");
  assert.equal(result.hours[8].count, 1);
  assert.equal(result.rankings.tracks[0].count, 1);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("private-event-id"), false);
  assert.equal(serialized.includes("2026-10-14T12:00:00Z"), false);
  assert.equal(Object.hasOwn(result, "plays"), false);
  assert.equal(Object.hasOwn(result.summary, "selected"), false);
});

test("calendar navigation respects selected periods and date validation rejects rollover", () => {
  assert.deepEqual(calendarRange("month", "2026-09-14", "2026-10-14", "2026-01-01"), { start: "2026-09-01", end: "2026-09-30" });
  assert.deepEqual(calendarRange("week", "2026-10-14", "2026-10-14", "2026-01-01"), { start: "2026-10-12", end: "2026-10-14" });
  assert.equal(validMusicDate("2026-02-30"), false);
  assert.equal(validMusicDate("2024-02-29"), true);
  assert.equal(validMusicDate("9999-01-01"), false);
});

test("unmatched source-event hashes are not used as public ranking IDs", () => {
  const snapshot = { ...fixture, plays: [{ ...fixture.plays[0], trackId: "a".repeat(64), albumId: null }] };
  const result = publicMusicStats(snapshot, { start: "2026-10-14", end: "2026-10-14" });
  assert.equal(JSON.stringify(result).includes("a".repeat(64)), false);
});
