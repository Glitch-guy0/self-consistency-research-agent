import type { ISessionPort } from "#lib/interface/iSessionPort.interface.ts";
import type { KVCache } from "#lib/types/kvCache.type.ts";

/**
 * Adapter that implements `ISessionPort` using a shared `KVCache` instance.
 *
 * Sessions are stored directly under their `id` as the KVCache key. The
 * orchestrator is responsible for choosing unique session IDs (e.g.,
 * `"conv-session"`, `"agent-session-1"`, `"val-session"`).
 *
 * @example
 * ```ts
 * import { kvCache } from "#lib/utils/kvCache.util.ts";
 * import { SessionAdapter } from "#lib/session/sessionAdapter.provider.ts";
 *
 * const sessions = new SessionAdapter(kvCache);
 * sessions.init("conv-session");
 * sessions.set("conv-session", { messages: [] });
 * const data = sessions.get("conv-session");
 * sessions.delete("conv-session");
 * ```
 */
export class SessionAdapter implements ISessionPort {
  /**
   * @param cache — the shared KVCache instance
   */
  constructor(private readonly cache: KVCache) {}

  /** @inheritdoc */
  init(id: string): void {
    if (this.cache.get(id) === undefined) {
      this.cache.set(id, {});
    }
  }

  /** @inheritdoc */
  get(id: string): unknown | undefined {
    return this.cache.get(id);
  }

  /** @inheritdoc */
  set(id: string, data: unknown): void {
    this.cache.set(id, data);
  }

  /** @inheritdoc */
  delete(id: string): void {
    this.cache.delete(id);
  }
}
