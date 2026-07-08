# Story 1.2: Environment & Config Loader

Status: ready-for-dev

## Story

As a developer,
I want a configuration module that reads `.env` and provides typed config values,
so that API keys and settings are loaded consistently across the application.

## Acceptance Criteria

1. **AC1: Typed config export** — Given a `.env` file with `BASE_URL`, `MODEL`, `API_KEY`, and `JINA_API_KEY`, when the config module is imported, it exports a typed object containing those values
2. **AC2: Missing variable warnings** — When any required variable (`BASE_URL`, `MODEL`, `API_KEY`) is missing from `.env`, a clear warning message is printed to stderr (not thrown as an error)
3. **AC3: Optional variable default** — `JINA_API_KEY` defaults to `undefined` when missing (graceful degradation for the optional web search adapter)
4. **AC4: Type safety** — The config object uses a TypeScript interface/type with proper types (strings for all values, `JINA_API_KEY` is `string | undefined`)

## Tasks / Subtasks

- [ ] Task 1: Create the config type definition (AC: 1, 4)
  - [ ] Define `Config` interface in `lib/types/config.type.ts`
  - [ ] Fields: `baseUrl: string`, `model: string`, `apiKey: string`, `jinaApiKey: string | undefined`
- [ ] Task 2: Implement the config loader (AC: 1, 2, 3)
  - [ ] Create `loadConfig()` function in `lib/utils/config.util.ts`
  - [ ] Read `dotenv/config` to populate `process.env`
  - [ ] Extract values: `process.env["BASE_URL"]`, `process.env["MODEL"]`, `process.env["API_KEY"]`, `process.env["JINA_API_KEY"]`
  - [ ] Validate required fields are non-empty strings
  - [ ] Warn via `console.warn()` for each missing required variable — do NOT throw
  - [ ] Default `jinaApiKey` to `undefined` when absent
  - [ ] Export a singleton config object (loaded once on module import)
- [ ] Task 3: Wire into main.ts (AC: 1)
  - [ ] Replace the `// TODO: Story 1.2` comment in `main.ts` with `loadConfig()` import and call
  - [ ] Verify `main.ts` still typechecks cleanly
- [ ] Task 4: Verify typecheck (AC: 4)
  - [ ] Run `npm run typecheck` — zero errors

## Dev Notes

- `dotenv` is already a dependency and `import "dotenv/config"` is already used in `main.ts` — the config loader can rely on `process.env` being populated
- All env var values are strings; no number parsing or boolean coercion needed
- `BASE_URL`, `MODEL`, `API_KEY` are required; `JINA_API_KEY` is optional — this mirrors `.env.example` exactly
- The config module should be a **singleton** (export a frozen `const config: Config` object) — loaded once at startup, read-only thereafter
- Place the type definition in `lib/types/config.type.ts` using `import type` for type-only imports
- Place the loader function in `lib/utils/config.util.ts` — follows the `lib/utils/*.util.ts` convention from project-context
- Existing `lib/types/` and `lib/utils/` directories already exist (created in Story 1.1)
- No barrel files — import directly: `import { config } from "#lib/utils/config.util.ts"` and `import type { Config } from "#lib/types/config.type.ts"`
- `console.warn()` is the correct channel for missing-var messages (visible but non-fatal), printed to stderr via the `warn` method on `console`
- Do NOT use Zod for this story — plain TypeScript interface + runtime string checks are sufficient. Zod validation is reserved for Story 2.2 (`outputFormat()`)
- The config object is consumed by: Story 2.1 (LLMProvider gets `baseUrl`, `model`, `apiKey`), Story 2.3 (JinaSearchProvider reads `jinaApiKey`), and Story 4.3 (Orchestrator checks adapter availability)

### Key Files to Create

```
lib/types/config.type.ts    — Config interface (NEW)
lib/utils/config.util.ts    — loadConfig() + singleton export (NEW)
main.ts                     — Wire in config loader (UPDATE)
```

### References

- [Source: epics.md#Story-12-Environment--Config-Loader](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)
- [Source: project-context.md#Language-Specific-Rules](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/project-context.md)
- [Source: plan-locked-2026-07-07.md#7-Environment-Variables](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/plan-locked-2026-07-07.md)
- [Source: PRD §4.5 Session & Note Tool](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/prds/prd-self-consistency-2026-07-07/prd.md)

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Create `lib/types/config.type.ts` with `Config` interface
- Create `lib/utils/config.util.ts` with `loadConfig()` and singleton export
- Update `main.ts` — replace TODO comment, import and call `loadConfig()`
- `npm run typecheck` passes with zero errors

### File List

- lib/types/config.type.ts — new
- lib/utils/config.util.ts — new
- main.ts — updated
