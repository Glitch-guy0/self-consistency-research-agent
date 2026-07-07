# Project Brief: Self-Consistency Research Agent

**Author:** Mary (Business Analyst)
**Date:** 2026-07-07

---

## Overview

A CLI-based self-consistency research agent built with Node.js/TypeScript (ESM). The system takes a user query, spawns 3 concurrent LLM workers running chain-of-thought, collects their outputs, passes them through a validation agent, and streams the result to the terminal.

## Architecture Style

Hexagonal (ports & adapters) — the core LLM provider is abstracted behind an interface with pluggable adapters for web search and note-taking. This provides configuration optionality for scale.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js (ESM) |
| Language | TypeScript 6.0.3 (strict) |
| Core deps | OpenAI SDK, Zod, Chalk |
| LLM Provider | OpenAI (via SDK) |
| Web Search | Jina Search API |
| Session Store | Redis (KV) |
| TUI | Chalk + terminal |

## Key Components

- **Orchestrator** — receives user query, initializes session, spawns 3 workers, triggers validation
- **Research Workers** — 3 concurrent chain-of-thought agents; loop until response type equals `output`
- **Validation Agent** — reviews research output before streaming to user
- **Web Search Adapter** — wraps Jina Search API (search + content parsing)
- **Note Tool Adapter** — per-LLM KV dictionary for temporary data storage
- **Session Manager** — Redis-backed KV store for notebook data + session lifecycle
- **TUI** — terminal UI with animated "researching..." indicator

## Session Lifecycle

- **Research Agent:** session created per query, chain-of-thought steps stored in notebook, session terminated after output delivered
- **Validation Agent:** session persists across multiple user turns

## Agent Tools

- **websearch:** Jina Search API (query → markdown results)
- **note:** per-LLM KV dictionary, not shared across workers

## Flow

1. User submits query via CLI
2. Session initialized in Redis KV store
3. 3 concurrent workers dispatched, each running chain-of-thought
4. Each worker checks response type — `output` means complete, otherwise save to notebook and continue
5. TUI shows "researching..." with animated dots during processing
6. All outputs collected and sent to validation agent
7. Validation agent's intermediate thinking streamed to user
8. Final validated result streamed to user

---

## Goal Verification Framework

| # | Goal | Success Criteria | Status |
|---|------|------------------|--------|
| G1 | CLI accepts user query | Input received, session initialized in KV | ☐ |
| G2 | 3 concurrent LLM workers | 3 API calls dispatched, each with chain-of-thought | ☐ |
| G3 | Response type resolution | Workers loop until type=`output`; intermediates saved to notebook | ☐ |
| G4 | TUI animation | "researching..." with animated dots during processing | ☐ |
| G5 | Validation agent review | Output passes through validation before delivery | ☐ |
| G6 | Streaming thinking process | Validation intermediate thinking streamed in real-time | ☐ |
| G7 | Session lifecycle | Research session terminates; validation session persists | ☐ |
| G8 | Hexagonal architecture | LLM provider isolated behind interface; tools injected as adapters | ☐ |
| G9 | Jina Search API integration | Search + parsing via Jina, abstracted behind `websearch` interface | ☐ |
