// Matching catalog metadata never changes source listening evidence or version labels.
export const catalogName = value => String(value ?? "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
const artistName = value => catalogName(value).replace(/^the /, "");
// Broader cover lookup may borrow another deluxe/remaster edition's artwork;
// source release labels and listening identities remain unchanged.
const artworkAlbumName = value => catalogName(String(value).replace(/[([][^)\]]*(?:deluxe|remaster|expanded|anniversary|bonus)[^)\]]*[)\]]/gi, "").replace(/\s+-\s+.*(?:remaster|deluxe|expanded|anniversary).*$/i, ""));
export const imageUrl = images => (images ?? []).find(i => /^https:\/\/i\.scdn\.co\/image\/[a-zA-Z0-9]+$/.test(i.url) && (i.width ?? 0) >= 300)?.url ?? (images ?? []).find(i => /^https:\/\/i\.scdn\.co\/image\/[a-zA-Z0-9]+$/.test(i.url))?.url ?? null;
export const quoted = value => String(value).replace(/["\\]/g, " ").trim();

export function matchArtist(name, items, contextIds = []) {
  let matches = [...new Map(items.filter(a => a.type === "artist" && /^[A-Za-z0-9]{22}$/.test(a.id) && artistName(a.name) === artistName(name)).map(a => [a.id, a])).values()];
  const contextual = matches.filter(a => contextIds.includes(a.id));
  if (contextual.length === 1) matches = contextual;
  if (matches.length !== 1) return { status: matches.length ? "ambiguous" : "no-match", candidates: matches.map(a => ({ id: a.id, name: a.name })) };
  const artist = matches[0];
  return { status: "matched", id: artist.id, name: artist.name, image: imageUrl(artist.images), url: `https://open.spotify.com/artist/${artist.id}` };
}

export function matchAlbum(name, artists, items) {
  const names = artists.map(artistName);
  const matches = items.filter(a => a.type === "album" && /^[A-Za-z0-9]{22}$/.test(a.id) && artworkAlbumName(a.name) === artworkAlbumName(name) &&
    names.length > 0 && names.every(name => a.artists?.some(artist => artistName(artist.name) === name)));
  if (!matches.length) return { status: "no-match", candidates: items.slice(0, 10).map(a => ({ id: a.id, name: a.name, artists: a.artists?.map(v => v.name) })) };
  // Identical title/credits can have several regional releases. Choosing artwork
  // does not assert that their recordings/track IDs are interchangeable.
  const exact = matches.filter(a => catalogName(a.name) === catalogName(name));
  const choices = exact.length ? exact : matches;
  const album = choices.find(a => imageUrl(a.images)) ?? choices[0];
  return { status: "matched", id: album.id, name: album.name, artworkOnly: !exact.length, image: imageUrl(album.images), url: `https://open.spotify.com/album/${album.id}`, artists: album.artists.map(a => ({ id: a.id, name: a.name })), candidates: matches.map(a => a.id) };
}

export function matchTrack(play, items) {
  const matches = items.filter(t => t.type === "track" && /^[A-Za-z0-9]{22}$/.test(t.id) && catalogName(t.name) === catalogName(play.name) &&
    catalogName(t.album?.name) === catalogName(play.album) && typeof play.songLengthMs === "number" && Math.abs(t.duration_ms - play.songLengthMs) <= 2000 &&
    (!play.artists.length || play.artists.every(a => t.artists?.some(b => artistName(a.name) === artistName(b.name)))));
  const identities = new Set(matches.map(t => t.artists.map(a => a.id).sort().join(",")));
  if (!matches.length || identities.size !== 1) return { status: matches.length ? "ambiguous" : "no-match", candidates: matches.map(t => ({ id: t.id, name: t.name })) };
  const track = matches.find(t => imageUrl(t.album?.images)) ?? matches[0];
  return { status: "matched", id: track.id, name: track.name, image: imageUrl(track.album?.images),
    url: `https://open.spotify.com/track/${track.id}`, artists: track.artists.map(a => ({ id: a.id, name: a.name })), albumId: track.album.id, album: track.album.name };
}
