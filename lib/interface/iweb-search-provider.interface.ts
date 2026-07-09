/**
 * Web search provider port interface.
 *
 * Research agents use this to gather external information when the
 * Jina API key is available. The orchestrator checks at composition
 * time and gracefully degrades if the provider cannot be configured.
 *
 * @example
 * ```ts
 * const searcher: IWebSearchProvider = new JinaSearchProvider();
 * const results = await searcher.search("latest AI news");
 * ```
 */
export interface IWebSearchProvider {
  /**
   * Executes a web search for the given `query` and returns results
   * as markdown text.
   *
   * @param query — Search query string.
   * @returns Markdown-formatted search results.
   *
   * @example
   * ```ts
   * const md = await provider.search("TypeScript 6.0 features");
   * ```
   */
  search(query: string): Promise<string>;

  /**
   * Fetches and parses the content at the given `url`, returning the
   * rendered page content as markdown.
   *
   * @param url — The URL to fetch and parse.
   * @returns Markdown-formatted page content.
   *
   * @example
   * ```ts
   * const content = await provider.parse("https://example.com/docs");
   * ```
   */
  parse(url: string): Promise<string>;
}
