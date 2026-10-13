import { MagneticActions } from "@/components/magnetic-link";
import { AnimatedName } from "@/components/animated-name";
import { profile } from "@/content/profile";
import { TypedText } from "@/components/typed-text";
export default function Home() {
  return <main id="main" className="page-content home-page">
    <section className="hero" aria-label="Introduction">
      <AnimatedName />
      <p className="hero-credentials"><TypedText text={profile.credentials} delay={850}/></p>
      <p className="hero-summary"><TypedText text={profile.introduction} delay={2300} interval={12}/></p>
      <MagneticActions />
    </section>
  </main>;
}
