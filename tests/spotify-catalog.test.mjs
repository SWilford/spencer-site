import test from "node:test";
import assert from "node:assert/strict";
import { matchArtist, matchAlbum, matchTrack } from "../scripts/music/spotify-catalog.mjs";
const id = letter => letter.repeat(22);
const image = "https://i.scdn.co/image/abc123";
const artist = { id: id("a"), name: "LINKIN PARK", type: "artist", images: [{ url: image, width: 640 }] };
const album = { id: id("b"), name: "Example Album", type: "album", artists: [artist], images: [{ url: image, width: 640 }] };

test("artist lookup uses profile photos, normalizes names and requires context for namesakes", () => {
  assert.equal(matchArtist("Linkin Park", [artist]).image, image);
  const namesake = { ...artist, id: id("c") };
  assert.equal(matchArtist("Linkin Park", [artist, namesake]).status, "ambiguous");
  assert.equal(matchArtist("Linkin Park", [artist, namesake], [id("a")]).id, id("a"));
  assert.equal(matchArtist("Sabaton", [artist]).status, "no-match");
});
test("album artwork requires matching title and artist credits, preserving version distinctions", () => {
  assert.equal(matchAlbum("Example Album", ["Linkin Park"], [album]).image, image);
  assert.equal(matchAlbum("Example Album (Live)", ["Linkin Park"], [album]).status, "no-match");
  assert.equal(matchAlbum("Example Album", ["Another band"], [album]).status, "no-match");
  const borrowed = matchAlbum("Example Album (Deluxe Edition)", ["Linkin Park"], [album]);
  assert.equal(borrowed.status, "matched");
  assert.equal(borrowed.artworkOnly, true);
});
test("unknown artists can be recovered only from matching track, album and duration", () => {
  const play = { name: "Example", album: album.name, songLengthMs: 180000, artists: [] };
  const track = { id: id("d"), name: "Example", type: "track", duration_ms: 180500, artists: [artist], album };
  assert.equal(matchTrack(play, [track]).artists[0].id, artist.id);
  assert.equal(matchTrack(play, [{ ...track, duration_ms: 240000 }]).status, "no-match");
  assert.equal(matchTrack(play, [track, { ...track, id: id("e"), artists: [{ ...artist, id: id("c") }] }]).status, "ambiguous");
});
