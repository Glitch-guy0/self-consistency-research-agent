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
  - [x] Create `lib/interface/iNoteToolPort.interface.ts` with `save(key, value)` and `read(key)` methods
- [x] Task 2: Implement `NoteToolAdapter` (AC: 1, 2, 3)
  - [x] Create `lib/providers/noteToolAdapter.provider.ts` implementing INoteToolPort
  - [x] Constructor takes `KVCache` instance and `sessionPrefix` string
  - [x] Keys are scoped as `${sessionPrefix}:${key}` to isolate agent notebooks
- [x] Task 3: Verify typecheck (AC: all)
  - [x] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] Interface naming — used `iNoteToolPort.interface.ts` following `i` prefix convention established in Story 1.6 requirements. The interface uses a single generic approach rather than multiple type params since the notebook tool is simple key-value storage.
- [x] [Review][Patch] Key scoping — using `${sessionPrefix}:${key}` format ensures full isolation across agent sessions. Without the prefix, AC2 would fail since different sessions would collide.

## Dev Notes

- **Scoping strategy**: Each `NoteToolAdapter` instance is constructed with a unique `sessionPrefix` (e.g., `agent-session-1`). All keys are prefixed so notebooks are fully isolated.
- **Value semantics**: Values stored/returned by reference (same as KVCache) — consumers mutate notebook arrays in-place.
- The `INoteToolPort` interface is intentionally simple — just `save` and `read`. No `delete` since agent notebooks are cleaned up by deleting the entire session (via SessionAdapter).

### Key Files to Create

```
lib/interface/iNoteToolPort.interface.ts    — INoteToolPort interface (NEW)
lib/providers/noteToolAdapter.provider.ts   — NoteToolAdapter implementation (NEW)
```

### References

- [Source: epics.md#Story-14-NoteToolPort-Interface-&-NoteToolAdapter](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)
- [Source: architecture-diagrams.md#4-Hexagonal-Architecture](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/architecture-diagrams.md)

### Previous Story Intelligence

**Story 1.3** created:
- `lib/types/kvCache.type.ts` — KVCache interface
- `lib/utils/kvCache.util.ts` — KVCacheImpl + frozen singleton `kvCache`

**Key Patterns:**
- Types in `lib/types/*.type.ts`, interfaces in `lib/interface/*.interface.ts`, implementations in `lib/providers/*.provider.ts` or `lib/utils/*.util.ts`
- JSDoc with `@example` blocks on every public API
- `import type` for type-only imports
- `#lib/*` import alias with `.ts` extension

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `lib/interface/iNoteToolPort.interface.ts` with `INoteToolPort` interface (save, read)
- Created `lib/providers/noteToolAdapter.provider.ts` with `NoteToolAdapter` class implementing INoteToolPort
- Key scoping via `${sessionPrefix}:${key}` ensures per-agent isolation
- `npm run typecheck` passes with zero errors

### File List

- lib/interface/iNoteToolPort.interface.ts — new (INoteToolPort interface)
- lib/providers/noteToolAdapter.provider.ts — new (NoteToolAdapter implementation)
