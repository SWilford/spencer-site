import test from "node:test";
import assert from "node:assert/strict";
import { createMusicRequestLimit } from "../src/lib/music-request-limit.ts";
test("public stats traffic is bounded per visitor and recovers without touching collection", () => {
  let now=0; const admit=createMusicRequestLimit(()=>now);
  for(let i=0;i<60;i++) assert.equal(admit("visitor"),true);
  assert.equal(admit("visitor"),false); assert.equal(admit("other"),true);
  now=60001; assert.equal(admit("visitor"),true);
});
test("rotating visitor addresses still encounters an instance-wide limit", () => {
 const admit=createMusicRequestLimit(()=>0);
 for(let i=0;i<240;i++) assert.equal(admit(String(i)),true);
 assert.equal(admit("new-address"),false);
});
