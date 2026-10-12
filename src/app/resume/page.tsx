import Link from "next/link";
import { profile } from "@/content/profile";
import { PrintButton } from "@/components/print-button";
export const metadata = { title: "Résumé · Spencer Wilford" };
export default function ResumePage() {
  return <main id="main" className="resume-page">
    <Link className="text-link" href="/">Back home</Link>
    <div className="resume-page-heading"><h1>Spencer Wilford</h1><PrintButton /></div>
    <p><a href={`mailto:${profile.email}`}>{profile.email}</a> · <a href={profile.linkedin}>LinkedIn</a> · <a href={profile.github}>GitHub</a></p>
    <section><h2>Education</h2><h3>James Madison University</h3><p>B.S. Computer Science, minor in Computational Analytics · Honors College<br />August 2024 – May 2028 (expected)</p></section>
    <section><h2>Experience</h2><h3>Software Engineer Intern</h3><p>National Geospatial Intelligence Agency · June 2023 – August 2023</p><ul><li>Worked in Agile sprints with engineers and analysts using Jira.</li><li>Integrated REST API metrics tracking across internal dashboards.</li><li>Automated data ingestion with Python and built SQL pipelines to ingest, clean, and store structured datasets.</li></ul></section>
    <section><h2>Projects</h2><h3>JMU Men’s Rugby Web Platform</h3><p>Built a production React web platform with a protected CMS, Supabase authentication and Postgres data, and a Cloudflare R2 media pipeline.</p><h3>Thaw</h3><p>Built an AI-powered startup matching platform with React, Supabase, and Gemini. Awarded Best First Time Hack at HooHacks 2026.</p><h3>Byte-Builder</h3><p>Collaborated with two peers on a Java logic gate simulator and interactive circuit sandbox.</p></section>
    <section><h2>Leadership</h2><p>Eagle Scout · James Madison University Men’s Rugby Club player and Marketing Chair (May 2026 – May 2027).</p></section>
    <section><h2>Technical skills</h2><p>Java, Python, JavaScript, SQL, C, C++ · React, Next.js, PostgreSQL, Supabase · Git, GitHub Actions, Linux · Agile/Scrum, data structures, algorithms, OOP, system design.</p></section>
    <p className="content-note">Web summary based on the résumé you supplied. Use your browser’s Print command to save a PDF.</p>
  </main>;
}
