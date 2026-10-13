import type { CSSProperties } from "react";

export function AnimatedName() {
  let sequence = 0;
  return <h1 className="animated-name" aria-label="Spencer Wilford">
    {["Spencer", "Wilford"].map(word => <span className="name-word" aria-hidden="true" key={word}>
      {[...word].map((letter, index) => {
        const number = sequence++;
        const fragments = number===2 ? 9 : number===9 ? 6 : 0;
        return <span className={`name-letter entrance-${number}`} data-letter={letter} key={index}
          style={{ "--letter-delay": `${80 + number * 45}ms` } as CSSProperties}>
          <span className="name-glyph">{letter}</span>
          {Array.from({length:fragments},(_,piece)=>{
            const columns=3,rows=fragments/columns,col=piece%columns,row=Math.floor(piece/columns);
            return <span className="letter-fragment" key={piece} style={{
              clipPath:`inset(${row/rows*100}% ${(columns-col-1)/columns*100}% ${(rows-row-1)/rows*100}% ${col/columns*100}%)`,
              '--piece-x':`${(col-1)*(number===2 ? 16 : 85)}px`,
              '--piece-y':`${(row-(rows-1)/2)*(number===2 ? 16 : 75)}px`,
              '--piece-turn':`${number===2 ? 0 : (piece%2 ? 45 : -45)}deg`,
            } as CSSProperties}>{letter}</span>;
          })}
        </span>;
      })}
    </span>)}
  </h1>;
}
