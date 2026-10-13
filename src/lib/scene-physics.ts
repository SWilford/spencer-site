export type Vector = {x:number;y:number;z:number};
export function gridCell(x:number,z:number,time:number) {
  const flowX=time*.14,flowZ=time*.11;
  return {x:(x+flowX%1)*1.25,z:(z-flowZ%1)*1.6,idX:x-Math.floor(flowX),idZ:z+Math.floor(flowZ)};
}
export function collide(a:Vector,b:Vector,va:Vector,vb:Vector,radius:number) {
  const delta={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};
  const distance=Math.hypot(delta.x,delta.y,delta.z);
  if(distance>=radius*2 || distance<.0001) return null;
  const normal={x:delta.x/distance,y:delta.y/distance,z:delta.z/distance};
  const relative=(vb.x-va.x)*normal.x+(vb.y-va.y)*normal.y+(vb.z-va.z)*normal.z;
  return {normal,correction:(radius*2-distance)*.5,impulse:Math.max(0,-relative)*.82};
}
export function confine(bounds:{left:number;right:number;top:number;bottom:number},width:number,height:number) {
  return {
    x:Math.max(0,-bounds.left),
    y:bounds.top<0 ? -bounds.top : bounds.bottom>height ? height-bounds.bottom : 0,
    exit:bounds.left>width,
  };
}
