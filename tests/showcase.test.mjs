import test from 'node:test';
import assert from 'node:assert/strict';
import {readOnlyPublicFetch} from '../showcase/read-only-fetch.mjs';
const origin='https://example.supabase.co';
test('showcase allows public reads with anonymous credentials only',async()=>{
 const calls=[];const run=readOnlyPublicFetch(origin,'public-anon',(input,init)=>{calls.push({input,init});return Promise.resolve(new Response('[]'))});
 await run(origin+'/rest/v1/roster?select=*',{headers:{Authorization:'Bearer injected-admin',apikey:'injected-admin'},credentials:'include'});
 assert.equal(calls[0].init.headers.get('authorization'),'Bearer public-anon');
 assert.equal(calls[0].init.headers.get('apikey'),'public-anon');
 assert.equal(calls[0].init.credentials,'omit');
 await run(new Request(origin+'/rest/v1/matches',{method:'HEAD'}));assert.equal(calls.length,2);
});
test('showcase rejects writes, login, functions, and other origins before any fetch',()=>{
 let calls=0;const run=readOnlyPublicFetch(origin,'anon',()=>{calls++;return Promise.resolve(new Response())});
 for(const method of ['POST','PATCH','PUT','DELETE'])assert.throws(()=>run(origin+'/rest/v1/roster',{method}),/public reads only/);
 for(const url of [origin+'/auth/v1/token',origin+'/functions/v1/r2-media','https://evil.example/rest/v1/roster'])assert.throws(()=>run(url),/public reads only/);
 assert.throws(()=>run(new Request(origin+'/rest/v1/roster',{method:'DELETE'})),/public reads only/);
 assert.equal(calls,0);
});
