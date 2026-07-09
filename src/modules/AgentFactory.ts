import type { ILLMProvider } from "#src/interface/ILLMProvider.ts";
import type { IWebSearchProvider } from "#src/interface/IWebSearchProvider.ts";
import type { INoteToolPort } from "#src/interface/INoteToolPort.ts";
import { LLMProvider } from "#src/service/LLMProvider.ts";
import { LLMAgentWrapper } from "#src/modules/AgentWrapper.ts";
import type { ToolSet } from "#src/modules/AgentWrapper.ts";

export interface ProviderConfig {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

export interface ResearchAgentConfig {
  tools: ToolSet;
  systemPrompt: string;
  sessionId: string;
  provider: ILLMProvider;
}

export interface ValidationAgentConfig {
  tools: ToolSet;
  systemPrompt: string;
  sessionId: string;
}

export interface AgentInstance {
  wrapper: LLMAgentWrapper;
  sessionId: string;
}

export class AgentFactory {
  private readonly registeredProviders: ProviderConfig[] = [];

  registerResearchAgent(config: ProviderConfig): void {
    this.registeredProviders.push(config);
  }

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

  createValidationAgent(config: ValidationAgentConfig): LLMAgentWrapper {
    const provider = new LLMProvider();
    return new LLMAgentWrapper(config.tools, config.systemPrompt, provider);
  }
}
