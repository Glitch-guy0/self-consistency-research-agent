# Architecture Diagrams: Self-Consistency Research Agent

**Author:** Paige (Technical Writer)
**Date:** 2026-07-07

---

## 1. Architecture Pipeline

```mermaid
flowchart LR
    subgraph User["User"]
        TUI["CLI / TUI"]
    end

    subgraph App["Application Layer"]
        Orchestrator["Orchestrator"]
        Session["Session Manager"]
        TUIMgr["TUI Manager\nshowthinking()\noutput()\ninput()\nwarn()"]
    end

    subgraph AgentInstance["Per-Agent Instance (spawned × N)"]
        direction TB
        CoT["Chain-of-Thought Loop"]
        Notebook["Own Notebook\n(per-agent KV scope)"]
    end

    subgraph LLM_Provider["LLM Providers (per-agent)"]
        direction TB
        P1["Research Agent 1\nprovider: config{baseUrl, model, apiKey}"]
        P2["Research Agent N\nprovider: config{baseUrl, model, apiKey}"]
    end

    subgraph Adapters["Adapters (Hexagonal — composed by config)"]
        WebSearch["JinaSearchProvider\n(Jina API) — optional"]
    end

    subgraph Storage["Shared In-Memory KV Cache"]
        KVCache["convSession: {user, assistant}[]<br/>── per query ──<br/>agentSession_1: {notebook: [...]}<br/>agentSession_N: {notebook: [...]}<br/>valSession: {notebook: [...]}<br/>── all temp sessions deleted after completion ──"]
    end

    TUI --> TUIMgr
    TUIMgr -->|input()| Orchestrator

    Orchestrator -->|owns| Session
    Session -->|reads/writes| KVCache

    Orchestrator -->|compose adapters\nby config| Adapters
    Orchestrator -->|spawn from roster + temp sessions| AgentInstance
    Orchestrator -->|delete temp sessions after done| KVCache
    Orchestrator -->|append output to convSession| KVCache

    CoT -.->|if composed| WebSearch
    CoT ..-> P1
    CoT ..-> P2

    CoT -->|save/read| Notebook
    Notebook -->|temp agent session| KVCache

    CoT -->|stream thinking/output| TUIMgr
    Orchestrator -->|warn()| TUIMgr
    TUIMgr -->|render| TUI
```

---

## 2. Request Flow (Sequence)

```mermaid
sequenceDiagram
    actor User
    participant TUI as CLI / TUI
    participant TUIMgr as TUI Manager
    participant Orch as Orchestrator
    participant Factory as AgentFactory
    participant Conv as Conversation Session<br/>{user, assistant}[]
    participant W1 as Research Agent 1<br/>(own provider + tools + temp session)
    participant W2 as Research Agent 2<br/>(own provider + tools + temp session)
    participant WN as Research Agent N<br/>(own provider + tools + temp session)
    participant Val as Validation Agent<br/>(note + temp session)
    participant KV as Agent Session KV\n(Temp — per agent)

    User->>TUI: research query
    TUI->>TUIMgr: input("ask anything...")
    TUIMgr->>Orch: submit query
    Orch->>Conv: append {user: query}
    Orch->>Factory: getRoster()
    Factory-->>Orch: [agentConfigs]

    alt "no JINA_API_KEY"
        Orch->>TUIMgr: warn("websearch disabled, falling back to internal knowledge")
        TUIMgr->>TUI: render
    end

    Orch->>KV: create temp sessions for N research agents
    Orch->>KV: create temp session for validation agent

    Orch->>TUIMgr: showthinking("researching...", {delay: 0, showall: true})
    TUIMgr->>TUI: render

    par Concurrent Research
        Orch->>W1: run(query, conv history, {own provider, tools, temp session}, research-prompt)
        Orch->>W2: run(query, conv history, {own provider, tools, temp session}, research-prompt)
        Orch->>WN: run(query, conv history, {own provider, tools, temp session}, research-prompt)
    end

    loop Chain of Thought (per agent)
        W1->>W1: step() using own LLM provider
        alt type != "output"
            W1->>KV: save to temp notebook
        else type == "output"
            W1-->>Orch: final result
            Orch->>KV: delete W1 temp session
        end
    end

    Orch->>Val: validate(results, conv history, {note, temp session}, validation-prompt)
    Val->>TUIMgr: showthinking(intermediate, {delay: null, showall: true})
    TUIMgr->>TUI: render
    alt results agree
        Val-->>TUIMgr: output(synthesized answer)
    else results diverge
        Val-->>TUIMgr: output(confidence scores + divergent answers)
    end
    TUIMgr-->>TUI: render
    Orch->>Conv: append {assistant: validated result}
    Orch->>KV: delete all temp sessions
    Orch->>TUIMgr: ready for next query
```

---

## 3. Session Lifecycle (State)

```mermaid
stateDiagram-v2
    state "Conversation Session (Orchestrator)" as CS
    state "Query Cycle" as QC
    state "Research Agent Temp Session ×N" as RAS
    state "Validation Agent Temp Session" as VAS

    [*] --> CS: app starts
    CS --> QC: user submits query
    QC --> RAS: create N temp sessions, spawn agents (per roster)
    RAS --> RAS: chain-of-thought step (type != output)
    RAS --> QC: all agents output collected, temp sessions deleted
    QC --> VAS: create validation temp session
    VAS --> VAS: validate (confidence scoring, show divergences)
    VAS --> CS: output appended as {assistant}, temp session deleted
    CS --> QC: next query

    note right of CS: Persists across turns<br/>{user, assistant}[]
    note left of RAS: Deleted after output
    note left of VAS: Deleted after append
```

