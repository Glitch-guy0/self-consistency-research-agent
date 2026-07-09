# Source Tree Analysis

**Generated:** 2026-07-09

```
self-consistency/
├── main.ts                          # ── Entry point: loads dotenv, wires singletons,
│                                        creates Orchestrator(TUIManager, SessionAdapter, kvCache)
│                                        and calls run()
│
├── src/
│   ├── interface/                   # Port contracts (hexagonal architecture "ports")
│   │   ├── IConsistencyProtocol.ts  # Top-level protocol: participate(), submission(), evaluation()
│   │   ├── ILLMProvider.ts          # LLM provider: message(), stream(), json(), outputFormat()
│   │   ├── INoteToolPort.ts         # Agent notebook: save(), read()
│   │   ├── ISessionPort.ts          # Session lifecycle: init(), get(), set(), delete()
│   │   ├── ITerminalPresenter.ts    # Styled output: render(), success(), fail(), warning()
│   │   ├── ITUIManager.ts           # Terminal UI: showthinking(), clear(), output(), input(), warn()
│   │   └── IWebSearchProvider.ts    # Web search: search(), parse()
│   │
│   ├── types/                       # Shared type definitions (no runtime code)
│   │   ├── config.ts                # Config interface (baseUrl, model, apiKey, jinaApiKey)
│   │   └── kvCache.ts               # KVCache interface (set, get, delete, clear)
│   │
│   ├── utils/                       # Singleton utilities
│   │   ├── config.ts                # Frozen config singleton, loaded from env at import time
│   │   └── kvCache.ts               # Frozen in-memory KV cache singleton
│   │
│   ├── service/                     # Adapter implementations (hexagonal "adapters")
│   │   ├── LLMProvider.ts           # → ILLMProvider: wraps OpenAI SDK responses.create()
│   │   ├── JinaSearchProvider.ts    # → IWebSearchProvider: calls Jina AI API
│   │   ├── NoteToolAdapter.ts       # → INoteToolPort: prefixes keys with session ID
│   │   └── SessionAdapter.ts        # → ISessionPort: CRUD wrapper around KVCache
│   │
│   ├── plugins/                     # Pluggable UI implementations
│   │   ├── ChalkPresenter.ts        # → ITerminalPresenter: chalk-based ANSI styling
│   │   ├── PlainPresenter.ts        # → ITerminalPresenter: no-op passthrough
│   │   └── TUIManager.ts            # → ITUIManager: animated spinner, readline input, clear-line
│   │
│   └── modules/                     # Core application logic
│       ├── Orchestrator.ts          # Top-level orchestration: input → spawn agents → validate → output
│       ├── AgentFactory.ts          # Factory: registers provider configs, spawns agent instances
│       ├── AgentWrapper.ts          # LLMAgentWrapper: stepwise CoT loop (max 30 steps)
│       └── ProviderFactory.ts       # Factory: composes web search provider with graceful degradation
│
├── docs/                            # Generated project documentation
├── .agents/                         # AI agent skill definitions
├── _bmad/                           # BMAD method configuration
├── _bmad-output/                    # BMAD generated artifacts (planning, implementation)
│
├── package.json                     # ESM module, scripts: dev/build/start/typecheck/clean
├── tsconfig.json                    # ESNext target, bundler resolution, #src path aliases
└── .env.example                     # Environment variable template
```

## Critical Folders

### `src/interface/` — Port Contracts (Hexagonal Ports)

The foundational layer. Every external capability the system needs is defined here as a TypeScript interface. No implementation details, no runtime dependencies. This is the contract that `src/service/` and `src/plugins/` implement.

### `src/modules/` — Application Core

The "what" of the application. Orchestrator drives the workflow, AgentFactory manages agent lifecycle, AgentWrapper implements the CoT loop, ProviderFactory composes optional services. Depends only on interfaces, never on concrete implementations.

### `src/service/` — Adapter Implementations (Hexagonal Adapters)

Concrete implementations of port interfaces. Swappable without changing core logic. Currently provides OpenAI LLM provider, Jina AI search, KV cache adapter with session isolation, and session management.

### `src/plugins/` — UI Implementations

Pluggable terminal output. ChalkPresenter provides styled output, PlainPresenter is a no-op for non-interactive use. TUIManager combines input/output with animated thinking display.

## Entry Points

| Entry Point | File | Purpose |
|---|---|---|
| Application | `main.ts` | Bootstrap, wire dependencies, start orchestrator |
| Orchestration | `src/modules/Orchestrator.ts` | Main workflow: prompt → research → validate → display |
| Agent Loop | `src/modules/AgentWrapper.ts` | Per-agent chain-of-thought iteration |
| LLM Interface | `src/interface/ILLMProvider.ts` | Contract all LLM providers must implement |

## Integration Points

| Integration | Direction | Mechanism |
|---|---|---|
| Orchestrator → AgentFactory | Calls `spawnAll()` | Returns array of `AgentInstance` |
| AgentFactory → LLMAgentWrapper | Instantiates per-agent | Each gets fresh LLMProvider + isolated NoteToolAdapter |
| LLMAgentWrapper → LLMProvider | Calls `json()` | OpenAI Responses API via SDK |
| LLMAgentWrapper → JinaSearchProvider | Calls `search()` | HTTP requests to Jina AI API |
| Orchestrator → TUIManager | Calls `input()`, `output()`, `showthinking()` | stdin/stdout via readline/chalk |
| Service layer → KVCache | Backend storage | In-memory singleton, session-prefixed keys |
