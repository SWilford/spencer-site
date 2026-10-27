import { readFile, writeFile, rename } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../../private-data/music/collector-bootstrap.json", import.meta.url), "utf8"));
const action = process.argv[2] ?? "status";
if (!["status", "collect", "bootstrap", "snapshot"].includes(action)) throw new Error("Use status, collect, bootstrap, or snapshot.");
let body = { action: action === "snapshot" ? "dashboard" : action };
if (action === "bootstrap") {
  const authorization = JSON.parse(await readFile(new URL("../../private-data/music/spotify-authorization.json", import.meta.url), "utf8"));
  body = { ...body, client_id: authorization.client_id, refresh_token: authorization.refresh_token };
}
const response = await fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect`, {
  method: "POST", redirect: "error", signal: AbortSignal.timeout(130_000),
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
  body: JSON.stringify(body),
});
if (!response.ok) throw new Error(`Hosted ${action} failed (HTTP ${response.status}); inspect redacted collector status.`);
const result = await response.json();
if (action === "snapshot") {
  if (!Array.isArray(result.plays) || !Number.isFinite(Date.parse(result.generatedAt))) throw new Error("Invalid dashboard snapshot");
  const destination = new URL("../../private-data/music/collector-snapshot.json", import.meta.url);
  const temporary = new URL("../../private-data/music/collector-snapshot.cli-next", import.meta.url);
  await writeFile(temporary, JSON.stringify(result), { mode: 0o600 });
  await rename(temporary, destination);
  console.log(JSON.stringify({ saved: true, lastCollection: result.lastCollection, recorded_plays: result.plays.length }));
} else console.log(JSON.stringify(result));
