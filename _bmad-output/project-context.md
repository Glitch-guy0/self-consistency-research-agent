---
project_name: 'self-consistency'
user_name: 'Prajwal'
date: '2026-07-07'
sections_completed: ['technology_stack', 'language_specific_rules']
existing_patterns_found: 8
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Node.js** — ESM (`"type": "module"` in package.json)
- **TypeScript** 6.0.3 — strict mode, ESNext target, bundler moduleResolution
- **OpenAI SDK** ^6.45.0
- **Zod** ^4.4.3 — schema validation
- **Chalk** ^5.6.2 — terminal styling
- **Dotenv** ^17.4.2 — env var loading
- **ts-node** ^10.9.2 (dev)
- **@types/node** ^26.1.0 (dev)

### Language-Specific Rules

- **ESM only** — use `import`/`export` syntax; never use `require()` or `module.exports`
- **Strict TypeScript** — avoid `any`, handle `null`/`undefined` explicitly, use strict equality (`===`)
- **Import aliases** — use `#lib/*` and `#util/*` for internal imports; always include the `.ts` extension
- **Type-only imports** — use `import type` when importing only types to avoid runtime side-effects
- **No barrel files** — import directly from the specific module path
- **Top-level await** — available (ESM); prefer async patterns over callbacks

### Documentation Rules

- **Every method must have JSDoc** including: a usage example, an explanation of *why* the method/class exists, and inline comments documenting the control flow
- Example:
  ```ts
  /**
   * Submits all participant prompts to their LLM providers and collects responses.
   * Exists to centralize the submission logic so participants remain decoupled
   * from the evaluation pipeline.
   *
   * @example
   * const consistency = new Consistency(participants);
   * const submissions = await consistency.submission();
   * // submissions: [{ participantId: "p1", response: "..." }, ...]
   */
  async submission(): Promise<Submission[]> {
    // 1. Iterate over each participant
    // 2. Call llmProvider.message() on each
    // 3. Collect and return results
  }
  ```

### Architecture & Design Rules

- **Always code to interfaces** — every public capability must be defined in `lib/interface/*.interface.ts` before implementation. Classes implement interfaces, not the other way around.
- **Plan for scale** — design abstractions that support multiple strategies (e.g., multiple LLM providers, evaluation methods, TUI renderers). Use generics and dependency injection rather than hard-coding implementations.

### Folder Structure Conventions

```
lib/
  interface/      # All interfaces (*.interface.ts)
  types/          # Shared type definitions & type aliases
  utils/          # Utility/helper functions (*.util.ts)
util/               # Root-level utilities (alias: #util/*)
```

- **Interfaces** always go in `lib/interface/` — suffix with `.interface.ts`
- **Utilities** go in either `lib/utils/` (library-scoped) or `util/` (root-level, shared), suffixed with `.util.ts`
- **Types** (type aliases, enums, constants) go in `lib/types/`
- **Import via aliases** — use `#lib/interface/foo.interface.ts`, `#lib/utils/bar.util.ts`, `#util/baz.util.ts`
- **No barrel files** — always import from the specific module path
- **Keep depth shallow** — prefer flat subdirectories over deep nesting for discoverability

## Critical Implementation Rules

