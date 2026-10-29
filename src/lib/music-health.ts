type HealthState = "ok" | "stale" | "unavailable";

/** A collection run counts even when no songs were played. Never use the latest play time. */
export function createMusicHealthCheck(load: () => Promise<unknown>, now = () => Date.now()) {
  let lastCollection: number | undefined;
  let refreshAt = 0;
  let pending: Promise<void> | undefined;
  return async (): Promise<{ status: HealthState }> => {
    if (now() >= refreshAt) {
      pending ??= (async () => {
        try {
          const value = await load();
          const date = value && typeof value === "object" && "lastCollection" in value ? value.lastCollection : undefined;
          lastCollection = typeof date === "string" ? Date.parse(date) : undefined;
          refreshAt = now() + 60000;
        } catch {
          lastCollection = undefined;
          refreshAt = now() + 10000;
        }
      })().finally(() => { pending = undefined; });
      await pending;
    }
    if (lastCollection === undefined || !Number.isFinite(lastCollection) || lastCollection > now() + 60000) return { status: "unavailable" };
    return { status: now() - lastCollection > 30 * 60000 ? "stale" : "ok" };
  };
}
