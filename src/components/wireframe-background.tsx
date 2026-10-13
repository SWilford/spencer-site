"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; z: number };
type ScreenPoint = Point & { scale: number; visible: boolean };
const count = 12;
const shapeNames = ["icosahedron", "cuboctahedron", "twisted-prism", "bipyramid", "stellated-prism"];
function target(i: number, shape: number): Point {
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
  const angle = (i % ring) / ring * Math.PI * 2 + (shape === 2 && upper ? .65 : 0);
  const radius = shape === 4 && i % 2 ? .65 : 1.55;
  return {x:Math.cos(angle)*radius + (shape === 2 && upper ? .4 : 0), y:shape === 3 ? 0 : upper ? 1 : -1, z:Math.sin(angle)*radius};
}
// Supporting planes supply actual closed polygon faces, computed once per target.
function hull(shape: number): number[][] {
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
const shapeFaces = shapeNames.map((_,i)=>hull(i));
function rotate(p: Point, yaw: number, pitch: number): Point {
  const x = p.x * Math.cos(yaw) - p.z * Math.sin(yaw);
  const z = p.x * Math.sin(yaw) + p.z * Math.cos(yaw);
  return { x, y: p.y * Math.cos(pitch) - z * Math.sin(pitch), z: p.y * Math.sin(pitch) + z * Math.cos(pitch) };
}

export function WireframeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, elapsed = 0, frame = 0, last = 0;
    let reduced = motionQuery.matches;
    const random = () => crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
    const bodies = Array.from({length:3},(_,layer)=>({
      travel:layer/3+random()*.12, phase:random()*5, lane:layer*1.8+(random()-.5)*.65,
      order:shapeNames.map((_,i)=>i), offset:{x:0,y:0,z:0}, velocity:{x:0,y:0,z:0},
      spin:random()*Math.PI*2, strain:0, cooldown:0, lap:0,
    }));
    for(const body of bodies) for(let i=body.order.length-1;i>0;i--) {
      const j=Math.floor(random()*(i+1)); [body.order[i],body.order[j]]=[body.order[j],body.order[i]];
    }
    let kicks=0, collisions=0;
    const pointer = { x: .5, y: .5, strength: 0, vx:0, vy:0, time:0, serial:0 };
    let handledPointer=0;
    const smooth = { x: .5, y: .5, strength: 0 };
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reduced) return;
      const seconds=Math.max(.016,(event.timeStamp-pointer.time)/1000);
      pointer.vx=pointer.time ? Math.max(-1800,Math.min(1800,(event.clientX-pointer.x*width)/seconds)) : 0;
      pointer.vy=pointer.time ? Math.max(-1800,Math.min(1800,(event.clientY-pointer.y*height)/seconds)) : 0;
      pointer.time=event.timeStamp; pointer.serial++;
      pointer.x = event.clientX / width;
      pointer.y = event.clientY / height;
      pointer.strength = 1;
    };
    const leave = () => { pointer.strength = 0; };
    const project = (point: Point, centerX: number, centerY: number, size: number): ScreenPoint => {
      const depth = 7 + point.z;
      const scale = 7 / Math.max(1.5, depth);
      return { x: centerX + point.x * size * scale, y: centerY + point.y * size * scale, z: point.z, scale, visible: depth > 1.5 };
    };
    function draw(timestamp: number) {
      if (!context || !canvas) return;
      if (document.hidden) { last = 0; return; }
      if (last && timestamp - last < 1000 / (elapsed<2 ? 20 : 30) && !reduced) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const dt = last ? Math.min((timestamp - last) / 1000, .06) : 0;
      last = timestamp;
      if (!reduced) elapsed += dt;
      const ease = reduced ? 1 : 1 - Math.exp(-dt * 5);
      smooth.x += (pointer.x - smooth.x) * ease;
      smooth.y += (pointer.y - smooth.y) * ease;
      smooth.strength += (pointer.strength - smooth.strength) * ease;
      context.clearRect(0, 0, width, height);
      const px = smooth.x * width, py = smooth.y * height;
      const worldSize = Math.min(width * .16, height * .21);
      // Grid projection is deliberately independent of the pointer.
      const worldProject = (p: Point) => project(p,width*.30,height*.28,worldSize);
      const line = (a: ScreenPoint, b: ScreenPoint, alpha: number) => {
        if (!a.visible || !b.visible) return;
        context.beginPath();
        context.moveTo(a.x, a.y); context.lineTo(b.x, b.y);
        context.strokeStyle = `rgba(199,115,112,${alpha})`;
        context.lineWidth = 1; context.stroke();
      };
      // The entire lattice advances rightward and toward the camera in world space.
      const driftX = (elapsed*.14)%1, driftZ = (elapsed*.11)%1;
      for(let plane=0;plane<5;plane++) for(let x=-6;x<=6;x++) for(let z=-1;z<=7;z++) {
        const point = {x:(x+driftX)*1.25,y:plane*1.8-1.2,z:(z-driftZ)*1.6};
        const p = worldProject(point);
        const depthFade = Math.max(.15,Math.min(1,p.scale));
        line(p,worldProject({...point,x:point.x+1.25}),.18*depthFade);
        line(p,worldProject({...point,z:point.z+1.6}),.18*depthFade);
        if(plane===0 && x%3===0 && z%3===0) line(p,worldProject({...point,y:6}),.13*depthFade);
        if(!p.visible) continue;
        const light = Math.pow(.5+.5*Math.sin(x*7.13+z*4.7+plane+elapsed*.8),12);
        context.fillStyle = `rgba(239,174,165,${(.12+light*.8)*depthFade})`;
        const radius = (1+light)*Math.min(1.5,p.scale);
        context.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);
        if(light>.75) {
          context.strokeStyle=`rgba(221,139,135,${light*.6*depthFade})`;
          context.strokeRect(p.x-4,p.y-4,8,8);
        }
      }
      const smoothstep = (v:number) => {const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
      const centers = bodies.map(body=>{
        const lap=Math.floor(elapsed/42+body.travel);
        if(lap!==body.lap) {
          body.lap=lap; body.offset={x:0,y:0,z:0}; body.velocity={x:0,y:0,z:0};
          body.strain=0; body.lane=(bodies.indexOf(body)*1.8)+(random()-.5)*.65;
          body.phase=random()*5;
          for(let i=body.order.length-1;i>0;i--) {
            const j=Math.floor(random()*(i+1)); [body.order[i],body.order[j]]=[body.order[j],body.order[i]];
          }
        }
        const travel=(elapsed/42+body.travel)%1;
        const center={x:-2.8+travel*8+body.offset.x,y:.6+travel*1.3+body.lane+body.offset.y,z:8-travel*10+body.offset.z};
        const screen=worldProject(center);
        const phase=(elapsed/14+body.phase)%1;
        const formed=smoothstep(phase/.18)*(1-smoothstep((phase-.76)/.18));
        const dx=screen.x-pointer.x*width,dy=screen.y-pointer.y*height;
        if(!reduced && pointer.serial!==handledPointer && elapsed>body.cooldown && formed>.45 && screen.visible && Math.hypot(dx,dy)<worldSize*screen.scale*1.15+20) {
          const speed=Math.hypot(pointer.vx,pointer.vy);
          const force=.65+Math.min(2.8,speed/600);
          const distance=Math.hypot(dx,dy)||1;
          body.velocity.x+=(pointer.vx/900+dx/distance*.8)*force;
          body.velocity.y+=(pointer.vy/900+dy/distance*.8)*force;
          body.velocity.z+=(random()-.5)*force*2;
          body.spin+=(random()-.5)*force; body.strain=Math.min(1,body.strain+.65);
          body.cooldown=elapsed+.3; kicks++;
        }
        for(const axis of ['x','y','z'] as const) {
          body.offset[axis]+=body.velocity[axis]*dt;
          body.velocity[axis]*=Math.exp(-dt*.22);
          center[axis]+=body.velocity[axis]*dt;
        }
        body.strain*=Math.exp(-dt*2.6);
        return {center,formed,travel};
      });
      handledPointer=pointer.serial;
      // Broad-phase spheres exchange impulses only while forms are assembled.
      for(let a=0;a<bodies.length;a++) for(let b=a+1;b<bodies.length;b++) {
        const first=centers[a],second=centers[b];
        if(reduced || dt===0 || first.formed<.45 || second.formed<.45) continue;
        const delta={x:second.center.x-first.center.x,y:second.center.y-first.center.y,z:second.center.z-first.center.z};
        const distance=Math.hypot(delta.x,delta.y,delta.z);
        if(distance>=2.1 || distance<.001) continue;
        const normal={x:delta.x/distance,y:delta.y/distance,z:delta.z/distance};
        const relative=(bodies[b].velocity.x-bodies[a].velocity.x)*normal.x+(bodies[b].velocity.y-bodies[a].velocity.y)*normal.y+(bodies[b].velocity.z-bodies[a].velocity.z)*normal.z;
        const impulse=Math.max(0,-relative)*.85;
        for(const axis of ['x','y','z'] as const) {
          const correction=normal[axis]*(2.1-distance)*.5;
          bodies[a].offset[axis]-=correction; bodies[b].offset[axis]+=correction;
          first.center[axis]-=correction; second.center[axis]+=correction;
          bodies[a].velocity[axis]-=normal[axis]*impulse;
          bodies[b].velocity[axis]+=normal[axis]*impulse;
        }
        if(impulse>.15) {collisions++;bodies[a].strain=.6;bodies[b].strain=.6;}
      }
      for (let layer = 0; layer < 3; layer++) {
      const body=bodies[layer];
      const travel = centers[layer].travel;
      const phase = elapsed / 14 + body.phase;
      const shape = body.order[Math.floor(phase)%shapeNames.length];
      const nextShape = body.order[(Math.floor(phase)+1)%shapeNames.length];
      const stage = phase%1;
      const assembly = smoothstep(stage/.18)*(1-smoothstep((stage-.76)/.18));
      const split = smoothstep((stage-.53)/.18)*(1-smoothstep((stage-.85)/.15));
      const blend = smoothstep((stage-.3)/.22);
      const fade = Math.min(1,travel/.12,(1-travel)/.12);
      const points: Point[] = [];
      const screens: ScreenPoint[] = [];
      // All nodes and forms use the same projection and back-left → front-right flow.
      const center = centers[layer].center;
      let disruption = 0;
      for (let i = 0; i < count; i++) {
        const a = target(i, shape), b = target(i, nextShape);
        const formed = rotate({ x:a.x+(b.x-a.x)*blend,y:a.y+(b.y-a.y)*blend,z:a.z+(b.z-a.z)*blend },elapsed*.16+body.spin,-.25+elapsed*.055+body.strain*.3);
        const rest = {x:(i%3-1)*1.25,y:Math.floor(i/3)%2 ? 1.2 : -1.2,z:Math.floor(i/6)*1.6-.8};
        const anchor = {
          x:(Math.round((center.x+rest.x)/1.25-driftX)+driftX)*1.25,
          y:Math.round((center.y+rest.y+1.2)/1.8)*1.8-1.2,
          z:(Math.round((center.z+rest.z)/1.6+driftZ)-driftZ)*1.6,
        };
        const growth = .72+.18*Math.sin(stage*Math.PI);
        const p = {
          x:anchor.x-center.x+(formed.x*growth-(anchor.x-center.x))*assembly+(i<6 ? -1 : 1)*split*.9,
          y:anchor.y-center.y+(formed.y*growth-(anchor.y-center.y))*assembly,
          z:anchor.z-center.z+(formed.z*growth-(anchor.z-center.z))*assembly+(i%2 ? -1 : 1)*split*.35,
        };
        points.push(p);
        const screen = worldProject({x:center.x+p.x,y:center.y+p.y,z:center.z+p.z});
        const dx = screen.x - px, dy = screen.y - py;
        const distance = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - distance / 150) * smooth.strength*assembly;
        disruption = Math.max(disruption,influence);
        screen.x += (dx * .22 + Math.sin(i*2.7+elapsed)*body.strain*35) * influence;
        screen.y += (dy * .22 + Math.cos(i*1.8+elapsed)*body.strain*35) * influence;
        line(worldProject(anchor),screen,.12*assembly*fade);
        screens.push(screen);
      }
      const completion = assembly*assembly*(1-split)*(1-Math.sin(blend*Math.PI)*.7);
      for (const indices of shapeFaces[blend < .5 ? shape : nextShape]) {
        const face = indices.map(i => screens[i]);
        if (face.every(p => p.visible)) {
          context.beginPath(); context.moveTo(face[0].x,face[0].y);
          face.slice(1).forEach(p => context.lineTo(p.x,p.y));
          context.closePath(); context.fillStyle = `rgba(199,115,112,${completion*.055*(1-disruption*.85)*fade})`; context.fill();
        }
      }
      for (let i = 0; i < count; i++) {
        const neighbors = points.map((p, j) => ({ j, d: Math.hypot(p.x - points[i].x, p.y - points[i].y, p.z - points[i].z) }))
          .filter(n => n.j !== i).sort((a, b) => a.d - b.d).slice(0, 4);
        for (const n of neighbors) {
          if (n.j < i) continue;
          const a = screens[i], b = screens[n.j];
          const cursorLight = Math.max(0, 1 - Math.hypot((a.x+b.x)/2-px, (a.y+b.y)/2-py)/260) * smooth.strength;
          line(a, b, (.18 + assembly*.4 + cursorLight*.3)*fade);
        }
        const p = screens[i];
        const near = Math.max(0, 1 - Math.hypot(p.x-px, p.y-py)/220) * smooth.strength;
        const half = near > .3 ? 3 : 1.8;
        context.strokeStyle = `rgba(221,139,135,${(.75 + near * .25)*fade})`;
        context.strokeRect(p.x-half, p.y-half, half*2, half*2);
        const beacon = .5 + .5*Math.sin(elapsed*.7+i*2+layer);
        if(beacon>.7) {context.fillStyle=`rgba(239,174,165,${beacon*fade})`;context.fillRect(p.x-1,p.y-1,2,2);}
        if (i % 9 === 0) {
          line({ ...p, x:p.x-7 }, { ...p, x:p.x+7 }, .32);
          line({ ...p, y:p.y-7 }, { ...p, y:p.y+7 }, .32);
        }
      }
      }
      canvas.dataset.shape = shapeNames[bodies[0].order[Math.floor(elapsed/14+bodies[0].phase)%shapeNames.length]];
      canvas.dataset.travel = ((elapsed/42)%1).toFixed(3);
      canvas.dataset.flow = "back-left-to-front-right";
      canvas.dataset.gridPhase = driftX.toFixed(3);
      canvas.dataset.pointer = smooth.strength.toFixed(2);
      canvas.dataset.kicks=String(kicks); canvas.dataset.collisions=String(collisions);
      canvas.dataset.sequence=bodies.map(b=>b.order.join('')).join('-');
      canvas.dataset.centers=JSON.stringify(centers.map(({center})=>center));
      canvas.dataset.motion = reduced ? "reduced" : "running";
      if (!reduced) frame = requestAnimationFrame(draw);
    }
    const start = () => {
      cancelAnimationFrame(frame); last = 0;
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    const preference = () => { reduced = motionQuery.matches; pointer.strength = 0; start(); };
    const resized = () => { resize(); start(); };
    resize(); start();
    window.addEventListener("resize", resized);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", start);
    motionQuery.addEventListener("change", preference);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resized);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", start);
      motionQuery.removeEventListener("change", preference);
    };
  }, []);
  return <div className="wireframe-layer" aria-hidden="true"><canvas ref={canvasRef} /><div className="reading-scrim" /></div>;
}
