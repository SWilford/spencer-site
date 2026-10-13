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

// Pick distinct lattice intersections, independent of the solid's small final size.
export function constructionAnchors(center:Vector, vertices:Vector[], time:number):Vector[] {
  const flowX=time*.14,flowZ=time*.11;
  const origin={x:Math.round(center.x/1.25-flowX),y:Math.round((center.y+1.2)/1.8),z:Math.round(center.z/1.6+flowZ)};
  const available:Vector[]=[];
  for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++) {
    available.push({x:origin.x+x,y:(origin.y+y)*1.8-1.2,z:origin.z+z});
  }
  return vertices.map(vertex=>{
    const desired={x:center.x+vertex.x,y:center.y+vertex.y,z:center.z+vertex.z};
    let best=0,distance=Infinity;
    available.forEach((anchor,index)=>{
      const next=Math.hypot((anchor.x+flowX)*1.25-desired.x,anchor.y-desired.y,(anchor.z-flowZ)*1.6-desired.z);
      if(next<distance) {best=index;distance=next;}
    });
    return available.splice(best,1)[0];
  });
}
