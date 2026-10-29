import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import thawTailwind from "tailwindcss-thaw";
import thawLoadConfig from "tailwindcss-thaw/loadConfig.js";
import autoprefixer from "autoprefixer";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.dirname(here), work = path.join(root, "work"), out = path.join(root, "public/demos");
const dependencies = JSON.parse(await readFile(path.join(here, "package.json"), "utf8")).dependencies;
const aliases = Object.fromEntries(Object.keys(dependencies).filter(name => name !== "vite").map(name => [name, path.join(here, "node_modules", name)]));
function output(name) {
    if (!['rugby', 'thaw', 'inception'].includes(name))
        throw Error('Unknown generated showcase');
    const target = path.resolve(out, name), allowed = path.resolve(root, 'public/demos') + path.sep;
    if (!target.startsWith(allowed))
        throw Error('Showcase output escaped its generated directory');
    return target;
}
const originals = { rugby: process.env.RUGBY_SHOWCASE_SOURCE || path.join(work, "rugby-source"), thaw: path.join(work, "thaw-source") };
const pins = { rugby: "49d7bc8c739490d9c97aad39aed123103f0ff0a7", thaw: "d0cb7fa468f7d1786927c6e63417645df65eb95c" };
async function source(name) {
    const dest = path.join(work, `showcase-${name}`);
    await mkdir(dest, { recursive: true });
    const actual = execFileSync("git", ["rev-parse", "HEAD"], { cwd: originals[name], encoding: "utf8" }).trim();
    if (actual !== pins[name])
        throw Error(`Unexpected ${name} source revision`);
    const files = execFileSync("git", ["ls-tree", "-r", "--name-only", "HEAD"], { cwd: originals[name], encoding: "utf8" }).trim().split("\n");
    for (const file of files) {
        if (!/^(src\/|public\/|app\/|components\/|lib\/|types\/|tailwind.config|index.html)/.test(file))
            continue;
        if (/(^|\/)(Admin|admin)(\/|\.)/.test(file) || file.startsWith("src/components/Admin/"))
            continue;
        const target = path.join(dest, file);
        if (!target.startsWith(dest + path.sep))
            throw Error("Invalid source path");
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, execFileSync("git", ["show", `HEAD:${file}`], { cwd: originals[name], maxBuffer: 50 * 1024 * 1024 }));
    }
    return dest;
}
async function copyPortfolioFonts(destination, base) {
    const chunks = path.join(root, ".next/static/chunks");
    let fonts = "";
    for (const file of await readdir(chunks)) {
        if (!file.endsWith(".css"))
            continue;
        const css = await readFile(path.join(chunks, file), "utf8");
        for (const face of css.match(/@font-face\{[^}]+\}/g) || []) {
            let updated = face;
            for (const match of face.matchAll(/url\(([^)]+\.woff2)\)/g)) {
                const name = match[1].replaceAll('"', '').split('/').pop();
                await mkdir(path.join(destination, "public/fonts"), { recursive: true });
                await cp(path.join(root, ".next/static/media", name), path.join(destination, "public/fonts", name));
                updated = updated.replaceAll(match[1], `${base}/fonts/${name}`);
            }
            fonts += updated;
        }
    }
    await writeFile(path.join(destination, "fonts.css"), fonts);
}
const rugby = await source("rugby");
let app = await readFile(path.join(rugby, "src/App.jsx"), "utf8");
app = app.replace(/^const Admin =.*\r?\n/gm, "").replace(/<Route path="\/admin" element=\{<Admin \/>\} \/>/g, "");
await writeFile(path.join(rugby, "src/App.jsx"), app);
let nav = await readFile(path.join(rugby, "src/components/Navbar.jsx"), "utf8");
nav = nav.replace(/<NavLink\s+to="\/admin"[\s\S]*?<\/NavLink>/g, "");
await writeFile(path.join(rugby, "src/components/Navbar.jsx"), nav);
let main = await readFile(path.join(rugby, "src/main.jsx"), "utf8");
await writeFile(path.join(rugby, "src/main.jsx"), main.replaceAll("BrowserRouter", "HashRouter"));
const config = JSON.parse(await readFile(path.join(work, "rugby-public-config.json"), "utf8"));
if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(config.url))
    throw Error("Invalid public database origin");
