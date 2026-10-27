// Owner-started local worker. It never invokes the authenticated Spotify Web API.
import { spawn } from "node:child_process";
import { readFile, writeFile, open, unlink } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const directory = new URL("../../private-data/music/spotify/", import.meta.url);
const lockFile = new URL("artwork-runner.lock", directory), statusFile = new URL("artwork-runner-status.json", directory);
let lock;
try { lock = await open(lockFile, "wx"); }
catch (e) {
  if (e.code !== "EEXIST") throw e;
  const existing = JSON.parse(await readFile(lockFile, "utf8"));
  let alive = true; try { process.kill(existing.pid, 0); } catch { alive = false; }
  if (alive) throw new Error("An artwork runner is already active");
  await unlink(lockFile); lock = await open(lockFile, "wx");
}
await lock.writeFile(JSON.stringify({ pid: process.pid }));
const status = { pid: process.pid, startedAt: new Date().toISOString(), state: "running", batches: 0, authenticatedSpotifyRequests: 0 };
await writeFile(statusFile, JSON.stringify(status, null, 2));
let child, stop = false;
process.on("SIGTERM", () => { stop = true; child?.kill(); });
process.on("SIGINT", () => { stop = true; child?.kill(); });
let failures = 0;
try {
  for (let cycle = 0; !stop; cycle++) {
    // Consume the local saved snapshot only. No collector credentials or endpoints.
    const exit = await new Promise(resolve => {
      child = spawn(process.execPath, [fileURLToPath(new URL("cache-music-artwork.mjs", import.meta.url)), "--wikidata", "--limit", "10", "--covers"], { windowsHide: true, stdio: "inherit" });
      child.on("exit", code => resolve(code));
      child.on("error", () => resolve(1));
    });
    status.batches++;
    let batch;
    try { batch = JSON.parse(await readFile(new URL("artwork-worker-status.json", directory), "utf8")); }
    catch { batch = { status: "paused", error: "Artwork batch status unavailable; retrying independently" }; }
    Object.assign(status, { lastBatch: batch, updatedAt: new Date().toISOString() });
    failures = exit === 0 ? 0 : failures + 1;
    status.state = batch.status === "complete" ? "complete" : exit === 0 ? "running" : "waiting_to_retry";
    await writeFile(statusFile, JSON.stringify(status, null, 2));
    if (batch.status === "complete" || stop || process.argv.includes("--once")) break;
    // Separate provider throttles cannot update any collector retry/lease state.
    const waitMs = exit === 0 ? 60000 : Math.min(1800000, 60000 * 2 ** Math.min(failures - 1, 5));
    status.nextBatchAt = new Date(Date.now() + waitMs).toISOString();
    await writeFile(statusFile, JSON.stringify(status, null, 2));
    for (let waited = 0; waited < waitMs && !stop; waited += 1000) await delay(Math.min(1000, waitMs - waited));
  }
  if (stop) status.state = "stopped";
  else if (process.argv.includes("--once")) status.state = "single_batch_finished";
} finally {
  status.finishedAt = new Date().toISOString();
  await writeFile(statusFile, JSON.stringify(status, null, 2));
  await lock.close(); await unlink(lockFile);
}
