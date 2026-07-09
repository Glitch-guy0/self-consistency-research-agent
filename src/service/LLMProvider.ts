import OpenAI from "openai";
import type { ZodType } from "zod";
import { ReadableStream } from "node:stream/web";
import type { ILLMProvider } from "#src/interface/ILLMProvider.ts";
import { config } from "#src/utils/config.ts";

export interface LLMProviderOptions {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

export class LLMProvider<U = unknown, V = unknown> implements ILLMProvider<U, V> {
  private readonly client: OpenAI;
  private readonly model: string;
  private schema: ZodType<V> | null = null;

  constructor(options: LLMProviderOptions = {}) {
    const baseUrl = options.baseUrl ?? config.baseUrl;
    const model = options.model ?? config.model;
    const apiKey = options.apiKey ?? config.apiKey;

    this.client = new OpenAI({ baseURL: baseUrl, apiKey });
    this.model = model;
  }

  outputFormat(zodSchema: ZodType<V>): ILLMProvider<U, V> {
    this.schema = zodSchema;
    return this;
  }

  private buildMessages(input: string, instructions?: string): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (instructions) {
      messages.push({ role: "system", content: instructions });
    }
    messages.push({ role: "user", content: input });
    return messages;
  }

  async message(input: string, instructions?: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: this.buildMessages(input, instructions),
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(input: string, instructions?: string): Promise<ReadableStream<string>> {
    if (this.schema) {
      throw new Error("stream() cannot be called after outputFormat()");
    }

    const openAIStream = await this.client.chat.completions.create({
      model: this.model,
      messages: this.buildMessages(input, instructions),
      stream: true,
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of openAIStream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(delta);
            }
          }
          controller.close();
        } catch (err: unknown) {
          controller.error(err);
        }
      },
    });
  }

  async json(input: string, instructions?: string): Promise<U> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: this.buildMessages(input, instructions),
      ...(this.schema ? { response_format: { type: "json_object" } } : {}),
    });

    const raw = response.choices[0]?.message?.content ?? "";
    if (!raw) {
      throw new Error("LLM returned empty response");
    }
    if (this.schema) {
      return this.schema.parse(JSON.parse(raw)) as unknown as U;
    }
    return JSON.parse(raw) as U;
  }
}
