---
baseline_commit: 11855b46969cbb9a34da983f22414f26776b22fe
---

# Story 1.5: SessionPort Interface & SessionAdapter

Status: in-progress

## Story

As a developer,
I want the ISessionPort interface and its SessionAdapter implementation,
so that the orchestrator can manage Conversation Sessions and temp Agent Sessions.

## Acceptance Criteria

1. **AC1: init + set + get** — Given a SessionAdapter backed by KVCache, when I call `init(id)` then `set(id, data)` then `get(id)`, the stored session data is returned
2. **AC2: delete** — `delete(id)` removes the session
3. **AC3: no overwrite** — `init` on an existing id does not overwrite data

## Tasks / Subtasks

- [x] Task 1: Define `ISessionPort` interface (AC: 1, 2, 3)
  - [x] Create `src/interface/ISessionPort.ts` with `init(id)`, `get(id)`, `set(id, data)`, `delete(id)` methods
- [x] Task 2: Implement `SessionAdapter` (AC: 1, 2, 3)
  - [x] Create `src/service/SessionAdapter.ts` implementing ISessionPort
  - [x] `init(id)` only sets data if the key does not already exist (no overwrite per AC3)
  - [x] `set(id, data)` overwrites existing data unconditionally
  - [x] `get(id)` returns the stored session data or undefined
  - [x] `delete(id)` removes the session entry
- [x] Task 3: Verify typecheck (AC: all)
  - [x] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] Session data typed as `unknown` — callers cast at usage site, consistent with KVCache pattern.
- [x] [Review][Patch] `init` no-overwrite guard — uses `cache.get(id) === undefined` check before setting. Using strict `=== undefined` rather than truthiness check to correctly handle edge case where stored value is `null`, `false`, or `0`.

## Dev Notes

- **Session lifecycle**: Orchestrator owns the persistent Conversation Session. Per query: create N temp Agent Sessions → spawn research agents → on each agent's output, delete its temp session → spawn validation agent with its own temp session → on output appended to Conversation Session, delete validation temp session.
- **AC3 detail**: `init` must not overwrite. This is critical for session safety — if two callers try to init the same id concurrently, the first write wins.
- `SessionAdapter` does NOT scope keys with a prefix — it uses the raw `id` as the KVCache key. The orchestrator is responsible for choosing unique session IDs.

### Key Files to Create

```
src/interface/ISessionPort.ts      — ISessionPort interface (NEW)
src/service/SessionAdapter.ts       — SessionAdapter implementation (NEW)
```

### References

- [Source: epics.md#Story-15-SessionPort-Interface-&-SessionAdapter](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)
- [Source: architecture-diagrams.md#3-Session-Lifecycle](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/architecture-diagrams.md)

### Previous Story Intelligence

**Story 1.4** created:
- `src/interface/INoteToolPort.ts` — INoteToolPort interface
- `src/service/NoteToolAdapter.ts` — NoteToolAdapter implementation

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `src/interface/ISessionPort.ts` with `ISessionPort` interface (init, get, set, delete)
- Created `src/service/SessionAdapter.ts` with `SessionAdapter` class implementing ISessionPort
- `init` uses strict `undefined` check to avoid overwriting existing sessions (AC3)
- `npm run typecheck` passes with zero errors

### File List

- src/interface/ISessionPort.ts — new (ISessionPort interface)
- src/service/SessionAdapter.ts — new (SessionAdapter implementation)
