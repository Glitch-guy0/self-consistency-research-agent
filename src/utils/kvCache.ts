import type { KVCache } from "#src/types/kvCache.ts";

/**
 * Shared in-memory key-value cache backed by a plain JS object.
 *
 * Exists as the single shared store for the entire application — agent
 * notebooks (via `NoteToolAdapter`) and conversation sessions (via
 * `SessionAdapter`) all read/write the same cache instance. Using a plain
 * object rather than a `Map` keeps the implementation maximally simple and
 * matches the architecture decision to defer Redis to post-v1.
 *
 * Values are stored and returned **by reference**. This is intentional:
 * consumers like `SessionAdapter` mutate session objects in-place, and
 * the KVCache should not interfere with that pattern.
 *
 * @example
 * ```ts
 * import { kvCache } from "#src/utils/kvCache.ts";
 *
 * kvCache.set("session-A", { notebook: [], session: {} });
 * const data = kvCache.get("session-A");
 * // data => { notebook: [], session: {} }
 * ```
 */
export class KVCacheImpl implements KVCache {
  private readonly store: Record<string, unknown> = Object.create(null);

  /** @param key — string key. @param value — any value (not undefined). */
  set(key: string, value: unknown): void {
    this.store[key] = value;
  }

  /**
   * Returns the value stored under `key`, or `undefined` if absent.
   *
   * @example
   * ```ts
   * kvCache.set("k", 42);
   * kvCache.get("k"); // 42
   * kvCache.get("missing"); // undefined
   * ```
   */
  get(key: string): unknown | undefined {
    return this.store[key];
  }

  /** Removes the entry under `key`. No-op if key does not exist. */
  delete(key: string): void {
    delete this.store[key];
  }

  /** Removes all entries from the cache. */
  clear(): void {
    for (const key of Object.keys(this.store)) {
      delete this.store[key];
    }
  }
}

/** Singleton instance shared across the application. */
export const kvCache: Readonly<KVCache> = Object.freeze(new KVCacheImpl());
