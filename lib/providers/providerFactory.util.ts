import { config } from "#lib/utils/config.util.ts";
import type { IWebSearchProvider } from "#lib/interface/iweb-search-provider.interface.ts";
import { JinaSearchProvider } from "#lib/providers/jinaSearchProvider.provider.ts";

/**
 * Result of attempting to compose an optional web-search provider.
 *
 * The orchestrator (Story 4.3) checks this result before building an
 * agent's toolset: if `isAvailable` is `false`, the warning message
 * should be displayed via `warn()` and the agent tools list should
 * exclude the web-search tool.
 *
 * @example
 * ```ts
 * const { provider, isAvailable, warning } = composeWebSearch();
 * if (!isAvailable && warning) {
 *   warn(warning);
 * }
 * ```
 */
export interface WebSearchComposition {
  /** The provider instance, or `null` when unavailable. */
  provider: IWebSearchProvider | null;
  /** Whether a Jina API key was configured. */
  isAvailable: boolean;
  /** Human-readable warning message, or `null` when available. */
  warning: string | null;
}

/**
 * Attempts to compose a web-search provider (JinaSearchProvider).
 *
 * Checks the frozen config singleton for `jinaApiKey`. When the key
 * is missing the composition result signals unavailability with a
 * warning message — the caller should use `warn()` to inform the
 * user before dispatching agents.
 *
 * @returns A composition result with provider, availability, and warning.
 *
 * @example
 * ```ts
 * const web = composeWebSearch();
 * if (web.isAvailable) {
 *   // compose agent with web-search tool
 * } else if (web.warning) {
 *   warn(web.warning);
 * }
 * ```
 */
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
