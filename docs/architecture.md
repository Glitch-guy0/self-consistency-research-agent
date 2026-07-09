# Architecture Documentation

## Executive Summary

Self-consistency is a terminal-based research agent framework written in TypeScript. It spawns multiple independent LLM agents to research a query in parallel, then validates and synthesises their outputs into a single answer with confidence scoring. The architecture follows hexagonal (ports & adapters) principles, ensuring the core domain logic is entirely decoupled from infrastructure concerns.

## Technology Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Runtime | Node.js | ESM | Modern JS runtime with native ESM support |
| Language | TypeScript | 6.0.3 | Type-safe development with strict mode |
| LLM SDK | OpenAI SDK | ^6.45.0 | Production-grade LLM client with streaming, structured output |
| Validation | Zod | ^4.4.3 | Runtime schema validation for agent output parsing |
| Terminal | Chalk | ^5.6.2 | Lightweight ANSI styling for terminal output |
| Config | Dotenv | ^17.4.2 | Standard env var loading |

## Architecture Pattern

**Hexagonal Architecture (Ports & Adapters)**

The system is organized into three concentric layers:

1. **Ports** (`src/interface/`) — TypeScript interfaces defining contracts for LLM providers, session management, note storage, terminal UI, web search, and the consistency protocol
2. **Core Domain** (`src/modules/`) — Application logic that depends only on port interfaces, never on concrete implementations
3. **Adapters** (`src/service/` + `src/plugins/`) — Concrete implementations of port interfaces that are injected into the core

### Layer Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     main.ts (Bootstrap)                   │
│  Loads config, wires singletons, creates Orchestrator     │
└──────────────────────┬───────────────────────────────────┘
                       │ injects
┌──────────────────────▼───────────────────────────────────┐
│  Orchestrator (src/modules/)                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ AgentFactory │  │ ProviderFact.│  │ TUIManager       │ │
│  └──────┬──────┘  └──────────────┘  └─────────────────┘ │
│         │ spawns                                          │
│  ┌──────▼────────────────────────────────────────────────┐│
│  │ LLMAgentWrapper (per-agent)                          ││
│  │  ┌────────────┐  ┌──────────────┐  ┌───────────────┐ ││
│  │  │ LLMProvider │  │ NoteToolAdapt│  │ JinaSearchProv│ ││
│  │  └────────────┘  └──────────────┘  └───────────────┘ ││
│  └───────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Orchestrator (`src/modules/Orchestrator.ts`)

The top-level coordinator that:
- Prompts the user for a research query (with 500-char limit)
- Loads or creates a conversation session
- Composes the web search provider (with graceful degradation)
- Registers N research agents via AgentFactory
- Spawns all agents and runs them in parallel via `Promise.all`
- Passes all research results to a validation agent
- Displays the final synthesised answer
- Persists the conversation history

### 2. AgentFactory (`src/modules/AgentFactory.ts`)

Manages agent lifecycle:
- Accepts per-agent LLM provider configurations
- `spawnAll()` creates `LLMAgentWrapper` instances with isolated providers and note tools
- Each agent gets a unique session ID for notebook isolation
- `createValidationAgent()` creates the single validation agent with a note tool

### 3. LLMAgentWrapper (`src/modules/AgentWrapper.ts`)

The chain-of-thought agent loop:
- Maximum 30 steps per agent (guard against infinite loops)
- Each step calls `provider.json()` with the query, system prompt, conversation history, and notebook context
- Parses structured JSON responses: `{type: "thinking"|"research"|"output", content, query?}`
- On "research" type: executes web search and stores results in notebook
- On "output" type: terminates and returns the final answer
- All intermediate thinking steps are persisted to the notebook

### 4. LLMProvider (`src/service/LLMProvider.ts`)

OpenAI Responses API adapter:
- Supports `message()`, `stream()`, and `json()` calls
- `outputFormat(schema)` enables server-side JSON mode for structured output
- Uses Zod schemas for client-side response validation
- Configurable base URL, model, API key per instance

### 5. Data Flow

```
User Input
    │
    ▼
Orchestrator.run()
    │
    ├─ Agent 1 ── LLMAgentWrapper.run() ── CoT loop (≤30 steps)
    │                 │                         │
    │                 │  ┌──────────────────┐    │
    │                 ├──│ LLMProvider.json() │◄──┤
    │                 │  └──────────────────┘    │
    │                 │  ┌──────────────────┐    │
    │                 └──│ JinaSearchProv.  │    │  (if type="research")
    │                    └──────────────────┘    │
    │  Notebook: step-N, search-N entries        │
    │                                            │
    ├─ Agent 2 ── (same pattern, isolated session)
    │
    ├─ Agent 3 ── (same pattern, isolated session)
    │
    ▼
Validation Agent ── LLMAgentWrapper.run() ── synthesises all outputs
    │
    ▼
Display final answer with confidence scoring
```

## Data Architecture

### Sessions

- **Conversation Session** (`conv-session`): Persistent across queries, stores user/assistant message pairs
- **Agent Sessions**: Per-query, isolated per agent (e.g., `agent-session-<uuid>`)
- **Validation Session** (`val-session`): Per-query, for the validation agent

### Notebook Storage

- Backed by in-memory `KVCache` singleton
- Keys prefixed with session ID for isolation
- Stores: step-N (thinking/research entries), search-N (web search results)

### Agent Output Schema

```typescript
// Per-step response (Zod-validated):
{ type: "thinking", content: string }
{ type: "research", content: string, query: string }
{ type: "output", content: string }
```

## Development Workflow

### Setup

1. Clone repository
2. `npm install`
3. Copy `.env.example` to `.env` and configure:
   - `BASE_URL` — OpenAI-compatible API base URL
   - `MODEL` — Model name (e.g., `gpt-4o`)
   - `API_KEY` — API key
   - `JINA_API_KEY` — (optional) Jina AI API key for web search

### Running

```bash
npm run dev      # Development mode via ts-node
npm run build    # Compile TypeScript
npm start        # Run compiled output
```

### Code Conventions

- **ESM only** — `import`/`export` syntax, no `require()`
- **Strict TypeScript** — no `any`, explicit null handling, strict equality
- **Import aliases** — `#src/*` with `.ts` extension
- **Type-only imports** — `import type` for type-only dependencies
- **No barrel files** — import from specific module paths
- **No JSDoc by convention** — code is self-documenting

## Testing Strategy

No test framework is currently configured. The project is in an experimental phase with manual testing via terminal.

## Deployment Architecture

Currently designed for local/terminal execution only. No server deployment, containerization, or CI/CD configured.

---

_Generated using BMAD Method `document-project` workflow_
