"use client";

import { useState, type CSSProperties } from "react";
export function TypedText({text,delay=0,interval=34}:{text:string;delay?:number;interval?:number}) {
  const [complete,setComplete]=useState(false);
  const words=text.split(/(\s+)/);
  return <span className={complete ? "typed-text type-complete" : "typed-text"} onAnimationEnd={event=>{if((event.target as HTMLElement).dataset.typeLast==="true") setComplete(true);}}><span className="sr-only">{text}</span><span aria-hidden="true">
    {words.map((word,part)=>{
      if(/^\s+$/.test(word)) return word;
      const start=words.slice(0,part).join("").length;
      return <span className="typed-word" key={part}>{[...word].map((character,index)=>{
      const current=start+index;
      return <span className="typed-character" data-type-last={current===text.length-1 ? "true" : undefined} key={current} style={{"--type-delay":`${delay+current*interval}ms`} as CSSProperties}>{character}</span>;
    })}</span>;})}
  </span></span>;
}
