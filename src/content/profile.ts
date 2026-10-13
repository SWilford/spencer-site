export const profile = {
  name: "Spencer Wilford",
  email: "sawilford2006@gmail.com",
  github: "https://github.com/SWilford",
  linkedin: "https://www.linkedin.com/in/spencerwilford",
  credentials: "CS @ JMU | Prev. SWE at NSWCDD, NGA",
  introduction: "I've worked in software engineering at NSWCDD and NGA, and helped build a hackathon-winning project at HooHacks 2026. At JMU, I’m a CS ambassador and play men’s rugby. I’m also an Eagle Scout. I’m interested in full-stack development, national security and defense, systems engineering, software architecture, and applying AI and machine learning to practical problems.",
};
export const projects = [
  {
    title: "JMU Men's Rugby",
    category: "Full-stack web platform",
    description: "A production website and protected content dashboard for the team, with live roster, schedule, and media management.",
    stack: ["React", "Supabase", "Cloudflare R2"],
    href: "https://www.jmumensrugby.com",
    linkLabel: "Visit website",
    visual: "rugby",
  },
  {
    title: "Byte-Builder",
    category: "Logic gate simulator",
    description: "A Java circuit sandbox built with two teammates to design, connect, and simulate logic components.",
    stack: ["Java", "Data structures", "Interactive GUI"],
    href: "https://github.com/SWilford/Byte-Builder",
    linkLabel: "View repository",
    visual: "circuits",
  },
  {
    title: "Thaw",
    category: "AI startup matching",
    description: "An AI-powered matching platform for startups, investors, and partners. Built at HooHacks 2026 and awarded Best First Time Hack.",
    stack: ["React", "Supabase", "Gemini"],
    href: null,
    linkLabel: null,
    visual: "thaw",
  },
];
