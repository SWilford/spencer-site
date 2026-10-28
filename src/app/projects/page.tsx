import { pageMetadata } from "@/lib/site-metadata";
import { ProjectShowcases } from "@/components/project-showcases";
import "./projects.css";
export const metadata = pageMetadata("Projects", "Interactive demos of full-stack applications, hackathon work, and this portfolio.", "/projects", true);
export default function ProjectsPage() { return <main id="main" className="page-content interior-page projects-page"><div className="page-heading"><h1>Projects</h1><p>Full-stack applications, hackathon work, and interactive experiments.</p></div><ProjectShowcases /></main>; }
