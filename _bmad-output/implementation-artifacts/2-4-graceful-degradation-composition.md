# Story 2.4: Graceful Degradation Composition

Status: in-progress

## Story

As a developer,
I want JinaSearchProvider to be composed only when JINA_API_KEY is present,
So that the system degrades gracefully when web search is unavailable.

## Acceptance Criteria

1. **AC1**: When JINA_API_KEY missing, JinaSearchProvider is not composed in agent toolset
2. **AC2**: Warning notification shown via warn() before agent dispatch
3. **AC3**: Agents proceed without error

## Tasks / Subtasks

- [x] Task 1: Create `createProviderFactory()` in `lib/providers/providerFactory.util.ts`
- [x] Task 2: Implement `composeWebSearch()` that returns `{ provider, isAvailable, warning }`
- [x] Task 3: Run `npm run typecheck` — zero errors

## Dev Notes

- Factory checks `config.jinaApiKey` to determine availability
- Returns a result object: `{ provider: IWebSearchProvider | null, isAvailable: boolean, warning: string | null }`
- The orchestrator (Story 4.3) consumes this factory to compose agent toolsets
- Warn function signature: `(message: string) => void` (matches ITUIManager.warn)

### Key Files to Create

```
lib/providers/providerFactory.util.ts  — Provider factory (NEW)
```

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `lib/providers/providerFactory.util.ts` with `composeWebSearch()` helper
- `npm run typecheck` passes with zero errors

### Review Findings

- [x] [Review][Decision] Uses `config.jinaApiKey` (frozen singleton) rather than `process.env` directly. Matches the project convention of centralising env access through the config object.
- [x] [Review][Patch] The warning message is descriptive and actionable, telling the user both what happened and how to fix it. [lib/providers/providerFactory.util.ts:59]
- [x] [Review][Decision] The `composeWebSearch()` function returns a structured result rather than throwing. This lets the orchestrator decide how to handle unavailability (warn vs. silent fallback).
- [x] [Review][Patch] JSDoc with `@example` on the function and the result interface matches project convention.

### File List

- lib/providers/providerFactory.util.ts — new
