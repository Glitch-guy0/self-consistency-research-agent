import type { ZodType } from "zod";
export interface ILLMProvider {
    stream(): Promise<void>;
    message(): Promise<string>;
    json(): Promise<unknown>;
    outputFormat(zodSchema: ZodType): void;
}
