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
    description:"A production website and protected content dashboard for the team, with roster, schedule, and media management. Explore a preserved copy of my frontend, connected to the current public content.",
    stack:["React", "Supabase", "Cloudflare R2"], href:"https://www.jmumensrugby.com", source:"https://github.com/SWilford/jmu-rugby-site", status:"Live public data", demo:"/demos/rugby/index.html" },
  { id:"thaw", title:"THAW", category:"HooHacks 2026 · Best First Time Hack",
    description:"An AI-powered platform for matching startups, investors, and partners. The original service is offline; this restored demo preserves the interface and matching engine with the team's sample profiles.",
    stack:["Next.js", "React", "Supabase", "Auth0", "Gemini"], href:null, source:"https://github.com/sambriggs262/thaw", status:"Restored demo · Sample data", demo:"/demos/thaw/index.html" },
  { id:"inception", title:"Spencer Site — Inception", category:"Interactive portfolio",
    description:"The site you're on, inside the site you're on. Play with the same letter animations, geometry, and navigation, then visit Projects inside the preview to go another level deeper.",
    stack:["Next.js", "TypeScript", "Canvas", "Supabase"], href:null, source:"https://github.com/SWilford/spencer-site", status:"Three levels deep", demo:"/demos/inception/index.html?depth=1" },
];
