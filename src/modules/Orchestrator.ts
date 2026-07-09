import type { ITUIManager } from "#src/interface/ITUIManager.ts";
import type { ISessionPort } from "#src/interface/ISessionPort.ts";
import type { INoteToolPort } from "#src/interface/INoteToolPort.ts";
import type { KVCache } from "#src/types/kvCache.ts";
import { composeWebSearch } from "#src/modules/ProviderFactory.ts";
import { AgentFactory } from "#src/modules/AgentFactory.ts";
import type { AgentInstance } from "#src/modules/AgentFactory.ts";
import { NoteToolAdapter } from "#src/service/NoteToolAdapter.ts";

const CONVERSATION_SESSION_ID = "conv-session";
const VALIDATION_SESSION_ID = "val-session";

interface ConvSession {
  messages: Array<{ user?: string; assistant?: string }>;
}

const RESEARCH_SYSTEM_PROMPT = [
  "You are a research agent in a self-consistency system.",
  "Your task is to research the given query thoroughly.",
  "",
  "You MUST respond with valid JSON using one of these formats:",
  '- {"type": "thinking", "content": "Your intermediate reasoning..."}',
  '- {"type": "research", "content": "I need to search", "query": "search query here"}',
  '- {"type": "output", "content": "Your final answer"}',
  "",
  "When type is 'thinking', your thoughts are saved for future steps.",
  "When type is 'research', a web search is performed for your query.",
  "When type is 'output', your answer is final.",
  "Continue thinking and researching until ready for final output.",
].join("\n");

const VALIDATION_SYSTEM_PROMPT = [
  "You are a validation agent in a self-consistency system.",
  "You receive multiple research outputs and must analyze them for consistency.",
  "",
  "You MUST respond with valid JSON using one of these formats:",
  '- {"type": "thinking", "content": "Your analysis of the research outputs..."}',
  '- {"type": "output", "content": "Your validated, synthesised answer"}',
  "",
  "When type is 'thinking', your intermediate analysis is saved.",
  "When type is 'output', your answer is considered final.",
  "",
  "Analyze the research outputs for:",
  "1. Agreement — Do they reach similar conclusions?",
  "2. Confidence scoring based on agreement-strength and citation overlap",
  "3. If they converge, synthesise a unified answer",
  "4. If they diverge, present differing results with confidence scores",
  "",
  "Clearly show which parts have high confidence vs low confidence.",
].join("\n");

export class Orchestrator {
  private readonly agentFactory: AgentFactory;

  constructor(
    private readonly tui: ITUIManager,
    private readonly session: ISessionPort,
    private readonly kvCache: KVCache,
    agentFactory?: AgentFactory,
    private readonly agentCount: number = 3,
  ) {
    this.agentFactory = agentFactory ?? new AgentFactory();
  }

  async run(): Promise<void> {
    this.tui.output("Self-Consistency Research Agent");
    const query = await this.tui.input("Enter your research query: ");

    if (!query || query.trim() === "") {
      this.tui.warn("Empty query received. Exiting.");
      return;
    }

    const convSession = this.getOrCreateConversation();
    convSession.messages.push({ user: query });
    this.session.set(CONVERSATION_SESSION_ID, convSession);

    const webSearchComposition = composeWebSearch();
    if (!webSearchComposition.isAvailable && webSearchComposition.warning) {
      this.tui.warn(webSearchComposition.warning);
    }

    for (let i = 0; i < this.agentCount; i++) {
      this.agentFactory.registerResearchAgent({});
    }

    this.tui.showthinking("researching...", { timeoutMs: 0, showall: true });

    const createNoteTool = (sessionId: string): INoteToolPort => {
      return new NoteToolAdapter(this.kvCache, sessionId);
    };

    const agents: AgentInstance[] = await this.agentFactory.spawnAll(
      RESEARCH_SYSTEM_PROMPT,
      webSearchComposition.provider,
      createNoteTool,
    );

    const convHistory = this.formatConversationHistory(convSession);

    const researchResults = await Promise.all(
      agents.map(async (agent) => {
        this.session.init(agent.sessionId);
        const output = await agent.wrapper.run(query, convHistory);
        this.session.delete(agent.sessionId);
        return output;
      }),
    );

    this.tui.clear();

    this.tui.showthinking("Validating research outputs...", { timeoutMs: 0, showall: true });

    const validationNoteTool = new NoteToolAdapter(this.kvCache, VALIDATION_SESSION_ID);
    this.session.init(VALIDATION_SESSION_ID);

    const validationAgent = this.agentFactory.createValidationAgent({
      tools: { note: validationNoteTool },
      systemPrompt: VALIDATION_SYSTEM_PROMPT,
      sessionId: VALIDATION_SESSION_ID,
    });

    const researchData = JSON.stringify(
      researchResults.map((r, i) => ({ agent: i + 1, content: r.content })),
    );

    const validationResult = await validationAgent.run(researchData, convHistory);

    this.tui.clear();

    const updatedConv = this.session.get(CONVERSATION_SESSION_ID) as ConvSession | undefined;
    if (updatedConv) {
      updatedConv.messages.push({ assistant: validationResult.content });
      this.session.set(CONVERSATION_SESSION_ID, updatedConv);
    }

    this.tui.output(validationResult.content);

    this.session.delete(VALIDATION_SESSION_ID);
  }

  private getOrCreateConversation(): ConvSession {
    this.session.init(CONVERSATION_SESSION_ID);
    const existing = this.session.get(CONVERSATION_SESSION_ID) as ConvSession | undefined;
    if (existing && Array.isArray(existing.messages)) {
      return existing;
    }
    const session: ConvSession = { messages: [] };
    this.session.set(CONVERSATION_SESSION_ID, session);
    return session;
  }

  private formatConversationHistory(conv: ConvSession): string {
    return conv.messages
      .map((m) => {
        if (m.user) return `User: ${m.user}`;
        if (m.assistant) return `Assistant: ${m.assistant}`;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
}
