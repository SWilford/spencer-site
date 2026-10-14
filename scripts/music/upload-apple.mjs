import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const config = JSON.parse(await readFile(new URL("../../private-data/music/collector-bootstrap.json", import.meta.url), "utf8"));
const audit = JSON.parse(await readFile(new URL("../../private-data/music/apple/apple-audit.json", import.meta.url), "utf8"));
const bytes = await readFile(new URL(`../../private-data/music/apple/${audit.archive_sha256}.zip`, import.meta.url));
if (createHash("sha256").update(bytes).digest("hex") !== audit.archive_sha256) throw new Error("Local archive checksum changed.");
const response = await fetch(`https://${config.project_id}.supabase.co/functions/v1/spotify-collect?action=archive-upload&sha=${audit.archive_sha256}`, {
  method: "POST", redirect: "error", signal: AbortSignal.timeout(90_000),
  headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/zip" }, body: bytes,
});
if (!response.ok) throw new Error(`Private archive upload failed (HTTP ${response.status}).`);
const result = await response.json();
if (result.sha256 !== audit.archive_sha256 || result.bytes !== bytes.length) throw new Error("Upload verification failed.");
console.log(JSON.stringify({ stored: true, bytes: result.bytes, private: true, checksum_verified: true }));
