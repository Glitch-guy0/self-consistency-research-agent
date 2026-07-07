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
        KVCache["{sessionKey: {<br/>  notebook_agent1: [...],<br/>  notebook_agent2: [...],<br/>  session: {...}<br/>}}"]
    end

    TUI --> TUIMgr
    TUIMgr -->|input()| Orchestrator

    Orchestrator -->|compose adapters\nby config| Adapters
    Orchestrator -->|spawn 3x, tools=composed| AgentInstance
    Orchestrator -->|spawn 1x, tools=composed| AgentInstance

    CoT -.->|if composed| WebSearch
    CoT -.->|if composed| JiraAdapter
    CoT --> Config
    Config --> Exec

    CoT -->|save/read| Notebook
    Notebook --> KVCache
    Orchestrator --> Session
    Session --> KVCache

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
    participant W1 as Research Agent 1<br/>(composed tools + note)
    participant W2 as Research Agent 2<br/>(composed tools + note)
    participant W3 as Research Agent 3<br/>(composed tools + note)
    participant LLM as LLM Provider
    participant Val as Validation Agent<br/>(note only)
    participant KV as Session KV\n(In-Memory)

    User->>TUI: research query
    TUI->>TUIMgr: input("ask anything...")
    TUIMgr->>Orch: submit query
    Orch->>KV: init session

    alt "no JINA_API_KEY"
        Orch->>TUIMgr: warn("websearch disabled, falling back to internal knowledge")
        TUIMgr->>TUI: render
    end

    Orch->>TUIMgr: showthinking("researching...", {timeout: 0, showall: true})
    TUIMgr->>TUI: render

    par Concurrent Research
        Orch->>W1: run(query, {composed tools, note}, research-prompt)
        Orch->>W2: run(query, {composed tools, note}, research-prompt)
        Orch->>W3: run(query, {composed tools, note}, research-prompt)
    end

    loop Chain of Thought (per agent)
        W1->>LLM: step()
        LLM-->>W1: response {type, content}
        alt type != "output"
            W1->>KV: save to notebook
        else type == "output"
            W1-->>Orch: final result
        end
    end

    Orch->>Val: validate(results, {note}, validation-prompt)
    Val->>TUIMgr: showthinking(intermediate, {timeout: null, showall: true})
    TUIMgr->>TUI: render
    Val-->>TUIMgr: output(validated result)
    TUIMgr-->>TUI: render
    Orch->>KV: terminate research session
```

---

## 3. Session Lifecycle (State)

```mermaid
stateDiagram-v2
    state "Research Agent Session" as RAS
    state "Validation Agent Session" as VAS

    [*] --> RAS: user query received
    RAS --> RAS: chain-of-thought step (type != output)
    RAS --> VAS: output produced (type == output)
    RAS --> [*]: session terminated

    VAS --> VAS: validate turn 1
    VAS --> VAS: validate turn 2
    VAS --> [*]: application exits

    note right of RAS: Cleared after each query
    note right of VAS: Persists across multiple user turns
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
        KVCache["Session-level Dictionary\n{key: {notebook, session}}"]
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
