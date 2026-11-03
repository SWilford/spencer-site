import { createHash } from "node:crypto";
import type { RankingKind } from "./music-stats";

/** Stable catalog references, including unmatched items; never expose source event identities. */
export function musicEntityKey(kind: RankingKind, id: string) {
  const track = (value: string) => /^[A-Za-z0-9]{22}$/.test(value) ? `spotify:track:${value}` : value;
  const canonical = kind === "tracks" ? track(id) : kind === "albums" && id.startsWith("unknown:") ? `unknown:${track(id.slice(8))}` : id;
  return createHash("sha256").update(`${kind}\0${canonical}`).digest("hex");
}
