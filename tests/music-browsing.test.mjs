import test from "node:test";
import assert from "node:assert/strict";
import { permitsMusicBrowsing } from "../src/lib/music-browsing.ts";
import { publicMusicStats } from "../src/lib/music-public.ts";
test("individual periods reject pre-2021 dates including crossing custom ranges", () => {
  for (const preset of ["day", "week", "month", "year", "custom"]) {
    assert.equal(permitsMusicBrowsing(preset, ["2020-12-31", "2021-01-03"]), false);
    assert.equal(permitsMusicBrowsing(preset, ["2021-01-01", "2021-01-03"]), true);
  }
});
test("lifetime keeps older music in totals and rankings", () => {
  assert.equal(permitsMusicBrowsing("lifetime", ["2017-12-25"]), true);
  const result = publicMusicStats({ generatedAt:"2026-10-27T12:00:00Z", plays:[{id:"old",at:"2020-05-01T12:00:00Z",actualMs:60000,songLengthMs:60000,trackId:"old-track",name:"Older track",artists:[{id:"artist",name:"Artist"}],albumId:"album",album:"Album"}] }, {start:"2017-12-25",end:"2026-10-27"});
  assert.equal(result.summary.streams, 1);
  assert.equal(result.summary.milliseconds, 60000);
  assert.equal(result.rankings.tracks[0].name, "Older track");
});
