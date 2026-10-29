/** Read-only hosted snapshots. This module has no collector credentials or local-file access. */
export const hostedMusicEnabled = () => Boolean(process.env.MUSIC_SITE_READ_KEY);

export function musicDataUrl() {
  const project = process.env.MUSIC_SUPABASE_PROJECT_ID;
  if (!project || !/^[a-z]{20}$/.test(project)) throw new Error("Music data project is not configured");
  return `https://${project}.supabase.co/functions/v1/music-site-data`;
}

export async function fetchSavedMusic() {
  const response = await fetch(musicDataUrl(), { headers: { Authorization: `Bearer ${process.env.MUSIC_SITE_READ_KEY}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("Saved music unavailable");
  return response.json();
}
