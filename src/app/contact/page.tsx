import { pageMetadata } from "@/lib/site-metadata";
import Link from "next/link";
import { MagneticActions, MagneticLink } from "@/components/magnetic-link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr/GithubLogo";
import { LinkedinLogo } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import { profile } from "@/content/profile";
export const metadata = pageMetadata('Contact', 'Contact Spencer Wilford by email, LinkedIn, or GitHub.', "/contact", true);
const channels = [
  {title:"Email",label:profile.email,href:`mailto:${profile.email}`,Icon:EnvelopeSimple},
  {title:"LinkedIn",label:"linkedin.com/in/spencerwilford",href:profile.linkedin,Icon:LinkedinLogo},
  {title:"GitHub",label:"github.com/SWilford",href:profile.github,Icon:GithubLogo},
];
export default function ContactPage() { return <main id="main" className="page-content interior-page contact-page">
  <div className="page-heading"><h1>Contact</h1><p>Reach out about software engineering opportunities, projects, or collaborations.</p></div>
  <div className="contact-layout"><div className="contact-channels">{channels.map(({title,label,href,Icon})=><a key={title} className="contact-channel" href={href} {...(title!=="Email"?{target:"_blank",rel:"noreferrer"}:{})}>
    <Icon size={29} weight="regular" aria-hidden="true"/><div><h2>{title}</h2><p>{label}</p></div><ArrowUpRight className="channel-arrow" size={20} aria-hidden="true"/>
  </a>)}</div>
  <div className="contact-sidebar"><nav className="contact-quick-links" aria-label="Quick links"><h2>Quick Links</h2>{[["View Projects","/projects"],["See Experience","/experience"],["View Resume","/resume"]].map(([label,href])=><Link href={href} key={href}>{label}<ArrowUpRight size={18} aria-hidden="true"/></Link>)}</nav>
    <section className="contact-opportunities"><h2>Software engineering &amp; collaboration</h2><p>My interests include full-stack development, national security and defense, systems engineering, software architecture, and applied AI and machine learning.</p><MagneticActions label="Contact actions" className="contact-action"><MagneticLink href={`mailto:${profile.email}`}>Get in Touch</MagneticLink></MagneticActions></section>
  </div></div>
</main>; }
