import test from "node:test";
import assert from "node:assert/strict";
import { spotifyPreview, artistFromRelease, spotifyArtistLink, publicArtistIds } from "../scripts/music/public-artwork.mjs";
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
