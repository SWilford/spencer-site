import test from 'node:test';
import assert from 'node:assert/strict';
import {createDecodeSectors,createDecodeKeyframes} from '../src/lib/sector-decode.ts';

const rng = initial => { let state=initial; return ()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;}; };
const area = p => Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a.x*b.y-b.x*a.y;},0)/2);
test('irregular sectors cover desktop and mobile without missing content',()=>{
  for(const [w,h] of [[1280,720],[390,844],[3440,1440]]) {
    const sectors=createDecodeSectors(w,h,rng(42));
    assert.ok(Math.abs(sectors.reduce((sum,s)=>sum+area(s.polygon),0)-w*h)<.001);
    assert.ok(sectors.every(s=>s.polygon.length>=3 && s.polygon.every(p=>p.x>=-.001&&p.x<=w+.001&&p.y>=-.001&&p.y<=h+.001)));
    assert.ok(sectors.every(s=>s.start+s.duration<1));
  }
});
test('fresh navigation gets a different partition and reveal order',()=>{
  const a=createDecodeSectors(1280,720,rng(1)),b=createDecodeSectors(1280,720,rng(2));
  assert.notDeepEqual(a.map(s=>s.polygon),b.map(s=>s.polygon));
  assert.notDeepEqual(a.map(s=>s.start),b.map(s=>s.start));
});
test('all animation frames retain compatible path topology on a scrolled long page',()=>{
  const frames=createDecodeKeyframes(1280,3400,1200,720,rng(4));
  const topology = frame => frame.clipPath.replace(/[-\d.,\s]/g,'');
  assert.ok(frames.every(frame=>topology(frame)===topology(frames[0])));
  assert.equal(frames[0].offset,0); assert.equal(frames.at(-1).offset,1);
  assert.ok(frames.every(frame=>!frame.clipPath.includes('NaN')));
  assert.ok(frames[0].clipPath.includes('3400.00'));
});
