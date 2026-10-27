"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

/** Keep native hit areas fixed; only the inner visual face moves. */
export function MusicButton({ children, ...props }: ComponentProps<"button">) {
  return <button {...props} data-music-magnet="control"><span className="music-motion-face">{children}</span></button>;
}
export function MusicLink({ children, ...props }: ComponentProps<"a">) {
  return <a {...props} data-music-magnet="control"><span className="music-motion-face">{children}</span></a>;
}

export function MusicInteractions({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = matchMedia("(hover: hover) and (pointer: fine)");
    let active: HTMLElement | null = null, frame = 0;
    let point = { x: 0, y: 0 };
    const clear = () => {
      if (!active) return;
      for (const name of ["--music-mx", "--music-my", "--music-rx", "--music-ry"]) active.style.removeProperty(name);
      delete active.dataset.near;
      active = null;
    };
    const reset = () => { cancelAnimationFrame(frame); frame = 0; clear(); };
    const update = () => {
      frame = 0;
      if (reduced.matches || !mouse.matches || document.visibilityState !== "visible") { clear(); return; }
      // Read all bounds before writing styles. Closed disclosures and disabled
      // controls never participate; only one nearest target can attract.
      let closest: { target: HTMLElement; bounds: DOMRect; distance: number; center: number } | undefined;
      for (const target of element.querySelectorAll<HTMLElement>("[data-music-magnet]:not(:disabled)")) {
        if (target.closest("[inert]")) continue;
        const bounds = target.getBoundingClientRect();
        if (!bounds.width || !bounds.height || bounds.bottom < 0 || bounds.top > innerHeight) continue;
        const distance = Math.hypot(Math.max(bounds.left - point.x, 0, point.x - bounds.right), Math.max(bounds.top - point.y, 0, point.y - bounds.bottom));
        if (distance >= 28) continue;
        const center = Math.hypot(point.x - bounds.left - bounds.width / 2, point.y - bounds.top - bounds.height / 2);
        if (!closest || distance < closest.distance || distance === closest.distance && center < closest.center) closest = { target, bounds, distance, center };
      }
      if (active !== closest?.target) clear();
      if (!closest) return;
      const { target, bounds, distance } = closest;
      active = target;
      const strength = (1 - distance / 28) ** 2;
      const x = Math.max(-1, Math.min(1, (point.x - bounds.left) / bounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (point.y - bounds.top) / bounds.height * 2 - 1));
      target.style.setProperty("--music-mx", `${x * 3 * strength}px`);
      target.style.setProperty("--music-my", `${y * 2 * strength}px`);
      target.style.setProperty("--music-rx", `${-y * 1.5 * strength}deg`);
      target.style.setProperty("--music-ry", `${x * 1.5 * strength}deg`);
      target.dataset.near = "true";
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") { reset(); return; }
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(update);
    };
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    reduced.addEventListener("change", reset);
    mouse.addEventListener("change", reset);
    return () => {
      reset();
      element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", reset);
      window.removeEventListener("scroll", reset); window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      reduced.removeEventListener("change", reset); mouse.removeEventListener("change", reset);
    };
  }, []);
  return <div ref={root} className="music-interactions">{children}</div>;
}
