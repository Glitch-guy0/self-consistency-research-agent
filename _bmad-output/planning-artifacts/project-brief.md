# Project Brief: Self-Consistency Research Agent

**Author:** Mary (Business Analyst)
**Date:** 2026-07-07

---

## Overview

A CLI-based self-consistency research agent built with Node.js/TypeScript (ESM). The system takes a user query, spawns N concurrent research agents (configurable, default 3) each running chain-of-thought with their own LLM provider, collects their outputs, passes them through a validation agent using confidence scoring, and streams the result to the terminal.

## Architecture Style

Hexagonal (ports & adapters) — every adapter follows the composition pattern. The orchestrator composes only the adapters that are configured and available. Missing API keys don't throw errors; the adapter simply isn't composed and the system degrades gracefully.

Each research agent gets its own LLM provider instance with independent `baseUrl`, `model`, and `apiKey`, enabling different models/providers per agent (GPT-4o, Claude, Gemini, etc.) for genuine independence. Agents are registered via a two-phase factory: `registerResearchAgent(providerConfig)` builds the roster, `spawnAll()` dispatches them.

Both the note tool adapter and session adapter point to the same shared in-memory KV cache, keeping the storage layer unified and swappable.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js (ESM) |
| Language | TypeScript 6.0.3 (strict) |
| Core deps | OpenAI SDK, Zod, Chalk |
| LLM Provider | OpenAI (via SDK) |
| Web Search | Jina Search API (optional — `JINA_API_KEY` env var, falls back to internal knowledge) |
| Session Store | In-memory KV (session dictionary) |
| TUI | Chalk + terminal (via `ITerminalPresenter` interface — swappable) |

## Key Components

- **Orchestrator** — receives user query, initializes session, spawns agents, manages pipeline
- **LLM Agent Wrapper** — generic agent that takes a tool set + system prompt and runs chain-of-thought. Each spawned instance gets its own chain-of-thought loop and its own isolated notebook. This is the single reusable primitive for both research and validation.
- **Research Agents** — N concurrent LLM Agent Wrapper instances (configurable, default 3), each with its own `{websearch, note}` tools + research system prompt + private notebook + its own LLM provider
- **Validation Agent** — single LLM Agent Wrapper instance with its own `{note}` tool only + validation system prompt + private notebook (no web search)
- **LLM Provider** — wraps an LLM SDK (OpenAI-compatible); builds an execution object at runtime with configurable `baseUrl`, `model`, `apiKey`. Each research agent gets its own provider instance for cross-model diversity.
- **Web Search Provider** — wraps Jina Search API via `IWebSearchProvider` interface. Single `JinaSearchProvider` implementation uses separate URIs: `https://s.jina.ai/` for search and `https://r.jina.ai/` for parse. Constructor accepts optional `apiKey`; internally checks `JINA_API_KEY` env var. Falls back to agent internal knowledge when disabled, with a warning notification.
- **TerminalPresenter** — Optional styling component consumed by `TUIManager`. Interface `ITerminalPresenter` exposes `render({color?, bgcolor?, opacity?})` for fine-grained control plus `success()`, `fail()`, `warning()` wrappers. Two implementations: `ChalkPresenter` (uses Chalk when available) and `PlainPresenter` (no styling, direct terminal write). Swappable for any chalk-like library.
- **Note Tool Adapter** — per-agent KV dictionary scoped to that agent instance; each agent's notebook is isolated within the shared in-memory KV cache
- **Session Manager** — in-memory KV dictionary for session lifecycle; backed by the same shared in-memory KV cache as the note tool (implements SessionPort; swappable for Redis later)
- **TUI Manager** — terminal UI layer with:
  - `showthinking(text, {delay?, showall?})` — displays thinking/intermediate text; `delay` auto-clears after a duration, `showall` bypasses truncation
  - `clear()` — *(private)* clears the current thinking text
  - `_truncateLength()` — *(private)* calculates truncation boundary based on terminal dimensions
  - `output(string)` — displays final agent output
  - `input(placeholder)` — prompts user for input with a placeholder string
  - `warn(message)` — displays a warning notification (e.g., "websearch disabled, falling back to internal knowledge")
  - Optionally composes `ITerminalPresenter` for styled output; uses `ChalkPresenter` when Chalk is available, `PlainPresenter` when absent

## Session Lifecycle

- **Orchestrator (Conversation Session):** persistent session storing `{user, assistant}` pairs across query turns. Passed as context to each new query iteration.
- **Research Agents (temp sessions):** each agent gets a temporary session for its notebook. Deleted by the orchestrator after the agent's output is collected.
- **Validation Agent (temp session):** gets a temporary session for its notebook. Deleted by the orchestrator after the final answer is appended to the Conversation Session.

## Agent Tools

All adapters follow the composition pattern:
- **websearch:** Jina Search API via `IWebSearchProvider` — available to research agents only. Optional. If `JINA_API_KEY` is not set, the provider is omitted and the agent falls back to internal knowledge. A warning is shown via `warn()`.
- **note:** per-agent KV dictionary, not shared across agents

## Flow

1. TUI Manager calls `input("ask anything...")`, user submits query
2. Session initialized in in-memory KV store
3. TUI Manager calls `showthinking("researching...", {delay: 0, showall: true})` — animated dots render in terminal
4. N research agents dispatched concurrently (per factory roster), each with their own LLM provider + `{websearch, note}` tools + research system prompt
5. Each runs chain-of-thought, checking response type — `output` means complete, otherwise save to notebook and continue
6. All outputs collected and sent to validation agent (single instance, `{note}` tool only, validation system prompt) which uses confidence scoring and shows divergent results when answers disagree
7. Validation agent's intermediate thinking streamed via `showthinking(text, {delay: null, showall: true})`
8. Final result delivered via `output(string)`

---

## Goal Verification Framework

| # | Goal | Success Criteria | Status |
|---|------|------------------|--------|
| G1 | CLI accepts user query | Input received, session initialized in KV | ☐ |
| G2 | Concurrent research agents (configurable) | N agent instances dispatched (default 3), each with own LLM provider + `{websearch, note}` + research prompt | ☐ |
| G3 | Response type resolution | Agents loop until type=`output`; intermediates saved to notebook | ☐ |
| G4 | TUI animation | "researching..." with animated dots during processing | ☐ |
| G5 | Single agent wrapper | Both research and validation use the same LLM Agent Wrapper with different config | ☐ |
| G6 | Validation uses no web search | Validation agent instantiated with `{note}` only | ☐ |
| G7 | Streaming thinking process | Validation intermediate thinking streamed in real-time | ☐ |
| G8 | Session lifecycle | Research session terminates; validation session persists | ☐ |
| G9 | Composition pattern | All adapters composed by config; missing API keys disable adapters without errors | ☐ |
| G10 | Websearch optional | Falls back to internal knowledge when disabled, with `warn()` notification | ☐ |
| G11 | Jina Search API integration | Search + parsing with separate URIs via `IWebSearchProvider` / `JinaSearchProvider` | ☐ |
| G13 | Pluggable terminal styling | `TUIManager` optionally composes `ITerminalPresenter`; `ChalkPresenter` when chalk available, `PlainPresenter` fallback; swappable interface | ☐ |
