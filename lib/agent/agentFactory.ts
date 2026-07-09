import type { ILLMProvider } from "#lib/interface/llmProvider.interface.ts";
import type { IWebSearchProvider } from "#lib/interface/iweb-search-provider.interface.ts";
import type { INoteToolPort } from "#lib/interface/iNoteToolPort.interface.ts";
import { LLMProvider } from "#lib/providers/llmProvider.provider.ts";
import { LLMAgentWrapper } from "#lib/agent/llmAgentWrapper.ts";
import type { ToolSet } from "#lib/agent/llmAgentWrapper.ts";

/**
 * Configuration for per-agent LLM provider setup.
 *
 * Each field falls back to the global config singleton when omitted,
 * so callers only need to supply overrides for cross-model diversity.
 *
 * @example
 * ```ts
 * const config: ProviderConfig = {
 *   baseUrl: "https://api.openai.com/v1",
 *   model: "gpt-4o",
 *   apiKey: "sk-...",
 * };
 * ```
 */
export interface ProviderConfig {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

/**
 * Full configuration for a research agent, composed by `spawnAll()`.
 *
 * @example
 * ```ts
 * const config: ResearchAgentConfig = {
 *   tools: { note: noteTool, webSearch: searchProvider },
 *   systemPrompt: "You are a research agent...",
 *   sessionId: "agent-session-0",
 *   provider: llmProvider,
 * };
 * ```
 */
export interface ResearchAgentConfig {
  tools: ToolSet;
  systemPrompt: string;
  sessionId: string;
  provider: ILLMProvider;
}

/**
 * Configuration for the validation agent.
 *
 * Unlike research agents, the validation agent gets a note-only toolset
 * (no websearch) and uses the default LLM provider.
 *
 * @example
 * ```ts
 * const config: ValidationAgentConfig = {
 *   tools: { note: noteTool },
 *   systemPrompt: "You are a validation agent...",
 *   sessionId: "val-session",
 * };
 * ```
 */
export interface ValidationAgentConfig {
  tools: ToolSet;
  systemPrompt: string;
  sessionId: string;
}

/**
 * A spawned agent instance with its temp session identifier.
 *
 * The orchestrator uses `sessionId` to clean up temp sessions after
 * agent output is collected.
 *
 * @example
 * ```ts
 * const instance: AgentInstance = { wrapper, sessionId: "agent-session-0" };
 * ```
 */
export interface AgentInstance {
  wrapper: LLMAgentWrapper;
  sessionId: string;
}

/**
 * Two-phase agent factory that supports declarative roster building
 * and deferred instance creation.
 *
 * **Phase 1** — Call `registerResearchAgent()` N times to populate the
 * internal roster with `ProviderConfig` entries.
 *
 * **Phase 2** — Call `spawnAll()` to materialise `LLMAgentWrapper`
 * instances, each with its own `LLMProvider`, isolated note tool, and
 * (optionally) the shared web-search provider.
 *
 * `createValidationAgent()` creates a single validation agent that
 * uses the default LLM provider and receives only a note tool.
 *
 * @example
 * ```ts
 * const factory = new AgentFactory();
 * factory.registerResearchAgent({ model: "gpt-4o" });
 * factory.registerResearchAgent({ model: "gpt-4o-mini" });
 *
 * const agents = await factory.spawnAll(
 *   "You are a research agent...",
 *   webSearchProvider,
 *   (sessionId) => new NoteToolAdapter(kvCache, sessionId),
 * );
 * ```
 */
export class AgentFactory {
  private readonly registeredProviders: ProviderConfig[] = [];

  /**
   * Registers a `ProviderConfig` in the internal roster.
   *
   * @param config — Provider configuration (baseUrl, model, apiKey).
   *
   * @example
   * ```ts
   * factory.registerResearchAgent({ model: "gpt-4o" });
   * factory.registerResearchAgent({ model: "claude-3-opus" });
   * ```
   */
  registerResearchAgent(config: ProviderConfig): void {
    this.registeredProviders.push(config);
  }

  /**
   * Creates `LLMAgentWrapper` instances for every registered provider.
   *
   * Each wrapper gets its own `LLMProvider` (constructed from the
   * registered `ProviderConfig`), an isolated note tool scoped to a
   * unique `sessionId`, and the optional web-search provider.
   *
   * @param systemPrompt — System prompt for all spawned agents.
   * @param webSearch — Optional web-search provider shared across agents.
   * @param createNoteTool — Factory that creates a scoped note tool for
   *                         each session ID.
   * @returns An array of `AgentInstance` objects with wrapper + sessionId.
   *
   * @example
   * ```ts
   * const agents = await factory.spawnAll(
   *   "You are a research agent",
   *   jinaProvider,
   *   (id) => new NoteToolAdapter(kvCache, id),
   * );
   * ```
   */
  async spawnAll(
    systemPrompt: string,
    webSearch: IWebSearchProvider | null,
    createNoteTool: (sessionId: string) => INoteToolPort,
  ): Promise<AgentInstance[]> {
    const instances: AgentInstance[] = [];

    for (let i = 0; i < this.registeredProviders.length; i++) {
      const providerConfig = this.registeredProviders[i];
      const sessionId = `agent-session-${i}`;

      const provider = new LLMProvider(providerConfig);
      const noteTool = createNoteTool(sessionId);

      const tools: ToolSet = { note: noteTool };
      if (webSearch) {
        tools.webSearch = webSearch;
      }

      const wrapper = new LLMAgentWrapper(tools, systemPrompt, provider);
      instances.push({ wrapper, sessionId });
    }

    return instances;
  }

  /**
   * Creates a single validation `LLMAgentWrapper` instance.
   *
   * The validation agent uses the default LLM provider (no specific
   * config overrides) and receives only the tools specified in its
   * config (typically note-only, no websearch).
   *
   * @param config — Validation agent configuration.
   * @returns A new `LLMAgentWrapper` for validation.
   *
   * @example
   * ```ts
   * const valAgent = factory.createValidationAgent({
   *   tools: { note: valNoteTool },
   *   systemPrompt: "You are a validation agent",
   *   sessionId: "val-session",
   * });
   * ```
   */
  createValidationAgent(config: ValidationAgentConfig): LLMAgentWrapper {
    const provider = new LLMProvider();
    return new LLMAgentWrapper(config.tools, config.systemPrompt, provider);
  }
}
