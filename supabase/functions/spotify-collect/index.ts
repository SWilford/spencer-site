const projectUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function control(action: string, key: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(`${projectUrl}/rest/v1/rpc/music_collector_control`, {
    method: "POST", signal: AbortSignal.timeout(15_000),
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action, collector_key: key, payload }),
  });
  if (!response.ok) throw new Error("control_failed");
  return await response.json();
}

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  const key = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!key) return reply({ error: "unauthorized" }, 401);
  // All actions are authenticated through the private database key hash.
  let context;
  try { context = await control("status", key); }
  catch { return reply({ error: "unauthorized" }, 401); }
  const url = new URL(request.url);
  if (url.searchParams.get("action") === "archive-upload") {
    const sha = url.searchParams.get("sha");
    if (!sha || !/^[a-f0-9]{64}$/.test(sha)) return reply({ error: "invalid_checksum" }, 400);
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "missing_archive" }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 50 * 1024 * 1024) { await reader.cancel(); return reply({ error: "too_large" }, 413); }
      chunks.push(value);
    }
    const archive = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { archive.set(chunk, offset); offset += chunk.length; }
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", archive)), byte => byte.toString(16).padStart(2,"0")).join("");
    if (digest !== sha) return reply({ error: "checksum_mismatch" }, 400);
    const upload = await fetch(`${projectUrl}/storage/v1/object/music-imports/${sha}.zip`, {
      method: "POST", signal: AbortSignal.timeout(60_000),
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/zip", "x-upsert": "false" },
      body: archive,
    });
    return upload.ok ? reply({ stored: true, sha256: sha, bytes: size }) : reply({ error: "archive_upload_failed" }, 502);
  }
  let body: Record<string, unknown>;
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 8192) return reply({ error: "too_large" }, 413);
    const text = await request.text();
    if (text.length > 8192) return reply({ error: "too_large" }, 413);
    body = text ? JSON.parse(text) : {};
  } catch { return reply({ error: "invalid_request" }, 400); }
  if (body.action === "status") return reply(context);
  if (body.action === "dashboard") {
    const response = await fetch(`${projectUrl}/rest/v1/rpc/music_dashboard_snapshot`, {
      method: "POST", signal: AbortSignal.timeout(15_000),
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ collector_key: key }),
    });
    return response.ok ? reply(await response.json()) : reply({ error: "dashboard_unavailable" }, 503);
  }
  if (body.action === "bootstrap") {
    if (context.connected) return reply({ error: "already_connected" }, 409);
    try { return reply(await control("bootstrap", key, body)); }
    catch { return reply({ error: "bootstrap_failed" }, 400); }
  }
  try { context = await control("acquire", key); }
  catch { return reply({ error: "acquire_failed" }, 503); }
  if (context.state !== "acquired") return reply({ state: context.state });
  const run_id = context.run_id;
  let code = "collection_failed";
  let retrySeconds = 600;
  try {
    const refresh = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", client_id: context.client_id, refresh_token: context.refresh_token }),
    });
    if (!refresh.ok) { code = `token_http_${refresh.status}`; throw new Error(code); }
    const token = await refresh.json();
    if (!token.access_token || token.token_type?.toLowerCase() !== "bearer") throw new Error("invalid_token");
    if (token.refresh_token) await control("save_token", key, { run_id, refresh_token: token.refresh_token });
    let next: URL | null = new URL("https://api.spotify.com/v1/me/player/recently-played?limit=50");
    if (context.after !== null) next.searchParams.set("after", String(context.after));
    const pages = [];
    const seen = new Set<string>();
    while (next && pages.length < 10) {
      if (next.origin !== "https://api.spotify.com" || next.pathname !== "/v1/me/player/recently-played" || next.username || next.password || seen.has(next.href)) throw new Error("invalid_pagination");
      seen.add(next.href);
      const response: Response = await fetch(next.href, { redirect: "error", signal: AbortSignal.timeout(10_000), headers: { Authorization: `Bearer ${token.access_token}` } });
      if (!response.ok) {
        code = `history_http_${response.status}`;
        const retry = response.headers.get("retry-after");
        if (retry) retrySeconds = /^\d+$/.test(retry) ? Number(retry) : Math.ceil((Date.parse(retry)-Date.now())/1000);
        if (!Number.isFinite(retrySeconds)) retrySeconds = 600;
        throw new Error(code);
      }
      const page: { items: unknown[]; next?: string | null } = await response.json();
      if (!Array.isArray(page.items)) throw new Error("invalid_page");
      pages.push(page);
      next = page.next ? new URL(page.next) : null;
    }
    return reply(await control("finish", key, { run_id, pages, truncated: next !== null }));
  } catch {
    try { await control("fail", key, { run_id, code, retry_seconds: Math.max(60, Math.min(86400, retrySeconds)) }); } catch { /* Lease expires if the database is unreachable. */ }
    return reply({ error: code }, 502);
  }
});
