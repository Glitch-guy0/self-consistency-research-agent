import type { INoteToolPort } from "#src/interface/INoteToolPort.ts";
import type { KVCache } from "#src/types/kvCache.ts";

export class NoteToolAdapter implements INoteToolPort {
  constructor(
    private readonly cache: KVCache,
    private readonly sessionPrefix: string,
  ) {}

  save(key: string, value: unknown): void {
    this.cache.set(`${this.sessionPrefix}:${key}`, value);
  }

  read(key: string): unknown | undefined {
    return this.cache.get(`${this.sessionPrefix}:${key}`);
  }
}
