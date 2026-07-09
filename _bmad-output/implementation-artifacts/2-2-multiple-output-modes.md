# Story 2.2: Multiple Output Modes

Status: in-progress

## Story

As a developer,
I want the LLMProvider to support stream(), message(), and json() output modes,
So that agents and orchestrator can choose the appropriate output format.

## Acceptance Criteria

1. **AC1**: `stream()` returns a ReadableStream (with text deltas)
2. **AC2**: `message()` returns a raw string
3. **AC3**: `json()` returns parsed structured output (generic type U)
4. **AC4**: `outputFormat(zodSchema)` configures schema validation for json() output
5. **AC5**: Calling `stream()` after `outputFormat()` throws

## Tasks / Subtasks

- [x] Task 1: Implement `message(input, instructions?)` — returns raw text from `responses.create()`
- [x] Task 2: Implement `stream(input, instructions?)` — returns ReadableStream of text deltas
- [x] Task 3: Implement `json(input, instructions?)` — returns parsed structured output
- [x] Task 4: Implement `outputFormat(zodSchema)` — stores Zod schema, disables stream
- [x] Task 5: Run `npm run typecheck` — zero errors

## Dev Notes

- Implemented as part of the same LLMProvider class from Story 2.1
- Uses OpenAI Responses API with `stream: true` for streaming
- For json(), parses `response.output_text` as JSON, validates with Zod if schema set
- `outputFormat` stores the Zod schema internally; when set, `stream()` throws an error

### Key Files

```
src/service/LLMProvider.ts     — LLMProvider class (same as 2.1)
```

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- All output mode methods implemented on LLMProvider class
- `outputFormat` sets schema and disables `stream()`
- `npm run typecheck` passes with zero errors

### Review Findings

- [x] [Review][Patch] `stream()` guards against `outputFormat()` by checking `this.schema` before creating the stream [src/service/LLMProvider.ts:53]
- [x] [Review][Decision] `outputFormat()` leaves the schema in place for subsequent `json()` calls. It is never auto-cleared. Callers that need to switch modes should create a new provider instance.
- [x] [Review][Decision] No `text.format` is passed to the OpenAI API for structured output — the Zod validation is applied client-side only. A future enhancement could pass the schema JSON to the API for server-side enforcement.

### File List

- src/service/LLMProvider.ts — updated (same file as 2.1)
