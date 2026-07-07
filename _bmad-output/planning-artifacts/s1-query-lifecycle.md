# S1 — Query Lifecycle Sequence

**Scope:** User submits query → orchestrator lifecycle → agent creation → validation → output
**Actors:** User, Orchestrator, AgentFactory, LLMAgentWrapper (×3), ValidationAgent, KVCache

---

```mermaid
sequenceDiagram
    actor User
    participant TUI as TUIManager
    participant Orch as Orchestrator
    participant Factory as AgentFactory
    participant R1 as ResearchAgent 1
    participant R2 as ResearchAgent 2
    participant R3 as ResearchAgent 3
    participant Val as ValidationAgent
    participant KV as KVCache

    User->>TUI: types query
    TUI->>Orch: input(query)

    Note over Orch,KV: Phase 1 - Init
    Orch->>KV: init convSession
    Orch->>KV: create temp session slots x4

    alt JINA_API_KEY missing
        Orch->>TUI: warn websearch disabled
    end

    Note over Orch,TUI: Phase 2 - Research
    Orch->>TUI: showthinking researching...
    Orch->>Factory: createResearchAgent(config)
    Factory-->>Orch: agent instances

    par spawn 3 concurrent agents
        Orch->>R1: run(query, convHistory)
        Orch->>R2: run(query, convHistory)
        Orch->>R3: run(query, convHistory)
    end

    R1-->>Orch: output A
    Orch->>KV: delete temp session R1
    R2-->>Orch: output B
    Orch->>KV: delete temp session R2
    R3-->>Orch: output C
    Orch->>KV: delete temp session R3

    Note over Orch,Val: Phase 3 - Validation
    Orch->>TUI: clear indicator
    Orch->>Factory: createValidationAgent(config)
    Orch->>Val: run with outputs and convHistory

    Val->>TUI: showthinking intermediate thinking
    TUI->>User: streams thinking

    Val-->>Orch: finalAnswer
    Orch->>KV: delete temp session Val
    Orch->>KV: append assistant answer to convSession

    Note over Orch,User: Phase 4 - Output
    Orch->>TUI: output finalAnswer
    TUI->>User: renders final result
    Orch->>TUI: ready for next query
```

## Phase Breakdown

| Phase | Action | Temp Sessions |
|-------|--------|---------------|
| **Init** | App starts or new query arrives; conv session created/loaded; 4 temp session slots allocated | 0 active |
| **Research** | 3 agents spawned concurrently; each writes CoT to its temp session; sessions deleted on output | 3 → 0 |
| **Validation** | 1 agent synthesizes results via majority-vote; thinking streamed live; session deleted after append | 1 → 0 |
| **Output** | Final answer rendered; orchestrator awaits next query | 0 |