if (!config.anonKey.startsWith("sb_publishable_")) {
    const claims = JSON.parse(Buffer.from(config.anonKey.split(".")[1], "base64url"));
    if (claims.role !== "anon")
        throw Error("Only an anonymous browser key is allowed");
}
await cp(path.join(here, "read-only-fetch.mjs"), path.join(rugby, "src/lib/showcase-read-only.js"));
await cp(path.join(here, "adapters/rugby-client.js"), path.join(rugby, "src/lib/supabaseClient.js"));
// Absolute public assets must stay inside the clone rather than targeting the portfolio root.
async function rewriteAssets(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory())
        await rewriteAssets(file);
    else if (/\.(jsx?|css|html)$/.test(file)) {
        const text = await readFile(file, "utf8");
        await writeFile(file, text.replace(/(["'(])\/(fonts\/|videos\/|images\/|favicon|apple-touch|site.webmanifest|purplelogo)/g, "$1/demos/rugby/$2"));
    }
} }
await rewriteAssets(path.join(rugby, "src"));
await rewriteAssets(path.join(rugby, "public"));
let html = await readFile(path.join(rugby, "index.html"), "utf8");
html = html.replace(/(["'(])\/(fonts\/|videos\/|images\/|favicon|apple-touch|site.webmanifest|purplelogo)/g, "$1/demos/rugby/$2");
html = html.replace(/<link[^>]*(?:rel="manifest"|rel="canonical")[^>]*>/g, "").replace("<head>", '<head><meta name="robots" content="noindex,nofollow">');
await writeFile(path.join(rugby, "index.html"), html);
await build({ configFile: false, root: rugby, base: "/demos/rugby/", plugins: [react(), tailwind()], resolve: { dedupe: ["react", "react-dom"], alias: { ...aliases, react: path.join(here, "node_modules/react"), "react-dom": path.join(here, "node_modules/react-dom") } }, define: { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(config.url), "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(config.anonKey), "import.meta.env.VITE_R2_PUBLIC_BASE_URL": JSON.stringify(config.media) }, build: { outDir: output("rugby"), emptyOutDir: true, sourcemap: false } });
const thaw = await source("thaw");
let typing = await readFile(path.join(thaw, "components/ui/typing-headline.tsx"), "utf8");
typing = typing.replace('import { motion }', 'import { motion, useReducedMotion }').replace('export function TypingHeadline() {', 'export function TypingHeadline() {\n  const reduced=useReducedMotion();').replace('    const currentPhrase =', '    if(reduced) return;\n    const currentPhrase =').replace('[isDeleting, phraseIndex, visibleCount]', '[reduced, isDeleting, phraseIndex, visibleCount]').replace('animate={{ opacity: [1, 0] }}', 'animate={reduced ? {opacity:1} : { opacity: [1, 0] }}');
await writeFile(path.join(thaw, "components/ui/typing-headline.tsx"), typing);
let reveal = await readFile(path.join(thaw, "components/ui/reveal.tsx"), "utf8");
reveal = reveal.replace('motion, type Variants', 'motion, useReducedMotion, type Variants').replace('  return (', '  const reduced=useReducedMotion();\n  return (').replace('initial="hidden"', 'initial={reduced ? false : "hidden"}');
await writeFile(path.join(thaw, "components/ui/reveal.tsx"), reveal);
let landing = await readFile(path.join(thaw, "app/page.tsx"), "utf8");
landing = landing.replace('import { getOptionalSessionUser } from "@/lib/auth/session";', "").replace("export default async function LandingPage()", "export default function LandingPage()").replace("const user = await getOptionalSessionUser();", "const user = { name: 'Demo visitor' };").replaceAll('href={plan.href}', 'href="#/matches"').replaceAll('"/dashboard"', '"#/dashboard"');
await writeFile(path.join(thaw, "app/page.tsx"), landing);
for (const file of ["main.tsx", "next-link.tsx", "next-image.tsx", "save-match-button.tsx"]) {
    const target = file === "save-match-button.tsx" ? path.join(thaw, "components/matches", file) : path.join(thaw, file);
    await cp(path.join(here, "adapters/thaw", file), target);
}
await writeFile(path.join(thaw, "index.html"), '<!doctype html><html lang="en" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>THAW · Restored demo</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
await copyPortfolioFonts(thaw, "/demos/thaw");
await cp(path.join(here, "fonts/space-grotesk-latin.woff2"), path.join(thaw, "public/fonts/space-grotesk-latin.woff2"));
await cp(path.join(here, "fonts/SpaceGrotesk-OFL.txt"), path.join(thaw, "public/fonts/SpaceGrotesk-OFL.txt"));
await writeFile(path.join(thaw, "fonts.css"), (await readFile(path.join(thaw, "fonts.css"), "utf8")) + '\n@font-face{font-family:"Space Grotesk";font-style:normal;font-weight:400 700;font-display:swap;src:url(/demos/thaw/fonts/space-grotesk-latin.woff2) format("woff2")}\n:root{--font-manrope:Manrope,sans-serif;--font-space-grotesk:"Space Grotesk",sans-serif}body{font-family:var(--font-manrope)}');
await build({ configFile: false, root: thaw, base: "/demos/thaw/", plugins: [react()], resolve: { alias: { ...aliases, "@": thaw, "next/link": path.join(thaw, "next-link.tsx"), "next/image": path.join(thaw, "next-image.tsx"), react: path.join(here, "node_modules/react"), "react-dom": path.join(here, "node_modules/react-dom") } }, css: { postcss: { plugins: [thawTailwind({ ...thawLoadConfig(path.join(thaw, "tailwind.config.ts")), content: [`${thaw.replaceAll("\\", "/")}/app/**/*.{ts,tsx}`, `${thaw.replaceAll("\\", "/")}/components/**/*.{ts,tsx}`, `${thaw.replaceAll("\\", "/")}/*.tsx`] }), autoprefixer()] } }, build: { outDir: output("thaw"), emptyOutDir: true, sourcemap: false } });
await writeFile(path.join(out, "provenance.json"), JSON.stringify({ rugby: { repo: "SWilford/jmu-rugby-site", commit: pins.rugby }, thaw: { repo: "sambriggs262/thaw", commit: pins.thaw }, inception: { repo: "SWilford/spencer-site", mode: "full live website in a same-origin iframe" } }, null, 2));
console.log("Showcases built. Rugby uses anonymous public reads; THAW is local sample data; no live AI or outreach.");
