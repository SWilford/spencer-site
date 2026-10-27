// Runs in the trusted build, never in the browser. No Spotify calls.
import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { hostedMusicDirectory } from "../../src/lib/hosted-music-data.ts";
if (process.env.MUSIC_SITE_READ_KEY && process.env.MUSIC_HISTORY_MANIFEST) {
  const source = await hostedMusicDirectory();
  const destination = path.resolve("private-data/music/site-bundle");
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });
  await writeFile(path.join(destination, "manifest.json"), process.env.MUSIC_HISTORY_MANIFEST, { mode: 0o600 });
  console.log("Verified private music read copy prepared for server functions.");
} else console.log("No hosted music credentials for this build; portfolio build continues.");
