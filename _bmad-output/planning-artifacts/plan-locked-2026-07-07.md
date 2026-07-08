# Locked Product Plan: Self-Consistency Research Agent

**Date:** 2026-07-07
**Status:** LOCKED
**Author:** Paige (Technical Writer), with contributions from Mary (Analyst), John (PM), and Winston (Architect)

---

## Party Validation Summary

The plan was validated in a roundtable on 2026-07-07 with four perspectives:

| Persona | Role | Focus |
|---------|------|-------|
| 📊 Mary | Business Analyst | Evidence grounding, requirements precision, stakeholder representation |
| 📋 John | Product Manager | User value, PRD alignment, smallest shippable increment |
| 🏗️ Winston | System Architect | Architecture invariants, trade-offs, developer productivity |
| 📚 Paige | Technical Writer | Documentation clarity, diagram accuracy, reader's task |

---

## Decisions Locked

### 1. Agent Count — Configurable
- **Decision:** Default 3, configurable via `agentCount` in factory config
- **Rationale:** 3 is the smallest odd number > 1 for majority signal; parameterizing avoids hard-coding
- **Implementation:** `AgentFactory` accepts `agentCount: number` with default 3
- **No hard limit** — users can register as many agents as they want

### 2. Validation Strategy — Confidence Scoring
- **Decision:** Validation agent uses agreement-strength scoring across research outputs
- **When all 3+ answers agree:** Synthesized answer delivered as final output
- **When answers diverge:** Confidence scores shown alongside differing results so the user sees the disagreement
- **Normalization:** Based on consistency analysis and citation overlap, not raw model logprobs (since agents may use different providers)

### 3. LLM Provider — Per-Agent Registration
- **Decision:** Each research agent gets its own LLM provider with unique `(baseUrl, apiKey, model)`
- **Registration method:** `addResearchAgent(config)` on the factory specifies provider details
- **Diversity:** Agents can use different models/providers (GPT-4o, Claude, Gemini, etc.) for genuine independence
- **Factory roster:** Factory maintains the list of registered agents; orchestrator calls `spawnAll()` to dispatch

### 4. Connection Pooling — Deferred
- **Decision:** Post-performance-update; ship without it, measure, then decide
- **Rationale:** Not a correctness concern; purely a performance optimization

### 5. Sequence Diagram Fix
- **Decision:** Pre-allocation of temp session slots before composition was a diagram bug
- **Fix:** Session slots allocated after adapter composition is resolved

---

## Architecture Changes from Validation

### Two-Phase Agent Lifecycle

```
AgentFactory:
  registerResearchAgent(providerConfig)  → adds to roster
  spawnAll()                              → spawns all registered agents
```

### Provider Config Per Agent

```typescript
interface ResearchAgentConfig {
  tools: string[];
  systemPrompt: string;
  sessionId: string;
  provider: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
}
```

---

## Related Artifacts (Updated to Align)

- [Project Brief](project-brief.md) — Updated: configurable agent count, per-agent providers, N not 3
- [PRD](prds/prd-self-consistency-2026-07-07/prd.md) — Updated: status→locked, confidence scoring, per-agent providers, open question resolved
- [Architecture Diagrams](architecture-diagrams.md) — Updated: per-agent LLM providers, two-phase factory, confidence scoring validation, ×N research agents
- [Class Diagram](class-diagram.md) — Updated: two-phase factory (registerResearchAgent + spawnAll), per-agent ProviderConfig, roster management
- [Object Diagram](object-diagram.md) — Updated: per-agent LLM providers with unique configs, factory roster state, N agents
- [S1 — Query Lifecycle](s1-query-lifecycle.md) — Updated: session allocation after composition, per-agent providers, two-phase factory, confidence scoring
- [S2 — Agent CoT Loop](s2-agent-cot-loop.md) — No changes needed (internal loop unaffected by agent count/provider config)

---

*Locked by Prajwal after party validation on 2026-07-07. All 6 related artifacts updated to align. No further changes without a new round.*
