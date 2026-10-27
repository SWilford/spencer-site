import test from 'node:test';
import assert from 'node:assert/strict';
import { MusicSnapshotCache, StaleMusicSnapshotError } from '../src/lib/music-snapshot-cache.ts';
import { historySnapshotKey } from '../src/lib/music-history-store.ts';
const snapshot = { generatedAt:'2026-10-19T12:00:00Z',lastCollection:null,collectionError:null,collectionStartedAt:null,truncated:false,plays:[] };
test('saved data returns without waiting for a slow refresh; concurrent refreshes share one request', async () => {
  let finish, calls=0, saves=0, now=0;
  const fresh={...snapshot,lastCollection:'2026-10-19T12:10:00Z'};
  const cache=new MusicSnapshotCache(async()=>snapshot,()=>{calls++;return new Promise(resolve=>{finish=resolve;});},async()=>{saves++;},()=>now);
  assert.equal(await cache.get(),snapshot);
  const refresh=cache.refresh();
  assert.equal(cache.refresh(),refresh);
  assert.equal(await cache.get(),snapshot);
  assert.equal(calls,1);
  finish(fresh); await refresh;
  assert.equal(await cache.get(),fresh);assert.equal(saves,1);
  await cache.refresh();assert.equal(calls,1);
  now=60001;const next=cache.refresh();finish(fresh);await next;assert.equal(calls,2);
});
test('remote failure retains saved data, but cannot fabricate an initial snapshot',async()=>{
  const fail=async()=>{throw new Error('offline');};
  const saved=new MusicSnapshotCache(async()=>snapshot,fail,async()=>{},()=>Date.parse(snapshot.generatedAt)+1000);
  await saved.get(); await saved.refresh(); assert.equal(await saved.get(),snapshot);
  const empty=new MusicSnapshotCache(async()=>undefined,fail,async()=>{});
  await assert.rejects(empty.get(),/offline/);
});
test('a week-old saved copy is refreshed before it can be presented as current', async()=>{
  const now=Date.parse(snapshot.generatedAt)+7*86400000;
  const fresh={...snapshot,generatedAt:new Date(now).toISOString(),lastCollection:new Date(now).toISOString()};
  let calls=0;
  const cache=new MusicSnapshotCache(async()=>snapshot,async()=>{calls++;return fresh;},async()=>{},()=>now);
  const results=await Promise.all([cache.get(),cache.get()]);
  assert.deepEqual(results,[fresh,fresh]);assert.equal(calls,1);
});
test('an old copy cannot silently pass as live after refresh fails; a later retry recovers',async()=>{
  let now=Date.parse(snapshot.generatedAt)+7*86400000, online=false;
  const fresh={...snapshot,generatedAt:new Date(now).toISOString()};
  const cache=new MusicSnapshotCache(async()=>snapshot,async()=>{if(!online)throw new Error('offline');return fresh;},async()=>{},()=>now);
  await assert.rejects(cache.get(),StaleMusicSnapshotError);
  online=true;now+=60001;
  assert.equal(await cache.get(),fresh);
});
test('refresh timestamps do not invalidate history; records and artwork do',()=>{
  const key=historySnapshotKey(snapshot);
  assert.equal(key,historySnapshotKey({...snapshot,generatedAt:'2026-10-19T13:00:00Z',lastCollection:'2026-10-19T13:00:00Z'}));
  assert.notEqual(key,historySnapshotKey({...snapshot,plays:[{id:'new'}]}));
  assert.notEqual(key,historySnapshotKey({...snapshot,artistProfiles:{a:{image:'new',url:null}}}));
});
