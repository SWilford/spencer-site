import Link from "next/link";
import { AnimatedName } from "@/components/animated-name";
import { profile } from "@/content/profile";
export default function Home() {
  return <main id="main" className="page-content home-page">
    <section className="hero" aria-label="Introduction">
      <AnimatedName />
      <p className="hero-description">{profile.introduction}</p>
      <Link className="text-link hero-link" href="/experience">View experience</Link>
    </section>
  </main>;
}
