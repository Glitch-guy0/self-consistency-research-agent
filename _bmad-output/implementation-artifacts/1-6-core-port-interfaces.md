---
baseline_commit: 11855b46969cbb9a34da983f22414f26776b22fe
---

# Story 1.6: Core Port Interfaces

Status: in-progress

## Story

As a developer,
I want the remaining port interfaces defined — ILLMProvider, ITUIManager, IWebSearchProvider, IConsistencyProtocol,
so that all hexagonal boundaries are established before adapters are implemented.

## Acceptance Criteria

1. **AC1: ILLMProvider** — `ILLMProvider.ts` declares stream(), message(), json(), outputFormat() methods with generics
2. **AC2: ITUIManager** — `ITUIManager.ts` declares showthinking(), clear(), output(), input(), warn()
3. **AC3: IWebSearchProvider** — `IWebSearchProvider.ts` declares search() and parse()
4. **AC4: IConsistencyProtocol** — `IConsistencyProtocol.ts` declares participate(), submission(), evaluation()
5. **AC5: import type** — All interfaces use `import type` for type-only imports

## Tasks / Subtasks

- [x] Task 1: Define `ILLMProvider` interface (AC: 1, 5)
  - [x] Create `src/interface/ILLMProvider.ts` with generic type params and stream/message/json/outputFormat methods
  - [x] Use `import type { ZodType } from "zod"` for the outputFormat parameter
  - [x] Remove old stub `src/interface/ILLMProvider.ts`
- [x] Task 2: Define `ITUIManager` interface (AC: 2, 5)
  - [x] Create `src/interface/ITUIManager.ts` with showthinking/clear/output/input/warn methods
  - [x] Remove old stub `src/interface/ITUIManager.ts`
- [x] Task 3: Define `IWebSearchProvider` interface (AC: 3, 5)
  - [x] Create `src/interface/IWebSearchProvider.ts` with search() and parse() methods
- [x] Task 4: Define `IConsistencyProtocol` interface (AC: 4, 5)
  - [x] Create `src/interface/IConsistencyProtocol.ts` with participate()/submission()/evaluation() methods
  - [x] Remove old stub `src/interface/IConsistencyProtocol.ts`
- [x] Task 5: Verify typecheck (AC: all)
  - [x] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] ILLMProvider generic params — `T` for json output type, `U` for outputFormat schema type.
- [x] [Review][Decision] Zod dependency in interface — `outputFormat` takes `ZodType<V>` which couples the port interface to zod. Accepted per architecture decision (FR-10 requires schema validation; zod is the project's validation library).
- [x] [Review][Decision] ITUIManager.input() returns `Promise<string>` — terminal input is inherently async (reads from stdin), so the return type must be a Promise.
- [x] [Review][Decision] IConsistencyProtocol.evaluation() returns `Promise<{ result: string }>` — matches the streaming response requirement from the draft stub.

## Dev Notes

- **Naming convention**: Interface files use PascalCase with `I` prefix (e.g., `ILLMProvider.ts`) and dropped the old `i` prefix + kebab-case convention.
- **import type**: All interface files use `import type` for type-only imports. No runtime imports in interface files.
- **Existing stubs**: The old stub files (`ILLMProvider.ts`, `ITUIManager.ts`, `IConsistencyProtocol.ts`) are removed and replaced with properly named, typed interfaces.

### Key Files

```
src/interface/ILLMProvider.ts         — ILLMProvider interface (NEW)
src/interface/ITUIManager.ts           — ITUIManager interface (NEW)
src/interface/IWebSearchProvider.ts   — IWebSearchProvider interface (NEW)
src/interface/IConsistencyProtocol.ts  — IConsistencyProtocol interface (NEW)
```

### References

- [Source: epics.md#Story-16-Core-Port-Interfaces](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)
- [Source: architecture-diagrams.md#4-Hexagonal-Architecture](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/architecture-diagrams.md)
- [Source: epic-1-context.md#Technical-Decisions](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/implementation-artifacts/epic-1-context.md)

### Previous Story Intelligence

**Stories 1.4-1.5** established the pattern for interface + implementation separation:
- Interfaces in `src/interface/`, implementations in `src/service/`
- JSDoc with `@example` on every public API
- `import type` for type-only imports
- `#src/*` import alias with `.ts` extension

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `src/interface/ILLMProvider.ts` with proper ILLMProvider generic interface (stream, message, json, outputFormat)
- Created `src/interface/ITUIManager.ts` with proper ITUIManager interface (showthinking, clear, output, input, warn)
- Created `src/interface/IWebSearchProvider.ts` with IWebSearchProvider interface (search, parse)
- Created `src/interface/IConsistencyProtocol.ts` with IConsistencyProtocol interface (participate, submission, evaluation)
- Removed old stub files
- All interfaces use `import type` for type-only imports
- `npm run typecheck` passes with zero errors

### File List

- src/interface/ILLMProvider.ts — new (ILLMProvider interface)
- src/interface/ITUIManager.ts — new (ITUIManager interface)
- src/interface/IWebSearchProvider.ts — new (IWebSearchProvider interface)
- src/interface/IConsistencyProtocol.ts — new (IConsistencyProtocol interface)
