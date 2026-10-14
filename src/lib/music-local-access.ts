/** The initial real-data dashboard is available only on an explicitly enabled local server. */
export function canReadLocalMusic(headers: Headers, enabled: boolean, hosted: boolean) {
  if (!enabled || hosted) return false;
  const host = headers.get("host") ?? "";
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) return false;
  // Next.js supplies these headers itself; reject mismatches and non-loopback hops.
  if (headers.has("forwarded")) return false;
  if (headers.has("x-forwarded-host") && headers.get("x-forwarded-host") !== host) return false;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(forwardedFor)) return false;
  const origin = headers.get("origin");
  if (origin && origin !== `http://${host}` && origin !== `https://${host}`) return false;
  const site = headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}