---

## 4. Hexagonal Architecture (Context)

```mermaid
flowchart TB
    subgraph Ports["Ports (Interfaces)"]
        IP_LM["LLMProviderPort"]
        IP_Web["IWebSearchProvider"]
        IP_Note["NoteToolPort"]
        IP_Session["SessionPort"]
    end

    subgraph CoreHex["Core Domain"]
        direction TB
        Wrapper["LLM Agent Wrapper\n(single primitive)"]
        Factory["Agent Factory\n(registerResearchAgent + spawnAll)"]
        Orch["Orchestrator\n(composes adapters by config, gets roster from factory)"]
        LLMConfig["Per-Agent Provider Config\n{baseUrl, model, apiKey}[]"]
    end

    subgraph AdaptersHex["Adapters"]
        JinaProvider["JinaSearchProvider\n(uses JINA_API_KEY env var)"]
        NoteAdapter["NoteToolAdapter\n(always composed)"]
        SessionAdapter["SessionAdapter\n(always composed)"]
    end

    subgraph LLM_Impl["LLM Provider Instances (per-agent)"]
        direction TB
        Provider1["Provider Instance 1\n(model A: baseUrl, apiKey)"]
        ProviderN["Provider Instance N\n(model B: baseUrl, apiKey)"]
    end

    subgraph Storage["Shared In-Memory KV Cache"]
        KVCache["convSession: {user, assistant}[]<br/>agentSession_N: {notebook: [...]} (temp)"]
    end

    subgraph External["External"]
        JinaAPI["Jina Search API\nsearch: https://s.jina.ai/\nparse: https://r.jina.ai/"]
    end

    Orch -->|compose| Factory
    Factory -->|registerResearchAgent| LLMConfig
    Factory -->|spawnAll| Wrapper
    Wrapper --> IP_LM
    Wrapper --> IP_Web
    Wrapper --> IP_Note
    Wrapper --> IP_Session

    IP_LM --> Provider1
    IP_LM --> ProviderN

    IP_Web --> JinaProvider
    IP_Note --> NoteAdapter
    IP_Session --> SessionAdapter

    NoteAdapter --> KVCache
    SessionAdapter --> KVCache

    JinaProvider --> JinaAPI

    style Factory fill:#e1f5e1,stroke:#2e7d32
    style KVCache fill:#fce4ec,stroke:#c62828
    style IP_Web stroke-dasharray: 5 5
    style JinaProvider stroke-dasharray: 5 5
```

---

## 5. Agent Configuration Matrix

```mermaid
flowchart LR
    subgraph Factory["Agent Factory"]
        direction TB
        Roster["registerResearchAgent(providerConfig)\n— called N times to build roster"]
        Spawn["spawnAll()\n— dispatches all registered agents"]
    end

    subgraph ResearchConfig["Per Research Agent Config"]
        direction TB
        RC["provider: {baseUrl, apiKey, model}<br/>tools: [websearch?, note]<br/>systemPrompt: research"]
    end

    subgraph ValidationConfig["Validation Agent"]
        direction TB
        VC["tools: [note]<br/>systemPrompt: validation<br/>instances: 1"]
    end

    subgraph PerInstance["Per Instance (spawned)"]
        direction TB
        CoT["own chain-of-thought loop"]
        NB["own notebook\n(isolated KV scope)"]
        LP["own LLM provider\n(per research agent)"]
    end

    Roster --> ResearchConfig
    Spawn --> PerInstance
    ResearchConfig --> PerInstance
    ValidationConfig --> PerInstance
```

---

## 6. TerminalPresenter — Optional Styling Component

`TUIManager` optionally composes an `ITerminalPresenter` at construction. When Chalk is available, `ChalkPresenter` provides colored output; when absent, `PlainPresenter` writes directly to terminal without styling. The interface is swappable for any chalk-like library.

```mermaid
classDiagram
    class ITerminalPresenter {
        <<Interface>>
        +render(opts: {color?: string; bgcolor?: string; opacity?: number}) void
        +success(text: string) void
        +fail(text: string) void
        +warning(text: string) void
    }

    class ChalkPresenter {
        -chalk: Chalk
        +render(opts: {color?: string; bgcolor?: string; opacity?: number}) void
        +success(text: string) void
        +fail(text: string) void
        +warning(text: string) void
    }

    class PlainPresenter {
        +render(opts: {color?: string; bgcolor?: string; opacity?: number}) void
        +success(text: string) void
        +fail(text: string) void
        +warning(text: string) void
    }

    class TUIManager {
        -chalk: string
        -currentThinking: string
        -presenter: ITerminalPresenter
        +showthinking(text: string, opts: string) void
        +clear() void
        +truncateLength() number
        +output(text: string) void
        +input(placeholder: string) string
        +useroutput() void
    }

    ITerminalPresenter <|.. ChalkPresenter : chalk implementation
    ITerminalPresenter <|.. PlainPresenter : fallback (no styling)
    TUIManager --> ITerminalPresenter : optional composition

    style ITerminalPresenter fill:#e3f2fd,stroke:#1565c0
    note for TUIManager "presenter is optional — TUIManager\ngracefully degrades when absent"
```
