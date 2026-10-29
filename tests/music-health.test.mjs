import test from "node:test";
import assert from "node:assert/strict";
import { createMusicHealthCheck } from "../src/lib/music-health.ts";

test("health checks collection freshness, including successful runs with no listening", async () => {
  const now = Date.parse("2026-10-29T15:00:00Z");
  const healthy = createMusicHealthCheck(async () => ({ lastCollection: new Date(now - 10 * 60000).toISOString(), plays: [], secret: "never expose" }), () => now);
  assert.deepEqual(await healthy(), { status: "ok" });
  const stale = createMusicHealthCheck(async () => ({ lastCollection: new Date(now - 31 * 60000).toISOString() }), () => now);
  assert.deepEqual(await stale(), { status: "stale" });
});

test("health fails closed on missing, invalid, future or unavailable saved data", async () => {
  const now = Date.parse("2026-10-29T15:00:00Z");
  for (const value of [null, {}, { lastCollection: "invalid" }, { lastCollection: new Date(now + 120000).toISOString() }]) {
    assert.deepEqual(await createMusicHealthCheck(async () => value, () => now)(), { status: "unavailable" });
  }
  assert.deepEqual(await createMusicHealthCheck(async () => { throw new Error("private error"); }, () => now)(), { status: "unavailable" });
});

test("health coalesces reads, refreshes on expiry and does not mask a failed refresh", async () => {
  let now = Date.parse("2026-10-29T15:00:00Z"), calls = 0;
  const check = createMusicHealthCheck(async () => {
    calls++;
    if (calls > 1) throw new Error("unavailable");
    return { lastCollection: new Date(now).toISOString() };
  }, () => now);
  assert.deepEqual(await Promise.all([check(), check(), check()]), [{ status: "ok" }, { status: "ok" }, { status: "ok" }]);
  assert.equal(calls, 1);
  now += 61000;
  assert.deepEqual(await check(), { status: "unavailable" });
  assert.equal(calls, 2);
});

test("cached timestamps become stale as time advances, even before the next read", async () => {
  let now = Date.parse("2026-10-29T15:00:00Z"), calls = 0;
  const lastCollection = new Date(now - 30 * 60000).toISOString();
  const check = createMusicHealthCheck(async () => { calls++; return { lastCollection }; }, () => now);
  assert.deepEqual(await check(), { status: "ok" });
  now += 1000;
  assert.deepEqual(await check(), { status: "stale" });
  assert.equal(calls, 1);
});
