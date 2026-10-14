"use client";

import { useEffect, useRef } from "react";

/** Decorative frame follows the pointer; the center always marks the exact hit point. */
export function SensorCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const dot = root.querySelector<HTMLElement>(".cursor-core")!;
    const frame = root.querySelector<HTMLElement>(".cursor-frame")!;
    const pulse = root.querySelector<HTMLElement>(".cursor-pulse")!;
    const tail = Array.from(root.querySelectorAll<HTMLElement>(".cursor-vector"));
    const eligible = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let x = 0, y = 0, followX = 0, followY = 0, previousTime = 0, request = 0;
    let visible = false;
    const points = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
    let pulseAnimation: Animation | undefined;
    const hide = () => {
      visible = false;
      root.dataset.visible = "false";
      delete document.documentElement.dataset.sensorCursor;
      cancelAnimationFrame(request);
      request = 0;
      pulseAnimation?.cancel();
    };
    const render = (time: number) => {
      request = 0;
      if (!visible) return;
      const dt = Math.min(40, time - previousTime || 16);
      previousTime = time;
      const ease = 1 - Math.exp(-dt / 45);
      followX += (x - followX) * ease;
      followY += (y - followY) * ease;
      frame.style.transform = `translate3d(${followX}px,${followY}px,0)`;
      let distance = Math.hypot(x - followX, y - followY);
      points[0] = { x, y };
      for (let i = 1; i < points.length; i++) {
        const point = points[i], before = points[i - 1];
        point.x += (before.x - point.x) * ease;
        point.y += (before.y - point.y) * ease;
        const length = Math.hypot(before.x - point.x, before.y - point.y);
        const segment = tail[i - 1];
        segment.style.transform = `translate3d(${point.x}px,${point.y}px,0) rotate(${Math.atan2(before.y - point.y, before.x - point.x)}rad) scaleX(${Math.min(14, length)})`;
        segment.style.opacity = `${Math.min(.36, length / 20) * (1 - (i - 1) * .25)}`;
        distance += length;
      }
      // Stop at rest: no permanent second animation loop alongside the background.
      if (distance > .1) request = requestAnimationFrame(render);
    };
    const classify = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      const control = target.closest("a,button,[role='button'],summary");
      root.dataset.locked = String(!!control && !control.matches(":disabled,[aria-disabled='true']"));
      const nativeCursor = getComputedStyle(target).cursor;
      // Restore the browser cursor over text and editing surfaces.
      return !control && (!!target.closest("p,h1,h2,h3,h4,h5,h6,input,textarea,select,[contenteditable='true'],pre,code") || /text|resize|grab|wait|progress|not-allowed/.test(nativeCursor));
    };
    const move = (event: PointerEvent) => {
      if (!eligible.matches || event.pointerType !== "mouse" || document.hidden || classify(event.target)) { hide(); return; }
      x = event.clientX; y = event.clientY;
      if (!visible) {
        followX = x; followY = y;
        points.forEach(point => { point.x = x; point.y = y; });
        previousTime = 0;
      }
      visible = true;
      root.dataset.visible = "true";
      document.documentElement.dataset.sensorCursor = "true";
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (!request) request = requestAnimationFrame(render);
    };
    const click = (event: PointerEvent) => {
      move(event);
      if (!visible || event.pointerType !== "mouse" || event.button !== 0) return;
      pulse.style.left = `${event.clientX}px`;
      pulse.style.top = `${event.clientY}px`;
      pulseAnimation?.cancel();
      pulseAnimation = pulse.animate([
        { transform: "translate(-50%,-50%) scale(.55)", opacity: .8 },
        { transform: "translate(-50%,-50%) scale(1.6)", opacity: 0 },
      ], { duration: 300, easing: "cubic-bezier(.16,1,.3,1)" });
    };
    const refresh = () => hide();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true });
    window.addEventListener("blur", hide);
    window.addEventListener("scroll", hide, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    document.addEventListener("visibilitychange", hide);
    document.addEventListener("keydown", hide);
    eligible.addEventListener("change", refresh);
    return () => {
      hide();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", move);
      window.removeEventListener("pointerdown", click);
      window.removeEventListener("blur", hide);
      window.removeEventListener("scroll", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.removeEventListener("visibilitychange", hide);
      document.removeEventListener("keydown", hide);
      eligible.removeEventListener("change", refresh);
    };
  }, []);
  return <div ref={rootRef} className="sensor-cursor" aria-hidden="true" data-visible="false">
    {[0, 1, 2].map(index => <span className="cursor-vector" key={index} />)}
    <span className="cursor-frame"><span /></span>
    <span className="cursor-core"><span /></span>
    <span className="cursor-pulse"><span /></span>
  </div>;
}
