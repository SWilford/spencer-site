import test from 'node:test';
import assert from 'node:assert/strict';
import { shapeVertexCounts, target, shapeNames, shapeEdges, shapeFaces, formationProgress } from '../src/lib/scene-geometry.ts';
import { collide, confine, gridCell, gridNodes, gridNodePosition, constructionAnchors } from '../src/lib/scene-physics.ts';
test('grid recycling preserves node identities and continuous world positions',()=>{
  const epsilon=.00001;
  const before=gridCell(0,0,1/.14-epsilon),after=gridCell(1,0,1/.14+epsilon);
  assert.equal(before.idX,after.idX);assert.ok(Math.abs(before.x-after.x)<.0001);
  const far=gridCell(0,0,1/.11-epsilon),near=gridCell(0,-1,1/.11+epsilon);
  assert.equal(far.idZ,near.idZ);assert.ok(Math.abs(far.z-near.z)<.0001);
});
test('completed solids have unique vertices, closed convex topology, and expected edges',()=>{
  const expected=[30,24,24,30,18,12,12,9,12,6];
  shapeNames.forEach((name,shape)=>{
    const count=shapeVertexCounts[shape];
    const vertices=Array.from({length:count},(_,i)=>target(i,shape));
    assert.equal(new Set(vertices.map(v=>JSON.stringify(v))).size,count,name);
    assert.equal(shapeEdges[shape].length,expected[shape],name);
    assert.equal(count-shapeEdges[shape].length+shapeFaces[shape].length,2,name);
    for(const [a,b] of shapeEdges[shape]) {
      assert.equal(shapeFaces[shape].filter(face=>face.some((v,i)=>v===a&&face[(i+1)%face.length]===b || v===b&&face[(i+1)%face.length]===a)).length,2,name);
    }
  });
});
test('lighter shapes change velocity more while conserving mass-weighted momentum',()=>{
  const smallMass=.05,largeMass=1;
  const hit=collide({x:0,y:0,z:0},{x:1,y:0,z:0},{x:3,y:0,z:0},{x:0,y:0,z:0},.3,1,smallMass,largeMass);
  assert.ok(hit);
  const smallAfter=3-hit.impulse/smallMass,largeAfter=hit.impulse/largeMass;
  assert.ok(Math.abs((smallAfter-3))>Math.abs(largeAfter));
  assert.ok(Math.abs(smallMass*smallAfter+largeMass*largeAfter-smallMass*3)<1e-10);
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

test('formation completes once and never restarts or dissolves during travel',()=>{
  assert.equal(formationProgress(-2),0);
  assert.equal(formationProgress(0),0);
  assert.ok(formationProgress(1)>0 && formationProgress(1)<1);
  for(const age of [2.52,7,14,28,56,120]) assert.equal(formationProgress(age),1);
});

test('construction seeds are distinct members of the rendered finite grid, including after recycling',()=>{
  for(const time of [0,9.5,123.4]) for(let shape=0;shape<shapeNames.length;shape++) {
    const nodes=gridNodes(time).filter(node=>node.fade>.35);
    const anchors=constructionAnchors({x:-2.7,y:2.15,z:7.8},Array.from({length:shapeVertexCounts[shape]},(_,i)=>target(i,shape)),nodes);
    const identity=node=>`${node.idX}:${node.idZ}:${node.plane}`;
    assert.equal(new Set(anchors.map(identity)).size,shapeVertexCounts[shape]);
    for(const anchor of anchors) {
      assert.ok(nodes.includes(anchor));
      assert.ok(anchor.plane>=0 && anchor.plane<5);
      const projected=gridNodePosition(anchor,time);
      for(const axis of ['x','y','z']) assert.ok(Math.abs(projected[axis]-anchor.position[axis])<1e-10);
      const later=gridNodes(time+.1).find(node=>identity(node)===identity(anchor));
      assert.ok(later);
      for(const axis of ['x','y','z']) assert.ok(Math.abs(gridNodePosition(anchor,time+.1)[axis]-later.position[axis])<1e-10);
    }
  }
});
