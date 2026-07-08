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

    subgraph LLM_Provider["LLM Provider"]
        direction TB
        Config["config: baseUrl, model, apiKey"]
        Exec["OpenAI Execution Object"]
    end

    subgraph Adapters["Adapters (Hexagonal — composed by config)"]
        WebSearch["Web Search Adapter\n(Jina API) — optional"]
        JiraAdapter["Jira Adapter\n(Jira REST API) — optional"]
    end

    subgraph Storage["Shared In-Memory KV Cache"]
        KVCache["convSession: {user, assistant}[]<br/>── per query ──<br/>agentSession_1: {notebook: [...]}<br/>agentSession_2: {notebook: [...]}<br/>agentSession_3: {notebook: [...]}<br/>valSession: {notebook: [...]}<br/>── all temp sessions deleted after completion ──"]
    end

    TUI --> TUIMgr
    TUIMgr -->|input()| Orchestrator

    Orchestrator -->|owns| Session
    Session -->|reads/writes| KVCache

    Orchestrator -->|compose adapters\nby config| Adapters
    Orchestrator -->|spawn 3x + temp sessions| AgentInstance
    Orchestrator -->|spawn 1x + temp session| AgentInstance
    Orchestrator -->|delete temp sessions after done| KVCache
    Orchestrator -->|append output to convSession| KVCache

    CoT -.->|if composed| WebSearch
    CoT -.->|if composed| JiraAdapter
    CoT --> Config
    Config --> Exec

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
    participant Conv as Conversation Session<br/>{user, assistant}[]
    participant W1 as Research Agent 1<br/>(composed tools + temp session)
    participant W2 as Research Agent 2<br/>(composed tools + temp session)
    participant W3 as Research Agent 3<br/>(composed tools + temp session)
    participant LLM as LLM Provider
    participant Val as Validation Agent<br/>(note + temp session)
    participant KV as Agent Session KV\n(Temp — per agent)

    User->>TUI: research query
    TUI->>TUIMgr: input("ask anything...")
    TUIMgr->>Orch: submit query
    Orch->>Conv: append {user: query}
    Orch->>KV: create temp sessions for research agents ×3
    Orch->>KV: create temp session for validation agent ×1

    alt "no JINA_API_KEY"
        Orch->>TUIMgr: warn("websearch disabled, falling back to internal knowledge")
        TUIMgr->>TUI: render
    end

    Orch->>TUIMgr: showthinking("researching...", {timeout: 0, showall: true})
    TUIMgr->>TUI: render

    par Concurrent Research
        Orch->>W1: run(query, conv history, {composed tools, temp session}, research-prompt)
        Orch->>W2: run(query, conv history, {composed tools, temp session}, research-prompt)
        Orch->>W3: run(query, conv history, {composed tools, temp session}, research-prompt)
    end

    loop Chain of Thought (per agent)
        W1->>LLM: step()
        LLM-->>W1: response {type, content}
        alt type != "output"
            W1->>KV: save to temp notebook
        else type == "output"
            W1-->>Orch: final result
            Orch->>KV: delete W1 temp session
        end
    end

    Orch->>Val: validate(results, conv history, {note, temp session}, validation-prompt)
    Val->>TUIMgr: showthinking(intermediate, {timeout: null, showall: true})
    TUIMgr->>TUI: render
    Val-->>TUIMgr: output(validated result)
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
    state "Research Agent Temp Session ×3" as RAS
    state "Validation Agent Temp Session" as VAS

    [*] --> CS: app starts
    CS --> QC: user submits query
    QC --> RAS: create 3 temp sessions, spawn agents
    RAS --> RAS: chain-of-thought step (type != output)
    RAS --> QC: all agents output collected, temp sessions deleted
    QC --> VAS: create validation temp session
    VAS --> VAS: validate (majority-vote reasoning)
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
        IP_Web["WebSearchPort\n(optional)"]
        IP_Jira["JiraPort\n(optional)"]
        IP_Note["NoteToolPort"]
        IP_Session["SessionPort"]
    end

    subgraph CoreHex["Core Domain"]
        direction TB
        Wrapper["LLM Agent Wrapper\n(single primitive)"]
        Factory["Agent Factory\n(research config / validation config)"]
        Orch["Orchestrator\n(composes adapters by config)"]
        LLMConfig["LLM Config\nbaseUrl, model, apiKey"]
    end

    subgraph AdaptersHex["Adapters"]
        JinaAdapter["JinaSearchAdapter\n(composed if JINA_API_KEY set)"]
        JiraAdapter["JiraAdapter\n(composed if JIRA_API_KEY set)"]
        NoteAdapter["NoteToolAdapter\n(always composed)"]
        SessionAdapter["SessionAdapter\n(always composed)"]
    end

    subgraph LLM_Impl["LLM Provider (Implementation)"]
        direction TB
        LLM_IF["Implements LLMProviderPort"]
        Builder["Builds OpenAI Execution Object\n(baseUrl, model, apiKey)"]
        SDK["OpenAI SDK"]
    end

    subgraph Storage["Shared In-Memory KV Cache"]
        KVCache["convSession: {user, assistant}[]<br/>agentSession_N: {notebook: [...]} (temp)"]
    end

    subgraph External["External"]
        JinaAPI["Jina Search API"]
        JiraExt["Jira REST API"]
    end

    Orch -->|compose| Factory
    Factory --> Wrapper
    Wrapper --> IP_LM
    Wrapper --> IP_Web
    Wrapper --> IP_Jira
    Wrapper --> IP_Note
    Wrapper --> IP_Session
    LLMConfig --> Wrapper

    IP_LM --> LLM_IF
    LLM_IF --> Builder
    Builder --> SDK

    IP_Web -.->|if composed| JinaAdapter
    IP_Jira -.->|if composed| JiraAdapter
    IP_Note --> NoteAdapter
    IP_Session --> SessionAdapter

    NoteAdapter --> KVCache
    SessionAdapter --> KVCache

    JinaAdapter --> JinaAPI
    JiraAdapter --> JiraExt

    style Factory fill:#e1f5e1,stroke:#2e7d32
    style KVCache fill:#fce4ec,stroke:#c62828
    style IP_Web stroke-dasharray: 5 5
    style IP_Jira stroke-dasharray: 5 5
    style JinaAdapter stroke-dasharray: 5 5
    style JiraAdapter stroke-dasharray: 5 5
```

---

## 5. Agent Configuration Matrix

```mermaid
flowchart LR
    subgraph Factory["Agent Factory"]
        direction TB
        A1["Research Agent<br/>systemPrompt: research<br/>tools: [websearch?, jira?, note]<br/>instances: 3"]
        A2["Validation Agent<br/>systemPrompt: validation<br/>tools: [note]<br/>instances: 1"]
    end

    subgraph PerInstance["Per Instance (spawned)"]
        direction TB
        CoT["own chain-of-thought loop"]
        NB["own notebook\n(isolated KV scope)"]
    end

    A1 --> PerInstance
    A2 --> PerInstance
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
