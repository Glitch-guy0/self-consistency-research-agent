# Story 1.1: Project Scaffold

Status: ready-for-dev

## Story

As a developer,
I want the project scaffold initialized with ESM, strict TypeScript, and directory structure,
So that I have a consistent foundation to build on.

## Acceptance Criteria

1. **AC1: package.json** — exists with `"type": "module"` and all core dependencies (openai, zod, chalk, dotenv)
2. **AC2: tsconfig.json** — exists with strict mode, ESNext target, bundler moduleResolution
3. **AC3: Directory structure** — directories `lib/interface/`, `lib/providers/`, `lib/tui/`, `lib/agent/`, `lib/session/`, `lib/utils/`, `util/` exist
4. **AC4: .env.example** — contains placeholders for BASE_URL, MODEL, API_KEY, JINA_API_KEY
5. **AC5: .gitignore** — excludes node_modules and dist/
6. **AC6: Build verification** — `npm run typecheck` passes with no errors
7. **AC7: Build output** — `npm run build` succeeds, producing dist/

## Tasks / Subtasks

- [ ] Task 1: Audit and verify existing scaffold state (AC: all)
  - [ ] Confirm package.json is correct: ESM, deps, import aliases, scripts
  - [ ] Confirm tsconfig.json is correct: strict, ESNext, bundler, rootDir
  - [ ] Confirm .env.example has all 4 vars
  - [ ] Confirm .gitignore covers dist/ (currently only node_modules)
- [ ] Task 2: Create missing directories (AC: 3)
  - [ ] `lib/providers/`
  - [ ] `lib/tui/`
  - [ ] `lib/agent/`
  - [ ] `lib/session/`
  - [ ] `lib/utils/`
  - [ ] Add `.gitkeep` to empty dirs so they commit
- [ ] Task 3: Create entry point — `main.ts` (AC: 6, 7)
  - [ ] Should bootstrap config and orchestrator
  - [ ] Must typecheck and compile cleanly
- [ ] Task 4: Verify the build pipeline (AC: 6, 7)
  - [ ] `npm run typecheck` → zero errors
  - [ ] `npm run build` → dist/main.js produced

## Dev Notes

- The project ALREADY has: package.json, tsconfig.json, .env.example, lib/, util/, node_modules/ (deps installed), and a stub main.ts.
- Directories that ALREADY exist: `lib/interface/`, `lib/types/`, `util/`.
- Directories that NEED CREATING: `lib/providers/`, `lib/tui/`, `lib/agent/`, `lib/session/`, `lib/utils/`.
- The existing `lib/interface/` has 3 stub files (llmProvider.interface.ts, tui.interface.ts, consistency.interface.ts) — these are incomplete draft comments. **DO NOT rewrite them in this story**; Story 1.6 owns the proper port interfaces. Only ensure they don't break typechecking.
- The existing `util/llmProvider.util.ts` is a stub — **DO NOT implement it**; Story 2.1 owns the LLMProvider implementation.
- The existing `main.ts` imports OpenAI with a broken reference (missing `baseURL` definition). It must be fixed minimally to compile.
- `.gitignore` must be updated to exclude `dist/` (currently only has `node_modules`).
- Import aliases `#lib/*` and `#util/*` are already configured in package.json `"imports"`.
- The project uses root-level `lib/` NOT `src/lib/` — do NOT create a `src/` directory.

### Project Structure Notes

```
self-consistency/
├── lib/
│   ├── interface/    # All port interfaces (*.interface.ts) — exists, stubs present
│   ├── types/        # Shared types (*.type.ts) — exists, empty
│   ├── providers/    # NEEDS CREATION — adapter implementations
│   ├── tui/          # NEEDS CREATION — TUI & presenter implementations
│   ├── agent/        # NEEDS CREATION — agent wrapper & factory
│   ├── session/      # NEEDS CREATION — session manager
│   └── utils/        # NEEDS CREATION — library-scoped utilities
├── util/             # Root-level shared utilities (alias: #util/*) — exists
├── main.ts           # Entry point (exists, needs fix)
├── package.json      # OK
├── tsconfig.json     # OK
└── .env.example      # OK
```

### References

- [Source: epics.md#Story-11-Project-Scaffold](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)
- [Source: project-context.md#Folder-Structure-Conventions](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/project-context.md)
- [Source: PRD §6.1 In Scope](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/prds/prd-self-consistency-2026-07-07/prd.md)
- [Source: plan-locked-2026-07-07.md](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/plan-locked-2026-07-07.md)

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Existing scaffold audit: package.json ✓ (ESM, deps), tsconfig.json ✓ (strict, ESNext), .env.example ✓ (4 vars)
- Missing dirs identified: lib/providers/, lib/tui/, lib/agent/, lib/session/, lib/utils/
- .gitignore needs `dist/` added
- Stub files in lib/interface/ and util/ should NOT be implemented — later stories own them

### File List

- package.json (verify/update if needed)
- tsconfig.json (verify/update if needed)
- .env.example (verify/update if needed)
- .gitignore (update)
- main.ts (fix stub)
- lib/providers/ (create + .gitkeep)
- lib/tui/ (create + .gitkeep)
- lib/agent/ (create + .gitkeep)
- lib/session/ (create + .gitkeep)
- lib/utils/ (create + .gitkeep)
