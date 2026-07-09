import type { INoteToolPort } from "#lib/interface/iNoteToolPort.interface.ts";
import type { KVCache } from "#lib/types/kvCache.type.ts";

/**
 * Adapter that implements `INoteToolPort` using a shared `KVCache` instance
 * with session-scoped key prefixes.
 *
 * Each instance is constructed with a unique `sessionPrefix` (e.g.,
 * `"agent-session-1"`) so that notebooks across agent sessions are fully
 * isolated — data saved under one prefix is invisible to another.
 *
 * @example
 * ```ts
 * import { kvCache } from "#lib/utils/kvCache.util.ts";
 * import { NoteToolAdapter } from "#lib/providers/noteToolAdapter.provider.ts";
 *
 * const adapter = new NoteToolAdapter(kvCache, "agent-session-1");
 * adapter.save("step-1", { thought: "analyzing query..." });
 * const data = adapter.read("step-1");
 * ```
 */
export class NoteToolAdapter implements INoteToolPort {
  /**
   * @param cache          — the shared KVCache instance
   * @param sessionPrefix  — unique prefix for this agent session (e.g., `"agent-session-1"`)
   */
  constructor(
    private readonly cache: KVCache,
    private readonly sessionPrefix: string,
  ) {}

  /** @inheritdoc */
  save(key: string, value: unknown): void {
    this.cache.set(`${this.sessionPrefix}:${key}`, value);
  }

  /** @inheritdoc */
  read(key: string): unknown | undefined {
    return this.cache.get(`${this.sessionPrefix}:${key}`);
  }
}
