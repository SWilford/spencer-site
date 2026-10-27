import { pageMetadata } from "@/lib/site-metadata";
import Image from "next/image";
import { MagneticActions, MagneticLink } from "@/components/magnetic-link";
export const metadata = pageMetadata('Resume', 'View and download Spencer Wilford’s resume.', "/resume", true);
export default function ResumePage() { return <main id="main" className="page-content interior-page resume-document-page">
  <div className="page-heading"><h1>Resume</h1><p>Education, software engineering experience, projects, leadership, and technical skills.</p></div>
  <MagneticActions label="Resume actions" className="resume-document-actions"><MagneticLink href="/resume/spencer-wilford-resume.pdf" download="Spencer Wilford Resume.pdf">Download Resume</MagneticLink></MagneticActions>
  <a className="resume-document-preview" href="/resume/spencer-wilford-resume.pdf" target="_blank" rel="noreferrer" aria-label="Open Spencer Wilford's resume as a PDF with selectable text"><Image src="/resume/spencer-wilford-resume.webp" width={1224} height={1584} alt="Spencer Wilford's resume: JMU education, NSWCDD and NGA internships, JMU rugby and Thaw projects, leadership, and technical skills. Open the PDF to read selectable text." priority unoptimized /></a>
</main>; }
