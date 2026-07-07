# Project Brief: Self-Consistency Research Agent

**Author:** Mary (Business Analyst)
**Date:** 2026-07-07

---

## Overview

A CLI-based self-consistency research agent built with Node.js/TypeScript (ESM). The system takes a user query, spawns 3 concurrent LLM workers running chain-of-thought, collects their outputs, passes them through a validation agent, and streams the result to the terminal.

## Architecture Style

Hexagonal (ports & adapters) — the core LLM provider is abstracted behind an interface with pluggable adapters for web search and note-taking. This provides configuration optionality for scale.

The LLM provider implementation wraps the OpenAI SDK. At execution time it builds an OpenAI execution object with configurable `baseUrl`, `model`, and `apiKey` — all exposed at the top configuration layer.

Both the note tool adapter and session adapter point to the same shared in-memory KV cache, keeping the storage layer unified and swappable.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js (ESM) |
| Language | TypeScript 6.0.3 (strict) |
| Core deps | OpenAI SDK, Zod, Chalk |
| LLM Provider | OpenAI (via SDK) |
| Web Search | Jina Search API |
| Session Store | In-memory KV (session dictionary) |
| TUI | Chalk + terminal |

## Key Components

- **Orchestrator** — receives user query, initializes session, spawns agents, manages pipeline
- **LLM Agent Wrapper** — generic agent that takes a tool set + system prompt and runs chain-of-thought. Each spawned instance gets its own chain-of-thought loop and its own isolated notebook. This is the single reusable primitive for both research and validation.
- **Research Agents** — 3 concurrent LLM Agent Wrapper instances, each with its own `{websearch, note}` tools + research system prompt + private notebook
- **Validation Agent** — single LLM Agent Wrapper instance with its own `{note}` tool only + validation system prompt + private notebook (no web search)
- **LLM Provider** — wraps OpenAI SDK; builds an execution object at runtime with configurable `baseUrl`, `model`, `apiKey`. These configs are exposed at the top layer (orchestrator / agent factory).
- **Web Search Adapter** — wraps Jina Search API (search + content parsing)
- **Note Tool Adapter** — per-agent KV dictionary scoped to that agent instance; each agent's notebook is isolated within the shared in-memory KV cache
- **Session Manager** — in-memory KV dictionary for session lifecycle; backed by the same shared in-memory KV cache as the note tool (implements SessionPort; swappable for Redis later)
- **TUI Manager** — terminal UI layer with:
  - `showthinking(text, {timeout?, showall?})` — displays thinking/intermediate text; `timeout` auto-clears after a duration, `showall` bypasses truncation
  - `clear()` — *(private)* clears the current thinking text
  - `_truncateLength()` — *(private)* calculates truncation boundary based on terminal dimensions
  - `output(string)` — displays final agent output
  - `input(placeholder)` — prompts user for input with a placeholder string

## Session Lifecycle

- **Research Agent:** session created per query, chain-of-thought steps stored in notebook, session terminated after output delivered
- **Validation Agent:** session persists across multiple user turns

## Agent Tools

- **websearch:** Jina Search API (query → markdown results) — available to research agents only
- **note:** per-agent KV dictionary, not shared across agents

## Flow

1. TUI Manager calls `input("ask anything...")`, user submits query
2. Session initialized in in-memory KV store
3. TUI Manager calls `showthinking("researching...", {timeout: 0, showall: true})` — animated dots render in terminal
4. 3 concurrent research agents dispatched, each with `{websearch, note}` tools + research system prompt
5. Each runs chain-of-thought, checking response type — `output` means complete, otherwise save to notebook and continue
6. All outputs collected and sent to validation agent (single instance, `{note}` tool only, validation system prompt)
7. Validation agent's intermediate thinking streamed via `showthinking(text, {timeout: null, showall: true})`
8. Final result delivered via `output(string)`

---

## Goal Verification Framework

| # | Goal | Success Criteria | Status |
|---|------|------------------|--------|
| G1 | CLI accepts user query | Input received, session initialized in KV | ☐ |
| G2 | 3 concurrent research agents | 3 agent instances dispatched, each with `{websearch, note}` + research prompt | ☐ |
| G3 | Response type resolution | Agents loop until type=`output`; intermediates saved to notebook | ☐ |
| G4 | TUI animation | "researching..." with animated dots during processing | ☐ |
| G5 | Single agent wrapper | Both research and validation use the same LLM Agent Wrapper with different config | ☐ |
| G6 | Validation uses no web search | Validation agent instantiated with `{note}` only | ☐ |
| G7 | Streaming thinking process | Validation intermediate thinking streamed in real-time | ☐ |
| G8 | Session lifecycle | Research session terminates; validation session persists | ☐ |
| G9 | Hexagonal architecture | LLM provider isolated behind interface; tools injected as adapters | ☐ |
| G10 | Jina Search API integration | Search + parsing via Jina, abstracted behind `websearch` interface | ☐ |
