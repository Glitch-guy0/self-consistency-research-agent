import OpenAI from "openai";
import type { ZodType } from "zod";
import { ReadableStream } from "node:stream/web";
import type { ILLMProvider } from "#lib/interface/llmProvider.interface.ts";
import { config } from "#lib/utils/config.util.ts";

/**
 * Options for constructing an LLMProvider.
 *
 * Each field falls back to the global typed config singleton when
 * omitted, so callers only need to supply overrides.
 *
 * @example
 * ```ts
 * const provider = new LLMProvider({
 *   baseUrl: "https://api.openai.com/v1",
 *   model: "gpt-4o",
 *   apiKey: "sk-...",
 * });
 * ```
 */
export interface LLMProviderOptions {
  /** OpenAI-compatible base URL. Defaults to `config.baseUrl`. */
  baseUrl?: string;
  /** Model identifier. Defaults to `config.model`. */
  model?: string;
  /** API key. Defaults to `config.apiKey`. */
  apiKey?: string;
}

/**
 * Concrete LLM provider backed by the OpenAI SDK (Responses API).
 *
 * Implements all three output modes defined in `ILLMProvider`:
 * - `message()` — single string response
 * - `stream()` — real‑time text deltas as a `ReadableStream<string>`
 * - `json()` — structured output with optional Zod validation
 *
 * @example
 * ```ts
 * const provider = new LLMProvider({ model: "gpt-4o" });
 * const text = await provider.message("Hello!");
 * ```
 */
export class LLMProvider<U = unknown, V = unknown> implements ILLMProvider<U, V> {
  private readonly client: OpenAI;
  private readonly model: string;
  private schema: ZodType<V> | null = null;

  /**
   * Creates a new LLMProvider.
   *
   * @param options — Optional overrides for baseUrl, model, apiKey.
   *                  All fields fall back to the global config singleton.
   *
   * @example
   * ```ts
   * // All defaults from config
   * const p1 = new LLMProvider();
   *
   * // Override model only
   * const p2 = new LLMProvider({ model: "gpt-4o-mini" });
   * ```
   */
  constructor(options: LLMProviderOptions = {}) {
    const baseUrl = options.baseUrl ?? config.baseUrl;
    const model = options.model ?? config.model;
    const apiKey = options.apiKey ?? config.apiKey;

    this.client = new OpenAI({ baseURL: baseUrl, apiKey });
    this.model = model;
  }

  /**
   * Configures a Zod schema that `json()` will validate against.
   *
   * After calling this method, `stream()` will throw because
   * streaming is incompatible with schema-validated output.
   *
   * @param zodSchema — The Zod schema to validate against.
   * @returns The same provider (fluent), typed as `ILLMProvider<U, V>`.
   *
   * @example
   * ```ts
   * const schema = z.object({ answer: z.string() });
   * const out = await provider.outputFormat(schema).json("...");
   * ```
   */
  outputFormat(zodSchema: ZodType<V>): ILLMProvider<U, V> {
    this.schema = zodSchema;
    return this;
  }

  /**
   * Sends `input` and returns the complete response as a string.
   *
   * @param input — The user / conversation input.
   * @param instructions — Optional system instructions.
   * @returns The model's response text.
   *
   * @example
   * ```ts
   * const answer = await provider.message("What is 2+2?");
   * // "4"
   * ```
   */
  async message(input: string, instructions?: string): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      input,
      instructions,
    });
    return response.output_text;
  }

  /**
   * Sends `input` and streams text deltas as a `ReadableStream<string>`.
   *
   * @param input — The user / conversation input.
   * @param instructions — Optional system instructions.
   * @returns A ReadableStream yielding text deltas.
   * @throws If `outputFormat()` was previously called (stream disabled).
   *
   * @example
   * ```ts
   * const stream = await provider.stream("Tell me a story");
   * const reader = stream.getReader();
   * while (true) {
   *   const { done, value } = await reader.read();
   *   if (done) break;
   *   process.stdout.write(value);
   * }
   * ```
   */
  async stream(input: string, instructions?: string): Promise<ReadableStream<string>> {
    if (this.schema) {
      throw new Error("stream() cannot be called after outputFormat()");
    }

    const openAIStream = await this.client.responses.create({
      model: this.model,
      input,
      instructions,
      stream: true,
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const event of openAIStream) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(event.delta);
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  /**
   * Sends `input` and returns parsed structured output.
   *
   * If a Zod schema was set via `outputFormat()`, the parsed JSON is
   * validated against it before being returned.
   *
   * @param input — The user / conversation input.
   * @param instructions — Optional system instructions.
   * @returns The parsed output of type `U`.
   *
   * @example
   * ```ts
   * const result = await provider.json<{ answer: string }>(
   *   "Return JSON: {\"answer\": \"42\"}"
   * );
   * // result => { answer: "42" }
   * ```
   */
  async json(input: string, instructions?: string): Promise<U> {
    const response = await this.client.responses.create({
      model: this.model,
      input,
      instructions,
    });

    const raw = response.output_text;
    if (this.schema) {
      return this.schema.parse(JSON.parse(raw)) as unknown as U;
    }
    return JSON.parse(raw) as U;
  }
}
