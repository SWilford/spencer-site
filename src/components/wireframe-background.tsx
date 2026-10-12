"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; z: number };
type ScreenPoint = Point & { scale: number; visible: boolean };
const count = 27;
function target(i: number, shape: number): Point {
  const x = i % 3 - 1;
  const y = Math.floor(i / 3) % 3 - 1;
  const z = Math.floor(i / 9) - 1;
  if (shape === 0) return { x: x * 1.25, y: y * .9, z };
  if (shape === 1) {
    const length = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
    return { x: x / length * 1.75, y: y / length * 1.75, z: z / length * 1.75 };
  }
  const angle = (i % 9) / 9 * Math.PI * 2;
  return { x: Math.cos(angle) * 1.3, y: Math.floor(i / 9) - 1, z: Math.sin(angle) * 1.3 };
}
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
    const pointer = { x: .5, y: .5, strength: 0 };
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
      if (last && timestamp - last < 1000 / 30 && !reduced) {
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
      const yaw = elapsed * .027 + (smooth.x - .5) * .17 * smooth.strength;
      const pitch = -.15 + (smooth.y - .5) * .1 * smooth.strength;
      const gridSize = Math.max(width / 9, 100);
      const gridProject = (p: Point) => project(rotate(p, yaw * .3 + .3, -.24 + pitch * .15), width * .48, height * .65, gridSize);
      const line = (a: ScreenPoint, b: ScreenPoint, alpha: number) => {
        if (!a.visible || !b.visible) return;
        context.beginPath();
        context.moveTo(a.x, a.y); context.lineTo(b.x, b.y);
        context.strokeStyle = `rgba(189,119,123,${alpha})`;
        context.lineWidth = 1; context.stroke();
      };
      for (let i = -9; i <= 9; i++) {
        line(gridProject({x:i,y:2.8,z:-4}), gridProject({x:i,y:2.8,z:7}), .22);
        line(gridProject({x:-9,y:2.8,z:i}), gridProject({x:9,y:2.8,z:i}), .22);
        line(gridProject({x:i,y:-4,z:3}), gridProject({x:i,y:5,z:3}), .14);
        line(gridProject({x:-9,y:i*.55,z:3}), gridProject({x:9,y:i*.55,z:3}), .14);
      }
      // A sparse architectural field spans the viewport independently of the volumes.
      const anchors = [[-.08,.08],[.25,.04],[.62,-.04],[1.08,.12],[-.08,.38],[.35,.32],[.76,.42],[1.08,.62],[.08,.72],[.43,.83],[.83,.94],[1.08,1.08]];
      const field = anchors.map(([x,y],i): ScreenPoint => ({
        x: x * width + Math.sin(elapsed * .035 + i) * 9 + (smooth.x-.5) * smooth.strength * 14,
        y: y * height + Math.cos(elapsed * .03 + i) * 7 + (smooth.y-.5) * smooth.strength * 10,
        z: 0, scale: 1, visible: true,
      }));
      for (const [a,b] of [[0,3],[0,9],[1,8],[1,10],[2,4],[2,9],[3,8],[4,7],[4,10],[5,11],[6,8],[7,9],[8,11]]) {
        line(field[a],field[b],.25);
      }
      for (const p of field) {
        context.strokeStyle = "rgba(189,119,123,.65)";
        context.strokeRect(p.x-2,p.y-2,4,4);
      }
      const phase = elapsed / 13;
      const shape = Math.floor(phase) % 3;
      const rawBlend = Math.max(0, (phase % 1 - .2) / .8);
      const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);
      for (let layer = 0; layer < 3; layer++) {
      const points: Point[] = [];
      const screens: ScreenPoint[] = [];
      const size = Math.min(width * [ .27, .16, .2 ][layer], height * [ .34, .23, .26 ][layer]);
      for (let i = 0; i < count; i++) {
        const a = target(i, shape), b = target(i, (shape + 1) % 3);
        const p = rotate({ x: a.x + (b.x - a.x) * blend, y: a.y + (b.y - a.y) * blend, z: a.z + (b.z - a.z) * blend }, yaw * (layer % 2 ? -1 : 1) + .4 + layer * .7, pitch + layer * .15);
        points.push(p);
        const screen = project(p, width * [ .72, .15, .48 ][layer], height * [ .32, .62, .91 ][layer], size);
        const dx = screen.x - px, dy = screen.y - py;
        const distance = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - distance / 230) * smooth.strength;
        screen.x += dx * influence * .12;
        screen.y += dy * influence * .12;
        screens.push(screen);
      }
      for (const indices of [[0,2,8,6],[18,20,26,24],[2,20,26,8]]) {
        const face = indices.map(i => screens[i]);
        if (face.every(p => p.visible)) {
          context.beginPath(); context.moveTo(face[0].x,face[0].y);
          face.slice(1).forEach(p => context.lineTo(p.x,p.y));
          context.closePath(); context.fillStyle = "rgba(189,119,123,.04)"; context.fill();
        }
      }
      for (let i = 0; i < count; i++) {
        const neighbors = points.map((p, j) => ({ j, d: Math.hypot(p.x - points[i].x, p.y - points[i].y, p.z - points[i].z) }))
          .filter(n => n.j !== i).sort((a, b) => a.d - b.d).slice(0, 4);
        for (const n of neighbors) {
          if (n.j < i) continue;
          const a = screens[i], b = screens[n.j];
          const cursorLight = Math.max(0, 1 - Math.hypot((a.x+b.x)/2-px, (a.y+b.y)/2-py)/260) * smooth.strength;
          line(a, b, .42 + cursorLight * .3);
        }
        const p = screens[i];
        const near = Math.max(0, 1 - Math.hypot(p.x-px, p.y-py)/220) * smooth.strength;
        const half = near > .3 ? 3 : 1.8;
        context.strokeStyle = `rgba(189,119,123,${.7 + near * .25})`;
        context.strokeRect(p.x-half, p.y-half, half*2, half*2);
        if (i % 9 === 0) {
          line({ ...p, x:p.x-7 }, { ...p, x:p.x+7 }, .32);
          line({ ...p, y:p.y-7 }, { ...p, y:p.y+7 }, .32);
        }
      }
      }
      canvas.dataset.shape = ["cuboid", "octahedral", "prismatic"][shape];
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
