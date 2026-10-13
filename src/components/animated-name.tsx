"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import contours from "@/content/name-glyphs.json";
export const nameEffects=["explode","water","pixels","print","dots","sand","radar","blueprint","decode","binary","graph","integral","search","raster"];
function Glyph({letter,className="",outline=false}:{letter:string;className?:string;outline?:boolean}) {
  const glyph=contours.glyphs[letter as keyof typeof contours.glyphs];
  return <svg className={`letter-art ${className}`} viewBox={`0 -${contours.ascent} ${glyph.advance} ${contours.ascent-contours.descent}`} preserveAspectRatio="none" aria-hidden="true"><g transform="scale(1,-1)"><path d={glyph.d} pathLength="1" fill={outline ? "none" : "currentColor"} stroke={outline ? "currentColor" : "none"} strokeWidth="10" /></g></svg>;
}
export function AnimatedName() {
  const [replays,setReplays]=useState<number[]>(Array(14).fill(0));
  const [complete,setComplete]=useState<boolean[]>(Array(14).fill(false));
  const readyAt=useRef<number[]>([]);
  useEffect(()=>{if(readyAt.current.length===0) readyAt.current=Array(14).fill(performance.now()+4200);},[]);
  const replay=(number:number)=>{
    const now=performance.now();
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches || now<(readyAt.current[number]??Infinity)) return;
    readyAt.current[number]=now+(number===0 || number===7 ? 2600 : 1900)+750;
    setComplete(previous=>previous.map((value,index)=>index===number ? false : value));
    setReplays(previous=>previous.map((count,index)=>index===number ? count+1 : count));
  };
  let sequence=0;
  return <h1 className="animated-name" aria-label="Spencer Wilford">
    {["Spencer","Wilford"].map(word=><span className="name-word" aria-hidden="true" key={word}>
      {[...word].map((letter,index)=>{
        const number=sequence++,effect=nameEffects[number],hero=number===0||number===7;
        const delay=replays[number]>0 ? 0 : number===7 ? 360 : 120+number*100;
        const glyph=contours.glyphs[letter as keyof typeof contours.glyphs];
        const tiles=effect==="explode" ? 8 : effect==="pixels" ? 9 : effect==="sand" ? 24 : effect==="dots" ? 25 : effect==="raster" ? 12 : effect==="search" ? 4 : 0;
        return <span className={`name-letter effect-${effect}${complete[number] ? " letter-complete" : ""}`} key={`${index}-${replays[number]}`} data-replay={replays[number]} onAnimationEnd={event=>{
          const node=event.target as HTMLElement;
          const terminal=effect==="raster"||effect==="search" ? node.classList.contains("letter-piece") && node.style.getPropertyValue("--piece")===String(tiles-1) : effect==="binary" ? node.style.getPropertyValue("--column")==="3" : node.classList.contains("glyph-solid");
          if(terminal) setComplete(previous=>previous.map((value,i)=>i===number ? true : value));
        }} onPointerEnter={event=>{if(event.pointerType==="mouse") replay(number);}} onPointerDown={event=>{if(event.pointerType==="touch") replay(number);}} style={{"--letter-delay":`${delay}ms`,"--letter-duration":hero ? "2600ms" : "1900ms"} as CSSProperties}>
          <span className="name-glyph">{letter}</span><Glyph letter={letter} className="glyph-solid" />
          {(effect==="water"||effect==="integral"||effect==="radar")&&<Glyph letter={letter} className="glyph-outline" outline />}
          {Array.from({length:tiles},(_,piece)=>{
            const columns=effect==="explode" ? 4 : effect==="raster" ? 12 : effect==="sand" ? 6 : effect==="dots" ? 5 : effect==="search" ? 2 : 3;
            const rows=Math.ceil(tiles/columns),col=piece%columns,row=Math.floor(piece/columns);
            return <span className="letter-piece" key={piece} style={{clipPath:`inset(${row/rows*100}% ${(columns-col-1)/columns*100}% ${(rows-row-1)/rows*100}% ${col/columns*100}%)`,"--piece":piece,"--piece-x":`${(col-(columns-1)/2)*(effect==="explode" ? 65 : 8)}px`,"--piece-y":`${effect==="sand" ? 35+piece%4*8 : (row-(rows-1)/2)*(effect==="explode" ? 80 : 8)}px`,"--piece-turn":`${effect==="explode" ? (piece%2 ? 70 : -60) : 0}deg`} as CSSProperties}><Glyph letter={letter} /></span>;
          })}
          {(effect==="blueprint"||effect==="graph")&&<svg className="letter-art growing-edges" viewBox={`0 -${contours.ascent} ${glyph.advance} ${contours.ascent-contours.descent}`} preserveAspectRatio="none" aria-hidden="true"><g transform="scale(1,-1)">{glyph.edges.map((edge,i)=><g key={i} style={{"--edge":i%6} as CSSProperties}><circle cx={edge.x} cy={edge.y} r="9"/><path d={edge.d} pathLength="1" /></g>)}</g></svg>}
          {effect==="binary"&&<span className="binary-rain" aria-hidden="true">{["0101","1100","0011","1010"].map((bits,i)=><span key={i} style={{"--column":i} as CSSProperties}>{bits}</span>)}</span>}
          {effect==="radar"&&<span className="radar-sweep" aria-hidden="true"/>}
          {effect==="print"&&<span className="print-head" aria-hidden="true"/>}
        </span>;
      })}
    </span>)}
  </h1>;
}
