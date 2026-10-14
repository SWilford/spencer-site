"use client";

import { useRef, ViewTransition, type ReactNode, type ViewTransitionInstance } from "react";
import { createDecodeKeyframes } from "@/lib/sector-decode";

export function PageMotion({children}:{children:ReactNode}) {
  const stage = useRef<HTMLDivElement>(null);
  const decode = (instance:ViewTransitionInstance) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !stage.current) return;
    const bounds = stage.current.getBoundingClientRect();
    const top = Math.max(0, Math.min(bounds.height, -bounds.top));
    const height = Math.min(innerHeight, bounds.height - top);
    if (bounds.width <= 0 || height <= 0 || !CSS.supports("clip-path", 'path("M0,0 L1,0 L1,1 Z")')) return;
    try {
      const animation = document.documentElement.animate(
        createDecodeKeyframes(bounds.width, bounds.height, top, height),
        { duration:620, easing:"linear", fill:"both", pseudoElement:`::view-transition-new(${instance.name})` },
      );
      return () => animation.cancel();
    } catch {
      // Browsers without pseudo-element animation retain the CSS crossfade.
    }
  };
  return <ViewTransition name="page-content" default="none" update="decode" enter="decode" exit="decode" onUpdate={decode} onEnter={decode} onShare={decode}>
    <div ref={stage} className="page-stage">{children}</div>
  </ViewTransition>;
}
