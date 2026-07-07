---
title: Self-Consistency Research Agent
created: 2026-07-07
updated: 2026-07-07
status: draft
---

# PRD: Self-Consistency Research Agent

## 0. Document Purpose

This PRD is for me (Prajwal) as the sole developer and user. It defines the scope, features, and requirements for a CLI-based self-consistency AI research tool. The architecture and system design are informed by the existing Project Brief and Architecture Diagrams in `_bmad-output/planning-artifacts/`. This PRD builds on those artifacts — it does not duplicate them.

## 1. Vision

A CLI tool that takes a user query, spawns 3 independent research agents running chain-of-thought, collects their outputs, and passes them through a validation agent that synthesizes a coherent answer using majority-vote reasoning. The entire pipeline runs in the terminal with animated feedback. Built with hexagonal architecture — every external dependency (LLM provider, web search, Jira, session store) is behind a port interface and composed only if configured, so the system degrades gracefully when API keys are missing.

## 2. Target User

### 2.1 Jobs To Be Done

- **Research faster:** Get a synthesized answer from multiple LLM perspectives in one go rather than running separate queries.
- **Validate assumptions:** Use the self-consistency check (3 agents + validator) to surface conflicting information and find the majority position.
- **Learn by watching:** See the chain-of-thought process of both research and validation agents.

### 2.2 Non-Users (v1)

- Non-technical users who expect a GUI.
- Teams / collaborative use.

### 2.3 Key User Journeys

- **UJ-1. Prajwal researches a topic and gets a validated answer.**
  Prajwal opens the terminal, runs the tool, and types a question. The orchestrator initializes the Conversation Session, spawns 3 research agents with temp sessions. The TUI shows "researching..." with animated dots. After agents complete, their temp sessions are deleted. The validation agent runs with its own temp session, thinking streams in real-time. Final answer is stored in Conversation Session as `{assistant}`, validation temp session deleted. Prajwal reads the output.

- **UJ-2. Prajwal runs the tool without a Jina API key.**
  The tool warns: "websearch disabled, falling back to internal knowledge." Research agents proceed using only the LLM's training data.

- **UJ-3. Prajwal asks a follow-up question.**
  Prajwal types a second query. The orchestrator passes the Conversation Session (with prior `{user, assistant}` pairs) as context. New agents are spawned with fresh temp sessions, research and validate, output stored back in the same Conversation Session.

## 3. Glossary

- **LLM Agent Wrapper** — Single reusable primitive that takes a tool set + system prompt and runs a chain-of-thought loop. Used for both research and validation agents.
- **Research Agent** — Instance of the LLM Agent Wrapper configured with `{websearch, jira, note}` tools + the sherlock research system prompt. 3 concurrent instances per query.
- **Validation Agent** — Instance of the LLM Agent Wrapper configured with `{note}` tool only + the athena validation system prompt. 1 instance runs after research agents complete.
- **Notebook** — Per-agent KV storage scoped to that agent instance. Stores intermediate chain-of-thought findings.
- **Conversation Session** — Persistent orchestrator-owned session storing `{user, assistant}` pairs across query turns.
- **Agent Session** — Temporary session created per agent instance (research or validation), deleted after that agent completes.
- **TUI Manager** — Terminal UI layer with `showthinking()`, `output()`, `input()`, `clear()`, and `warn()` methods.

## 4. Features

### 4.1 Agent Pipeline Orchestration

**Description:** The orchestrator receives a user query from the TUI, composes available adapters (websearch, jira, note) based on environment config, spawns 3 concurrent research agents, collects their outputs, dispatches to the validation agent, and streams the result back. The orchestrator owns a persistent Conversation Session storing `{user, assistant}` pairs. Each spawned agent gets a temporary Agent Session (for its notebook) that is deleted after completion. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Query intake and conversation session

The orchestrator receives a user query from `TUI.input()`, appends it to the persistent Conversation Session as a `{user}` entry.

**Consequences (testable):**
- Conversation Session exists before any agent is dispatched.
- Conversation Session accumulates `{user, assistant}` pairs across query turns.

