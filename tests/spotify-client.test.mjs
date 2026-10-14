import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createAuthorization, credentialsFromToken, fetchRecentHistory, REDIRECT_URI, requestToken, SCOPE, validateCallback } from "../scripts/music/spotify-client.mjs";

test("PKCE binds a fresh verifier/state to the exact loopback redirect and minimal scope", () => {
  const a = createAuthorization("a".repeat(32));
  const b = createAuthorization("a".repeat(32));
  const url = new URL(a.url);
  assert.notEqual(a.state, b.state);
  assert.notEqual(a.verifier, b.verifier);
  assert.equal(url.searchParams.get("code_challenge"), createHash("sha256").update(a.verifier).digest("base64url"));
  assert.equal(url.searchParams.get("redirect_uri"), REDIRECT_URI);
  assert.equal(url.searchParams.get("scope"), SCOPE);
  assert.throws(() => createAuthorization(""));
  assert.equal(validateCallback(new URL(`${REDIRECT_URI}?code=example&state=${a.state}`), a.state), "example");
  assert.throws(() => validateCallback(new URL(`${REDIRECT_URI}?code=example&state=wrong`), a.state));
  assert.throws(() => validateCallback(new URL(`${REDIRECT_URI}?error=access_denied&state=${a.state}`), a.state));
});

test("refresh keeps the original refresh token unless rotated", () => {
  const token = { access_token: "example", expires_in: 3600, scope: SCOPE };
  assert.equal(credentialsFromToken(token, { refresh_token: "original" }, 0).refresh_token, "original");
  assert.equal(credentialsFromToken({ ...token, refresh_token: "rotated" }, { refresh_token: "original" }, 0).refresh_token, "rotated");
  assert.equal(credentialsFromToken(token, { refresh_token: "original" }, 0).expires_at, "1970-01-01T01:00:00.000Z");
  assert.throws(() => credentialsFromToken(token));
  assert.throws(() => credentialsFromToken({ ...token, scope: "" }, { refresh_token: "original" }));
});

test("history preserves raw records without inventing listened duration and flags a page cap", async () => {
  const item = { played_at: "2026-10-14T12:00:00Z", track: { duration_ms: 180000 } };
  const result = await fetchRecentHistory("example", { maxPages: 1, fetcher: async () => Response.json({ items: [item], next: "https://api.spotify.com/v1/me/player/recently-played?before=1" }) });
  assert.deepEqual(result.pages[0].response.items, [item]);
  assert.equal(result.truncated, true);
  assert.equal(result.pages[0].response.items[0].listened_ms, undefined);
});

test("history refuses token leakage through hostile pagination and propagates rate limits", async () => {
  let calls = 0;
  await assert.rejects(fetchRecentHistory("example", { fetcher: async () => { calls++; return Response.json({ items: [], next: "https://example.org/steal" }); } }), /unexpected/);
  assert.equal(calls, 1);
  await assert.rejects(fetchRecentHistory("example", { fetcher: async () => new Response(null, { status: 429, headers: { "retry-after": "60" } }) }), error => error.status === 429 && error.retryAfter === "60");
  await assert.rejects(requestToken({}, async () => new Response("private-provider-error", { status: 400 })), error => !error.message.includes("private-provider-error"));
});
