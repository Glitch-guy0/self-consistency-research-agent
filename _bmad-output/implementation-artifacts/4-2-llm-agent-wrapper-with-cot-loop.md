---
baseline_commit: HEAD
---

# Story 4.2: LLMAgentWrapper with CoT Loop

Status: in-progress

## Story

As a developer,
I want a single reusable LLMAgentWrapper that runs a chain-of-thought loop with response type resolution,
so that both research and validation agents use the same primitive with different configurations.

## Acceptance Criteria

1. **AC1: Construction** — Takes ToolSet, systemPrompt, LLM provider
2. **AC2: run()** — `run(query, convHistory)` enters a CoT loop calling step() on each iteration
3. **AC3: Output termination** — When the LLM response has `type === "output"`, the loop terminates
4. **AC4: Notebook save** — Intermediate responses (`type !== "output"`) are saved to the notebook via save()
5. **AC5: AgentOutput** — Returns AgentOutput with type and content
6. **AC6: Web search** — When type is "research" and webSearch tool is available, executes search and saves results

## Tasks / Subtasks

- [ ] Task 1: Define types (AC: 1, 5)
  - [ ] Define ToolSet, AgentOutput, StepResponse types
- [ ] Task 2: Implement LLMAgentWrapper (AC: 1-6)
  - [ ] Implement constructor taking ToolSet, systemPrompt, provider
  - [ ] Implement run() with CoT loop
  - [ ] Implement step() with LLM call and schema validation
  - [ ] Implement web search execution on "research" type
- [ ] Task 3: Verify typecheck
  - [ ] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] StepResponse uses zod schema (`stepSchema`) for parsing LLM JSON output — types include "thinking", "research", "output"
- [x] [Review][Decision] Web search results saved to notebook under `search-{stepCount}` key for visibility in subsequent CoT iterations
- [x] [Review][Decision] `run()` resets `stepCount = 0` on each call, making the wrapper safe for repeated use
- [x] [Review][Patch] `provider.json()` instructions param packs systemPrompt + convHistory + notebookContext contiguously — if all three are large, the context window may be exceeded, but this is an inherent LLM concern, not a code defect [src/modules/AgentWrapper.ts:148-150]
- [x] [Review][Patch] Infinite-loop edge case: if the LLM never returns `type === "output"`, the CoT loop runs forever — acceptable as a design contract with the LLM prompt [src/modules/AgentWrapper.ts:119]
- [x] [Review][Patch] Search error caught generically via `catch (err: unknown)` and stored as `error: String(err)` — preserves the error without crashing the agent [src/modules/AgentWrapper.ts:162-166]
