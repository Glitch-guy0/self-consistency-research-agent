/**
 * Typed configuration loaded from environment variables.
 *
 * Exists to centralize env-var access so the rest of the application
 * never touches `process.env` directly. Every consumer (LLM provider,
 * web search, orchestrator) reads from this single config object.
 *
 * @example
 * ```ts
 * import { config } from "#lib/utils/config.util.ts";
 * // config.baseUrl // "https://api.openai.com/v1"
 * // config.jinaApiKey // "sk-..." or undefined
 * ```
 */
export interface Config {
  baseUrl: string;
  model: string;
  apiKey: string;
  jinaApiKey: string | undefined;
}
