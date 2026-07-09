# Epic 1 Context: Foundation & Core Infrastructure

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish the entire project scaffold, all hexagonal port interfaces, the shared in-memory KV cache, session management abstractions, note tool adapter, and environment configuration — giving every subsequent epic the skeleton, storage, and boundary definitions it depends on. Covers FR-13 (in-memory KV store) and FR-14 (session lifecycle).

## Stories

- Story 1.1: Project Scaffold
- Story 1.2: Environment & Config Loader
- Story 1.3: Shared In-Memory KVCache
- Story 1.4: NoteToolPort Interface & NoteToolAdapter
- Story 1.5: SessionPort Interface & SessionAdapter
- Story 1.6: Core Port Interfaces

## Requirements & Constraints

- All external dependencies must be behind port interfaces (hexagonal architecture, NFR-5). No implementation code imports an SDK/library directly — only interfaces.
- KV store must be a single shared in-memory JS object, keyed hierarchically (`{sessionKey: {notebook_agent1: [...], session: {...}}}`), supporting concurrent reads/writes without corruption (FR-13, NFR-6).
- One persistent Conversation Session (`{user, assistant}[]`) owned by the orchestrator; temp Agent Sessions created per query cycle and deleted after completion (FR-14).
- Env vars loaded via dotenv: `BASE_URL`, `MODEL`, `API_KEY`, `JINA_API_KEY`. Missing vars produce clear warnings; `JINA_API_KEY` is optional (NFR-7).
- Strict TypeScript 6.0.3 with ESM — no `require()`, no `any`, strict equality, explicit null/undefined handling (NFR-8).
- Configurable agent count (default 3) — no hard limit (NFR-3).

## Technical Decisions

- **Hexagonal architecture**: Port interfaces in `src/interface/*.ts`, adapters in `src/service/`, core domain (Orchestrator, AgentFactory, LLMAgentWrapper) depends only on interfaces.
- **KVCache**: Plain JS `Map` or object — single instance shared across the app. Both `NoteToolAdapter` and `SessionAdapter` receive the same cache instance.
- **Session lifecycle**: Orchestrator owns the Conversation Session. Per query: create N temp Agent Sessions → spawn research agents → on each agent's output, delete its temp session → spawn validation agent with its own temp session → on output appended to Conversation Session, delete validation temp session.
- **Config model**: `ProviderConfig` type (`{baseUrl, model, apiKey}`) for per-agent LLM provider setup. Config loaded from `.env` via `dotenv` with typed exports and optional-key handling for `JINA_API_KEY`.
- **Port interfaces defined in this epic**:
  - `ILLMProvider` — `stream()`, `message()`, `json()`, `outputFormat(zodSchema)`
  - `ITUIManager` — `showthinking()`, `clear()`, `output()`, `input()`, `warn()`
  - `IWebSearchProvider` — `search(query)`, `parse(url)`
  - `IConsistencyProtocol` — `participate()`, `submission()`, `evaluation()`
  - `INoteToolPort` — `save(key, value)`, `read(key)`
  - `ISessionPort` — `init(id)`, `get(id)`, `set(id, data)`, `delete(id)`
- **Conventions**: ESM imports with `.ts` extension, `#src/*` import aliases, `import type` for type-only imports, no barrel files, JSDoc on every method.
- **Folder layout**: `src/interface/` (interfaces), `src/types/` (type aliases/constants), `src/utils/` (utilities), `src/service/` (adapters), `src/plugins/` (TUI + presenters), `src/modules/` (application logic).
- **Dependencies**: `openai`, `zod`, `chalk`, `dotenv` — all runtime; `typescript@6.0.3`, `ts-node`, `@types/node` — dev.

## Cross-Story Dependencies

- Story 1.4 (NoteToolAdapter) and Story 1.5 (SessionAdapter) depend on Story 1.3 (KVCache) — both receive the cache instance.
- Story 1.6 (Core Port Interfaces) should precede or run in parallel with 1.4/1.5 since those implement interfaces defined here.
- Story 1.2 (Config Loader) depends on Story 1.1 (Scaffold) — needs `package.json`, `tsconfig.json`, and `.env.example` to exist.
- Story 1.3 (KVCache) depends on Story 1.1 for the project skeleton.
