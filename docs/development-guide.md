# Development Guide

## Prerequisites

- **Node.js** v18+ (ESM-compatible)
- **npm** v9+
- **OpenAI-compatible API endpoint** with API key
- **(Optional) Jina AI API key** for web search functionality

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
BASE_URL=https://api.openai.com/v1
MODEL=gpt-4o
API_KEY=sk-...
JINA_API_KEY=   # Optional, for web search
```

### 3. Verify Setup

```bash
npm run typecheck
```

Should complete with no TypeScript errors.

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Run in development mode via `ts-node main.ts` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output from `dist/main.js` |
| `npm run typecheck` | Type-check without emitting files |
| `npm run clean` | Remove `dist/` directory |

## Project Structure

```
src/
├── interface/   # Port contracts (ILLMProvider, ITUIManager, etc.)
├── types/       # Shared type definitions (Config, KVCache)
├── utils/       # Singletons (config loader, KV cache)
├── service/     # Adapter implementations (LLM, search, session, notes)
├── plugins/     # UI implementations (Chalk, Plain, TUIManager)
└── modules/     # Application logic (Orchestrator, AgentFactory, AgentWrapper)
```

### Adding a New LLM Provider

1. Define any new types in `src/types/` or `src/interface/` if needed
2. Implement `ILLMProvider` interface from `src/interface/ILLMProvider.ts`
3. Place implementation in `src/service/`
4. Inject via `AgentFactory.registerResearchAgent({provider: new MyProvider()})`

### Adding a New Terminal Presenter

1. Implement `ITerminalPresenter` from `src/interface/ITerminalPresenter.ts`
2. Place in `src/plugins/`
3. Pass to `TUIManager` constructor

## Common Tasks

### Running with Multiple Agents

The system defaults to 3 research agents. Override via:

```typescript
// In Orchestrator constructor
new Orchestrator(tui, session, kvCache, undefined, 5) // 5 agents
```

### Disabling Web Search

Simply omit `JINA_API_KEY` from `.env`. The system will warn at startup but continue without search capability.

### Customizing System Prompts

Edit `RESEARCH_SYSTEM_PROMPT` and `VALIDATION_SYSTEM_PROMPT` constants in `src/modules/Orchestrator.ts`.

## Architecture Decisions

- **Hexagonal architecture** to keep domain logic testable and provider-swappable
- **In-memory KV cache** for session/notebook storage (no database dependency)
- **OpenAI Responses API** for structured JSON output with Zod validation
- **Max 30 iterations** per agent to prevent runaway token consumption
- **500-char query limit** to respect context window boundaries
- **Per-agent LLM config** via `AgentFactory.registerResearchAgent()` for flexible provider composition
