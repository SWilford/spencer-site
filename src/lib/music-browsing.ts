/** Presentation boundary only. Lifetime analytics retain the entire archive. */
export const MUSIC_BROWSE_START = "2021-01-01";
export function permitsMusicBrowsing(preset: string, dates: (string | null)[]) {
  return preset === "lifetime" || dates.every(date => !date || date >= MUSIC_BROWSE_START);
}
