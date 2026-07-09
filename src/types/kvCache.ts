/**
 * Key-Value cache interface for shared in-memory storage.
 *
 * Provides basic CRUD operations backed by a plain JS object. The cache is
 * shared across the entire application — `NoteToolAdapter` and `SessionAdapter`
 * both receive the same instance so agent notebooks and conversation sessions
 * live in a single store.
 *
 * Values are stored and returned **by reference** — callers that mutate a
 * retrieved value are mutating the cache itself. This is intentional: session
 * scopes and notebook arrays are updated in-place by their consumers.
 *
 * @example
 * ```ts
 * import { kvCache } from "#src/utils/kvCache.ts";
 *
 * kvCache.set("session-1", { notebook: [] });
 * const session = kvCache.get("session-1");
 * // session => { notebook: [] }
 * kvCache.delete("session-1");
 * kvCache.get("session-1"); // undefined
 * ```
 */
export interface KVCache {
  /**
   * Stores `value` under `key`. Overwrites any existing entry.
   *
   * @example
   * ```ts
   * kvCache.set("session-1", { notebook: [] });
   * ```
   */
  set(key: string, value: unknown): void;

  /**
   * Returns the value stored under `key`, or `undefined` if absent.
   *
   * @example
   * ```ts
   * const data = kvCache.get("session-1");
   * // data => { notebook: [] } or undefined
   * ```
   */
  get(key: string): unknown | undefined;

  /**
   * Removes the entry under `key`. No-op if key does not exist.
   *
   * @example
   * ```ts
   * kvCache.delete("session-1");
   * kvCache.get("session-1"); // undefined
   * ```
   */
  delete(key: string): void;

  /**
   * Removes **all** entries from the cache.
   *
   * @example
   * ```ts
   * kvCache.clear();
   * kvCache.get("any-key"); // undefined
   * ```
   */
  clear(): void;
}
