import type { ILLMProvider } from "#src/interface/ILLMProvider.ts";

/**
 * Port interface for the self-consistency protocol.
 *
 * Manages the multi-participant consistency workflow: agents register via
 * `participate()`, submit their outputs via `submission()`, and the protocol
 * evaluates convergence/divergence via `evaluation()`.
 *
 * @example
 * ```ts
 * import type { IConsistencyProtocol } from "#src/interface/IConsistencyProtocol.ts";
 * import type { ILLMProvider } from "#src/interface/ILLMProvider.ts";
 *
 * async function run(protocol: IConsistencyProtocol, providers: ILLMProvider[]) {
 *   for (const provider of providers) {
 *     protocol.participate(provider);
 *   }
 *   await protocol.submission();
 *   const result = await protocol.evaluation();
 *   console.log(result.result);
 * }
 * ```
 */
export interface IConsistencyProtocol {
  /**
   * Registers an `ILLMProvider` instance as a participant in the protocol.
   *
   * @param provider — the LLM provider instance for this participant
   *
   * @example
   * ```ts
   * protocol.participate(provider);
   * ```
   */
  participate(provider: ILLMProvider<unknown, unknown>): void;

  /**
   * Triggers all registered participants to produce their submissions.
   *
   * @returns a promise that resolves when all submissions are collected
   *
   * @example
   * ```ts
   * await protocol.submission();
   * ```
   */
  submission(): Promise<unknown>;

  /**
   * Evaluates all collected submissions for consistency and returns the
   * result (synthesized answer or divergence report).
   *
   * @returns an object containing the evaluation `result` string
   *
   * @example
   * ```ts
   * const { result } = await protocol.evaluation();
   * ```
   */
  evaluation(): Promise<{ result: string }>;
}
