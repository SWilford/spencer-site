import test from 'node:test';
import assert from 'node:assert/strict';
import { MusicSnapshotCache } from '../src/lib/music-snapshot-cache.ts';
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
  const saved=new MusicSnapshotCache(async()=>snapshot,fail,async()=>{});
  await saved.get(); await saved.refresh(); assert.equal(await saved.get(),snapshot);
  const empty=new MusicSnapshotCache(async()=>undefined,fail,async()=>{});
  await assert.rejects(empty.get(),/offline/);
});
test('refresh timestamps do not invalidate history; records and artwork do',()=>{
  const key=historySnapshotKey(snapshot);
  assert.equal(key,historySnapshotKey({...snapshot,generatedAt:'2026-10-19T13:00:00Z',lastCollection:'2026-10-19T13:00:00Z'}));
  assert.notEqual(key,historySnapshotKey({...snapshot,plays:[{id:'new'}]}));
  assert.notEqual(key,historySnapshotKey({...snapshot,artistProfiles:{a:{image:'new',url:null}}}));
});
