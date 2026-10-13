"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";

export function MagneticLink({href,children}:{href:string;children:string}) {
  const reset=(element:HTMLAnchorElement)=>{
    for(const property of ["--mag-x","--mag-y"]) element.style.setProperty(property,"0px");
    for(const property of ["--tilt-x","--tilt-y"]) element.style.setProperty(property,"0deg");
    delete element.dataset.pressed;
  };
  return <Link href={href} prefetch={true} className="hero-button"
    onPointerLeave={event=>reset(event.currentTarget)}
    onPointerDown={event=>{event.currentTarget.dataset.pressed="true";}}
    onPointerUp={event=>{delete event.currentTarget.dataset.pressed;}}
    onPointerCancel={event=>reset(event.currentTarget)} onBlur={event=>reset(event.currentTarget)}
    onKeyDown={event=>{if(event.key==="Enter" && !event.repeat) event.currentTarget.dataset.pressed="true";}}
    onKeyUp={event=>{if(event.key==="Enter") delete event.currentTarget.dataset.pressed;}}>
    <span className="magnetic-face">
      <span className="button-blocks" aria-hidden="true">{Array.from({length:30},(_,index)=><span key={index} className="button-block" style={{"--block-delay":`${index%10*24+Math.floor(index/10)*16}ms`} as CSSProperties}/>)}</span>
      <span className="button-label">{children}</span>
    </span>
  </Link>;
}

export function MagneticActions() {
  const navRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    const links=Array.from(navRef.current?.querySelectorAll<HTMLAnchorElement>(".hero-button") ?? []);
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    const clear=(link:HTMLAnchorElement)=>{
      for(const key of ["--mag-x","--mag-y"]) link.style.setProperty(key,"0px");
      for(const key of ["--tilt-x","--tilt-y"]) link.style.setProperty(key,"0deg");
    };
    const reset=()=>links.forEach(clear);
    const move=(event:PointerEvent)=>{
      if(event.pointerType!=="mouse" || motion.matches) {reset();return;}
      const candidates=links.map(link=>{
        const bounds=link.getBoundingClientRect();
        const dx=Math.max(bounds.left-event.clientX,0,event.clientX-bounds.right);
        const dy=Math.max(bounds.top-event.clientY,0,event.clientY-bounds.bottom);
        const distance=Math.hypot(dx,dy);
        const centerDistance=Math.hypot(event.clientX-bounds.left-bounds.width/2,event.clientY-bounds.top-bounds.height/2);
        return {link,bounds,distance,centerDistance};
      }).sort((a,b)=>a.distance-b.distance || a.centerDistance-b.centerDistance);
      const closest=candidates[0];
      for(const candidate of candidates) {
        const {link,bounds,distance}=candidate;
        if(candidate!==closest || distance>=44) {clear(link);continue;}
        const strength=(1-distance/44)**2;
        const x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
        const y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
        link.style.setProperty("--mag-x",`${x*7*strength}px`);
        link.style.setProperty("--mag-y",`${y*5*strength}px`);
        link.style.setProperty("--tilt-x",`${-y*5*strength}deg`);
        link.style.setProperty("--tilt-y",`${x*7*strength}deg`);
      }
    };
    window.addEventListener("pointermove",move,{passive:true});
    window.addEventListener("blur",reset);
    document.documentElement.addEventListener("pointerleave",reset);
    motion.addEventListener("change",reset);
    return ()=>{window.removeEventListener("pointermove",move);window.removeEventListener("blur",reset);document.documentElement.removeEventListener("pointerleave",reset);motion.removeEventListener("change",reset);};
  },[]);
  return <nav ref={navRef} className="hero-actions" aria-label="Explore my portfolio">
    {[["Experience","/experience"],["Projects","/projects"],["Résumé","/resume"],["Contact","/contact"]].map(([label,href])=><MagneticLink key={href} href={href}>{label}</MagneticLink>)}
  </nav>;
}
