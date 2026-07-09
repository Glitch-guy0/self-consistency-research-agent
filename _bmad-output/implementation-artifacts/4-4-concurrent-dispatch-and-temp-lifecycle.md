---
baseline_commit: HEAD
---

# Story 4.4: Concurrent Dispatch & Temp Lifecycle

Status: in-progress

## Story

As a user,
I want research agents dispatched concurrently with their own temp sessions,
so that I get diverse perspectives in parallel.

## Acceptance Criteria

1. **AC1: Parallel spawn** — N agent instances are spawned in parallel via Promise.all
2. **AC2: Independent provider** — Each agent receives its own LLM provider with unique config
3. **AC3: Temp session** — Each agent gets a temporary Agent Session with isolated notebook scope
4. **AC4: Cleanup** — After each agent's output is collected, its temp session is deleted

## Tasks / Subtasks

- [ ] Task 1: Concurrent dispatch in Orchestrator (AC: 1, 2)
  - [ ] Use Promise.all to run all agents concurrently
  - [ ] Each agent uses own LLM provider
- [ ] Task 2: Temp session lifecycle (AC: 3, 4)
  - [ ] Create temp sessions for each agent
  - [ ] Delete temp sessions after output collected
- [ ] Task 3: Verify typecheck
  - [ ] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] Temp session IDs follow pattern `agent-session-{N}` for traceability — matches the `{N}` index from the registered roster
- [x] [Review][Decision] `Promise.all` dispatches all agents concurrently — each agent gets `session.init()` called before run and `session.delete()` after, preventing cross-agent state leaks
- [x] [Review][Patch] Concurrent `session.init()` calls on different session IDs are safe — `SessionAdapter.init()` checks `=== undefined` before overwriting, and IDs are unique per agent [src/modules/Orchestrator.ts:159]
- [x] [Review][Patch] Research agent output is collected but not persisted to the Conversation Session — raw research outputs are passed only to the validation agent via `JSON.stringify` [src/modules/Orchestrator.ts:179-181]