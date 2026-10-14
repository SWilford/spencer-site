import Image from "next/image";
export const metadata = { title: "Resume · Spencer Wilford" };
export default function ResumePage() { return <main id="main" className="page-content interior-page resume-document-page">
  <div className="page-heading"><h1>Resume</h1><p>Education, software engineering experience, projects, leadership, and technical skills.</p></div>
  <div className="resume-document-actions"><a className="resume-download" href="/resume/spencer-wilford-resume.pdf" download="Spencer Wilford Resume.pdf">Download Resume <span>PDF</span></a><a className="text-link" href="/resume/spencer-wilford-resume.docx" download="Spencer Wilford Resume.docx">Download Word version</a><a className="text-link" href="/resume/spencer-wilford-resume.pdf" target="_blank" rel="noreferrer">Open PDF</a></div>
  <a className="resume-document-preview" href="/resume/spencer-wilford-resume.pdf" target="_blank" rel="noreferrer" aria-label="Open Spencer Wilford's resume as a PDF with selectable text"><Image src="/resume/spencer-wilford-resume.webp" width={1224} height={1584} alt="Spencer Wilford's resume: JMU education, NSWCDD and NGA internships, JMU rugby and Thaw projects, leadership, and technical skills. Open the PDF to read selectable text." priority unoptimized /></a>
</main>; }
