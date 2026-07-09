import type { ZodType } from "zod";
import type { ReadableStream } from "node:stream/web";

/**
 * LLM provider port interface for the self-consistency system.
 *
 * Every research agent and the validation agent receives its own
 * `ILLMProvider` instance configured with independent `baseUrl`,
 * `model`, and `apiKey`. This lets each agent call a different
 * model provider (OpenAI, Anthropic via proxy, local Ollama, etc.)
 * for cross-model diversity.
 *
 * The provider supports three output modes:
 * - `stream()` — real-time text deltas via ReadableStream
 * - `message()` — a single raw string response
 * - `json()` — structured / parsed output
 *
 * @example
 * ```ts
 * const provider: ILLMProvider<MyType> = new LLMProvider({
 *   baseUrl: "https://api.openai.com/v1",
 *   model: "gpt-4o",
 *   apiKey: "sk-...",
 * });
 * const answer = await provider.message("What is 2+2?");
 * ```
 */
export interface ILLMProvider<U = unknown, V = unknown> {
  /**
   * Returns a ReadableStream of text deltas from the LLM.
   *
   * @param input — The user / conversation input to send.
   * @param instructions — Optional system instructions.
   *
   * @example
   * ```ts
   * const stream = await provider.stream("Tell me a story");
   * const reader = stream.getReader();
   * // read chunks via reader.read()
   * ```
   */
  stream(input: string, instructions?: string): Promise<ReadableStream<string>>;

  /**
   * Returns a complete string response from the LLM.
   *
   * @param input — The user / conversation input to send.
   * @param instructions — Optional system instructions.
   *
   * @example
   * ```ts
   * const text = await provider.message("Hello");
   * // text => "Hi! How can I help you today?"
   * ```
   */
  message(input: string, instructions?: string): Promise<string>;

  /**
   * Returns structured output parsed from the LLM response.
   *
   * If `outputFormat()` was called before, the returned value is
   * validated against the Zod schema and the generic type `U`.
   *
   * @param input — The user / conversation input to send.
   * @param instructions — Optional system instructions.
   *
   * @example
   * ```ts
   * const result = await provider.json<{ answer: string }>(
   *   "Return JSON: {\"answer\": \"42\"}"
   * );
   * // result => { answer: "42" }
   * ```
   */
  json(input: string, instructions?: string): Promise<U>;

  /**
   * Configures a Zod schema for `json()` output validation.
   *
   * Once called, `stream()` will throw an error because streaming
   * is incompatible with schema-validated structured output.
   *
   * @param zodSchema — A Zod schema whose inferred type `V` the
   *                    `json()` output will be validated against.
   *
   * @example
   * ```ts
   * const schema = z.object({ answer: z.string() });
   * const validated = await provider
   *   .outputFormat(schema)
   *   .json("Return {answer: string}");
   * ```
   */
  outputFormat(zodSchema: ZodType<V>): ILLMProvider<U, V>;
}
