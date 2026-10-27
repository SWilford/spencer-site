// Defense in depth behind Vercel's CDN/WAF, scoped to one function instance.
// This never touches Spotify's quota, credentials, leases or retry state.
export function createMusicRequestLimit(now = () => Date.now()) {
  const clients = new Map<string, { until: number; requests: number }>();
  let total = { until: 0, requests: 0 };
  return (client: string) => {
    const time = now();
    if (total.until <= time) total = { until: time + 60000, requests: 0 };
    if (++total.requests > 240) return false;
    let entry = clients.get(client);
    if (!entry || entry.until <= time) {
      if (clients.size >= 2048) clients.delete(clients.keys().next().value!);
      entry = { until: time + 60000, requests: 0 }; clients.set(client, entry);
    }
    return ++entry.requests <= 60;
  };
}
