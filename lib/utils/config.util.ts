import type { Config } from "#lib/types/config.type.ts";

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
 * import { config } from "#lib/utils/config.util.ts";
 * console.log(config.baseUrl); // string, possibly empty
 * ```
 */
export function loadConfig(): Readonly<Config> {
  const requiredVars = ["BASE_URL", "MODEL", "API_KEY"] as const;

  for (const key of requiredVars) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      console.warn(`Missing required env var: ${key}`);
    }
  }

  const config: Config = {
    baseUrl: (process.env["BASE_URL"] ?? "").trim(),
    model: (process.env["MODEL"] ?? "").trim(),
    apiKey: (process.env["API_KEY"] ?? "").trim(),
    jinaApiKey: process.env["JINA_API_KEY"]?.trim() || undefined,
  };

  return Object.freeze(config);
}

/** Singleton config instance — loaded once at module import time. */
export const config: Readonly<Config> = loadConfig();
