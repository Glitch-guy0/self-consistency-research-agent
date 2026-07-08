---
stepsCompleted:
  - step-01-prerequisites-validated
  - step-01-requirements-extracted
  - step-01-user-confirmed
  - step-02-epics-designed
  - step-02-epics-approved
  - step-03-stories-created
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

### Story 1.1: Project Scaffold

As a developer,
I want the project scaffold initialized with ESM, strict TypeScript, and directory structure,
So that I have a consistent foundation to build on.

**Acceptance Criteria:**

**Given** the project directory is empty
**When** I run `npm install`
**Then** package.json exists with `"type": "module"` and all core dependencies (openai, zod, chalk, dotenv)
**And** tsconfig.json exists with strict mode, ESNext target, bundler moduleResolution
**And** directories `src/lib/interface/`, `src/lib/providers/`, `src/lib/tui/`, `src/lib/agent/`, `src/lib/session/`, `src/util/` exist
**And** .env.example contains placeholders for BASE_URL, MODEL, API_KEY, JINA_API_KEY

### Story 1.2: Environment & Config Loader

As a developer,
I want a configuration module that reads .env and provides typed config values,
So that API keys and settings are loaded consistently across the application.

**Acceptance Criteria:**

**Given** a `.env` file with BASE_URL, MODEL, API_KEY, and JINA_API_KEY
**When** the config module is loaded
**Then** it exports a typed object with those values
**And** missing variables produce a clear warning message
**And** JINA_API_KEY defaults to undefined (optional)

### Story 1.3: Shared In-Memory KVCache

As a developer,
I want a shared in-memory KV cache,
So that session and notebook data can be stored and retrieved from a single store.

**Acceptance Criteria:**

**Given** a fresh KVCache instance
**When** I call `set(key, value)` then `get(key)`
**Then** the stored value is returned
**And** `delete(key)` removes the entry
**And** `get` on a non-existent key returns undefined
**And** concurrent reads/writes do not corrupt data

### Story 1.4: NoteToolPort Interface & NoteToolAdapter

As a developer,
I want the INoteToolPort interface and its NoteToolAdapter implementation backed by KVCache,
So that agents have isolated per-instance notebook storage.

**Acceptance Criteria:**

**Given** a NoteToolAdapter backed by KVCache
**When** I call `save(key, value)` for agent session "session-A"
**Then** the data is stored under the agent-scoped key in KVCache
**And** `read(key)` for a different agent session returns undefined
**And** notebooks across agent sessions are fully isolated

### Story 1.5: SessionPort Interface & SessionAdapter

As a developer,
I want the ISessionPort interface and its SessionAdapter implementation,
So that the orchestrator can manage Conversation Sessions and temp Agent Sessions.

**Acceptance Criteria:**

**Given** a SessionAdapter backed by KVCache
**When** I call `init(id)` then `set(id, data)` then `get(id)`
**Then** the stored session data is returned
**And** `delete(id)` removes the session
**And** init on an existing id does not overwrite data

### Story 1.6: Core Port Interfaces

As a developer,
I want the remaining port interfaces defined — ILLMProvider, ITUIManager, IWebSearchProvider, IConsistencyProtocol,
So that all hexagonal boundaries are established before adapters are implemented.

**Acceptance Criteria:**

**Given** the interfaces directory
**When** I inspect `illm-provider.interface.ts`
**Then** it declares stream(), message(), json(), outputFormat() methods with generics
**And** `itui-manager.interface.ts` declares showthinking(), clear(), output(), input(), warn()
**And** `iweb-search-provider.interface.ts` declares search() and parse()
**And** `iconsistency-protocol.interface.ts` declares participate(), submission(), evaluation()
**And** all interfaces use `import type` for type-only imports

### Epic 2: LLM Provider & Web Search
Implement the LLM provider with configurable execution object and multiple output modes, and the optional Jina web search provider with graceful degradation when API key is missing.
**FRs covered:** FR-9, FR-10, FR-11, FR-12

### Story 2.1: LLMProvider Implementation

As a developer,
I want the LLMProvider class that builds an OpenAI SDK client from configurable parameters,
So that each agent can use its own LLM provider with independent baseUrl, model, and apiKey.

