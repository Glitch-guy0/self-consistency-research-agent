import type { ZodType } from "zod";
import { ClientOptions } from "openai/index.js";

export interface ILLMProvider<U, V> {
  constructor(options: Partial<Pick<ClientOptions, "apiKey" | "baseURL" | "maxRetries">>): ILLMProvider<U, V>;
  // this will give me readable stream
  stream(): Promise<ReadableStream>;
  // this will be me raw string from the completion
  message(): Promise<string>;
  // this will give me parsed only allowed then outputformat is provided then attach this to resulting function else do not show this. create a separate interface class if required
  json(): Promise<U>;
  // takes zod schema and then zod schema is provided then stream function is disabled.
  outputFormat(zodSchema: ZodType): ILLMProvider<U, V>;
}

// llm tool interface
// search(query): string