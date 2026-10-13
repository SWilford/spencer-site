export type Vector = {x:number;y:number;z:number};
export function gridCell(x:number,z:number,time:number) {
  const flowX=time*.14,flowZ=time*.11;
  return {x:(x+flowX%1)*1.25,z:(z-flowZ%1)*1.6,idX:x-Math.floor(flowX),idZ:z+Math.floor(flowZ)};
}
export function collide(a:Vector,b:Vector,va:Vector,vb:Vector,radius:number,radiusB=radius,massA=1,massB=1) {
  const delta={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};
  const distance=Math.hypot(delta.x,delta.y,delta.z);
  if(distance>=radius+radiusB || distance<.0001) return null;
  const normal={x:delta.x/distance,y:delta.y/distance,z:delta.z/distance};
  const relative=(vb.x-va.x)*normal.x+(vb.y-va.y)*normal.y+(vb.z-va.z)*normal.z;
  const overlap=radius+radiusB-distance,inverse=1/massA+1/massB;
  return {normal,correction:overlap*.5,correctionA:overlap/massA/inverse,correctionB:overlap/massB/inverse,impulse:Math.max(0,-relative)*1.64/inverse};
}
export function confine(bounds:{left:number;right:number;top:number;bottom:number},width:number,height:number) {
  return {
    x:Math.max(0,-bounds.left),
    y:bounds.top<0 ? -bounds.top : bounds.bottom>height ? height-bounds.bottom : 0,
    exit:bounds.left>width,
  };
}

// One finite lattice supplies both rendering and construction; no synthetic seed nodes.
export type GridNode={idX:number;idZ:number;plane:number;position:Vector;fade:number};
export function gridNodePosition(node:Pick<GridNode,'idX'|'idZ'|'plane'>,time:number):Vector {
  return {x:(node.idX+time*.14)*1.25,y:node.plane*1.8-1.2,z:(node.idZ-time*.11)*1.6};
}
export function gridExtent(width:number,height:number):number {
  const worldSize=Math.min(width*.16,height*.21);
  return Math.max(6,Math.ceil(width*.7/worldSize*(7+11.2)/7/1.25)+2);
}
export function gridNodes(time:number,xRadius=6):GridNode[] {
  const nodes:GridNode[]=[],driftX=(time*.14)%1,driftZ=(time*.11)%1;
  for(let plane=0;plane<5;plane++) for(let x=-xRadius;x<=xRadius;x++) for(let z=-1;z<=7;z++) {
    const cell=gridCell(x,z,time);
    nodes.push({idX:cell.idX,idZ:cell.idZ,plane,position:{x:cell.x,y:plane*1.8-1.2,z:cell.z},fade:Math.max(0,Math.min(1,xRadius-Math.abs(x+driftX),z-driftZ+1,7-z+driftZ))});
  }
  return nodes;
}
export function constructionAnchors(center:Vector,vertices:Vector[],nodes:GridNode[]):GridNode[] {
  const available=[...nodes];
  return vertices.map(vertex=>{
    const desired={x:center.x+vertex.x,y:center.y+vertex.y,z:center.z+vertex.z};
    let best=0,distance=Infinity;
    available.forEach((node,index)=>{
      const p=node.position,next=Math.hypot(p.x-desired.x,p.y-desired.y,p.z-desired.z);
      if(next<distance) {best=index;distance=next;}
    });
    return available.splice(best,1)[0];
  });
}
