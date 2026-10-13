"use client";

import { useEffect, useRef } from "react";

import { shapeVertexCounts, shapeNames, shapeFaces, shapeEdges, target, rotate, type Point, type ScreenPoint } from "@/lib/scene-geometry";
import { collide, confine, gridCell } from "@/lib/scene-physics";

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
    const bodies = Array.from({length:5},(_,index)=>{
      const small=index>=2,size=small ? .18+random()*.08 : .62;
      const birth=[0,9,3.5,7,12][index];
      const period=small ? 22+random()*10 : 42+random()*14;
      return {
      small,size,mass:size**3,period,phase:-birth/14,lane:[.6,3.2,1.2,2.4,3.8][index]+(random()-.5)*.5,
      order:Array.from({length:5},(_,i)=>small ? i+5 : i), offset:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0},
      spin:random()*Math.PI*2, strain:0, cooldown:0,birth,
      anchors:[] as Point[], anchorCycle:-1,
    };});
    for(const body of bodies) for(let i=body.order.length-1;i>0;i--) {
      const j=Math.floor(random()*(i+1)); [body.order[i],body.order[j]]=[body.order[j],body.order[i]];
    }
    let kicks=0, collisions=0, wallHits=0, replacements=0;
    const fragments:Array<{position:Point;velocity:Point;life:number;angle:number;spin:number;cooldown:number}>=[];
    const respawn = (body:(typeof bodies)[number]) => {
      body.birth=elapsed+1.5+random()*2.5; body.phase=-body.birth/14; body.offset={x:0,y:0,z:0};
      body.velocity={x:0,y:0,z:0}; body.strain=0; body.anchorCycle=-1;
      body.lane=random()*3.8; body.spin=random()*Math.PI*2;
      body.period=body.small ? 22+random()*10 : 42+random()*14;
      for(let i=body.order.length-1;i>0;i--) {
        const j=Math.floor(random()*(i+1)); [body.order[i],body.order[j]]=[body.order[j],body.order[i]];
      }
      replacements++;
    };
    const pointer = { x: .5, y: .5, strength: 0, vx:0, vy:0, time:0, serial:0 };
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
      const flowX=elapsed*.14,flowZ=elapsed*.11;
      const driftX=flowX%1,driftZ=flowZ%1;
      for(let plane=0;plane<5;plane++) for(let x=-6;x<=6;x++) for(let z=-1;z<=7;z++) {
        const cell=gridCell(x,z,elapsed);
        const point = {x:cell.x,y:plane*1.8-1.2,z:cell.z};
        const p = worldProject(point);
        const edgeFade=Math.max(0,Math.min(1,6-Math.abs(x+driftX),(z-driftZ+1),(7-z+driftZ)));
        const depthFade = Math.max(.15,Math.min(1,p.scale))*edgeFade;
        line(p,worldProject({...point,x:point.x+1.25}),.18*depthFade);
        line(p,worldProject({...point,z:point.z+1.6}),.18*depthFade);
        const {idX,idZ}=cell;
        if(plane===0 && idX%3===0 && idZ%3===0) line(p,worldProject({...point,y:6}),.13*depthFade);
        if(!p.visible) continue;
        const light = Math.pow(.5+.5*Math.sin(idX*7.13+idZ*4.7+plane+elapsed*.8),12);
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
        const travel=(elapsed-body.birth)/body.period;
        const base={x:-2.8+travel*8,y:.6+travel*1.3+body.lane,z:Math.max(0,8-travel*10)};
        if(body.strain>=1.4 && !reduced) {
          const shape=body.order[Math.floor(elapsed/14+body.phase)%body.order.length];
          for(let i=0;i<shapeVertexCounts[shape];i++) {
            const p=target(i,shape);
            fragments.push({position:{x:base.x+body.offset.x+p.x*.4*body.size,y:base.y+body.offset.y+p.y*.4*body.size,z:Math.max(0,base.z+body.offset.z+p.z*.4*body.size)},velocity:{x:1+random()*2,y:(random()-.5)*2,z:(random()-.5)},life:7,angle:random()*6.28,spin:(random()-.5)*8,cooldown:0});
          }
          if(fragments.length>60) fragments.splice(0,fragments.length-60);
          respawn(body);
          return {center:{x:-2.8,y:.6+body.lane,z:8},formed:0,travel:(elapsed-body.birth)/body.period};
        }
        const center={x:base.x+body.offset.x,y:base.y+body.offset.y,z:base.z+body.offset.z};
        const screen=worldProject(center);
        const phase=(elapsed/14+body.phase)%1;
        const formed=smoothstep(phase/.18)*(1-smoothstep((phase-.76)/.18));
        const dx=screen.x-pointer.x*width,dy=screen.y-pointer.y*height;
        if(!reduced && pointer.strength>0 && elapsed>body.cooldown && formed>.45 && screen.visible && Math.hypot(dx,dy)<worldSize*screen.scale*1.15*body.size+12) {
          const speed=Math.hypot(pointer.vx,pointer.vy);
          const force=.65+Math.min(2.8,speed/600);
          const distance=Math.hypot(dx,dy)||1;
          body.velocity.x+=(pointer.vx/900+dx/distance*.8)*force;
          body.velocity.y+=(pointer.vy/900+dy/distance*.8)*force;
          body.spin+=(random()-.5)*force;
          body.cooldown=elapsed+.3; kicks++;
        }
        for(const axis of ['x','y','z'] as const) {
          body.offset[axis]+=body.velocity[axis]*dt;
          body.velocity[axis]*=Math.exp(-dt*.22);
          center[axis]+=body.velocity[axis]*dt;
        }
        center.z=Math.max(0,Math.min(9,center.z)); body.offset.z=center.z-base.z;
        body.strain*=Math.exp(-dt*.35);
        return {center,formed,travel};
      });
      // Broad-phase spheres exchange impulses only while forms are assembled.
      for(let a=0;a<bodies.length;a++) for(let b=a+1;b<bodies.length;b++) {
        const first=centers[a],second=centers[b];
        if(reduced || dt===0 || first.formed<.45 || second.formed<.45) continue;
        const contact=collide(first.center,second.center,bodies[a].velocity,bodies[b].velocity,1.3*bodies[a].size,1.3*bodies[b].size,bodies[a].mass,bodies[b].mass);
        if(!contact) continue;
        const {normal,impulse}=contact;
        for(const axis of ['x','y','z'] as const) {
          const correctionA=normal[axis]*contact.correctionA,correctionB=normal[axis]*contact.correctionB;
          bodies[a].offset[axis]-=correctionA; bodies[b].offset[axis]+=correctionB;
          first.center[axis]-=correctionA; second.center[axis]+=correctionB;
          bodies[a].velocity[axis]-=normal[axis]*impulse/bodies[a].mass;
          bodies[b].velocity[axis]+=normal[axis]*impulse/bodies[b].mass;
        }
        if(impulse>.015) {collisions++;bodies[a].strain+=impulse/bodies[a].mass*.2;bodies[b].strain+=impulse/bodies[b].mass*.2;}
      }
      for (let layer = 0; layer < bodies.length; layer++) {
      const body=bodies[layer];
      const travel = centers[layer].travel;
      if(travel<0) continue;
      const phase = elapsed / 14 + body.phase;
      const shape = body.order[Math.floor(phase)%body.order.length];
      const nextShape = body.small ? shape : body.order[(Math.floor(phase)+1)%body.order.length];
      const count=shapeVertexCounts[shape];
      const stage = phase%1;
      const assembly = smoothstep(stage/.18)*(1-smoothstep((stage-.76)/.18));
      const blend = smoothstep((stage-.44)/.14);
      const fade = Math.min(1,travel/.06)*smoothstep(stage/.06)*(1-smoothstep((stage-.94)/.06));
      const screens: ScreenPoint[] = [];
      // All nodes and forms use the same projection and back-left → front-right flow.
      const center = centers[layer].center;
      const cycle=Math.floor(phase);
      if(body.anchorCycle!==cycle) {
        body.anchorCycle=cycle;
        body.anchors=Array.from({length:count},(_,i)=>({
          x:Math.round((center.x+(i%3-1)*1.25*body.size)/1.25-flowX),
          y:Math.round((center.y+(Math.floor(i/3)%2 ? 1.2 : -1.2)*body.size+1.2)/1.8)*1.8-1.2,
          z:Math.round((center.z+(Math.floor(i/6)*1.6-.8)*body.size)/1.6+flowZ),
        }));
      }
      for (let i = 0; i < count; i++) {
        const a = target(i, shape), b = target(i, nextShape);
        const formed = rotate({ x:a.x+(b.x-a.x)*blend,y:a.y+(b.y-a.y)*blend,z:a.z+(b.z-a.z)*blend },elapsed*.16+body.spin,-.25+elapsed*.055+body.strain*.3);
        const rest = body.anchors[i];
        const anchor = {
          x:(rest.x+flowX)*1.25,y:rest.y,z:(rest.z-flowZ)*1.6,
        };
        const growth = (.72+.18*Math.sin(stage*Math.PI))*body.size;
        const p = {
          x:anchor.x-center.x+(formed.x*growth-(anchor.x-center.x))*assembly+Math.sin(i*2.7)*body.strain*.08*body.size*assembly,
          y:anchor.y-center.y+(formed.y*growth-(anchor.y-center.y))*assembly,
          z:anchor.z-center.z+(formed.z*growth-(anchor.z-center.z))*assembly+Math.cos(i*1.8)*body.strain*.08*body.size*assembly,
        };
        const screen = worldProject({x:center.x+p.x,y:center.y+p.y,z:center.z+p.z});
        line(worldProject(anchor),screen,.12*assembly*fade);
        screens.push(screen);
      }
      const bounds={left:Math.min(...screens.map(p=>p.x)),right:Math.max(...screens.map(p=>p.x)),top:Math.min(...screens.map(p=>p.y)),bottom:Math.max(...screens.map(p=>p.y))};
      const wall=confine(bounds,width,height);
      if(wall.exit && !reduced) {respawn(body);continue;}
      if((wall.x || wall.y) && !reduced && assembly>.45) {
        const scale=worldSize*worldProject(center).scale;
        body.offset.x+=wall.x/scale;body.offset.y+=wall.y/scale;
        for(const p of screens) {p.x+=wall.x;p.y+=wall.y;}
        if(wall.x) {if(body.velocity.x<0) body.strain+=Math.abs(body.velocity.x)*.15;body.velocity.x=Math.max(.25,Math.abs(body.velocity.x)*.75);}
        if(wall.y) {if(body.velocity.y*wall.y<0) body.strain+=Math.abs(body.velocity.y)*.15;body.velocity.y=(wall.y>0 ? 1 : -1)*Math.max(.25,Math.abs(body.velocity.y)*.75);}
        wallHits++;
      }
      const completion = assembly*assembly*(1-Math.sin(blend*Math.PI)*.7);
      for (const indices of shapeFaces[blend < .5 ? shape : nextShape]) {
        const face = indices.map(i => screens[i]);
        if (face.every(p => p.visible)) {
          context.beginPath(); context.moveTo(face[0].x,face[0].y);
          face.slice(1).forEach(p => context.lineTo(p.x,p.y));
          context.closePath(); context.fillStyle = `rgba(199,115,112,${completion*.055*fade})`; context.fill();
        }
      }
      for(const [a,b] of shapeEdges[blend<.5 ? shape : nextShape]) line(screens[a],screens[b],(.18+assembly*.4)*fade);
      for (let i = 0; i < count; i++) {
        const p = screens[i];
        const half = 1.8;
        context.strokeStyle = `rgba(221,139,135,${.75*fade})`;
        context.strokeRect(p.x-half, p.y-half, half*2, half*2);
        const beacon = .5 + .5*Math.sin(elapsed*.7+i*2+layer);
        if(beacon>.7) {context.fillStyle=`rgba(239,174,165,${beacon*fade})`;context.fillRect(p.x-1,p.y-1,2,2);}
        if (i % 9 === 0) {
          line({ ...p, x:p.x-7 }, { ...p, x:p.x+7 }, .32);
          line({ ...p, y:p.y-7 }, { ...p, y:p.y+7 }, .32);
        }
      }
      }
      for(let i=fragments.length-1;i>=0;i--) {
        const piece=fragments[i];
        piece.angle+=piece.spin*dt;
        for(const axis of ['x','y','z'] as const) piece.position[axis]+=piece.velocity[axis]*dt;
        piece.position.z=Math.max(0,piece.position.z);piece.life-=dt;
        const p=worldProject(piece.position), radius=5;
        if(!reduced && pointer.strength>0 && elapsed>piece.cooldown && Math.hypot(p.x-pointer.x*width,p.y-pointer.y*height)<20) {
          piece.velocity.x+=pointer.vx/700+(p.x-pointer.x*width)*.08;
          piece.velocity.y+=pointer.vy/700+(p.y-pointer.y*height)*.08;
          piece.spin+=(random()-.5)*6;piece.cooldown=elapsed+.2;
        }
        if(!reduced) for(let b=0;b<bodies.length;b++) {
          if(centers[b].formed<.45) continue;
          const hit=collide(piece.position,centers[b].center,piece.velocity,bodies[b].velocity,.08,bodies[b].size*1.3,.015,bodies[b].mass);
          if(!hit) continue;
          for(const axis of ['x','y','z'] as const) {
            piece.position[axis]-=hit.normal[axis]*hit.correctionA;
            piece.velocity[axis]-=hit.normal[axis]*hit.impulse/.015;
            bodies[b].offset[axis]+=hit.normal[axis]*hit.correctionB;
            bodies[b].velocity[axis]+=hit.normal[axis]*hit.impulse/bodies[b].mass;
          }
          piece.spin+=hit.impulse*12;
        }
        const wall=confine({left:p.x-radius,right:p.x+radius,top:p.y-radius,bottom:p.y+radius},width,height);
        if(wall.exit || piece.life<=0) {fragments.splice(i,1);continue;}
        const scale=worldSize*p.scale;
        piece.position.x+=wall.x/scale;piece.position.y+=wall.y/scale;
        p.x+=wall.x;p.y+=wall.y;
        if(wall.x) piece.velocity.x=Math.abs(piece.velocity.x);
        if(wall.y) piece.velocity.y=(wall.y>0 ? 1 : -1)*Math.abs(piece.velocity.y);
        const triangle=Array.from({length:3},(_,vertex)=>{
          const angle=piece.angle+vertex*Math.PI*2/3;
          return {...p,x:p.x+Math.cos(angle)*5,y:p.y+Math.sin(angle)*5};
        });
        for(let vertex=0;vertex<3;vertex++) line(triangle[vertex],triangle[(vertex+1)%3],piece.life*.08);
      }
      canvas.dataset.shape = shapeNames[bodies[0].order[Math.max(0,Math.floor(elapsed/14+bodies[0].phase))%bodies[0].order.length]];
      canvas.dataset.population=String(bodies.length);
      canvas.dataset.active=String(bodies.filter(body=>elapsed>=body.birth).length);
      canvas.dataset.sizes=bodies.map(body=>body.size.toFixed(2)).join(',');
      canvas.dataset.periods=bodies.map(body=>body.period.toFixed(1)).join(',');
      canvas.dataset.travel = ((elapsed/42)%1).toFixed(3);
      canvas.dataset.flow = "back-left-to-front-right";
      canvas.dataset.gridPhase = driftX.toFixed(3);
      canvas.dataset.pointer = smooth.strength.toFixed(2);
      canvas.dataset.kicks=String(kicks); canvas.dataset.collisions=String(collisions);
      canvas.dataset.wallHits=String(wallHits);canvas.dataset.replacements=String(replacements);
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
