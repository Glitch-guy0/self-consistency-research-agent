import { config } from "#src/utils/config.ts";
import type { IWebSearchProvider } from "#src/interface/IWebSearchProvider.ts";
import { JinaSearchProvider } from "#src/service/JinaSearchProvider.ts";

export interface WebSearchComposition {
  provider: IWebSearchProvider | null;
  isAvailable: boolean;
  warning: string | null;
}

export function composeWebSearch(): WebSearchComposition {
  if (config.jinaApiKey && config.jinaApiKey.trim() !== "") {
    return {
      provider: new JinaSearchProvider(),
      isAvailable: true,
      warning: null,
    };
  }

  return {
    provider: null,
    isAvailable: false,
    warning:
      "JINA_API_KEY not set — web search disabled. Research agents will " +
      "fall back to the LLM's internal knowledge. " +
      "Set JINA_API_KEY in your .env file to enable web search.",
  };
}
