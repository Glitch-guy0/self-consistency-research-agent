---
baseline_commit: HEAD
---

# Story 4.3: Orchestrator — Query Intake & Composition

Status: in-progress

## Story

As a developer,
I want an Orchestrator that receives the user query, composes available adapters by config, and manages the Conversation Session,
so that the pipeline has a central coordinator.

## Acceptance Criteria

1. **AC1: Query intake** — Receives user query from TUI.input()
2. **AC2: Conversation append** — Appends `{user: query}` to the persistent Conversation Session
3. **AC3: Adapter check** — Checks which adapters can be composed based on config (ProviderFactory)
4. **AC4: Factory delegation** — Delegates to AgentFactory for the roster
5. **AC5: Warning** — Shows warn() when websearch is unavailable
6. **AC6: main.ts integration** — main.ts instantiates and uses Orchestrator

## Tasks / Subtasks

- [ ] Task 1: Implement Orchestrator class (AC: 1-5)
  - [ ] Implement constructor with TUI, session, kvCache, agentCount
  - [ ] Implement run() with query intake and adapter composition
  - [ ] Handle conversation session lifecycle
- [ ] Task 2: Update main.ts (AC: 6)
  - [ ] Import and instantiate Orchestrator, call run()
- [ ] Task 3: Verify typecheck
  - [ ] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] Orchestrator owns the Conversation Session lifecycle; messages stored as `Array<{user?, assistant?}>` under `conv-session` key
- [x] [Review][Decision] `getOrCreateConversation()` uses `session.init()` (no-overwrite) before checking for existing messages — handles both first-run and repeat-run scenarios correctly
- [x] [Review][Decision] `formatConversationHistory()` maps `{user}` and `{assistant}` entries to `User: / Assistant:` prefixed lines for LLM consumption
- [x] [Review][Patch] `composeWebSearch()` is called before agent registration — warning appears before any processing delay, matching FR-7 [lib/agent/orchestrator.ts:134]
- [x] [Review][Patch] `registerResearchAgent({})` uses empty config (all defaults) — all agents share the same LLM config; cross-model diversity requires explicit config overrides [lib/agent/orchestrator.ts:140]