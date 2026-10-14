import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../../private-data/music/collector-bootstrap.json", import.meta.url), "utf8"));
const action = process.argv[2] ?? "status";
if (!["status", "collect", "bootstrap"].includes(action)) throw new Error("Use status, collect, or bootstrap.");
let body = { action };
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
console.log(JSON.stringify(await response.json()));
