# Self-Consistency Agent

An AI research system that spawns multiple parallel LLM agents to research a query independently, then uses a validation agent to synthesise their outputs into a single consistent answer.

## Environment Variables (`.env` / `.env.example`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_KEY` | Yes | — | Your OpenAI-compatible API key (ChatGPT, Azure, local LLM, etc.) |
| `BASE_URL` | No | `https://api.openai.com/v1` | Base URL for the OpenAI-compatible API endpoint |
| `MODEL` | No | `gpt-4o-mini` | Model identifier to use for all LLM calls |
| `JINA_API_KEY` | No | — | Jina AI API key for web search functionality (see setup below) |


Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

**Note:** `API_KEY` is mandatory — the app will throw an error at startup if it's missing.

The config is loaded in `src/utils/config.ts` and consumed throughout via a frozen singleton.

## Setup

### Prerequisites
- Node.js >= 18 (uses native `fetch`)
- npm

### Install & Run

```bash
npm install
npm run dev    # runs with tsx (hot-reload)
# or
npm run build && npm start
```

## Web Search via Jina AI

The system uses [Jina AI](https://jina.ai) for web search. When enabled, research agents can issue `{"type": "research", "query": "..."}` steps and receive live web results.

### Setup

1. Sign up at [jina.ai](https://jina.ai) and get an API key.
2. Add it to your `.env`:

```
JINA_API_KEY=your_jina_api_key_here
```

If `JINA_API_KEY` is not set or is empty, the web search provider is disabled and a warning is shown. Research agents will fall back to the LLM's internal (training) knowledge.

The provider is assembled in `src/modules/ProviderFactory.ts` — it checks for the key and instantiates `JinaSearchProvider` (`src/service/JinaSearchProvider.ts`) which calls:
- `https://s.jina.ai/<query>` — search endpoint
- `https://r.jina.ai/<url>` — URL reader/parse endpoint

## LLM Backend

The system uses the [OpenAI Node.js SDK](https://www.npmjs.com/package/openai) (`openai` package v6) under the hood — see `src/service/LLMProvider.ts`.

By default it points at `https://api.openai.com/v1` with your `API_KEY`, but you can swap in any OpenAI-compatible provider (Azure, Ollama, Together, etc.) by changing `BASE_URL`.

## Customising Agents

See `src/modules/Orchestrator.ts` for the main orchestration logic.

### Research Agents

Research agents are registered at lines 91–96. Each call to `registerResearchAgent()` accepts a `ProviderConfig`:

```ts
this.agentFactory.registerResearchAgent({
  baseUrl?: string,   // optional, overrides default
  model?: string,     // optional, overrides default
  apiKey?: string,    // optional, overrides default
});
```

You can give each agent a different model/provider to get diverse perspectives. Leave the object empty (`{}`) to use the defaults from `.env`.

The default system prompt (`RESEARCH_SYSTEM_PROMPT`, lines 19–32) instructs agents to respond in JSON with one of three step types: `thinking`, `research`, or `output`.

### Validation Agent

The validation agent is created at line 145. At line 142, a fresh `LLMProvider` is created:

```ts
const validationProvider = new LLMProvider();
```

This uses the default config from `.env` (`BASE_URL`, `MODEL`, `API_KEY`). To give the validator a different model or provider (e.g. a stronger reasoning model), pass options:

```ts
const validationProvider = new LLMProvider({
  model: "gpt-4o",
  // baseUrl: "...",
  // apiKey: "...",
});
```

The default validation prompt (`VALIDATION_SYSTEM_PROMPT`, lines 34–52) analyses research outputs for agreement, assigns confidence scores, and either synthesises a unified answer or presents divergent views.

### Agent Architecture

All agents use `LLMAgentWrapper` (`src/modules/AgentWrapper.ts`) which runs a loop (max 30 steps) where the LLM decides the next action. Steps are persisted to a note tool (in-memory KV cache) and fed back as context on each iteration, giving the agent working memory.