#### FR-2: Concurrent research agent dispatch

The orchestrator spawns 3 LLM Agent Wrapper instances concurrently, each with composed tools (websearch + jira if configured, note always), a temporary Agent Session, and the research system prompt. Each agent gets its own isolated notebook scope within its temp session.

**Consequences (testable):**
- 3 agent instances are dispatched in parallel (Promise.all or equivalent).
- Each agent has its own temp Agent Session with isolated notebook scope.
- Notebooks are not shared between agents.

#### FR-3: Chain-of-thought loop with response type resolution

Each research agent runs a chain-of-thought loop. On each step, it calls the LLM and checks the response `type` field. If `type === "output"`, the loop terminates. Otherwise, intermediate content is saved to the agent's temp notebook and the loop continues.

**Consequences (testable):**
- Agent loops until `type === "output"`.
- Intermediate steps with `type !== "output"` are saved to the notebook.
- Orchestrator deletes the agent's temp session after collecting its output.

#### FR-4: Validation agent synthesis

All 3 research outputs are passed to the validation agent (configured with `{note}` tool only + temporary Agent Session + validation system prompt). It ranks similarity between answers and produces a coherent synthesized answer using majority-vote reasoning.

**Consequences (testable):**
- Validation agent receives all 3 research outputs as input.
- Validation agent does NOT have access to websearch or jira tools.
- Final output is a synthesized answer, not a raw concatenation.
- Orchestrator appends the final answer to the Conversation Session as `{assistant}` then deletes the validation agent's temp session.

### 4.2 TUI Layer

**Description:** Terminal UI providing animated feedback during processing and streaming validation thinking. Uses Chalk for terminal styling. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Animated "researching" indicator

While research agents run, the TUI displays "researching..." with animated dots cycling and auto-clears when agents complete.

**Consequences (testable):**
- Animated dots are visible during research agent execution.
- Animation stops and clears when all research agents complete.

#### FR-6: Streaming validation thinking

Validation agent's intermediate chain-of-thought streams to the TUI in real-time via `showthinking(text, {timeout: null, showall: true})`.

**Consequences (testable):**
- Text appears incrementally as the validation agent produces it.
- No auto-clear — user sees the full thinking.

#### FR-7: Warning notifications

When an optional adapter is unavailable (no API key), the TUI displays a warning via `warn(message)` before agent dispatch.

**Consequences (testable):**
- Missing JINA_API_KEY triggers "websearch disabled, falling back to internal knowledge".
- Missing JIRA_API_KEY triggers no warning (silent skip).

### 4.3 LLM Provider

**Description:** Wraps the OpenAI SDK behind a port interface. Builds an OpenAI execution object at runtime with configurable `baseUrl`, `model`, `apiKey`. Supports `stream()`, `message()`, and `json()` output modes. Accepts a Zod schema for structured output via `outputFormat()`.

**Functional Requirements:**

#### FR-8: Configurable execution object

LLM provider builds an OpenAI execution object from configurable parameters (`baseUrl`, `model`, `apiKey`) exposed at the orchestrator/agent factory level.

**Consequences (testable):**
- Provider accepts `baseUrl`, `model`, and `apiKey` at construction.
- Provider constructs a valid OpenAI client from these parameters.
- Defaults used when parameters are omitted.

#### FR-9: Multiple output modes

Provider supports `stream()` (ReadableStream), `message()` (raw string), and `json()` (parsed structured output). When a Zod schema is provided via `outputFormat()`, `json()` validates output against the schema.

**Consequences (testable):**
- `stream()` returns a ReadableStream.
- `message()` returns a string.
- `json()` returns parsed U (generic type).
- `outputFormat(zodSchema)` disables `stream()`.

### 4.4 Web Search Adapter (Jina)

**Description:** Optional adapter wrapping the Jina Search API. Provides search (query → markdown) and content parsing (URL → parsed content). Composed only if `JINA_API_KEY` is set. Realizes UJ-2.

**Functional Requirements:**

#### FR-10: Jina search and parse

