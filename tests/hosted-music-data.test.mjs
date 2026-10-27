import test from "node:test";
import assert from "node:assert/strict";
import { createHash,randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { hostedMusicDirectory,musicDataUrl } from "../src/lib/hosted-music-data.ts";
test("hosted assets require a fixed project origin, private auth and verified checksums", async () => {
 const saved = { ...process.env }, original = globalThis.fetch;
 const names=["history.sqlite3","apple.json","apple-enrichment.json","catalog.json"];
 const data=Object.fromEntries(names.map(name=>[name,gzipSync(JSON.stringify({fixture:randomUUID(),name}))]));
 const manifest=Object.fromEntries(names.map(name=>[name,{sha256:createHash("sha256").update(data[name]).digest("hex"),bytes:data[name].length}]));
 process.env.MUSIC_SUPABASE_PROJECT_ID="../../untrusted";
 assert.throws(musicDataUrl,/not configured/);
 process.env.MUSIC_SUPABASE_PROJECT_ID="a".repeat(20);
 process.env.MUSIC_SITE_READ_KEY="private-read-fixture";
 process.env.MUSIC_HISTORY_MANIFEST=JSON.stringify(manifest);
 let corrupt=true;
 globalThis.fetch=async (value,options)=> {
   const url=new URL(value);
   assert.equal(url.origin,`https://${"a".repeat(20)}.supabase.co`);
   assert.equal(url.pathname,"/functions/v1/music-site-data");
   assert.equal(options.headers.Authorization,"Bearer private-read-fixture");
   assert.equal(options.redirect,"error"); assert.equal(options.method,undefined);
   const asset=url.searchParams.get("asset");
   if(asset==="catalog.json.gz" && !url.searchParams.has("sha")) return new Response(null,{status:503});
   const name=asset.slice(0,-3);
   return new Response(corrupt && name==="history.sqlite3" ? Buffer.from("corrupt") : data[name]);
 };
 try {
   await assert.rejects(hostedMusicDirectory(),/checksum/);
   corrupt=false;
   assert.match(await hostedMusicDirectory(),/spencer-music-/);
 } finally { globalThis.fetch=original; for(const key of ["MUSIC_SUPABASE_PROJECT_ID","MUSIC_SITE_READ_KEY","MUSIC_HISTORY_MANIFEST"]) { if(saved[key]===undefined) delete process.env[key]; else process.env[key]=saved[key]; } }
});
