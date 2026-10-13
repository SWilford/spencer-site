import type { CSSProperties } from "react";
export function TypedText({text,delay=0}:{text:string;delay?:number}) {
  const words=text.split(/(\s+)/);
  return <span className="typed-text"><span className="sr-only">{text}</span><span aria-hidden="true">
    {words.map((word,part)=>{
      if(/^\s+$/.test(word)) return word;
      const start=words.slice(0,part).join("").length;
      return <span className="typed-word" key={part}>{[...word].map((character,index)=>{
      const current=start+index;
      return <span className="typed-character" key={current} style={{"--type-delay":`${delay+current*34}ms`} as CSSProperties}>{character}</span>;
    })}</span>;})}
  </span></span>;
}