Adapter exposes `search(query)` → markdown results and `parse(url)` → parsed page content via the Jina API.

**Consequences (testable):**
- `search()` hits `https://s.jina.ai/` with the query.
- `parse()` hits `https://r.jina.ai/` with the URL.
- Both use the configured API key in the `Authorization` header.

#### FR-11: Graceful degradation when disabled

When `JINA_API_KEY` is missing, the adapter is not composed. A warning displays via `warn()` and agents fall back to LLM internal knowledge.

**Consequences (testable):**
- No websearch adapter instance when key is missing.
- Warning notification is displayed.
- Agents continue without error.

### 4.5 Jira Adapter

**Description:** Optional adapter wrapping the Jira REST API. Composed only if `JIRA_API_KEY` is set.

**Functional Requirements:**

#### FR-12: Optional Jira integration

Adapter composed only if `JIRA_API_KEY` is present. When missing, silently excluded (no warning, no error).

**Consequences (testable):**
- No Jira adapter instance when key is missing.
- No warning or error shown.

### 4.6 Session & Note Tool

**Description:** In-memory KV store (JS object) shared across the application. Implements `SessionPort` and `NoteToolPort` interfaces. Session manager handles lifecycle; note tool provides per-agent isolated notebook storage. Swappable for Redis later via the same port interface.

**Functional Requirements:**

#### FR-13: In-memory KV store

A single shared JS object acts as the KV cache. Key structure: `{sessionKey: {notebook_agent1: [...], notebook_agent2: [...], ..., session: {...}}}`.

**Consequences (testable):**
- KV store is a plain JS object.
- Multiple agents can read/write their own notebook scopes concurrently.
- Session data stored under the same key.

#### FR-14: Session lifecycle

The orchestrator owns one persistent Conversation Session storing `{user, assistant}` pairs across turns. For each query, the orchestrator creates temp Agent Sessions for the 3 research agents and 1 validation agent. After all 4 complete, it deletes all temp sessions and stores the output in the Conversation Session.

**Consequences (testable):**
- Conversation Session persists across multiple query turns with accumulated `{user, assistant}` pairs.
- Research agent temp sessions are deleted by the orchestrator after output collection.
- Validation agent temp session is deleted after its output is appended to the Conversation Session.
- Conversation Session is passed to the next query iteration for context.
- Session store swappable for Redis by implementing the same port interface.

## 5. Non-Goals (Explicit)

- NOT a web application or API server.
- NOT a multi-user system.
- NOT a production-grade LLM proxy — it's a research tool.
- Redis integration not in scope for v1 (interface defined, in-memory KV used).

## 6. MVP Scope

### 6.1 In Scope

- CLI query intake with TUI feedback
- 3 concurrent research agents with chain-of-thought
- Web search via Jina (optional, degrades gracefully)
- Jira integration (optional, silent skip)
- Validation agent with majority-vote synthesis
- Streaming validation thinking
- In-memory KV session management
- Chalk-based terminal styling
- Hexagonal architecture with composition pattern

### 6.2 Out of Scope for MVP

- Redis / any external session store (interface defined, in-memory used)
- Persistent history / query logging
- Multiple concurrent users
- GUI / web interface
- Plugin system beyond research + validation agents

## 7. Success Metrics

Success: I use this tool regularly for research queries and find synthesized answers more useful than a single LLM response. Abandonment after the first week is a failure signal.

## 8. Open Questions

1. How should the TUI handle very long chain-of-thought output? Truncation strategy?
2. Should agent count be configurable (currently hardcoded to 3)?

## 9. Assumptions Index

- [ASSUMPTION from FR-2] Promise.all is sufficient for concurrency — no worker threads needed.
- [ASSUMPTION from FR-8] OpenAI SDK client construction is lightweight enough to build per-agent without perf impact.
- [ASSUMPTION from FR-13] Plain JS object is performant enough for single-user CLI use.
- [RESOLVED] API keys are provided via `.env` file (`BASE_URL`, `MODEL`, `API_KEY`, `JINA_API_KEY`, `JIRA_API_KEY`) — per existing `.env.example` convention.
