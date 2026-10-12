import Link from "next/link";
export const metadata = { title: "Experience · Spencer Wilford" };
export default function ExperiencePage() { return <main id="main" className="page-content interior-page">
  <div className="page-heading"><h1>Experience</h1><p>A little about where I’ve been and what I’m learning.</p></div>
  <div className="experience-flow">
    <article className="experience-entry"><p className="entry-date">June 2023 – August 2023</p><h2>Software Engineer Intern</h2><p className="organization">National Geospatial Intelligence Agency</p><p>Python data ingestion, SQL pipelines, and REST API metrics for internal dashboards. Built alongside engineers and analysts in Agile sprints.</p></article>
    <article className="experience-entry education-entry"><p className="entry-date">2024 – 2028 · expected</p><h2>Computer Science at JMU</h2><p className="organization">James Madison University · Honors College</p><p>B.S. Computer Science with a minor in Computational Analytics. Studying software engineering, algorithms, data structures, and computer systems.</p></article>
  </div><Link className="text-link page-followup" href="/resume">Read my résumé</Link>
</main>; }
