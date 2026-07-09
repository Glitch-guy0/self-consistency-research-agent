import type { ZodType } from "zod";

/**
 * Port interface for LLM provider operations.
 *
 * Defines multiple output modes — `stream()` for real-time token streaming,
 * `message()` for raw string completion, and `json()` for structured parsed
 * output. The `outputFormat()` method configures Zod schema validation that
 * `json()` uses to validate and type its return value.
 *
 * @typeParam T — return type of `json()` (default `unknown`)
 * @typeParam U — schema-validated return type after `outputFormat()` is called
 *
 * @example
 * ```ts
 * import type { ILLMProvider } from "#lib/interface/illm-provider.interface.ts";
 *
 * async function example(provider: ILLMProvider<{ answer: string }>) {
 *   const raw = await provider.message();
 *   const parsed = await provider.json();
 *   const stream = await provider.stream();
 * }
 * ```
 */
export interface ILLMProvider<T = unknown, U = unknown> {
  /**
   * Returns a `ReadableStream` of tokens from the LLM.
   *
   * @returns a readable stream of response tokens
   *
   * @example
   * ```ts
   * const stream = await provider.stream();
   * const reader = stream.getReader();
   * // consume tokens from reader
   * ```
   */
  stream(): Promise<ReadableStream>;

  /**
   * Returns the full LLM response as a raw string.
   *
   * @returns the completion text
   *
   * @example
   * ```ts
   * const text = await provider.message();
   * console.log(text);
   * ```
   */
  message(): Promise<string>;

  /**
   * Returns the parsed structured output from the LLM.
   *
   * If `outputFormat()` was called with a Zod schema, the return value is
   * validated against that schema. Otherwise returns the raw parsed JSON.
   *
   * @returns the parsed response, typed as `T`
   *
   * @example
   * ```ts
   * const result = await provider.json();
   * // result: { answer: string }
   * ```
   */
  json(): Promise<T>;

  /**
   * Configures a Zod schema for `json()` output validation.
   *
   * When called, `stream()` should throw or be disabled since the provider
   * must buffer the full response to validate against the schema.
   *
   * @param zodSchema — a Zod schema to validate `json()` output
   * @returns a new `ILLMProvider` instance with schema validation configured
   *
   * @example
   * ```ts
   * import { z } from "zod";
   *
   * const validated = provider.outputFormat(z.object({ answer: z.string() }));
   * const result = await validated.json();
   * // result: { answer: string }
   * ```
   */
  outputFormat<V>(zodSchema: ZodType<V>): ILLMProvider<T, V>;
}
