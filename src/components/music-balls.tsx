"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent, type CSSProperties } from "react";
import Image from "next/image";
import { Play } from "@phosphor-icons/react/dist/csr/Play";
import { Pause } from "@phosphor-icons/react/dist/csr/Pause";
import { ArrowClockwise } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { createMusicBalls, packMusicBalls, stepMusicBalls, type MusicBall } from "@/lib/music-ball-physics";
import type { MusicRanking } from "@/lib/music-entity-details";
import { MusicButton } from "./music-interactions";

const subscribeMotion = (callback: () => void) => {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback); return () => query.removeEventListener("change", callback);
};
const reducedSnapshot = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
type Point = { x: number; y: number };
type Controller = { draw(): void; play(value: boolean): void; grab(index: number): void; move(index: number, point: Point): void; release(index: number, vx: number, vy: number): void; nudge(index: number, x: number, y: number): void };

export function MusicBalls({ rows, sort, suspended, onSelect }: { rows: MusicRanking[]; sort: "time" | "streams"; suspended: boolean; onSelect(row: MusicRanking): void }) {
  const stage = useRef<HTMLDivElement>(null), tooltip = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLButtonElement>()), controller = useRef<Controller | null>(null);
  const [revision, setRevision] = useState(0), [motion, setMotion] = useState<boolean | null>(null), [hovered, setHovered] = useState<number | null>(null);
  const reduced = useSyncExternalStore(subscribeMotion, reducedSnapshot, () => true);
  const active = (motion ?? !reduced) && !suspended, activeRef = useRef(false), hoverRef = useRef<number | null>(null);
  const drag = useRef<{ index: number; origin: Point; offset: Point; last: Point; time: number; vx: number; vy: number; moved: boolean } | null>(null);

  useEffect(() => { activeRef.current = active; controller.current?.play(active); }, [active]);
  useEffect(() => { hoverRef.current = hovered; controller.current?.draw(); }, [hovered]);
  useEffect(() => {
    const root = stage.current!;
    let width = 0, height = 0, elapsed = 0, last = 0, accumulator = 0, frame = 0, inView = true;
    let bodies: MusicBall[] = [];
    const draw = () => {
      bodies.forEach((ball, index) => {
        const node = nodes.current.get(rows[index].key);
        if (!node) return;
        node.style.width = node.style.height = `${ball.radius * 2}px`;
        node.style.fontSize = `${ball.radius * .65}px`;
        node.style.opacity = elapsed >= ball.birth ? "1" : "0";
        node.tabIndex = elapsed >= ball.birth ? 0 : -1;
        node.style.transform = `translate3d(${ball.x - ball.radius}px,${ball.y - ball.radius}px,0) rotate(${ball.angle}rad)`;
      });
      const chosen = hoverRef.current === null ? null : bodies[hoverRef.current];
      if (chosen && tooltip.current) {
        tooltip.current.style.left = `${Math.max(100, Math.min(width - 100, chosen.x))}px`;
        tooltip.current.style.top = `${Math.max(85, chosen.y - chosen.radius - 12)}px`;
      }
    };
    const tick = (now: number) => {
      frame = 0;
      if (!activeRef.current || document.hidden || !inView) return;
      accumulator += last ? Math.min(.045, (now - last) / 1000) : 0;
      last = now;
      while (accumulator >= 1 / 120) { elapsed += 1 / 120; stepMusicBalls(bodies, width, height, 1 / 120, elapsed); accumulator -= 1 / 120; }
      draw(); frame = requestAnimationFrame(tick);
    };
    const play = (value: boolean) => {
      cancelAnimationFrame(frame); frame = 0; last = 0; accumulator = 0;
      if (value && inView && !document.hidden && width) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const nextWidth = root.clientWidth, nextHeight = root.clientHeight;
      if (!nextWidth || Math.abs(nextWidth - width) < .5 && Math.abs(nextHeight - height) < .5) return;
      width = nextWidth; height = nextHeight; elapsed = 0;
      bodies = createMusicBalls(rows.map(row => sort === "streams" ? row.count : row.milliseconds), width, height);
      if (!activeRef.current) packMusicBalls(bodies, width, height);
      draw(); play(activeRef.current);
    };
    controller.current = { draw, play,
      grab(index) { const ball = bodies[index]; if (ball) { ball.grabbed = true; ball.birth = 0; ball.vx = ball.vy = 0; } },
      move(index, point) { const ball = bodies[index]; if (!ball) return; ball.x = Math.max(ball.radius, Math.min(width - ball.radius, point.x)); ball.y = Math.max(ball.radius, Math.min(height - ball.radius, point.y)); ball.entered = true; draw(); },
      release(index, vx, vy) { const ball = bodies[index]; if (ball) { ball.grabbed = false; ball.vx = Math.max(-1500, Math.min(1500, vx)); ball.vy = Math.max(-1500, Math.min(1500, vy)); } },
      nudge(index, x, y) { const ball = bodies[index]; if (ball) { ball.vx += x; ball.vy += y; if (!activeRef.current) { ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x + x * .15)); ball.y = Math.max(ball.radius, Math.min(height - ball.radius, ball.y + y * .15)); draw(); } } },
    };
    const visibility = () => play(activeRef.current);
    const observer = new ResizeObserver(resize); observer.observe(root); resize();
    const intersection = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; play(activeRef.current); }); intersection.observe(root);
    document.addEventListener("visibilitychange", visibility);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); document.removeEventListener("visibilitychange", visibility); controller.current = null; drag.current = null; };
  }, [rows, sort, revision]);

  const point = (event: PointerEvent) => { const root = stage.current!, bounds = root.getBoundingClientRect(); return { x: event.clientX - bounds.left - root.clientLeft, y: event.clientY - bounds.top - root.clientTop }; };
  const chosen = hovered === null ? null : rows[hovered];
  return <section className="music-balls" aria-label="Falling artwork balls">
    <div className="music-balls-controls"><p>{rows.length} {rows.length === 1 ? "ball" : "balls"}<span>Size by {sort === "time" ? "listening time" : "streams"}</span></p><div>
      <MusicButton className="stats-control" aria-label={active ? "Pause balls" : "Play balls"} onClick={() => setMotion(!active)}>{active ? <Pause size={18}/> : <Play size={18}/>}</MusicButton>
      <MusicButton className="stats-control" aria-label="Drop balls again" onClick={() => setRevision(value => value + 1)}><ArrowClockwise size={18}/></MusicButton>
    </div></div>
    <div ref={stage} className="music-ball-stage" style={{ "--music-ball-count": rows.length } as CSSProperties}>
      {rows.map((row, index) => <button key={row.key} ref={node => { if (node) nodes.current.set(row.key, node); else nodes.current.delete(row.key); }} className="music-ball"
        aria-label={`${row.name}: ${number.format(row.milliseconds / 60000)} minutes, ${row.count} streams. Open listening stats.`}
        onPointerEnter={() => setHovered(index)} onPointerLeave={() => { if (!drag.current) setHovered(null); }} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)}
        onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId); const p = point(event), box = event.currentTarget.getBoundingClientRect(); const offset = { x: event.clientX - box.left - box.width / 2, y: event.clientY - box.top - box.height / 2 }; drag.current = { index, origin: p, offset, last: p, time: event.timeStamp, vx: 0, vy: 0, moved: false }; controller.current?.grab(index); }}
        onPointerMove={event => { const held = drag.current; if (!held || held.index !== index) return; const p = point(event), dt = Math.max(.008, (event.timeStamp - held.time) / 1000); held.moved ||= Math.hypot(p.x - held.origin.x, p.y - held.origin.y) > 6; held.vx = (p.x - held.last.x) / dt; held.vy = (p.y - held.last.y) / dt; held.last = p; held.time = event.timeStamp; if (held.moved) controller.current?.move(index, { x: p.x - held.offset.x, y: p.y - held.offset.y }); }}
        onPointerUp={event => { const held = drag.current; if (!held || held.index !== index) return; controller.current?.release(index, held.moved && event.timeStamp - held.time < 120 ? held.vx : 0, held.moved && event.timeStamp - held.time < 120 ? held.vy : 0); drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); if (!held.moved) onSelect(row); }}
        onLostPointerCapture={() => { if (drag.current?.index === index) { controller.current?.release(index, 0, 0); drag.current = null; } }}
        onClick={event => { if (event.detail === 0) onSelect(row); }}
        onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); controller.current?.nudge(index, event.key === "ArrowLeft" ? -220 : event.key === "ArrowRight" ? 220 : 0, event.key === "ArrowUp" ? -340 : event.key === "ArrowDown" ? 200 : 0); } }}>
        {row.artwork ? <Image src={row.artwork} alt="" width={200} height={200} unoptimized loading="lazy" draggable={false}/> : <span aria-hidden="true">{row.name.slice(0, 1)}</span>}
      </button>)}
      {chosen && <div ref={tooltip} role="tooltip" className="stats-tooltip music-ball-tooltip"><b>{chosen.name}</b><span>{number.format(chosen.milliseconds / 60000)} min · {number.format(chosen.count)} streams</span></div>}
    </div>
    <p className="music-balls-hint">Drag to throw. Click for stats. <span>Keyboard: arrow keys to nudge, Enter to inspect.</span></p>
  </section>;
}
