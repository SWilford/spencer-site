import { projects } from "@/content/profile";
export const metadata = { title: "Projects · Spencer Wilford" };
export default function ProjectsPage() { return <main id="main" className="page-content interior-page">
  <div className="page-heading"><h1>Projects</h1><p>Full-stack applications, AI platforms, and interactive software projects.</p></div>
  <div className="projects-flow">{projects.map((project,index) => <article className={`project project-${index}`} key={project.title}>
    <div className={`project-preview preview-${project.visual}`}><span>Project image to come</span></div>
    <div className="project-copy"><p className="project-category">{project.category}</p><h2>{project.title}</h2><p>{project.description}</p><p className="project-stack">{project.stack.join(" / ")}</p>
    {project.href && <a className="text-link" href={project.href} target="_blank" rel="noreferrer">{project.linkLabel}</a>}</div>
  </article>)}</div>
</main>; }
