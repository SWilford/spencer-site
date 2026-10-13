export type Point = { x: number; y: number; z: number };
export type ScreenPoint = Point & { scale: number; visible: boolean };
export const count = 12;
export const shapeNames = ["icosahedron", "cuboctahedron", "hexagonal-antiprism", "decagonal-bipyramid", "hexagonal-prism", "trapezoidal-prism", "cube", "triangular-prism", "regular-octahedron", "tetrahedron"];
export const shapeVertexCounts=[12,12,12,12,12,8,8,6,6,4];
export function target(i: number, shape: number): Point {
  if(shape===5 || shape===6) {
    const x=i%2 ? 1 : -1,y=Math.floor(i/2)%2 ? 1 : -1,z=i<4 ? -1 : 1;
    return {x:x*(shape===5 && y<0 ? .55 : 1),y,z};
  }
  if(shape===7) {const cross=[[-1,-1],[1,-1],[-1,1]][i%3];return {x:cross[0],y:cross[1],z:i<3 ? -1 : 1};}
  if(shape===8) return [{x:1.5,y:0,z:0},{x:-1.5,y:0,z:0},{x:0,y:1.5,z:0},{x:0,y:-1.5,z:0},{x:0,y:0,z:1.5},{x:0,y:0,z:-1.5}][i];
  if(shape===9) return [{x:1,y:1,z:1},{x:-1,y:-1,z:1},{x:-1,y:1,z:-1},{x:1,y:-1,z:-1}][i];
  const phi = (1 + Math.sqrt(5)) / 2;
  if (shape === 0) {
    const a = i % 2 ? 1 : -1, b = Math.floor(i / 2) % 2 ? phi : -phi;
    return i < 4 ? {x:0,y:a,z:b} : i < 8 ? {x:a,y:b,z:0} : {x:b,y:0,z:a};
  }
  if (shape === 1) {
    const a = i % 2 ? 1.4 : -1.4, b = Math.floor(i / 2) % 2 ? 1.4 : -1.4;
    return i < 4 ? {x:0,y:a,z:b} : i < 8 ? {x:a,y:b,z:0} : {x:b,y:0,z:a};
  }
  if (shape === 3 && i > 9) return {x:0,y:i === 10 ? -2 : 2,z:0};
  const ring = shape === 3 ? 10 : 6;
  const upper = i >= 6;
  const angle = (i % ring) / ring * Math.PI * 2 + (shape === 2 && upper ? Math.PI/6 : 0);
  return {x:Math.cos(angle)*1.55, y:shape === 3 ? 0 : upper ? 1 : -1, z:Math.sin(angle)*1.55};
}
// Supporting planes supply actual closed polygon faces, computed once per target.
export function hull(shape: number): number[][] {
  const count=shapeVertexCounts[shape];
  const vertices = Array.from({length:count},(_,i)=>target(i,shape));
  const faces = new Map<string,number[]>();
  for(let a=0;a<count;a++) for(let b=a+1;b<count;b++) for(let c=b+1;c<count;c++) {
    const p=vertices[a], u={x:vertices[b].x-p.x,y:vertices[b].y-p.y,z:vertices[b].z-p.z}, v={x:vertices[c].x-p.x,y:vertices[c].y-p.y,z:vertices[c].z-p.z};
    const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};
    if(Math.hypot(n.x,n.y,n.z)<.001) continue;
    const distances=vertices.map(q=>(q.x-p.x)*n.x+(q.y-p.y)*n.y+(q.z-p.z)*n.z);
    if(distances.some(d=>d>.001)&&distances.some(d=>d<-.001)) continue;
    const ids=distances.flatMap((d,i)=>Math.abs(d)<.001?[i]:[]);
    const center=ids.reduce((s,i)=>({x:s.x+vertices[i].x/ids.length,y:s.y+vertices[i].y/ids.length,z:s.z+vertices[i].z/ids.length}),{x:0,y:0,z:0});
    const axis={x:vertices[ids[0]].x-center.x,y:vertices[ids[0]].y-center.y,z:vertices[ids[0]].z-center.z};
    const cross={x:n.y*axis.z-n.z*axis.y,y:n.z*axis.x-n.x*axis.z,z:n.x*axis.y-n.y*axis.x};
    const angle=(i:number)=>{const q=vertices[i];return Math.atan2(((q.x-center.x)*cross.x+(q.y-center.y)*cross.y+(q.z-center.z)*cross.z)/Math.hypot(cross.x,cross.y,cross.z),((q.x-center.x)*axis.x+(q.y-center.y)*axis.y+(q.z-center.z)*axis.z)/Math.hypot(axis.x,axis.y,axis.z));};
    faces.set(ids.join(','),[...ids].sort((i,j)=>angle(i)-angle(j)));
  }
  return [...faces.values()];
}
export const shapeFaces = shapeNames.map((_,i)=>hull(i));
export const shapeEdges = shapeFaces.map(faces=>{
  const edges = new Map<string,[number,number]>();
  for(const face of faces) for(let i=0;i<face.length;i++) {
    const a=face[i],b=face[(i+1)%face.length];
    edges.set(`${Math.min(a,b)}:${Math.max(a,b)}`,[a,b]);
  }
  return [...edges.values()];
});
export function rotate(p: Point, yaw: number, pitch: number): Point {
  const x = p.x * Math.cos(yaw) - p.z * Math.sin(yaw);
  const z = p.x * Math.sin(yaw) + p.z * Math.cos(yaw);
  return { x, y: p.y * Math.cos(pitch) - z * Math.sin(pitch), z: p.y * Math.sin(pitch) + z * Math.cos(pitch) };
}
