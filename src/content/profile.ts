export const profile = {
  name: "Spencer Wilford",
  email: "sawilford2006@gmail.com",
  github: "https://github.com/SWilford",
  linkedin: "https://www.linkedin.com/in/spencerwilford",
  credentials: "CS @ JMU | Prev. SWE at NSWCDD, NGA",
  introduction: "I've worked in software engineering at NSWCDD and NGA, and helped build a hackathon-winning project at HooHacks 2026. At JMU, I’m a CS ambassador and play men’s rugby. I’m also an Eagle Scout. I’m interested in full-stack development, national security and defense, systems engineering, software architecture, and applying AI and machine learning to practical problems.",
};
export const projects = [
  { id:"rugby", title:"JMU Men's Rugby", category:"Full-stack web platform",
    description:"I built the public website and content management system for JMU Men's Rugby. Visitors can find match schedules, results, player and coach profiles, photos, and recruitment information. Behind the site, authenticated team administrators manage that content through a dashboard, with database access policies and signed media uploads keeping editing restricted to the team.",
    stack:["JavaScript", "React", "React Router", "Vite", "Tailwind CSS", "Framer Motion", "Supabase Postgres", "Supabase Auth", "Supabase Edge Functions", "TypeScript", "Deno", "SQL", "Cloudflare R2", "Vercel"], href:"https://www.jmumensrugby.com", source:"https://github.com/SWilford/jmu-rugby-site", preview:"/project-previews/rugby.png", demo:"/demos/rugby/index.html" },
  { id:"thaw", title:"THAW", category:"HooHacks 2026 · Best First Time Hack",
    description:"THAW matches startups, investors, and enterprise partners by what each company is looking for and can offer. Our three-person team built it at HooHacks 2026 and won Best First Time Hack. I led backend development with Supabase, implemented Gemini-powered matching, structured responses, and agentic workflows, and helped polish the interface. Users can explore ranked matches, understand the reasoning behind a match, and draft an introduction.",
    stack:["TypeScript", "React", "Next.js", "Node.js", "Tailwind CSS", "Framer Motion", "Supabase Postgres", "Supabase Storage", "Auth0", "Google Gemini API", "Zod", "SQL", "Vercel"], href:null, source:"https://github.com/sambriggs262/thaw", preview:"/project-previews/thaw.png", demo:"/demos/thaw/index.html" },
  { id:"inception", title:"Spencer Site", category:"Personal portfolio",
    description:"This website brings together my experience, projects, and personal interests. I built the animated geometric background and cursor collisions with Canvas, gave individual letters their own entrance animations, and added custom navigation transitions. Music Stats combines my Spotify and Apple listening-history imports with ongoing Spotify collection, turning saved playback data into time-filtered rankings, listening clocks, and graphs.",
    stack:["TypeScript", "JavaScript", "React", "Next.js", "CSS", "Tailwind CSS", "Canvas 2D", "Python", "SQLite", "SQL", "Supabase Postgres", "Supabase Storage", "Supabase Edge Functions", "Deno", "Spotify Web API", "Phosphor Icons", "Vercel"], href:null, source:"https://github.com/SWilford/spencer-site", preview:"/project-previews/portfolio.png", demo:"/" },
];
