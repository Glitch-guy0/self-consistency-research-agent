---
title: 'Environment & Config Loader'
type: 'feature'
created: '2026-07-08'
final_revision: '11855b46969cbb9a34da983f22414f26776b22fe'
baseline_revision: 'c09bc677812d61b4b5b184a7aee5cb037655e78c'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
---

<intent-contract>

## Intent

**Problem:** The app needs typed, validated configuration from `.env` but currently only has `import "dotenv/config"` in `main.ts` with no structured config object. Every subsequent epic depends on this — LLM providers need `baseUrl`/`model`/`apiKey`, web search needs `jinaApiKey`, and the orchestrator needs to know which adapters are available.

**Approach:** Create a `Config` type in `lib/types/config.type.ts` and a `loadConfig()` singleton in `lib/utils/config.util.ts` that reads from `process.env` (populated by dotenv), validates required fields, warns on missing values, and exports a frozen config object. Wire into `main.ts` by replacing the TODO placeholder.

## Boundaries & Constraints

**Always:**
- Required vars: `BASE_URL`, `MODEL`, `API_KEY` must be non-empty strings
- Optional var: `JINA_API_KEY` — defaults to `undefined` when missing
- Missing required vars produce `console.warn()` (not throw) — the app continues but dev is warned
- Config is a frozen singleton, loaded once at module import time
- Uses plain TypeScript interface + runtime string checks — NOT Zod (reserved for Story 2.2)
- ESM imports with `.ts` extension via `#lib/*` alias
- JSDoc on every exported function/type

**Block If:**
- `lib/types/` directory does not exist (it does — confirmed)

**Never:**
- Do not use `require()` or `module.exports`
- Do not use `any` type
- Do not throw errors for missing vars — only warn
- Do not add new dependencies

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| All vars present | `.env` has BASE_URL, MODEL, API_KEY, JINA_API_KEY | `config` object with all 4 string fields populated | No warning |
| JINA_API_KEY missing | `.env` has BASE_URL, MODEL, API_KEY only | `config.jinaApiKey` is `undefined` | No warning (optional field) |
| One required var missing | `.env` missing API_KEY | `config.apiKey` is empty string | `console.warn("Missing required env var: API_KEY")` |
| All required vars missing | No `.env` file | `config` has empty strings for required fields | `console.warn()` for each of the 3 required vars |
| Config accessed before load | Module import | Config is frozen and available synchronously | Not possible — module scope guarantees load order |

</intent-contract>

## Code Map

- `lib/types/config.type.ts` -- NEW: `Config` interface with typed fields
- `lib/utils/config.util.ts` -- NEW: `loadConfig()` function + singleton export
- `main.ts` -- UPDATE: replace `// TODO: Story 1.2` with config import and call

## Tasks & Acceptance

**Execution:**
- [x] `lib/types/config.type.ts` -- define `Config` interface with `baseUrl: string`, `model: string`, `apiKey: string`, `jinaApiKey: string | undefined`
- [x] `lib/utils/config.util.ts` -- implement `loadConfig()` that reads `process.env`, validates required fields with `console.warn()` on each missing var, returns a frozen `Readonly<Config>` singleton
- [x] `main.ts` -- replace `// TODO: Story 1.2` with `import { loadConfig } from "#lib/utils/config.util.ts"` and call `loadConfig()` before the `console.log`
- [x] `tsconfig.json` -- add `allowImportingTsExtensions: true` and `types: ["node"]` (required for `.ts` extension imports and `process` type resolution)

**Acceptance Criteria:**
- Given a `.env` with all 4 vars set, when `loadConfig()` runs, then the returned config has all fields populated and `jinaApiKey` is a string
- Given a `.env` missing `API_KEY`, when `loadConfig()` runs, then `console.warn` is called with a message containing "API_KEY"
- Given no `.env` file, when `loadConfig()` runs, then `console.warn` is called 3 times (once per required var)
- Given the config is loaded, then `Object.isFrozen(config)` is true
- Given the module is imported, then `npm run typecheck` passes with zero errors

## Spec Change Log

## Review Triage Log

### 2026-07-08 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 2 (low 2)
- defer: 1 (low 1)
- reject: 11
- addressed_findings:
  - `[medium]` `[patch]` Whitespace-only env var values now trimmed in config construction — empty/whitespace vars produce empty strings (required) or undefined (optional)
  - `[low]` `[patch]` Redundant `loadConfig()` call in `main()` removed — singleton import triggers module-level init; `config` import kept for eager loading

## Verification

**Commands:**
- `npm run typecheck` -- expected: zero errors
- `node --experimental-vm-modules node_modules/.bin/ts-node -e "import { config } from './lib/utils/config.util.ts'; console.log(JSON.stringify(config))"` -- expected: prints config object without crashing

**Manual checks (if no CLI):**
- Verify `lib/types/config.type.ts` exports a `Config` interface with the 4 fields
- Verify `lib/utils/config.util.ts` exports a `config` object that is frozen
