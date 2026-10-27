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
  const close = () => { setMobileOpen(false); setFunOpen(false); };
  return <header ref={headerRef} className="site-header">
    <div className="header-inner">
      <Link className="wordmark" href="/" aria-label="Spencer Wilford, home" onClick={close}>Spencer Wilford</Link>
      <button ref={mobileButton} className="mobile-toggle icon-link" aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen} aria-controls="main-navigation" onClick={() => setMobileOpen(!mobileOpen)}>
        <span className={`menu-reticle${mobileOpen ? " is-open" : ""}`} aria-hidden="true"><i /><i /><i /></span>
      </button>
      <nav id="main-navigation" aria-label="Main navigation" className={mobileOpen ? "main-nav is-open" : "main-nav"}>
        {mainLinks.map(([label, href]) => <Link prefetch={true} key={label} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}</Link>)}
        <div className="fun-disclosure" ref={funRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFunOpen(false); }}>
          <button ref={funButton} className="fun-trigger" aria-expanded={funOpen} aria-controls="fun-links"
            onClick={() => setFunOpen(!funOpen)}>For fun <CaretDown size={13} className={funOpen ? "turned" : ""} /></button>
          <ul id="fun-links" className={funOpen ? "fun-links is-open" : "fun-links"} inert={!funOpen}>
            <li><MagneticLink href="/music" ariaCurrent={pathname === "/music" ? "page" : undefined} onClick={close}>Music Stats</MagneticLink></li>
          </ul>
        </div>
      </nav>
      <div className="social-links">
        <a className="icon-link" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub profile"><GithubLogo size={21} /></a>
        <a className="icon-link" href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn profile"><LinkedinLogo size={21} /></a>
        <a className="icon-link" href={`mailto:${profile.email}`} aria-label="Email Spencer"><EnvelopeSimple size={21} /></a>
      </div>
    </div>
  </header>;
}