**Acceptance Criteria:**

**Given** an LLMProvider is constructed with `{baseUrl, model, apiKey}`
**When** the provider initializes
**Then** it creates an OpenAI SDK client using those parameters
**And** defaults are used when parameters are omitted
**And** the provider implements the ILLMProvider interface

### Story 2.2: Multiple Output Modes

As a developer,
I want the LLMProvider to support stream(), message(), and json() output modes,
So that agents and orchestrator can choose the appropriate output format.

**Acceptance Criteria:**

**Given** an LLMProvider instance
**When** `stream()` is called
**Then** it returns a ReadableStream
**And** `message()` returns a raw string
**And** `json()` returns parsed structured output (generic type U)
**And** `outputFormat(zodSchema)` configures schema validation for json() output
**And** calling `stream()` after `outputFormat()` throws or is disabled

### Story 2.3: JinaSearchProvider

As a developer,
I want a JinaSearchProvider that searches the web and parses page content via Jina API,
So that research agents can gather external information.

**Acceptance Criteria:**

**Given** a JinaSearchProvider with a valid API key
**When** `search(query)` is called
**Then** it hits `https://s.jina.ai/` with the query and returns markdown results
**And** `parse(url)` hits `https://r.jina.ai/` with the URL and returns parsed page content
**And** the API key is sent in the Authorization header
**And** constructor falls back to `JINA_API_KEY` env var if no explicit apiKey provided

### Story 2.4: Graceful Degradation Composition

As a developer,
I want JinaSearchProvider to be composed only when JINA_API_KEY is present,
So that the system degrades gracefully when web search is unavailable.

**Acceptance Criteria:**

**Given** JINA_API_KEY is missing from config
**When** the factory composes tools for research agents
**Then** JinaSearchProvider is not included in the toolset
**And** a warning notification is shown via warn() before agent dispatch
**And** research agents proceed using only the LLM's internal knowledge without errors

### Epic 3: Terminal UI & Presentation
Build the TUI manager with animated researching indicator, streaming validation thinking, warning notifications, and the optional terminal presenter with ChalkPresenter and PlainPresenter implementations.
**FRs covered:** FR-5, FR-6, FR-7, FR-8

### Story 3.1: TUIManager Core

As a developer,
I want the TUIManager with output(), input(), and clear() methods,
So that the orchestrator can communicate with the user via the terminal.

**Acceptance Criteria:**

**Given** a TUIManager instance
**When** `output(text)` is called
**Then** the text is displayed in the terminal
**And** `input(placeholder)` prompts the user and returns their input string
**And** `clear()` clears the current display
**And** TUIManager implements the ITUIManager interface

### Story 3.2: Animated Researching Indicator

As a user,
I want to see an animated "researching..." indicator while research agents are running,
So that I know the system is processing my query.

**Acceptance Criteria:**

**Given** research agents are dispatched
**When** `showthinking("researching...", {timeout: 0, showall: true})` is called
**Then** animated dots cycle (e.g., ".", "..", "...") while agents run
**And** the animation stops and clears when all research agents complete

### Story 3.3: Streaming Validation Thinking

As a user,
I want to see the validation agent's chain-of-thought stream in real-time,
So that I can understand its reasoning process.

**Acceptance Criteria:**

**Given** the validation agent is running
**When** `showthinking(text, {timeout: null, showall: true})` is called
**Then** text appears incrementally as the agent produces it
**And** the display does not auto-clear after each chunk
**And** the full thinking is visible to the user

### Story 3.4: Warning Notifications

As a user,
I want to see warning notifications when optional features are unavailable,
So that I understand why certain capabilities are disabled.

**Acceptance Criteria:**

**Given** a missing API key (e.g., JINA_API_KEY)
**When** `warn("websearch disabled, falling back to internal knowledge")` is called
**Then** the warning message is displayed before agent dispatch
**And** the warning is visually distinct from normal output

### Story 3.5: ITerminalPresenter & Implementations

As a developer,
I want an optional styled output layer with ChalkPresenter and PlainPresenter,
So that TUIManager can render styled output when Chalk is available.

**Acceptance Criteria:**

