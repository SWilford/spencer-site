"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/csr/ArrowSquareOut";
import { ArrowsOutSimple } from "@phosphor-icons/react/dist/csr/ArrowsOutSimple";
import { ArrowsInSimple } from "@phosphor-icons/react/dist/csr/ArrowsInSimple";
import { ArrowClockwise } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { Play } from "@phosphor-icons/react/dist/csr/Play";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { projects } from "@/content/profile";
import { MusicButton, MusicInteractions, MusicLink } from "./music-interactions";
export function ProjectShowcases() {
    const [active, setActive] = useState<string | null>(null), [expanded, setExpanded] = useState<string | null>(null), [revision, setRevision] = useState(0), [loaded, setLoaded] = useState(false);
    const launch = (id: string) => {
        if(id === "inception") {
            let depth=0,current:Window=window;
            try {
                while(current.parent!==current && depth<8){
                    if(current.frameElement?.hasAttribute("data-portfolio-preview"))depth++;
                    current=current.parent;
                }
            } catch { /* Framing outside this site cannot inspect the frame tree. */ }
            if(depth>=3){window.open("/","_blank","noopener,noreferrer");return;}
        }
        setActive(id);setLoaded(false);setRevision(0);
    };
    return <MusicInteractions><div className="showcase-flow">{projects.map(project => <article key={project.id} className={`showcase-section${expanded === project.id ? " is-expanded" : ""}`} aria-labelledby={`project-${project.id}`}>
 <div className="showcase-copy"><h2 id={`project-${project.id}`}>{project.title}</h2><p className="showcase-category">{project.category}</p><p className="showcase-description">{project.description}</p><ul className="showcase-stack" aria-label="Technology stack">{project.stack.map(tech => <li key={tech}>{tech}</li>)}</ul><div className="showcase-links"><MusicLink href={project.source} target="_blank" rel="noreferrer">Source <ArrowSquareOut size={16}/></MusicLink>{project.href && <MusicLink href={project.href} target="_blank" rel="noreferrer">Live site <ArrowSquareOut size={16}/></MusicLink>}</div></div>
 <div className="project-browser"><div className="project-browser-toolbar"><span className="project-browser-address">{project.title}</span><div className="project-browser-controls">{active === project.id && <><MusicButton aria-label={`Restart ${project.title} demo`} onClick={() => { setLoaded(false); setRevision(n => n + 1); }}><ArrowClockwise size={17}/></MusicButton><MusicButton aria-label={`Close ${project.title} demo`} onClick={() => { setActive(null); setExpanded(null); }}><X size={17}/></MusicButton></>}<MusicButton aria-label={`${expanded === project.id ? 'Collapse' : 'Expand'} ${project.title} preview`} aria-pressed={expanded === project.id} onClick={event => {
    const next=expanded === project.id ? null : project.id;
    const browser=event.currentTarget.closest(".project-browser");
    setExpanded(next);
    if(next)requestAnimationFrame(()=>browser?.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"}));
}}>{expanded === project.id ? <ArrowsInSimple size={17}/> : <ArrowsOutSimple size={17}/>}</MusicButton></div></div>
 <div className={`project-browser-viewport${active === project.id ? "" : " is-idle"}`}>{active === project.id ? <><iframe key={`${project.id}:${revision}`} src={project.demo} title={`${project.title} interactive demo`} sandbox={project.id === "inception" ? undefined : "allow-scripts"} data-portfolio-preview={project.id === "inception" ? "true" : undefined} referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} aria-busy={!loaded}/>{!loaded && <div className="project-demo-loading" role="status">Loading {project.title}…</div>}</> : <button className="project-launch" onClick={() => launch(project.id)} aria-label={`Launch ${project.title} demo`} data-music-magnet="control"><Image className="project-preview-image" src={project.preview} alt={`${project.title} homepage screenshot`} fill sizes="(max-width: 950px) 100vw, 65vw"/><span className="project-launch-label music-motion-face"><Play size={22} weight="fill"/> Launch demo</span></button>}</div>
 </div>
 </article>)}</div></MusicInteractions>;
}
