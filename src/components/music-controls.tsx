"use client";

import { MusicButton } from "./music-interactions";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** A small anchored disclosure: native buttons, keyboard dismissal, no portal or scroll drift. */
export function StatsMenu({ label, icon, children, className = "" }: { label: string; icon: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={root} className={`stats-menu ${className}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <MusicButton ref={trigger} className="stats-control" aria-label={label} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{icon}<span className="stats-control-label">{label}</span></MusicButton>
    <div id={id} className="stats-menu-panel" data-open={open} inert={!open} onClick={event => { if ((event.target as HTMLElement).closest("button")) { setOpen(false); trigger.current?.focus(); } }}>{children}</div>
  </div>;
}
