# Story 2.1: LLMProvider Implementation

Status: in-progress

## Story

As a developer,
I want the LLMProvider class that builds an OpenAI SDK client from configurable parameters,
So that each agent can use its own LLM provider with independent baseUrl, model, and apiKey.

## Acceptance Criteria

1. **AC1**: Given an LLMProvider constructed with `{baseUrl, model, apiKey}`, it creates an OpenAI SDK client
2. **AC2**: Defaults used when parameters are omitted (falls back to config singleton)
3. **AC3**: Implements ILLMProvider interface

## Tasks / Subtasks

- [x] Task 1: Update ILLMProvider interface in `lib/interface/llmProvider.interface.ts`
- [x] Task 2: Create LLMProvider class in `lib/providers/llmProvider.provider.ts`
- [x] Task 3: Wire constructor with config fallback (baseUrl, model, apiKey from config)
- [x] Task 4: Run `npm run typecheck` — zero errors

## Dev Notes

- Uses OpenAI SDK v6 Responses API (`client.responses.create()`)
- Constructor accepts optional `LLMProviderOptions` with `baseUrl`, `model`, `apiKey`
- Falls back to frozen config singleton when options omitted
- OpenAI client created via `new OpenAI({ baseURL, apiKey })`
- Also implements Story 2.2 output modes in the same class

### Key Files to Create

```
lib/interface/llmProvider.interface.ts    — Updated with practical method signatures
lib/providers/llmProvider.provider.ts     — LLMProvider class (NEW)
```

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Updated `lib/interface/llmProvider.interface.ts` with practical method signatures
- Created `lib/providers/llmProvider.provider.ts` with `LLMProvider` class implementing `ILLMProvider`
- `npm run typecheck` passes with zero errors

### Review Findings

- [x] [Review][Patch] Unused `ClientOptions` import removed from provider [lib/providers/llmProvider.provider.ts:2]
- [x] [Review][Patch] JSDoc added with `@example` on every method to match project convention [lib/interface/llmProvider.interface.ts, lib/providers/llmProvider.provider.ts]
- [x] [Review][Decision] `outputFormat()` returns `ILLMProvider<U, V>` (interface type) rather than concrete `LLMProvider<U, V>`. This is intentional — consumers depend on the port interface, not the impl.
- [x] [Review][Decision] Generic type `U` is bound at the class level, so `json()` return type is fixed per instance. Consumers should use `new LLMProvider<MyType>()` or cast at call site. This matches the interface design.

### File List

- lib/interface/llmProvider.interface.ts — updated
- lib/providers/llmProvider.provider.ts — new
