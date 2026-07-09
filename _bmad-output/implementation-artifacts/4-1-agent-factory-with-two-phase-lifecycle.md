---
baseline_commit: HEAD
---

# Story 4.1: AgentFactory with Two-Phase Lifecycle

Status: in-progress

## Story

As a developer,
I want an AgentFactory that supports registerResearchAgent() and spawnAll() two-phase lifecycle,
so that the agent roster is built declaratively before dispatch.

## Acceptance Criteria

1. **AC1: registerResearchAgent** — `registerResearchAgent(providerConfig)` called N times adds each config to the internal roster
2. **AC2: spawnAll** — `spawnAll()` creates LLMAgentWrapper instances for all registered agents
3. **AC3: createValidationAgent** — `createValidationAgent(config)` creates a single validation agent instance
4. **AC4: ProviderConfig** — ProviderConfig type includes baseUrl, model, apiKey
5. **AC5: ResearchAgentConfig** — ResearchAgentConfig includes tools, systemPrompt, sessionId, and provider
6. **AC6: ValidationAgentConfig** — ValidationAgentConfig includes tools, systemPrompt, sessionId (no provider — uses default)

## Tasks / Subtasks

- [ ] Task 1: Define types (AC: 4, 5, 6)
  - [ ] Define ProviderConfig, ToolSet, ResearchAgentConfig, ValidationAgentConfig, AgentInstance
- [ ] Task 2: Implement AgentFactory class (AC: 1, 2, 3)
  - [ ] Implement registerResearchAgent() with internal roster array
  - [ ] Implement spawnAll() creating LLMAgentWrapper instances with LLMProvider per config
  - [ ] Implement createValidationAgent() with default LLMProvider
- [ ] Task 3: Verify typecheck
  - [ ] Run `npm run typecheck` — zero errors

### Review Findings

- [x] [Review][Decision] `spawnAll` returns `AgentInstance[]` (wrapper + sessionId) so orchestrator can track and clean up temp sessions
- [x] [Review][Decision] `ResearchAgentConfig` reflects what is composed by spawnAll, not a direct parameter — defined as an exported interface for type documentation
- [x] [Review][Decision] `createValidationAgent` creates its own `LLMProvider` with defaults (no config overrides) — matches AC6 "no provider — uses default"
- [x] [Review][Patch] `spawnAll` is marked `async` but contains no `await` calls — synchronous LLMProvider constructor is non-blocking, so this is acceptable for future extensibility [src/modules/AgentFactory.ts:153]
- [x] [Review][Patch] `registerResearchAgent` stores config by reference — configs are simple value objects so mutation-after-registration risk is negligible [src/modules/AgentFactory.ts:128]
