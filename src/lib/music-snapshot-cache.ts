import type { MusicSnapshot } from "./music-stats";

// A remote freshness check must not delay displaying an already saved snapshot.
// Concurrent visitors share one refresh, and failures retain the last good data.
export class MusicSnapshotCache {
  private value?: MusicSnapshot;
  private initializing?: Promise<void>;
  private pending?: Promise<void>;
  private retryAt = 0;
  constructor(private load: () => Promise<MusicSnapshot | undefined>, private fetchFresh: () => Promise<MusicSnapshot>, private save: (snapshot: MusicSnapshot) => Promise<void>, private now = Date.now) {}
  async get() {
    if (!this.value) {
      this.initializing ??= this.load().then(value => { this.value ??= value; });
      await this.initializing;
      if (!this.value) await this.refresh();
    }
    if (!this.value) throw new Error("No saved music snapshot is available");
    return this.value;
  }
  refresh(): Promise<void> {
    if (this.pending) return this.pending;
    if (this.now() < this.retryAt) return Promise.resolve();
    this.retryAt = this.now() + 60000;
    this.pending = (async () => {
      try {
        const value = await this.fetchFresh();
        this.value = value;
        await this.save(value);
      } catch (error) {
        if (!this.value) throw error;
      } finally { this.pending = undefined; }
    })();
    return this.pending;
  }
}
