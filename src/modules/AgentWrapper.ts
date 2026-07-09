import type { ILLMProvider } from "#src/interface/ILLMProvider.ts";
import type { IWebSearchProvider } from "#src/interface/IWebSearchProvider.ts";
import type { INoteToolPort } from "#src/interface/INoteToolPort.ts";
import { z } from "zod";

export interface ToolSet {
  webSearch?: IWebSearchProvider;
  note: INoteToolPort;
}

export interface AgentOutput {
  type: "output";
  content: string;
}

const stepSchema = z.object({
  type: z.enum(["thinking", "research", "output"]),
  content: z.string(),
  query: z.string().optional(),
});

type StepResponse = z.infer<typeof stepSchema>;

const MAX_STEPS = 30;

export class LLMAgentWrapper {
  private stepCount = 0;

  constructor(
    private readonly toolSet: ToolSet,
    private readonly systemPrompt: string,
    private readonly provider: ILLMProvider,
  ) {}

  async run(query: string, convHistory?: string): Promise<AgentOutput> {
    this.stepCount = 0;

    while (this.stepCount < MAX_STEPS) {
      this.stepCount++;
      const stepResult = await this.step(query, convHistory);

      if (stepResult.type === "output") {
        return { type: "output", content: stepResult.content };
      }

      this.toolSet.note.save(`step-${this.stepCount}`, {
        type: stepResult.type,
        content: stepResult.content,
      });
    }

    return { type: "output", content: "Max steps reached. Returning best available result." };
  }

  private async step(query: string, convHistory?: string): Promise<StepResponse> {
    const notebookContext = this.buildNotebookContext();
    const instructions = this.systemPrompt
      + (convHistory ? `\n\nConversation history:\n${convHistory}` : "")
      + (notebookContext ? `\n\n${notebookContext}` : "");

    const raw = await this.provider.json(query, instructions);
    const result = stepSchema.parse(raw);

    if (result.type === "research" && result.query && this.toolSet.webSearch) {
      try {
        const searchResults = await this.toolSet.webSearch.search(result.query);
        this.toolSet.note.save(`search-${this.stepCount}`, {
          query: result.query,
          results: searchResults,
        });
      } catch (err: unknown) {
        this.toolSet.note.save(`search-${this.stepCount}`, {
          query: result.query,
          error: String(err),
        });
      }
    }

    return result;
  }

  private buildNotebookContext(): string {
    const entries: string[] = [];

    for (let i = 1; i < this.stepCount; i++) {
      const entry = this.toolSet.note.read(`step-${i}`);
      if (entry) {
        entries.push(JSON.stringify(entry));
      }
    }

    for (let i = 1; i < this.stepCount; i++) {
      const searchEntry = this.toolSet.note.read(`search-${i}`);
      if (searchEntry) {
        entries.push(`[Search results]: ${JSON.stringify(searchEntry)}`);
      }
    }

    if (entries.length === 0) {
      return "";
    }

    return `Notebook entries:\n${entries.join("\n")}\n`;
  }
}
