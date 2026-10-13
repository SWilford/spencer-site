import Link from "next/link";
import { AnimatedName } from "@/components/animated-name";
import { profile } from "@/content/profile";
import { TypedText } from "@/components/typed-text";
export default function Home() {
  return <main id="main" className="page-content home-page">
    <section className="hero" aria-label="Introduction">
      <AnimatedName />
      <p className="hero-description"><TypedText text={profile.introduction} delay={850}/></p>
      <Link className="text-link hero-link" href="/experience"><TypedText text="View experience" delay={1600}/></Link>
    </section>
  </main>;
}
