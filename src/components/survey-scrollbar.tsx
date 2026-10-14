"use client";

import { useEffect, useRef } from "react";

const ticks = Array.from({ length: 61 }, (_, index) => <line key={index} x1={index % 5 === 0 ? 5 : 12} x2="21" y1={index * 16 + 10} y2={index * 16 + 10} className={index % 5 === 0 ? "major" : undefined} />);

export function SurveyScrollbar() {
  const rail = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ pointer: number; offset: number } | null>(null);
  const reveal = useRef<() => void>(() => {});

  useEffect(() => {
    const element = rail.current!;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const forced = matchMedia("(forced-colors: active)");
    let frame = 0, hideTimer: ReturnType<typeof setTimeout>;
    let hovered = false, focused = false;
    const show = () => {
      element.dataset.active = "true";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!hovered && !focused && !dragging.current) element.dataset.active = "false";
      }, 1100);
    };
    reveal.current = show;
    const measure = () => {
      const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      const height = element.clientHeight;
      const thumb = Math.min(height, Math.max(44, height * innerHeight / Math.max(innerHeight, document.documentElement.scrollHeight)));
      const fraction = maximum ? Math.max(0, Math.min(1, scrollY / maximum)) : 0;
      element.style.setProperty("--survey-thumb", `${thumb}px`);
      element.style.setProperty("--survey-offset", `${fraction * (height - thumb)}px`);
      element.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
      element.setAttribute("aria-valuetext", `${Math.round(fraction * 100)}% of page`);
      element.dataset.scrollable = String(maximum > 1);
      frame = 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const configure = () => {
      const enabled = fine.matches && !forced.matches;
      document.documentElement.classList.toggle("survey-scroll-enabled", enabled);
      element.dataset.enabled = String(enabled);
      element.tabIndex = enabled ? 0 : -1;
      schedule();
    };
    const onScroll = () => { schedule(); show(); };
    const enter = () => { hovered = true; show(); };
    const leave = () => { hovered = false; show(); };
    const focus = () => { focused = true; show(); };
    const blur = () => { focused = false; show(); };
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("focus", focus);
    element.addEventListener("blur", blur);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    fine.addEventListener("change", configure);
    forced.addEventListener("change", configure);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    observer.observe(element);
    configure();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame); clearTimeout(hideTimer);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", schedule);
      fine.removeEventListener("change", configure); forced.removeEventListener("change", configure);
      element.removeEventListener("pointerenter", enter); element.removeEventListener("pointerleave", leave);
      element.removeEventListener("focus", focus); element.removeEventListener("blur", blur);
      document.documentElement.classList.remove("survey-scroll-enabled");
    };
  }, []);

  const moveTo = (clientY: number, offset: number) => {
    const element = rail.current!;
    const bounds = element.getBoundingClientRect();
    const thumb = Number.parseFloat(element.style.getPropertyValue("--survey-thumb"));
    const fraction = Math.max(0, Math.min(1, (clientY - bounds.top - offset) / Math.max(1, bounds.height - thumb)));
    window.scrollTo({ top: fraction * Math.max(0, document.documentElement.scrollHeight - innerHeight), behavior: "instant" });
  };

  return <div ref={rail} className="survey-scrollbar" role="scrollbar" aria-label="Page scroll position" aria-controls="main" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} tabIndex={-1}
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault();
      const element = event.currentTarget, bounds = element.getBoundingClientRect();
      const thumb = Number.parseFloat(element.style.getPropertyValue("--survey-thumb"));
      const start = Number.parseFloat(element.style.getPropertyValue("--survey-offset"));
      const local = event.clientY - bounds.top;
      const offset = local >= start && local <= start + thumb ? local - start : thumb / 2;
      dragging.current = { pointer: event.pointerId, offset };
      element.dataset.dragging = "true"; element.focus({ preventScroll: true }); element.setPointerCapture(event.pointerId);
      reveal.current(); moveTo(event.clientY, offset);
    }}
    onPointerMove={event => { if (dragging.current?.pointer === event.pointerId) moveTo(event.clientY, dragging.current.offset); }}
    onLostPointerCapture={() => { dragging.current = null; if (rail.current) rail.current.dataset.dragging = "false"; reveal.current(); }}
    onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onKeyDown={event => {
      const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      const positions: Record<string, number> = { ArrowDown: scrollY + 48, ArrowUp: scrollY - 48, PageDown: scrollY + innerHeight * .85, PageUp: scrollY - innerHeight * .85, Home: 0, End: maximum };
      if (!(event.key in positions)) return;
      event.preventDefault(); reveal.current(); window.scrollTo({ top: Math.max(0, Math.min(maximum, positions[event.key])), behavior: "instant" });
    }}>
    <svg className="survey-ticks" viewBox="0 0 28 980" preserveAspectRatio="none" aria-hidden="true">{ticks}</svg>
    <span className="survey-thumb" aria-hidden="true"><i /><b /></span>
  </div>;
}
