import test from 'node:test';
import assert from 'node:assert/strict';
import { count, target, shapeNames, shapeEdges, shapeFaces } from '../src/lib/scene-geometry.ts';
import { collide, confine, gridCell } from '../src/lib/scene-physics.ts';
test('grid recycling preserves node identities and continuous world positions',()=>{
  const epsilon=.00001;
  const before=gridCell(0,0,1/.14-epsilon),after=gridCell(1,0,1/.14+epsilon);
  assert.equal(before.idX,after.idX);assert.ok(Math.abs(before.x-after.x)<.0001);
  const far=gridCell(0,0,1/.11-epsilon),near=gridCell(0,-1,1/.11+epsilon);
  assert.equal(far.idZ,near.idZ);assert.ok(Math.abs(far.z-near.z)<.0001);
});
test('completed solids have unique vertices, closed convex topology, and expected edges',()=>{
  const expected=[30,24,24,30,18];
  shapeNames.forEach((name,shape)=>{
    const vertices=Array.from({length:count},(_,i)=>target(i,shape));
    assert.equal(new Set(vertices.map(v=>JSON.stringify(v))).size,count,name);
    assert.equal(shapeEdges[shape].length,expected[shape],name);
    assert.equal(count-shapeEdges[shape].length+shapeFaces[shape].length,2,name);
    for(const [a,b] of shapeEdges[shape]) {
      assert.equal(shapeFaces[shape].filter(face=>face.some((v,i)=>v===a&&face[(i+1)%face.length]===b || v===b&&face[(i+1)%face.length]===a)).length,2,name);
    }
  });
});
test('left, top and bottom confine; right is the only exit',()=>{
  assert.deepEqual(confine({left:-10,right:20,top:-8,bottom:25},100,80),{x:10,y:8,exit:false});
  assert.deepEqual(confine({left:20,right:50,top:60,bottom:90},100,80),{x:0,y:-10,exit:false});
  assert.equal(confine({left:101,right:120,top:20,bottom:40},100,80).exit,true);
  assert.equal(confine({left:95,right:120,top:20,bottom:40},100,80).exit,false);
});
test('shape collisions separate overlap and exchange approaching momentum',()=>{
  const hit=collide({x:0,y:0,z:0},{x:1.5,y:0,z:0},{x:2,y:0,z:0},{x:-1,y:0,z:0},1);
  assert.ok(hit && hit.correction>0 && hit.impulse>0);
  const afterA=2-hit.impulse,afterB=-1+hit.impulse;
  assert.equal(afterA+afterB,1);
  assert.ok(afterA*afterA+afterB*afterB<=5);
  assert.equal(collide({x:0,y:0,z:0},{x:4,y:0,z:0},{x:0,y:0,z:0},{x:0,y:0,z:0},1),null);
});
