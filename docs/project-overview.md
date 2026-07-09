# Self-Consistency - Project Overview

**Date:** 2026-07-09
**Type:** Library / CLI Agent Framework
**Architecture:** Hexagonal (Ports & Adapters)

## Executive Summary

A TypeScript-based experimental framework that implements the self-consistency AI methodology: spawning multiple independent LLM research agents to answer the same query in parallel, then validating their outputs for convergence or divergence. Designed for terminal-based interactive research sessions with optional web search integration.

## Project Classification

- **Repository Type:** Monolith
- **Project Type:** Library (TypeScript/Node.js)
- **Primary Language:** TypeScript 6.0.3 (ESM)
- **Architecture Pattern:** Hexagonal Architecture with hexagonal ports/adapters separation

## Technology Stack Summary

| Category | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | (ESM) | JavaScript runtime |
| Language | TypeScript | 6.0.3 | Type-safe development |
| LLM SDK | OpenAI SDK | ^6.45.0 | LLM provider communication |
| Validation | Zod | ^4.4.3 | Schema validation for agent outputs |
| Terminal | Chalk | ^5.6.2 | ANSI terminal styling |
| Config | Dotenv | ^17.4.2 | Environment variable loading |
| Dev Tool | ts-node | ^10.9.2 | TypeScript execution |

## Key Features

- **Parallel Research Agents:** Spawns configurable number (default 3) of independent LLM agents that each research the query through a chain-of-thought loop
- **Chain-of-Thought Loop:** Each agent iterates through thinking/research/output steps (max 30 iterations), with persistent notebook storage
- **Validation Agent:** Collects all research outputs, analyzes them for consistency, and produces a synthesised answer with confidence scoring
- **Web Search Integration:** Optional Jina AI web search provider; graceful degradation when API key is absent
- **Session Persistence:** Conversation history preserved across queries via KV cache-backed sessions
- **Terminal UI:** Animated thinking indicator, styled output via Chalk, readline-based input

## Architecture Highlights

- **Hexagonal Architecture:** Core domain logic in `src/modules/` depends only on interfaces in `src/interface/`; implementations in `src/service/` and `src/plugins/` are swappable
- **Interface-First Design:** Every public capability defined as a TypeScript interface before implementation
- **Dependency Injection:** Providers, tools, and presenters are injected via constructors
- **Session Isolation:** Each agent gets an independent notebook via key-prefixed KV cache, preventing cross-agent data leaks

## Development Overview

### Prerequisites

- Node.js (ESM-compatible, v18+)
- OpenAI-compatible API endpoint with API key
- (Optional) Jina AI API key for web search

### Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your BASE_URL, MODEL, API_KEY, (optional) JINA_API_KEY

# Run in development
npm run dev

# Build
npm run build

# Run production
npm start
```

### Key Commands

- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Typecheck:** `npm run typecheck`
- **Clean:** `npm run clean`

## Repository Structure

```
.
├── main.ts                 # Application entry point
├── src/
│   ├── interface/          # Port contracts (7 interfaces)
│   ├── types/              # Shared type definitions (2 files)
│   ├── utils/              # Utility singletons (config, KV cache)
│   ├── service/            # Adapter implementations (LLM, search, session, notes)
│   ├── plugins/            # TUI + presenter implementations
│   └── modules/            # Core application logic (orchestrator, agent factory, wrapper, provider factory)
├── docs/                   # Generated documentation
├── _bmad/                  # BMAD method configuration
├── _bmad-output/           # BMAD generated artifacts
└── .agents/                # AI agent skill definitions
```

## Documentation Map

- [index.md](./index.md) - Master documentation index
- [architecture.md](./architecture.md) - Detailed architecture
- [source-tree-analysis.md](./source-tree-analysis.md) - Directory structure
- [development-guide.md](./development-guide.md) - Development workflow

---

_Generated using BMAD Method `document-project` workflow_
