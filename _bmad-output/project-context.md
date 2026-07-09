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
- **Import aliases** — use `#src/*` for internal imports; always include the `.ts` extension
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

- **Always code to interfaces** — every public capability must be defined in `src/interface/*.ts` before implementation. Classes implement interfaces, not the other way around.
- **Plan for scale** — design abstractions that support multiple strategies (e.g., multiple LLM providers, evaluation methods, TUI renderers). Use generics and dependency injection rather than hard-coding implementations.

### Folder Structure Conventions

```
src/
├── interface/   # Port contracts (ILLMProvider.ts, ITUIManager.ts, etc.)
├── types/       # Shared type definitions (kvCache.ts, config.ts)
├── utils/       # Pure helpers (config.ts, kvCache.ts, llmProvider.ts)
├── service/     # Adapter implementations (LLMProvider.ts, JinaSearchProvider.ts, etc.)
├── plugins/     # TUI + presenters (ChalkPresenter.ts, PlainPresenter.ts, TUIManager.ts)
└── modules/     # Application logic (AgentFactory.ts, AgentWrapper.ts, Orchestrator.ts, ProviderFactory.ts)
```

- **Interfaces** go in `src/interface/` — PascalCase with no suffix (e.g., `ILLMProvider.ts`)
- **Utilities** go in `src/utils/` — camelCase with no suffix (e.g., `config.ts`, `kvCache.ts`)
- **Types** go in `src/types/` — camelCase with no suffix (e.g., `config.ts`, `kvCache.ts`)
- **Services** go in `src/service/` — PascalCase class name (e.g., `LLMProvider.ts`, `SessionAdapter.ts`)
- **Plugins** go in `src/plugins/` — PascalCase class name (e.g., `ChalkPresenter.ts`, `TUIManager.ts`)
- **Modules** go in `src/modules/` — PascalCase class name (e.g., `Orchestrator.ts`, `AgentFactory.ts`)
- **Import via aliases** — use `#src/*` paths (e.g., `#src/interface/ILLMProvider.ts`, `#src/utils/config.ts`)
- **No barrel files** — always import from the specific module path
- **Dropped suffixes** — `.interface.ts`, `.provider.ts`, `.util.ts`, `.type.ts` — all redundant

## Critical Implementation Rules

