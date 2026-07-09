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

1. **AC1: ILLMProvider** — `illm-provider.interface.ts` declares stream(), message(), json(), outputFormat() methods with generics
2. **AC2: ITUIManager** — `itui-manager.interface.ts` declares showthinking(), clear(), output(), input(), warn()
3. **AC3: IWebSearchProvider** — `iweb-search-provider.interface.ts` declares search() and parse()
4. **AC4: IConsistencyProtocol** — `iconsistency-protocol.interface.ts` declares participate(), submission(), evaluation()
5. **AC5: import type** — All interfaces use `import type` for type-only imports

## Tasks / Subtasks

- [x] Task 1: Define `ILLMProvider` interface (AC: 1, 5)
  - [x] Create `lib/interface/illm-provider.interface.ts` with generic type params and stream/message/json/outputFormat methods
  - [x] Use `import type { ZodType } from "zod"` for the outputFormat parameter
  - [x] Remove old stub `lib/interface/llmProvider.interface.ts`
- [x] Task 2: Define `ITUIManager` interface (AC: 2, 5)
  - [x] Create `lib/interface/itui-manager.interface.ts` with showthinking/clear/output/input/warn methods
  - [x] Remove old stub `lib/interface/tui.interface.ts`
- [x] Task 3: Define `IWebSearchProvider` interface (AC: 3, 5)
  - [x] Create `lib/interface/iweb-search-provider.interface.ts` with search() and parse() methods
- [x] Task 4: Define `IConsistencyProtocol` interface (AC: 4, 5)
  - [x] Create `lib/interface/iconsistency-protocol.interface.ts` with participate()/submission()/evaluation() methods
  - [x] Remove old stub `lib/interface/consistency.interface.ts`
- [x] Task 5: Verify typecheck (AC: all)
  - [x] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] ILLMProvider generic params — `T` for json output type, `U` for outputFormat schema type. This matches the draft at `llmProvider.interface.ts` convention.
- [x] [Review][Decision] Zod dependency in interface — `outputFormat` takes `ZodType<V>` which couples the port interface to zod. Accepted per architecture decision (FR-10 requires schema validation; zod is the project's validation library).
- [x] [Review][Decision] ITUIManager.input() returns `Promise<string>` — terminal input is inherently async (reads from stdin), so the return type must be a Promise.
- [x] [Review][Decision] IConsistencyProtocol.evaluation() returns `Promise<{ result: string }>` — matches the streaming response requirement from the draft stub.

## Dev Notes

- **Naming convention**: Interface files use the `i` prefix + kebab-case (e.g., `illm-provider.interface.ts`) following AC file names.
- **import type**: All interface files use `import type` for type-only imports. No runtime imports in interface files.
- **Existing stubs**: The old `llmProvider.interface.ts`, `tui.interface.ts`, and `consistency.interface.ts` files are removed and replaced with properly named, typed interfaces.

### Key Files

```
lib/interface/illm-provider.interface.ts         — ILLMProvider interface (NEW, replaces llmProvider.interface.ts)
lib/interface/itui-manager.interface.ts           — ITUIManager interface (NEW, replaces tui.interface.ts)
lib/interface/iweb-search-provider.interface.ts   — IWebSearchProvider interface (NEW)
lib/interface/iconsistency-protocol.interface.ts  — IConsistencyProtocol interface (NEW, replaces consistency.interface.ts)
```

### References

- [Source: epics.md#Story-16-Core-Port-Interfaces](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)
- [Source: architecture-diagrams.md#4-Hexagonal-Architecture](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/architecture-diagrams.md)
- [Source: epic-1-context.md#Technical-Decisions](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/implementation-artifacts/epic-1-context.md)

### Previous Story Intelligence

**Stories 1.4-1.5** established the pattern for interface + implementation separation:
- Interfaces in `lib/interface/`, implementations in `lib/providers/` or `lib/session/`
- JSDoc with `@example` on every public API
- `import type` for type-only imports
- `#lib/*` import alias with `.ts` extension

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `lib/interface/illm-provider.interface.ts` with proper ILLMProvider generic interface (stream, message, json, outputFormat)
- Created `lib/interface/itui-manager.interface.ts` with proper ITUIManager interface (showthinking, clear, output, input, warn)
- Created `lib/interface/iweb-search-provider.interface.ts` with IWebSearchProvider interface (search, parse)
- Created `lib/interface/iconsistency-protocol.interface.ts` with IConsistencyProtocol interface (participate, submission, evaluation)
- Removed old stub files: `llmProvider.interface.ts`, `tui.interface.ts`, `consistency.interface.ts`
- All interfaces use `import type` for type-only imports
- `npm run typecheck` passes with zero errors

### File List

- lib/interface/illm-provider.interface.ts — new (ILLMProvider interface, replaces llmProvider.interface.ts)
- lib/interface/itui-manager.interface.ts — new (ITUIManager interface, replaces tui.interface.ts)
- lib/interface/iweb-search-provider.interface.ts — new (IWebSearchProvider interface)
- lib/interface/iconsistency-protocol.interface.ts — new (IConsistencyProtocol interface, replaces consistency.interface.ts)
- lib/interface/llmProvider.interface.ts — deleted (replaced)
- lib/interface/tui.interface.ts — deleted (replaced)
- lib/interface/consistency.interface.ts — deleted (replaced)
