import type { ZodType } from "zod";
import type { ReadableStream } from "node:stream/web";

export interface ILLMProvider<U = unknown, V = unknown> {
  stream(input: string, instructions?: string): Promise<ReadableStream<string>>;

  message(input: string, instructions?: string): Promise<string>;

  json(input: string, instructions?: string): Promise<U>;

  outputFormat(zodSchema: ZodType<V>): ILLMProvider<U, V>;
}
