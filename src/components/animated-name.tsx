import type { CSSProperties } from "react";

export function AnimatedName() {
  let sequence = 0;
  return <h1 className="animated-name" aria-label="Spencer Wilford">
    {["Spencer", "Wilford"].map(word => <span className="name-word" aria-hidden="true" key={word}>
      {[...word].map((letter, index) => {
        const number = sequence++;
        return <span className={`name-letter entrance-${number % 3}`} key={index}
          style={{ "--letter-delay": `${100 + number * 65}ms` } as CSSProperties}>{letter}</span>;
      })}
    </span>)}
  </h1>;
}
