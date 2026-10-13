"use client";

import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";

export function MagneticLink({href,children}:{href:string;children:string}) {
  const reset=(element:HTMLAnchorElement)=>{
    for(const property of ["--mag-x","--mag-y"]) element.style.setProperty(property,"0px");
    for(const property of ["--tilt-x","--tilt-y"]) element.style.setProperty(property,"0deg");
    delete element.dataset.pressed;
  };
  const move=(event:PointerEvent<HTMLAnchorElement>)=>{
    if(event.pointerType!=="mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element=event.currentTarget,bounds=element.getBoundingClientRect();
    const x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
    const y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
    element.style.setProperty("--mag-x",`${x*7}px`);
    element.style.setProperty("--mag-y",`${y*5}px`);
    element.style.setProperty("--tilt-x",`${-y*5}deg`);
    element.style.setProperty("--tilt-y",`${x*7}deg`);
  };
  return <Link href={href} prefetch={true} className="hero-button"
    onPointerMove={move} onPointerLeave={event=>reset(event.currentTarget)}
    onPointerDown={event=>{event.currentTarget.dataset.pressed="true";}}
    onPointerUp={event=>{delete event.currentTarget.dataset.pressed;}}
    onPointerCancel={event=>reset(event.currentTarget)} onBlur={event=>reset(event.currentTarget)}
    onKeyDown={event=>{if(event.key==="Enter" && !event.repeat) event.currentTarget.dataset.pressed="true";}}
    onKeyUp={event=>{if(event.key==="Enter") delete event.currentTarget.dataset.pressed;}}>
    <span className="magnetic-face">
      <span className="button-blocks" aria-hidden="true">{Array.from({length:12},(_,index)=><span key={index} className="button-block" style={{"--block-delay":`${index%6*42+Math.floor(index/6)*20}ms`} as CSSProperties}/>)}</span>
      <span className="button-label">{children}</span>
    </span>
  </Link>;
}
