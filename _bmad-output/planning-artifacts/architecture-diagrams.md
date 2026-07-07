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
        ValAgent["Validation Agent"]
        Session["Session Manager"]
    end

    subgraph Core["Core Domain"]
        LLMProvider["LLM Provider\n(Interface)"]
        ResearchWorker1["Research Worker 1"]
        ResearchWorker2["Research Worker 2"]
        ResearchWorker3["Research Worker 3"]
    end

    subgraph Adapters["Adapters (Hexagonal)"]
        WebSearch["Web Search Adapter\n(Jina API)"]
        NoteTool["Note Tool Adapter\n(KV Dictionary)"]
        Redis["Redis KV Store"]
    end

    TUI -->|query| Orchestrator
    Orchestrator -->|spawn 3x| ResearchWorker1
    Orchestrator -->|spawn 3x| ResearchWorker2
    Orchestrator -->|spawn 3x| ResearchWorker3
    ResearchWorker1 --> LLMProvider
    ResearchWorker2 --> LLMProvider
    ResearchWorker3 --> LLMProvider
    LLMProvider --> WebSearch
    LLMProvider --> NoteTool
    NoteTool --> Redis
    Orchestrator -->|output| ValAgent
    ValAgent -->|stream thinking| TUI
    ValAgent -->|stream result| TUI
    Orchestrator --> Session
    Session --> Redis
```

---

## 2. Request Flow (Sequence)

```mermaid
sequenceDiagram
    actor User
    participant TUI as CLI / TUI
    participant Orch as Orchestrator
    participant W1 as Worker 1
    participant W2 as Worker 2
    participant W3 as Worker 3
    participant LLM as LLM Provider
    participant Val as Validation Agent
    participant Redis as Redis KV

    User->>TUI: research query
    TUI->>Orch: submit query
    Orch->>Redis: init session
    Orch->>TUI: start "researching..."

    par Concurrent Research
        Orch->>W1: run(query)
        Orch->>W2: run(query)
        Orch->>W3: run(query)
    end

    loop Chain of Thought
        W1->>LLM: step()
        LLM-->>W1: response {type, content}
        alt type != "output"
            W1->>Redis: save to notebook
        else type == "output"
            W1-->>Orch: final result
        end
    end

    Orch->>Val: validate(results)
    Val->>TUI: stream thinking process
    Val-->>TUI: stream validated output
    Orch->>Redis: terminate research session
    TUI->>User: display result
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

    note right of RAS: Temporary thinking process cleared after each query
    note right of VAS: Session persists across multiple user turns
```

---

## 4. Hexagonal Architecture (Context)

```mermaid
flowchart TB
    subgraph Ports["Ports (Interfaces)"]
        IP_LM["LLMProviderPort"]
        IP_Web["WebSearchPort"]
        IP_Note["NoteToolPort"]
        IP_Session["SessionPort"]
    end

    subgraph CoreHex["Core Domain"]
        LLMProviderImpl["LLMProvider\n(Implements Port)"]
    end

    subgraph AdaptersHex["Adapters"]
        JinaAdapter["JinaSearchAdapter"]
        NoteAdapter["NoteToolAdapter"]
        RedisAdapter["RedisSessionAdapter"]
    end

    subgraph External["External"]
        JinaAPI["Jina Search API"]
        RedisDB["Redis"]
        OpenAI["OpenAI API"]
    end

    LLMProviderImpl --> IP_LM
    LLMProviderImpl --> IP_Web
    LLMProviderImpl --> IP_Note
    LLMProviderImpl --> IP_Session

    IP_Web --> JinaAdapter
    IP_Note --> NoteAdapter
    IP_Session --> RedisAdapter

    JinaAdapter --> JinaAPI
    NoteAdapter --> RedisDB
    RedisAdapter --> RedisDB
    LLMProviderImpl --> OpenAI
```
