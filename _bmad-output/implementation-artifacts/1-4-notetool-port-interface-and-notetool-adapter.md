---
baseline_commit: 11855b46969cbb9a34da983f22414f26776b22fe
---

# Story 1.4: NoteToolPort Interface & NoteToolAdapter

Status: in-progress

## Story

As a developer,
I want the INoteToolPort interface and its NoteToolAdapter implementation backed by KVCache,
so that agents have isolated per-instance notebook storage.

## Acceptance Criteria

1. **AC1: save + read** — Given a NoteToolAdapter backed by KVCache, when I call `save(key, value)` for agent session "session-A", then the data is stored under the agent-scoped key in KVCache
2. **AC2: isolation** — `read(key)` for a different agent session returns undefined
3. **AC3: full isolation** — Notebooks across agent sessions are fully isolated (no cross-contamination)

## Tasks / Subtasks

- [x] Task 1: Define `INoteToolPort` interface (AC: 1)
  - [x] Create `src/interface/INoteToolPort.ts` with `save(key, value)` and `read(key)` methods
- [x] Task 2: Implement `NoteToolAdapter` (AC: 1, 2, 3)
  - [x] Create `src/service/NoteToolAdapter.ts` implementing INoteToolPort
  - [x] Constructor takes `KVCache` instance and `sessionPrefix` string
  - [x] Keys are scoped as `${sessionPrefix}:${key}` to isolate agent notebooks
- [x] Task 3: Verify typecheck (AC: all)
  - [x] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] Interface naming — used `INoteToolPort.ts`.
- [x] [Review][Patch] Key scoping — using `${sessionPrefix}:${key}` format ensures full isolation across agent sessions. Without the prefix, AC2 would fail since different sessions would collide.

## Dev Notes

- **Scoping strategy**: Each `NoteToolAdapter` instance is constructed with a unique `sessionPrefix` (e.g., `agent-session-1`). All keys are prefixed so notebooks are fully isolated.
- **Value semantics**: Values stored/returned by reference (same as KVCache) — consumers mutate notebook arrays in-place.
- The `INoteToolPort` interface is intentionally simple — just `save` and `read`. No `delete` since agent notebooks are cleaned up by deleting the entire session (via SessionAdapter).

### Key Files to Create

```
src/interface/INoteToolPort.ts    — INoteToolPort interface (NEW)
src/service/NoteToolAdapter.ts   — NoteToolAdapter implementation (NEW)
```

### References

- [Source: epics.md#Story-14-NoteToolPort-Interface-&-NoteToolAdapter](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)
- [Source: architecture-diagrams.md#4-Hexagonal-Architecture](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/architecture-diagrams.md)

### Previous Story Intelligence

**Story 1.3** created:
- `src/types/kvCache.ts` — KVCache interface
- `src/utils/kvCache.ts` — KVCacheImpl + frozen singleton `kvCache`

**Key Patterns:**
- Types in `src/types/*.ts`, interfaces in `src/interface/*.ts`, implementations in `src/service/*.ts` or `src/utils/*.ts`
- JSDoc with `@example` blocks on every public API
- `import type` for type-only imports
- `#src/*` import alias with `.ts` extension

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `src/interface/INoteToolPort.ts` with `INoteToolPort` interface (save, read)
- Created `src/service/NoteToolAdapter.ts` with `NoteToolAdapter` class implementing INoteToolPort
- Key scoping via `${sessionPrefix}:${key}` ensures per-agent isolation
- `npm run typecheck` passes with zero errors

### File List

- src/interface/INoteToolPort.ts — new (INoteToolPort interface)
- src/service/NoteToolAdapter.ts — new (NoteToolAdapter implementation)
