import type { IWebSearchProvider } from "#src/interface/IWebSearchProvider.ts";
import { config } from "#src/utils/config.ts";

export class JinaSearchProvider implements IWebSearchProvider {
  private readonly apiKey: string | undefined;

  constructor(options?: { apiKey?: string }) {
    this.apiKey = options?.apiKey ?? config.jinaApiKey;
  }

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
