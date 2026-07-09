import type { IWebSearchProvider } from "#lib/interface/iweb-search-provider.interface.ts";
import { config } from "#lib/utils/config.util.ts";

/**
 * Jina AI-powered web search and page parser provider.
 *
 * Uses Jina's public API endpoints:
 * - `search(query)` → `GET https://s.jina.ai/{query}` 
 * - `parse(url)`   → `GET https://r.jina.ai/{url}`
 *
 * The constructor resolves the API key in this order:
 * 1. Explicit `apiKey` constructor argument
 * 2. `config.jinaApiKey` (from the frozen config singleton)
 * 3. `undefined` — the provider will still be constructable but every
 *    call will fail with an auth error (the calling orchestrator checks
 *    availability before composing the provider into an agent's toolset).
 *
 * @example
 * ```ts
 * // With explicit key
 * const jina = new JinaSearchProvider({ apiKey: "sk-..." });
 *
 * // Falls back to config / env
 * const jina2 = new JinaSearchProvider();
 * ```
 */
export class JinaSearchProvider implements IWebSearchProvider {
  private readonly apiKey: string | undefined;

  /**
   * Creates a new JinaSearchProvider.
   *
   * @param options.apiKey — Jina API key. Falls back to
   *                         `config.jinaApiKey` if omitted.
   *
   * @example
   * ```ts
   * const provider = new JinaSearchProvider();
   * ```
   */
  constructor(options?: { apiKey?: string }) {
    this.apiKey = options?.apiKey ?? config.jinaApiKey;
  }

  /**
   * Searches the web via `GET https://s.jina.ai/{query}` and returns
   * markdown results.
   *
   * @param query — The search query.
   * @returns Markdown-formatted search results.
   *
   * @example
   * ```ts
   * const results = await jina.search("What is self-consistency?");
   * ```
   */
  async search(query: string): Promise<string> {
    const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      method: "GET",
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Jina search failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Parses the content at `url` via `GET https://r.jina.ai/{url}` and
   * returns markdown-formatted page content.
   *
   * @param url — The URL to parse.
   * @returns Markdown-formatted page content.
   *
   * @example
   * ```ts
   * const content = await jina.parse("https://example.com/article");
   * ```
   */
  async parse(url: string): Promise<string> {
    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      method: "GET",
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Jina parse failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Builds the request headers, including Authorization if apiKey is set.
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "text/markdown",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
}
