"use client";

import { useRef, ViewTransition, type ReactNode, type ViewTransitionInstance } from "react";
import { createDecodeKeyframes, createDecodeSectors } from "@/lib/sector-decode";

export function PageMotion({children}:{children:ReactNode}) {
  const stage = useRef<HTMLDivElement>(null);
  const decode = (instance:ViewTransitionInstance) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !stage.current) return;
    const bounds = stage.current.getBoundingClientRect();
    const top = Math.max(0, Math.min(bounds.height, -bounds.top));
    const height = Math.min(innerHeight, bounds.height - top);
    if (bounds.width <= 0 || height <= 0 || !CSS.supports("clip-path", 'path("M0,0 L1,0 L1,1 Z")')) return;
    const sectors = createDecodeSectors(bounds.width, height);
    const ns = "http://www.w3.org/2000/svg";
    const outline = document.createElementNS(ns, "svg");
    outline.setAttribute("viewBox", `0 0 ${bounds.width} ${height}`);
    outline.setAttribute("aria-hidden", "true");
    Object.assign(outline.style, { position:"fixed", left:`${bounds.left}px`, top:`${bounds.top + top}px`, width:`${bounds.width}px`, height:`${height}px`, pointerEvents:"none", zIndex:"2147483000" });
    const effects: Animation[] = [];
    for (const sector of sectors) {
      const cell = document.createElementNS(ns, "path");
      cell.setAttribute("d", sector.polygon.map((p,i)=>`${i ? "L" : "M"}${p.x},${p.y}`).join(" ")+" Z");
      cell.setAttribute("fill", "rgba(32,32,34,.92)");
      cell.setAttribute("stroke", "#df8a85");
      cell.setAttribute("stroke-width", ".8");
      outline.appendChild(cell);
      effects.push(cell.animate([{opacity:1},{opacity:1,offset:.45},{opacity:0}], {delay:sector.start*620,duration:(sector.duration+.12)*620,fill:"both",easing:"ease-out"}));
    }
    document.body.appendChild(outline);
    const dispose = () => { effects.forEach(effect=>effect.cancel()); outline.remove(); };
    try {
      const animation = document.documentElement.animate(
        createDecodeKeyframes(bounds.width, bounds.height, top, height, Math.random, sectors),
        { duration:620, easing:"linear", fill:"both", pseudoElement:`::view-transition-new(${instance.name})` },
      );
      animation.finished.then(dispose, dispose);
      return () => { animation.cancel(); dispose(); };
    } catch {
      dispose();
      // Browsers without pseudo-element animation retain the CSS crossfade.
    }
  };
  return <ViewTransition name="page-content" default="none" update="decode" enter="decode" exit="decode" onUpdate={decode} onEnter={decode} onShare={decode}>
    <div ref={stage} className="page-stage">{children}</div>
  </ViewTransition>;
}
