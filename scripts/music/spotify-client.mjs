import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const REDIRECT_URI = "http://127.0.0.1:43821/callback";
export const SCOPE = "user-read-recently-played";

export function createAuthorization(clientId) {
  if (!/^[a-f\d]{32}$/i.test(clientId ?? "")) {
    throw new Error("Set SPOTIFY_CLIENT_ID to the public Client ID from your Spotify app.");
  }
  const verifier = randomBytes(48).toString("base64url");
  const state = randomBytes(32).toString("base64url");
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    client_id: clientId, response_type: "code", redirect_uri: REDIRECT_URI,
    scope: SCOPE, state, code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
  }).toString();
  return { url: url.toString(), verifier, state };
}

export function validateCallback(url, expectedState) {
  const actual = Buffer.from(url.searchParams.get("state") ?? "");
  const expected = Buffer.from(expectedState);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Authorization state did not match. Start the connection again.");
  }
  if (url.searchParams.has("error")) throw new Error("Spotify authorization was declined or failed.");
  const code = url.searchParams.get("code");
  if (!code) throw new Error("Spotify did not provide an authorization code.");
  return code;
}

export async function requestToken(parameters, fetcher = fetch) {
  const response = await fetcher("https://accounts.spotify.com/api/token", {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(20_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parameters),
  });
  if (!response.ok) throw new Error(`Spotify token request failed (HTTP ${response.status}).`);
  const token = await response.json();
  if (typeof token.access_token !== "string" || !token.access_token ||
      token.token_type?.toLowerCase() !== "bearer" ||
      !Number.isFinite(token.expires_in) || token.expires_in <= 0) {
    throw new Error("Spotify returned an invalid token response.");
  }
  return token;
}

// Retain the previous refresh token when Spotify does not rotate it.
export function credentialsFromToken(token, previous = {}, now = Date.now()) {
  const refreshToken = token.refresh_token ?? previous.refresh_token;
  if (typeof refreshToken !== "string" || !refreshToken) {
    throw new Error("No refresh token was returned. Reconnect Spotify.");
  }
  const scope = token.scope ?? previous.scope ?? "";
  if (!scope.split(" ").includes(SCOPE)) throw new Error("Recent-history permission was not granted.");
  return {
    ...previous, access_token: token.access_token, refresh_token: refreshToken,
    scope, expires_at: new Date(now + token.expires_in * 1000).toISOString(),
  };
}

export async function fetchRecentHistory(accessToken, { after, maxPages = 10, fetcher = fetch } = {}) {
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new Error("Invalid page limit.");
  let next = new URL("https://api.spotify.com/v1/me/player/recently-played?limit=50");
  if (after !== undefined) {
    if (!Number.isSafeInteger(after) || after < 0) throw new Error("Invalid history cursor.");
    next.searchParams.set("after", String(after));
  }
  const pages = [];
  const seen = new Set();
  while (next && pages.length < maxPages) {
    if (next.origin !== "https://api.spotify.com" || next.pathname !== "/v1/me/player/recently-played" || next.username || next.password) {
      throw new Error("Refusing an unexpected Spotify pagination URL.");
    }
    if (seen.has(next.href)) throw new Error("Spotify pagination repeated a page; cursor must not advance.");
    seen.add(next.href);
    const response = await fetcher(next.href, {
      headers: { Authorization: `Bearer ${accessToken}` }, redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      const error = new Error(`Spotify history request failed (HTTP ${response.status}).`);
      error.status = response.status;
      error.retryAfter = response.headers.get("retry-after");
      throw error;
    }
    const body = await response.json();
    if (!Array.isArray(body.items)) throw new Error("Spotify returned an invalid history page.");
    // Preserve entire source pages. Actual listening duration is absent here.
    pages.push({ fetched_at: new Date().toISOString(), response: body });
    next = body.next ? new URL(body.next) : null;
  }
  return { pages, truncated: next !== null };
}
