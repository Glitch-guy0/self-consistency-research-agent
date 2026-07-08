# S1 — Query Lifecycle Sequence

**Scope:** User submits query → orchestrator lifecycle → agent creation → validation → output
**Actors:** User, Orchestrator, AgentFactory (register → spawnAll), LLMAgentWrapper (×N), ValidationAgent, KVCache

---

```mermaid
sequenceDiagram
    actor User
    participant TUI as TUIManager
    participant Orch as Orchestrator
    participant Factory as AgentFactory
    participant R1 as ResearchAgent 1<br/>(own LLM provider)
    participant R2 as ResearchAgent 2<br/>(own LLM provider)
    participant RN as ResearchAgent N<br/>(own LLM provider)
    participant Val as ValidationAgent
    participant KV as KVCache

    User->>TUI: types query
    TUI->>Orch: input(query)

    Note over Orch,KV: Phase 1 - Init
    Orch->>KV: init convSession
    Orch->>Factory: getRoster() (built via registerResearchAgent calls)
    Factory-->>Orch: [agentConfigs with per-agent providers]

    alt JINA_API_KEY missing
        Orch->>TUI: warn websearch disabled
    end

    Note over Orch,KV: Session allocation AFTER composition resolved
    Orch->>KV: create temp sessions for N research agents
    Orch->>KV: create temp session for validation agent

    Note over Orch,TUI: Phase 2 - Research
    Orch->>TUI: showthinking researching...
    Orch->>Factory: spawnAll()
    Factory-->>Orch: [agent instances]

    par spawn N concurrent agents
        Orch->>R1: run(query, convHistory)
        Orch->>R2: run(query, convHistory)
        Orch->>RN: run(query, convHistory)
    end

    R1-->>Orch: output A
    Orch->>KV: delete temp session R1
    R2-->>Orch: output B
    Orch->>KV: delete temp session R2
    RN-->>Orch: output N
    Orch->>KV: delete temp session RN

    Note over Orch,Val: Phase 3 - Validation
    Orch->>TUI: clear indicator
    Orch->>Factory: createValidationAgent(config)
    Orch->>Val: run with outputs and convHistory

    Val->>TUI: showthinking intermediate thinking
    TUI->>User: streams thinking

    alt outputs agree
        Val-->>Orch: synthesized answer
    else outputs diverge
        Val-->>Orch: confidence scores + divergent results
    end
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
| **Init** | App starts or new query arrives; conv session created/loaded; factory roster resolved | 0 active |
| **Research** | N agents spawned concurrently (per factory roster); each writes CoT to its temp session with own LLM provider; sessions deleted on output | N → 0 |
| **Validation** | 1 agent synthesizes results via confidence scoring; divergent results shown when outputs disagree; thinking streamed live; session deleted after append | 1 → 0 |
| **Output** | Final answer rendered; orchestrator awaits next query | 0 |
