import test from "node:test";
import assert from "node:assert/strict";
import { dayKey, presetRange, rangeDays, summarize, rank, dailySeries, breakdown } from "../src/lib/music-stats.ts";

const play = (id, at, overrides = {}) => ({ id, at, provider: "spotify", songLengthMs: 180000, actualMs: null, trackId: id, name: id, url: null, artists: [{ id: "artist", name: "Artist" }], albumId: "album", album: "Album", artwork: null, ...overrides });

test("Eastern dates and hours follow DST rather than a fixed UTC offset", () => {
  assert.equal(dayKey("2026-03-08T04:59:00Z"), "2026-03-07");
  assert.equal(dayKey("2026-03-08T07:01:00Z"), "2026-03-08");
  const rows = [play("a", "2026-03-08T06:59:00Z"), play("b", "2026-03-08T07:01:00Z")];
  const hours = breakdown(rows, "estimated", "hour");
  assert.equal(hours.find(h => h.label === "1").minutes, 3);
  assert.equal(hours.find(h => h.label === "2").minutes, 0);
  assert.equal(hours.find(h => h.label === "3").minutes, 3);
  assert.equal(rangeDays({ start: "2026-03-07", end: "2026-03-09" }), 3);
});

test("measured time never substitutes full track duration; unknown durations preserve recorded plays", () => {
  const range = { start: "2026-10-13", end: "2026-10-14" };
  const rows = [play("a", "2026-10-14T12:00:00Z"), play("b", "2026-10-14T13:00:00Z", { actualMs: 12000 }), play("c", "2026-10-14T14:00:00Z", { songLengthMs: null })];
  assert.equal(summarize(rows, range, "measured").milliseconds, 12000);
  assert.equal(summarize(rows, range, "estimated").milliseconds, 192000);
  assert.equal(summarize(rows, range, "measured").count, 3);
  assert.equal(summarize(rows, range, "measured").durationKnown, 1);
  assert.equal(summarize(rows, range, "estimated").days, 2);
});

test("date ranges filter independently, repeated track plays remain, collaborations do not inflate global time", () => {
  const rows = [play("a", "2026-10-13T12:00:00Z", { trackId: "same" }), play("b", "2026-10-14T12:00:00Z", { trackId: "same", artists: [{ id: "artist", name: "Artist" }, { id: "other", name: "Other" }] })];
  const full = { start: "2026-10-13", end: "2026-10-14" };
  const day = { start: "2026-10-14", end: "2026-10-14" };
  assert.equal(summarize(rows, full, "estimated").tracks, 1);
  assert.equal(summarize(rows, full, "estimated").milliseconds, 360000);
  assert.equal(rank(rows, day, "estimated", "tracks", "plays")[0].count, 1);
  assert.equal(rank(rows, full, "estimated", "tracks", "plays")[0].count, 2);
  assert.equal(dailySeries(rows, full, "estimated").length, 2);
});

test("calendar presets and inclusive custom-day denominators are explicit", () => {
  assert.deepEqual(presetRange("week", "2026-10-14", "2020-01-01"), { start: "2026-10-12", end: "2026-10-14" });
  assert.deepEqual(presetRange("year", "2026-10-14", "2020-01-01", 2025), { start: "2025-01-01", end: "2025-12-31" });
  assert.equal(rangeDays(presetRange("past-year", "2024-02-29", "2020-01-01")), 365);
  assert.deepEqual(presetRange("lifetime", "2026-10-14", "2026-10-13"), { start: "2026-10-13", end: "2026-10-14" });
});