**Given** the ITerminalPresenter interface
**When** `render({color, bgcolor, opacity})` is called on ChalkPresenter
**Then** Chalk ANSI styling is applied to the output
**And** `PlainPresenter.render()` writes text directly without ANSI codes
**And** `success()`, `fail()`, `warning()` each delegate to render() with preset styles
**And** TUIManager accepts an optional ITerminalPresenter in its constructor
**And** when presenter is absent, all output renders as plain text

### Epic 4: Agent Pipeline & Orchestration
Implement the orchestrator, agent factory with two-phase lifecycle (registerResearchAgent + spawnAll), LLM agent wrapper with chain-of-thought loop, concurrent research agent dispatch, and validation agent with confidence scoring.
**FRs covered:** FR-1, FR-2, FR-3, FR-4

### Story 4.1: AgentFactory with Two-Phase Lifecycle

As a developer,
I want an AgentFactory that supports registerResearchAgent() and spawnAll() two-phase lifecycle,
So that the agent roster is built declaratively before dispatch.

**Acceptance Criteria:**

**Given** an AgentFactory instance
**When** `registerResearchAgent(providerConfig)` is called N times
**Then** each config is added to the internal roster
**And** `spawnAll()` creates LLMAgentWrapper instances for all registered agents
**And** `createValidationAgent(config)` creates a single validation agent instance
**And** ProviderConfig type includes baseUrl, model, apiKey
**And** ResearchAgentConfig includes tools, systemPrompt, sessionId, and provider
**And** ValidationAgentConfig includes tools, systemPrompt, sessionId (no provider — uses default or shared)

### Story 4.2: LLMAgentWrapper with CoT Loop

As a developer,
I want a single reusable LLMAgentWrapper that runs a chain-of-thought loop with response type resolution,
So that both research and validation agents use the same primitive with different configurations.

**Acceptance Criteria:**

**Given** an LLMAgentWrapper with ToolSet, systemPrompt, LLM provider, and session
**When** `run(query, convHistory)` is called
**Then** it enters a chain-of-thought loop calling step() on each iteration
**And** when the LLM response has `type === "output"`, the loop terminates
**And** intermediate responses (`type !== "output"`) are saved to the notebook via save()
**And** the final AgentOutput with type and content is returned

### Story 4.3: Orchestrator — Query Intake & Composition

As a developer,
I want an Orchestrator that receives the user query, composes available adapters by config, and manages the Conversation Session,
So that the pipeline has a central coordinator.

**Acceptance Criteria:**

**Given** a user query is submitted via TUI.input()
**When** the Orchestrator receives it
**Then** it appends `{user: query}` to the persistent Conversation Session
**And** it checks which adapters can be composed based on available API keys
**And** it delegates to AgentFactory for the roster
**And** a warning is shown via warn() when websearch is unavailable

### Story 4.4: Concurrent Dispatch & Temp Lifecycle

As a user,
I want research agents dispatched concurrently with their own temp sessions,
So that I get diverse perspectives in parallel.

**Acceptance Criteria:**

**Given** the roster is resolved
**When** the Orchestrator dispatches research agents
**Then** N agent instances are spawned in parallel via Promise.all (one per roster entry)
**And** each agent receives its own LLM provider with unique baseUrl, model, apiKey
**And** each agent gets a temporary Agent Session with isolated notebook scope
**And** after each agent's output is collected, its temp session is deleted

### Story 4.5: Validation Agent with Confidence Scoring

As a user,
I want the validation agent to analyze all research outputs and show confidence scores,
So that I see synthesized answers when agents agree and diverging results when they disagree.

**Acceptance Criteria:**

**Given** all research outputs are collected
**When** the Orchestrator dispatches the validation agent
**Then** the validation agent receives all outputs with its note-only toolset (no websearch)
**And** intermediate validation thinking streams to the TUI in real-time
**And** when outputs converge, a synthesized answer is produced
**And** when outputs diverge, confidence scores are shown alongside differing results
**And** the final answer is appended to the Conversation Session as `{assistant}`
**And** the validation agent's temp session is deleted after append
**And** confidence scoring is based on agreement-strength and citation overlap, not raw model logprobs
