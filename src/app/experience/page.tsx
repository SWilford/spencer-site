import { pageMetadata } from "@/lib/site-metadata";
import { MagneticActions, MagneticLink } from "@/components/magnetic-link";
export const metadata = pageMetadata('Experience', 'Software engineering internships, JMU education, leadership, awards, and mentorship.', "/experience", true);
const jobs = [
  { organization: "Naval Surface Warfare Center Dahlgren Division", location: "Dahlgren, VA", dates: "May 2026 – August 2026", bullets: [
    "Engineered full-stack features for MADSS, an enterprise mission-assurance platform supporting 15,000+ DoW users in modeling mission dependencies, assessing operational impacts, and monitoring supporting resources.",
    "Diagnosed a complex database and application-layer performance issue affecting 10,000+ records and proposed changes that reduced data population time from ~4 minutes to ~15 seconds, a 93.75% improvement.",
    "Developed Angular components, modals, state-driven workflows, and feature-flagged functionality using TypeScript, NgRx, and RxJS while contributing to C#/.NET REST APIs and microservices.",
    "Resolved release-critical defects spanning frontend, backend, database, and multiple deployment environments; used SQL Server, Elasticsearch, Swagger, and Kibana to trace and validate system behavior.",
    "Delivered 11 development tickets across 8 weeks of active development on a 7-person SAFe Scrum team, participating in code reviews, sprint planning, release workflows, and PI planning.",
  ]},
  { organization: "National Geospatial Intelligence Agency", location: "Springfield, VA", dates: "June 2023 – August 2023", bullets: [
    "Operated in Agile sprints using Jira, collaborating with engineers and analysts to deliver secure software features.",
    "Integrated REST API metrics tracking across internal dashboards, improving visibility into user activity.",
    "Automated data ingestion with Python, reducing manual processing time by 80%.",
    "Built SQL pipelines to ingest, clean, and store structured datasets, ensuring reliable analytics each sprint.",
  ]},
];
const sections = [["Professional Experience", "professional"], ["Education", "education"], ["Leadership", "leadership"], ["Awards & Hackathons", "awards"], ["Teaching & Mentorship", "mentorship"]];
export default function ExperiencePage() { return <main id="main" className="page-content interior-page experience-page">
  <div className="page-heading"><h1>Experience</h1><p>Software engineering experience, education, leadership, and mentorship.</p></div>
  <nav className="experience-index" aria-label="Experience sections">{sections.map(([label,id])=><a href={`#${id}`} key={id}>{label}</a>)}</nav>
  <section id="professional" className="career-section"><h2>Professional Experience</h2>{jobs.map(job=><article className="career-entry" key={job.organization}>
    <div className="career-entry-heading"><div><h3>Software Engineer Intern</h3><p className="career-organization">{job.organization}</p><p className="career-location">{job.location}</p></div><p className="career-date">{job.dates}</p></div>
    <ul className="career-bullets">{job.bullets.map(bullet=><li key={bullet}>{bullet}</li>)}</ul>
  </article>)}</section>
  <section id="education" className="career-section"><h2>Education</h2><article className="career-entry">
    <div className="career-entry-heading"><div><h3>James Madison University</h3><p className="career-organization">B.S. Computer Science · Honors College</p><p className="career-location">Harrisonburg, VA · GPA 3.48</p></div><p className="career-date">August 2024 – May 2028</p></div>
    <h4>Relevant coursework</h4><p className="career-detail">Discrete Structures I &amp; II, Calculus II, Algorithms and Data Structures, Software Engineering, Computer Systems I, Computer Systems II (in progress), Applied Algorithms (in progress), and Machine Learning (in progress).</p>
  </article></section>
  <section id="leadership" className="career-section"><h2>Leadership</h2>
    <article className="career-entry"><h3>Eagle Scout</h3><p className="career-detail">Earned Scouting’s highest rank after 8+ years of leadership and led teams of 10–75 during projects and expeditions.</p></article>
    <article className="career-entry"><div className="career-entry-heading"><div><h3>JMU Men’s Rugby Club</h3><p className="career-organization">Marketing Chair · Active player</p></div><p className="career-date">May 2026 – May 2027</p></div><p className="career-detail">Responsible for the club’s digital presence and marketing while balancing competitive athletics with a full academic workload.</p></article>
  </section>
  <section id="awards" className="career-section"><h2>Awards &amp; Hackathons</h2><article className="career-entry"><div className="career-entry-heading"><div><h3>Best First Time Hack</h3><p className="career-organization">Thaw · HooHacks 2026</p></div><p className="career-date">2026</p></div><p className="career-detail">Built an AI-powered platform matching startups with investors and partners in a 3-person team. Led backend development with Supabase and implemented Gemini-powered matching, structured responses, and agentic workflows under hackathon time constraints.</p></article></section>
  <section id="mentorship" className="career-section"><h2>Teaching &amp; Mentorship</h2><article className="career-entry"><div className="career-entry-heading"><div><h3>CS Ambassador</h3><p className="career-organization">JMU Computer Science Department</p></div><p className="career-date">Fall 2025</p></div><p className="career-detail">Selected to represent the Computer Science department at university events, open houses, and prospective student visits.</p><ul className="career-bullets"><li>Mentored incoming CS majors on course selection and career paths.</li><li>Organized and led departmental events and campus tours.</li><li>Served as liaison between students and faculty.</li></ul></article></section>
  <MagneticActions label="Experience actions" className="page-followup"><MagneticLink href="/resume">View Resume</MagneticLink></MagneticActions>
</main>; }
