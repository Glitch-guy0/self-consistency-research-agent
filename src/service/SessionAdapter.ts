import type { ISessionPort } from "#src/interface/ISessionPort.ts";
import type { KVCache } from "#src/types/kvCache.ts";

export class SessionAdapter implements ISessionPort {
  constructor(private readonly cache: KVCache) {}

  init(id: string): void {
    if (this.cache.get(id) === undefined) {
      this.cache.set(id, {});
    }
  }

  get(id: string): unknown | undefined {
    return this.cache.get(id);
  }

  set(id: string, data: unknown): void {
    this.cache.set(id, data);
  }

  delete(id: string): void {
    this.cache.delete(id);
  }
}
