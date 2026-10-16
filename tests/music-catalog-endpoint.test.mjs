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
    assert.equal(url.startsWith("https://api.spotify.com/v1/me/player/recently-played?"), true);
    actions.push({ action: "history" });
    return rateLimited ? new Response("", { status: 429, headers: { "retry-after": "123" } }) : Response.json({ items: [], next: null });
  };
  try { await run(actions); } finally { globalThis.fetch = original; }
}
test("catalog searches are disabled before acquiring credentials or calling Spotify", async () => mocked(async actions => {
  const response = await handler(request([{ type: "artist", q: "Sabaton" }]));
  assert.equal(response.status, 403);
  assert.deepEqual(actions.map(a => a.action), ["status"]);
  assert.equal(JSON.stringify(await response.json()).includes("private-access"), false);
}));
test("collection saves rotation and history without any catalog API calls", async () => mocked(async actions => {
  const req = request([]);
  const response = await handler(new Request(req.url, { method: "POST", headers: req.headers, body: '{"action":"collect"}' }));
  assert.equal(response.status, 200);
  assert.deepEqual(actions.map(a => a.action), ["status", "acquire", "save_token", "history", "finish"]);
}));
test("history rate limits still respect retry-after", async () => mocked(async actions => {
  const req = request([]);
  const response = await handler(new Request(req.url, { method: "POST", headers: req.headers, body: '{"action":"collect"}' }));
  assert.equal(response.status, 502);
  assert.equal(actions.at(-1).action, "fail");
  assert.equal(actions.at(-1).payload.retry_seconds, 123);
}, true));
test("old metadata clients cannot bypass the disabled catalog path", async () => mocked(async actions => {
  const response = await handler(request([{ type: "artist", q: "Sabaton", offset: -1 }]));
  assert.equal(response.status, 403);
  assert.deepEqual(actions.map(a => a.action), ["status"]);
}));
