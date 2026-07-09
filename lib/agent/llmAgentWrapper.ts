import type { ILLMProvider } from "#lib/interface/llmProvider.interface.ts";
import type { IWebSearchProvider } from "#lib/interface/iweb-search-provider.interface.ts";
import type { INoteToolPort } from "#lib/interface/iNoteToolPort.interface.ts";
import { z } from "zod";

/**
 * Set of tools available to an agent during its CoT loop.
 *
 * Research agents receive both `webSearch` (optional) and `note` (always).
 * The validation agent receives only `note`.
 *
 * @example
 * ```ts
 * const tools: ToolSet = {
 *   webSearch: jinaProvider,
 *   note: noteToolAdapter,
 * };
 * ```
 */
export interface ToolSet {
  /** Optional web-search provider (research agents only). */
  webSearch?: IWebSearchProvider;
  /** Notebook storage for intermediate results. */
  note: INoteToolPort;
}

/**
 * The final output produced when the agent's CoT loop terminates.
 *
 * @example
 * ```ts
 * const output: AgentOutput = { type: "output", content: "The answer is 42." };
 * ```
 */
export interface AgentOutput {
  type: "output";
  content: string;
}

/**
 * Zod schema for parsing the LLM's step response.
 *
 * The LLM is instructed to respond with one of:
 * - `thinking` — intermediate reasoning (saved to notebook, loop continues)
 * - `research` — a web search is needed (executed, results saved, loop continues)
 * - `output` — final answer (loop terminates)
 *
 * When type is `research`, the `query` field specifies the search term.
 */
const stepSchema = z.object({
  type: z.enum(["thinking", "research", "output"]),
  content: z.string(),
  query: z.string().optional(),
});

/** Inferred type from the step schema. */
type StepResponse = z.infer<typeof stepSchema>;

/**
 * Reusable agent wrapper that runs a chain-of-thought loop with
 * response-type resolution.
 *
 * Both research agents and the validation agent use this same primitive;
 * they differ only in their toolset, system prompt, and LLM provider.
 *
 * The CoT loop:
 * 1. Calls the LLM via `provider.json()` with the current notebook context.
 * 2. Parses the response for a `type` field.
 * 3. If `type === "output"`, returns the content as `AgentOutput`.
 * 4. Otherwise, saves the intermediate response to the notebook and loops.
 * 5. For `type === "research"`, executes a web search and saves results.
 *
 * @example
 * ```ts
 * const wrapper = new LLMAgentWrapper(tools, systemPrompt, provider);
 * const output = await wrapper.run("What is the capital of France?");
 * console.log(output.content);
 * ```
 */
export class LLMAgentWrapper {
  private stepCount = 0;

  /**
   * @param toolSet — Tools available to this agent (websearch + note).
   * @param systemPrompt — System prompt guiding the agent's behaviour.
   * @param provider — LLM provider instance for making inference calls.
   *
   * @example
   * ```ts
   * const wrapper = new LLMAgentWrapper(toolSet, prompt, llmProvider);
   * ```
   */
  constructor(
    private readonly toolSet: ToolSet,
    private readonly systemPrompt: string,
    private readonly provider: ILLMProvider,
  ) {}

  /**
   * Enters the chain-of-thought loop and returns the final agent output.
   *
   * On each iteration, `step()` is called. When the LLM returns
   * `{ type: "output", content: "..." }`, the loop terminates and
   * the content is returned as `AgentOutput`.
   *
   * @param query — The user's research query.
   * @param convHistory — Optional formatted conversation history string.
   * @returns The final agent output.
   *
   * @example
   * ```ts
   * const result = await wrapper.run("What is quantum computing?");
   * // result => { type: "output", content: "Quantum computing is..." }
   * ```
   */
  async run(query: string, convHistory?: string): Promise<AgentOutput> {
    this.stepCount = 0;

    while (true) {
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
  }

  /**
   * Executes a single CoT iteration.
   *
   * Builds context from previous notebook entries, calls the LLM, and
   * returns the parsed `StepResponse`. When the response type is
   * `"research"` and a web-search provider is available, the search is
   * executed and results are stored in the notebook.
   *
   * @param query — The user's research query.
   * @param convHistory — Optional formatted conversation history.
   * @returns Parsed step response from the LLM.
   */
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

  /**
   * Builds a notebook context string from all previous step entries.
   *
   * @returns A formatted string of previous notebook entries, or empty.
   */
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
