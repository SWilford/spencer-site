import test from 'node:test';
import assert from 'node:assert/strict';
import {scrollbarGeometry,scrollbarFraction} from '../src/lib/scrollbar-geometry.ts';

test('thumb ends align with the first and last ruler marks at different viewport sizes',()=>{
 for(const height of [300,720,876,1800]) {
  const top=scrollbarGeometry(height,900,5000,0);
  const bottom=scrollbarGeometry(height,900,5000,4100);
  assert.equal(top.offset,height*10/980);
  assert.ok(Math.abs(bottom.offset+bottom.thumb-(height-height*10/980))<1e-9);
 }
});
test('dragging uses the same inset track and keeps the grabbed point anchored',()=>{
 const geometry=scrollbarGeometry(876,1000,4000,1500);
 const grab=geometry.thumb*.7;
 assert.ok(Math.abs(scrollbarFraction(96+geometry.offset+grab,96,grab,geometry)-.5)<1e-9);
 assert.equal(scrollbarFraction(-200,96,grab,geometry),0);
 assert.equal(scrollbarFraction(3000,96,grab,geometry),1);
});
test('short and initially hidden pages have finite, bounded scrollbar geometry',()=>{
 for(const height of [0,40,876]) {
  const g=scrollbarGeometry(height,1000,600,0);
  assert.equal(g.maximum,0); assert.equal(g.fraction,0);
  assert.ok(g.thumb>=0 && g.thumb<=g.track);
 }
});
