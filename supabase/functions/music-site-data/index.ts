// Saved data only. Never import collector code, read Vault, or call Spotify.
const origin = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const names = new Set(["history.sqlite3.gz", "apple.json.gz", "apple-enrichment.json.gz", "catalog.json.gz"]);
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function rpc(name: string, body: unknown) {
  return fetch(`${origin}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000), redirect: "error" });
}
Deno.serve(async (request: Request) => {
  try {
    if (!["GET", "POST"].includes(request.method)) return reply({ error: "method_not_allowed" }, 405);
    const access = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!access) return reply({ error: "unauthorized" }, 401);
    const allowed = await rpc("music_site_authorize", { access_key: access, purpose: request.method === "POST" ? "write" : "read" });
    if (!allowed.ok || await allowed.json() !== true) return reply({ error: "unauthorized" }, 401);
    const url = new URL(request.url);
    const asset = url.searchParams.get("asset");
    if (!asset && request.method === "GET") {
      const snapshot = await rpc("music_site_snapshot", {});
      return snapshot.ok ? reply(await snapshot.json()) : reply({ error: "snapshot_unavailable" }, 503);
    }
    let sha = url.searchParams.get("sha");
    if (!sha && asset === "catalog.json.gz" && request.method === "GET") {
      const current = await rpc("music_site_catalog_checksum", {});
      sha = current.ok ? await current.json() : null;
    }
    if (!asset || !names.has(asset) || !sha || !/^[a-f0-9]{64}$/.test(sha)) return reply({ error: "invalid_asset" }, 400);
    if (request.method === "POST" && url.searchParams.get("activate") === "1") {
      if (asset !== "catalog.json.gz") return reply({ error: "invalid_asset" }, 400);
      const activated = await rpc("music_site_activate_catalog", { checksum: sha });
      return activated.ok && await activated.json() === true ? reply({ activated: true }) : reply({ error: "activation_failed" }, 400);
    }
    const storage = `${origin}/storage/v1/object/music-imports/site/${sha}/${asset}`;
    if (request.method === "GET") {
      const result = await fetch(storage, { headers, signal: AbortSignal.timeout(60000), redirect: "error" });
      return new Response(result.body, { status: result.status, headers: { "Content-Type": "application/octet-stream", "Cache-Control": "private, no-store", "X-Content-SHA256": sha } });
    }
    // Owner-only short-lived upload URL. Large bodies go straight to Storage.
    // The website read key cannot reach this branch.
    const signed = await fetch(`${origin}/storage/v1/object/upload/sign/music-imports/site/${sha}/${asset}`, {
      method: "POST", headers, body: JSON.stringify({ upsert: false }), signal: AbortSignal.timeout(15000), redirect: "error"
    });
    return signed.ok ? reply(await signed.json()) : reply({ error: "upload_signing_failed" }, 502);
  } catch { return reply({ error: "data_unavailable" }, 503); }
});
