---
stepsCompleted:
  - step-01-prerequisites-validated
  - step-01-requirements-extracted
  - step-01-user-confirmed
  - step-02-epics-designed
  - step-02-epics-approved
inputDocuments:
  - prds/prd-self-consistency-2026-07-07/prd.md
  - architecture-diagrams.md
  - project-brief.md
  - class-diagram.md
  - object-diagram.md
  - plan-locked-2026-07-07.md
  - s1-query-lifecycle.md
  - s2-agent-cot-loop.md
  - party-mode/plan-validation-2026-07-07.html
---

# self-consistency - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for self-consistency, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: Query intake and conversation session — orchestrator receives user query from TUI.input(), appends to persistent Conversation Session as {user} entry
FR-2: Concurrent research agent dispatch — orchestrator spawns LLM Agent Wrapper instances concurrently from factory roster, each with composed tools, own LLM provider, temp Agent Session, and research system prompt
FR-3: Chain-of-thought loop with response type resolution — each agent runs a CoT loop checking response type field, terminates when type === "output", saves intermediate content to temp notebook
FR-4: Validation agent with confidence scoring — all research outputs passed to validation agent which uses agreement-strength scoring; when converged → synthesized answer, when diverged → confidence scores + differing results shown
FR-5: Animated "researching" indicator — TUI displays "researching..." with animated dots during research agent execution, auto-clears on completion
FR-6: Streaming validation thinking — validation agent's intermediate chain-of-thought streams to TUI in real-time via showthinking(text, {timeout: null, showall: true})
FR-7: Warning notifications — when optional adapter unavailable, TUI displays warning via warn() before agent dispatch
FR-8: Optional terminal presenter with styled output — TUIManager optionally composes ITerminalPresenter; ChalkPresenter when Chalk available, PlainPresenter fallback; success(), fail(), warning() wrappers
FR-9: Configurable execution object — LLM provider builds OpenAI execution object from configurable parameters (baseUrl, model, apiKey)
FR-10: Multiple output modes — provider supports stream() (ReadableStream), message() (raw string), and json() (parsed structured output); outputFormat(zodSchema) for schema validation
FR-11: Jina search and parse — JinaSearchProvider exposes search(query) → markdown via https://s.jina.ai/ and parse(url) → page content via https://r.jina.ai/
FR-12: Graceful degradation when disabled — when JINA_API_KEY missing, JinaSearchProvider not composed, warning displayed via warn(), agents fall back to LLM internal knowledge
FR-13: In-memory KV store — single shared JS object as KV cache with key structure {sessionKey: {notebook_agent1: [...], ..., session: {...}}}
FR-14: Session lifecycle — orchestrator owns persistent Conversation Session with {user, assistant} pairs across turns; creates/deletes temp Agent Sessions per query cycle

### NonFunctional Requirements

NFR-1: CLI-based tool — not a web app, API server, or GUI
NFR-2: Single-user system — no multi-user or collaborative features
NFR-3: Configurable agent count — default 3, configurable via agentCount, no hard limit
NFR-4: Graceful degradation — missing API keys disable adapters without errors
NFR-5: Hexagonal architecture — all external dependencies behind port interfaces
NFR-6: In-memory KV store for single-user CLI use (Redis deferred to post-v1)
NFR-7: Environment variables via .env for configuration (JINA_API_KEY, BASE_URL, MODEL, API_KEY)
NFR-8: Strict TypeScript 6.0.3 with ESM module system
NFR-9: Per-agent LLM provider independence — each research agent gets unique baseUrl, model, apiKey for cross-model diversity

### Additional Requirements

AR-1: Hexagonal architecture with defined port interfaces — ILLMProvider, ITUIManager, IWebSearchProvider, INoteToolPort, ISessionPort, IConsistencyProtocol
AR-2: Two-phase agent factory — registerResearchAgent(config) builds roster, spawnAll() dispatches instances
AR-3: Per-agent ProviderConfig with baseUrl, model, apiKey for research agents
AR-4: Optional ITerminalPresenter composed by TUIManager — ChalkPresenter (Chalk) or PlainPresenter (no styling)
AR-5: KVCache as shared in-memory store backing both NoteToolAdapter and SessionAdapter
AR-6: Session lifecycle — persistent Conversation Session, temp Agent Sessions per query, all temp sessions deleted after completion
AR-7: Agent ToolSet composition — websearch (optional, research agents only) + note (always composed)
AR-8: Confidence scoring normalization based on consistency analysis and citation overlap (not raw model logprobs)

### UX Design Requirements

None — CLI tool with no UI/UX design specification.

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-1 | Epic 4 | Query intake and conversation session |
| FR-2 | Epic 4 | Concurrent research agent dispatch |
| FR-3 | Epic 4 | Chain-of-thought loop with response type resolution |
| FR-4 | Epic 4 | Validation agent with confidence scoring |
| FR-5 | Epic 3 | Animated "researching" indicator |
| FR-6 | Epic 3 | Streaming validation thinking |
| FR-7 | Epic 3 | Warning notifications for missing adapters |
| FR-8 | Epic 3 | Optional terminal presenter with styled output |
| FR-9 | Epic 2 | Configurable LLM execution object |
| FR-10 | Epic 2 | Multiple output modes (stream, message, json) |
| FR-11 | Epic 2 | Jina search and parse |
| FR-12 | Epic 2 | Graceful degradation when web search disabled |
| FR-13 | Epic 1 | In-memory KV store |
| FR-14 | Epic 1 | Session lifecycle management |

## Epic List

### Epic 1: Foundation & Core Infrastructure
Set up the project skeleton, all hexagonal port interfaces, in-memory KV storage, session management, note tool adapter, and environment configuration via .env.
**FRs covered:** FR-13, FR-14

### Epic 2: LLM Provider & Web Search
Implement the LLM provider with configurable execution object and multiple output modes, and the optional Jina web search provider with graceful degradation when API key is missing.
**FRs covered:** FR-9, FR-10, FR-11, FR-12

### Epic 3: Terminal UI & Presentation
Build the TUI manager with animated researching indicator, streaming validation thinking, warning notifications, and the optional terminal presenter with ChalkPresenter and PlainPresenter implementations.
**FRs covered:** FR-5, FR-6, FR-7, FR-8

### Epic 4: Agent Pipeline & Orchestration
Implement the orchestrator, agent factory with two-phase lifecycle (registerResearchAgent + spawnAll), LLM agent wrapper with chain-of-thought loop, concurrent research agent dispatch, and validation agent with confidence scoring.
**FRs covered:** FR-1, FR-2, FR-3, FR-4
