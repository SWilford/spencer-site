import test from "node:test";
import assert from "node:assert/strict";
import { spotifyPreview, artistFromRelease, spotifyArtistLink, publicArtistIds, artworkFetch, retrySeconds } from "../scripts/music/public-artwork.mjs";
test("artwork requests cannot consume authenticated Web API quota", async () => {
  const id = "a".repeat(22);
  const result = await spotifyPreview("artist", id, async (url, options) => {
    assert.equal(url.origin, "https://open.spotify.com");
    assert.equal(url.pathname, "/oembed");
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.redirect, "error");
    return Response.json({ title: "Example", thumbnail_url: "https://image-cdn-fa.spotifycdn.com/image/abc" });
  });
  assert.equal(result.image, "https://image-cdn-fa.spotifycdn.com/image/abc");
  await assert.rejects(spotifyPreview("artist", "../../v1/search"));
  await assert.rejects(spotifyPreview("artist", id, async () => new Response("", { status: 429, headers: { "retry-after": "120" } })), e => e.retrySeconds === 120);
});
test("catalog relationships disambiguate exact album credits and only Spotify artist links", () => {
  assert.equal(artistFromRelease("Band", "Album", [{ title: "Album", "artist-credit": [{ name: "Band", artist: { id: "mbid" } }] }]), "mbid");
  assert.equal(artistFromRelease("Band", "Other Album", [{ title: "Album", "artist-credit": [{ name: "Band", artist: { id: "mbid" } }] }]), null);
  assert.equal(spotifyArtistLink({ relations: [{ url: { resource: `https://open.spotify.com/artist/${"a".repeat(22)}` } }] }), "a".repeat(22));
  assert.equal(spotifyArtistLink({ relations: [{ url: { resource: `https://evil.example/artist/${"a".repeat(22)}` } }] }), null);
});
test("public catalog ID lookup rejects namesakes and never uses Spotify's app API", async () => {
  const ids = await publicArtistIds(["Example", "Ambiguous"], async (url, options) => {
    assert.equal(url.origin, "https://query.wikidata.org");
    assert.equal(options.headers.Authorization, undefined);
    return Response.json({ results: { bindings: [
      { name: { value: "Example" }, spotify: { value: "a".repeat(22) } },
      { name: { value: "Ambiguous" }, spotify: { value: "b".repeat(22) } },
      { name: { value: "Ambiguous" }, spotify: { value: "c".repeat(22) } },
    ] } });
  });
  assert.equal(ids.example, "a".repeat(22));
  assert.equal(ids.ambiguous, undefined);
});

test("artwork capability rejects collector hosts and credentials before any request", async () => {
  let calls = 0;
  const network = async () => { calls++; return Response.json({}); };
  for (const url of ["https://api.spotify.com/v1/artists/example", "https://accounts.spotify.com/api/token", "https://example.supabase.co/functions/v1/spotify-collect"]) {
    assert.throws(() => artworkFetch(url, {}, network), /credential-free/);
  }
  for (const headers of [{ authorization: "Bearer forbidden" }, { cookie: "session=forbidden" }]) {
    assert.throws(() => artworkFetch("https://open.spotify.com/oembed", { headers }, network), /credential-free/);
  }
  assert.equal(calls, 0);
  await artworkFetch("https://musicbrainz.org/ws/2/artist", { redirect: "follow" }, async (_, options) => {
    assert.equal(options.redirect, "error"); return Response.json({});
  });
});
test("public provider backoff respects both Retry-After formats", () => {
  const now = Date.parse("2026-10-27T00:00:00Z");
  assert.equal(retrySeconds(new Response(null, { headers: { "retry-after": "120" } }), now), 120);
  assert.equal(retrySeconds(new Response(null, { headers: { "retry-after": "Tue, 27 Oct 2026 00:05:00 GMT" } }), now), 300);
  assert.equal(retrySeconds(new Response(null), now), 600);
});
