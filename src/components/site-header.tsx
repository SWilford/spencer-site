"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { GithubLogo } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { LinkedinLogo } from "@phosphor-icons/react/dist/csr/LinkedinLogo";
import { MagneticLink } from "./magnetic-link";
import { profile } from "@/content/profile";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainLinks = [["Home", "/"], ["Experience", "/experience"], ["Projects", "/projects"], ["Resume", "/resume"], ["Contact", "/contact"]];

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [funOpen, setFunOpen] = useState(false);
  const funRef = useRef<HTMLDivElement>(null);
  const funButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!funRef.current?.contains(event.target as Node)) setFunOpen(false);
      if (!headerRef.current?.contains(event.target as Node)) setMobileOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (funOpen) funButton.current?.focus();
        else if (mobileOpen) mobileButton.current?.focus();
        setFunOpen(false); setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
  }, [funOpen, mobileOpen]);
  // Fixed hit areas prevent moving labels from chasing the cursor or shifting layout.
  useEffect(() => {
    const header = headerRef.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let active: HTMLElement | null = null, frame = 0;
    let point = { x: 0, y: 0 };
    const clear = () => {
      active?.style.removeProperty("--nav-x");
      active?.style.removeProperty("--nav-y");
      if (active) delete active.dataset.near;
      active = null;
    };
    const reset = () => { cancelAnimationFrame(frame); frame = 0; clear(); };
    const update = () => {
      frame = 0;
      if (reduced.matches || !fine.matches || document.hidden) { clear(); return; }
      let nearest: { target: HTMLElement; bounds: DOMRect; distance: number; center: number } | undefined;
      for (const target of header.querySelectorAll<HTMLElement>("[data-nav-magnet]")) {
        if (getComputedStyle(target).visibility !== "visible" || target.closest("[inert]")) continue;
        const bounds = target.getBoundingClientRect();
        if (!bounds.width || !bounds.height) continue;
        const distance = Math.hypot(Math.max(bounds.left - point.x, 0, point.x - bounds.right), Math.max(bounds.top - point.y, 0, point.y - bounds.bottom));
        if (distance >= 26) continue;
        const center = Math.hypot(point.x - bounds.left - bounds.width / 2, point.y - bounds.top - bounds.height / 2);
        if (!nearest || distance < nearest.distance || distance === nearest.distance && center < nearest.center) nearest = { target, bounds, distance, center };
      }
      if (active !== nearest?.target) clear();
      if (!nearest) return;
      const { target, bounds, distance } = nearest;
      active = target;
      const strength = (1 - distance / 26) ** 2;
      const x = Math.max(-1, Math.min(1, (point.x - bounds.left) / bounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (point.y - bounds.top) / bounds.height * 2 - 1));
      target.style.setProperty("--nav-x", `${x * 3.5 * strength}px`);
      target.style.setProperty("--nav-y", `${y * 2 * strength}px`);
      target.dataset.near = "true";
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") { reset(); return; }
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(update);
    };
    header.addEventListener("pointermove", move, { passive: true });
    header.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    reduced.addEventListener("change", reset);
    fine.addEventListener("change", reset);
    return () => {
      reset();
      header.removeEventListener("pointermove", move); header.removeEventListener("pointerleave", reset);
      window.removeEventListener("scroll", reset); window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      reduced.removeEventListener("change", reset); fine.removeEventListener("change", reset);
    };
  }, []);
  const close = () => { setMobileOpen(false); setFunOpen(false); };
  return <header ref={headerRef} className="site-header">
    <div className="header-inner">
      <Link className="wordmark" href="/" aria-label="Spencer Wilford, home" onClick={close}>Spencer Wilford</Link>
      <button ref={mobileButton} data-nav-magnet className="mobile-toggle icon-link" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen} aria-controls="main-navigation" onClick={() => setMobileOpen(!mobileOpen)}>
        <span className={`nav-motion-face menu-reticle${mobileOpen ? " is-open" : ""}`} aria-hidden="true"><i /><i /><i /></span>
      </button>
      <nav id="main-navigation" aria-label="Main navigation" className={mobileOpen ? "main-nav is-open" : "main-nav"}>
        {mainLinks.map(([label, href]) => <Link data-nav-magnet prefetch={true} key={label} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}><span className="nav-motion-face">{label}</span></Link>)}
        <div className="fun-disclosure" ref={funRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFunOpen(false); }}>
          <button ref={funButton} data-nav-magnet className="fun-trigger" aria-expanded={funOpen} aria-controls="fun-links"
            onClick={() => setFunOpen(!funOpen)}><span className="nav-motion-face">For fun <CaretDown size={13} className={funOpen ? "turned" : ""} /></span></button>
          <ul id="fun-links" className={funOpen ? "fun-links is-open" : "fun-links"} inert={!funOpen}>
            <li><MagneticLink href="/music" ariaCurrent={pathname === "/music" ? "page" : undefined} onClick={close}>Music Stats</MagneticLink></li>
          </ul>
        </div>
      </nav>
      <div className="social-links">
        <a data-nav-magnet className="icon-link" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub profile"><span className="nav-motion-face"><GithubLogo size={21} /></span></a>
        <a data-nav-magnet className="icon-link" href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn profile"><span className="nav-motion-face"><LinkedinLogo size={21} /></span></a>
        <a data-nav-magnet className="icon-link" href={`mailto:${profile.email}`} aria-label="Email Spencer"><span className="nav-motion-face"><EnvelopeSimple size={21} /></span></a>
      </div>
    </div>
  </header>;
}
