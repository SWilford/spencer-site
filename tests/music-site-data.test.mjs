import test from "node:test";
import assert from "node:assert/strict";
let handler;
globalThis.Deno = { env: { get: key => key === "SUPABASE_URL" ? "https://example.supabase.co" : "private-server-key" }, serve: callback => { handler = callback; } };
await import("../supabase/functions/music-site-data/index.ts");
const read = "r".repeat(43), write = "w".repeat(43);
test("saved-data service rejects anonymous callers before database or provider calls", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Unexpected network request"); };
  try { assert.equal((await handler(new Request("https://example/functions/music-site-data"))).status,401); }
  finally { globalThis.fetch = original; }
});
test("website key reads saved plays, but cannot upload or invoke collection", async () => {
  const original = globalThis.fetch, calls = [];
  globalThis.fetch = async (value, options) => {
    const url = new URL(value); calls.push(url.pathname);
    assert.equal(url.origin,"https://example.supabase.co");
    if (url.pathname.endsWith("music_site_authorize")) {
      const args = JSON.parse(options.body);
      return Response.json(args.access_key === (args.purpose === "read" ? read : write));
    }
    assert.equal(url.pathname,"/rest/v1/rpc/music_site_snapshot");
    return Response.json({ plays:[], generatedAt:"2026-10-27T00:00:00Z" });
  };
  try {
    const auth = { Authorization:`Bearer ${read}` };
    assert.equal((await handler(new Request("https://example/data?action=collect",{ headers:auth }))).status,200);
    assert.equal((await handler(new Request("https://example/data?asset=catalog.json.gz&sha="+"a".repeat(64),{ method:"POST",headers:auth,body:"forbidden" }))).status,401);
    assert.equal((await handler(new Request("https://example/data",{headers:{Authorization:`Bearer ${write}`}}))).status,401);
    assert.equal((await handler(new Request("https://example/data?asset=../../tokens&sha="+"a".repeat(64),{ headers:auth }))).status,400);
    assert.ok(calls.every(p=>!p.includes("collect")&&!p.includes("storage")));
  } finally { globalThis.fetch = original; }
});
