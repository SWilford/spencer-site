// Owner-started local worker. It never invokes the authenticated Spotify Web API.
import { spawn } from "node:child_process";
import { readFile, writeFile, open, unlink, rename } from "node:fs/promises";
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
  for (let cycle = 0; cycle < 150 && !stop; cycle++) {
    // Read saved collector data solely for catalog IDs/artwork. This action
    // queries our database; it does not collect or request anything from Spotify.
    try {
      const config = JSON.parse(await readFile(new URL("../collector-bootstrap.json", directory), "utf8"));
      const response = await fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(20000),
        headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" }, body: '{"action":"dashboard"}',
      });
      if (response.ok) {
        const temporary = new URL("../collector-snapshot.next.json", directory);
        await writeFile(temporary, JSON.stringify(await response.json()), { mode: 0o600 });
        await rename(temporary, new URL("../collector-snapshot.json", directory));
      }
    } catch { /* Saved catalog and export remain sufficient for offline progress. */ }
    const exit = await new Promise(resolve => {
      child = spawn(process.execPath, [fileURLToPath(new URL("cache-music-artwork.mjs", import.meta.url)), "--wikidata", "--limit", "50", "--covers"], { windowsHide: true, stdio: "inherit" });
      child.on("exit", code => resolve(code));
      child.on("error", () => resolve(1));
    });
    status.batches++;
    const batch = JSON.parse(await readFile(new URL("artwork-worker-status.json", directory), "utf8"));
    Object.assign(status, { lastBatch: batch, updatedAt: new Date().toISOString() });
    failures = exit === 0 ? 0 : failures + 1;
    status.state = failures >= 3 ? "paused_after_provider_errors" : batch.status === "complete" ? "complete" : "running";
    await writeFile(statusFile, JSON.stringify(status, null, 2));
    if (failures >= 3 || batch.status === "complete" || stop) break;
    // Separate provider throttles cannot update any collector retry/lease state.
    await delay(exit === 0 ? 15000 : 60000);
  }
  if (stop) status.state = "stopped";
  else if (status.state === "running") status.state = "batch_limit_reached";
} finally {
  status.finishedAt = new Date().toISOString();
  await writeFile(statusFile, JSON.stringify(status, null, 2));
  await lock.close(); await unlink(lockFile);
}
