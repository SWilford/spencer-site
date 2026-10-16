import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const directory = new URL("../../private-data/music/spotify/", import.meta.url);
const audit = JSON.parse(await readFile(new URL("spotify-import-audit.json", directory), "utf8"));
const receipt = new URL("archive-upload.json", directory);
let previous;
try { previous = JSON.parse(await readFile(receipt, "utf8")); } catch (e) { if (e.code !== "ENOENT") throw e; }
if (previous?.sha256 === audit.archive_sha) { console.log("Private archive backup already recorded."); process.exit(0); }
const bytes = await readFile(new URL(`${audit.archive_sha}.zip`, directory));
if (bytes.length > 50 * 1024 * 1024 || createHash("sha256").update(bytes).digest("hex") !== audit.archive_sha) throw new Error("Archive checksum/size changed");
const config = JSON.parse(await readFile(new URL("../collector-bootstrap.json", directory), "utf8"));
const response = await fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect?action=archive-upload&sha=${audit.archive_sha}`, {
  method: "POST", redirect: "error", signal: AbortSignal.timeout(90000), headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/zip" }, body: bytes,
});
if (!response.ok) throw new Error(`Private backup HTTP ${response.status}`);
const result = await response.json();
if (!result.stored || result.sha256 !== audit.archive_sha || result.bytes !== bytes.length) throw new Error("Backup receipt mismatch");
await writeFile(receipt, JSON.stringify(result));
console.log(JSON.stringify({ private_backup: true, checksum_verified: true, bytes: result.bytes }));
