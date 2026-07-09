import type { Config } from "#src/types/config.ts";

/**
 * Loads configuration from environment variables and returns a frozen,
 * typed config object.
 *
 * Reads `BASE_URL`, `MODEL`, `API_KEY`, and `JINA_API_KEY` from
 * `process.env` (populated by `dotenv`). Required vars that are missing
 * produce a `console.warn()` message — the application continues to
 * function with empty strings for those values.
 *
 * @returns A frozen `Readonly<Config>` singleton
 *
 * @example
 * ```ts
 * import { config } from "#src/utils/config.ts";
 * console.log(config.baseUrl); // string, possibly empty
 * ```
 */
export function loadConfig(): Readonly<Config> {
  const apiKey = (process.env["API_KEY"] ?? "").trim();
  if (!apiKey) {
    throw new Error("Missing required env var: API_KEY. Set it in your .env file.");
  }

  const baseUrl = (process.env["BASE_URL"] ?? "https://api.openai.com/v1").trim();
  const model = (process.env["MODEL"] ?? "gpt-4o-mini").trim();

  const config: Config = {
    baseUrl,
    model,
    apiKey,
    jinaApiKey: process.env["JINA_API_KEY"]?.trim() || undefined,
  };

  return Object.freeze(config);
}

/** Singleton config instance — loaded once at module import time. */
export const config: Readonly<Config> = loadConfig();
