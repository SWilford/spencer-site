import test from "node:test";
import assert from "node:assert/strict";
let handler;
const previousDeno = globalThis.Deno;
globalThis.Deno = { env: { get: name => name === "SUPABASE_URL" ? "https://example.supabase.co" : "test-service" }, serve: value => { handler = value; } };
await import("../supabase/functions/spotify-collect/index.ts");
globalThis.Deno = previousDeno;

const request = queries => new Request("https://example.supabase.co/functions/v1/spotify-collect", { method: "POST", headers: { authorization: `Bearer ${"k".repeat(43)}`, "content-type": "application/json" }, body: JSON.stringify({ action: "catalog", queries }) });
async function mocked(run, rateLimited = false) {
  const original = globalThis.fetch, actions = [];
  globalThis.fetch = async (url, options) => {
    url = String(url);
    if (url.endsWith("/rpc/music_collector_control")) {
      const body = JSON.parse(options.body); actions.push(body);
      return Response.json(body.action === "acquire" ? { state: "acquired", run_id: "run", client_id: "client", refresh_token: "private-refresh" } : {});
    }
    if (url === "https://accounts.spotify.com/api/token") return Response.json({ access_token: "private-access", token_type: "Bearer", refresh_token: "rotated-refresh" });
    assert.equal(url.startsWith("https://api.spotify.com/v1/search?"), true);
    actions.push({ action: "search" });
    return rateLimited ? new Response("", { status: 429, headers: { "retry-after": "123" } }) : Response.json({ artists: { items: [] } });
  };
  try { await run(actions); } finally { globalThis.fetch = original; }
}
test("catalog searches save rotated tokens before lookup and release without advancing listening collection", async () => mocked(async actions => {
  const response = await handler(request([{ type: "artist", q: "Sabaton" }]));
  assert.equal(response.status, 200);
  assert.deepEqual(actions.map(a => a.action), ["status", "acquire", "save_token", "search", "catalog_finish"]);
  assert.equal(JSON.stringify(await response.json()).includes("private-access"), false);
}));
test("catalog rate limits release the lease with shared backoff, without claiming a history failure", async () => mocked(async actions => {
  const response = await handler(request([{ type: "album", q: "Example" }]));
  assert.equal(response.status, 429);
  assert.equal(actions.at(-1).action, "catalog_finish");
  assert.equal(actions.at(-1).payload.retry_seconds, 123);
}, true));
test("invalid query batches are rejected before acquiring credentials", async () => mocked(async actions => {
  const response = await handler(request([{ type: "artist", q: "Sabaton", offset: -1 }]));
  assert.equal(response.status, 400);
  assert.deepEqual(actions.map(a => a.action), ["status"]);
}));
