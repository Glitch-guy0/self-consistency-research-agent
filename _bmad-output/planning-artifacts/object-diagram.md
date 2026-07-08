# Object Diagram: Runtime Snapshot During Query Execution

## 1. Runtime Instance Snapshot

An object (`instanceName:ClassName`) diagram showing a live state when the user submits a query. Three research agents are in-flight, the validation agent hasn't been spawned yet, and the single `KVCache` holds both the conversation session and three temp agent notebooks.

```mermaid
classDiagram
    class orch:Orchestrator {
        convSessionId = session-abc123
        tui = tui
        sessionAdapter = sAdapter
        factory = f
    }

    class tui:TUIManager {
        chalk = Chalk
        currentThinking = researching...
    }

    class sAdapter:SessionAdapter {
        kvStore = cache
    }

    class nAdapter:NoteToolAdapter {
        kvStore = cache
    }

    class f:AgentFactory {
        llmConfig = configured
    }

    class r1:LLMAgentWrapper {
        sessionId = temp-r1
        tools = websearch+note
        systemPrompt = sherlock
    }

    class r2:LLMAgentWrapper {
        sessionId = temp-r2
        tools = websearch+note
        systemPrompt = sherlock
    }

    class r3:LLMAgentWrapper {
        sessionId = temp-r3
        tools = websearch+note
        systemPrompt = sherlock
    }

    class v1:LLMAgentWrapper {
        sessionId = temp-val
        tools = note
        systemPrompt = athena
    }

    class p1:LLMProvider {
        client = OpenAI
        config = default
    }

    class cache:KVCache {
        store = conv plus 4 temp
    }

    class jina:JinaSearchAdapter {
        apiKey = present
    }

    orch --> tui
    orch --> sAdapter
    orch --> f
    f --> r1 : creates
    f --> r2 : creates
    f --> r3 : creates
    f --> v1 : created later

    r1 --> p1
    r2 --> p1
    r3 --> p1

    r1 --> nAdapter
    r2 --> nAdapter
    r3 --> nAdapter

    r1 --> jina
    r2 --> jina
    r3 --> jina

    sAdapter --> cache
    nAdapter --> cache
```

---

## 2. Session State Transitions

A state diagram showing how the `ConvSessionData` and `TempSessionData` objects evolve across a full two-query lifecycle. Temp sessions are created per query and garbage-collected after the agent produces its `AgentOutput`.

```mermaid
stateDiagram-v2
    state "App Start" as START
    state "ConvSessionData" as CONV {
        [*] --> empty
        empty --> q1Phase1 : Query 1
        q1Phase1 --> q1Phase2 : Agent Output Collected
        q1Phase2 --> q2Phase1 : Query 2
        q2Phase1 --> q2Phase2 : Agent Output Collected
    }

    state "TempSessionData (per query)" as TEMP {
        [*] --> created : spawnResearchAgents
        created --> inFlight : run CoT
        inFlight --> collected : AgentOutput produced
        collected --> [*] : deleted
    }

    START --> empty : init Conversation Session
```

---

## Object Table

| Object | Class | State | Notes |
|--------|-------|-------|-------|
| `orch` | `Orchestrator` | `convSessionId = "session-abc123"` | Root coordinator |
| `tui` | `TUIManager` | showing "researching..." | Chalk-based terminal |
| `sAdapter` | `SessionAdapter` | backed by `cache` | Manages all sessions |
| `nAdapter` | `NoteToolAdapter` | backed by `cache` | Per-agent notebook store |
| `f` | `AgentFactory` | configured with LLM config | Creates agent instances |
| `r1, r2, r3` | `LLMAgentWrapper` | each with own `sessionId` | Research agents in-flight |
| `v1` | `LLMAgentWrapper` | not yet created | Validation agent (pending) |
| `p1` | `LLMProvider` | wraps OpenAI SDK | Shared by all agents |
| `cache` | `KVCache` | 3 temp sessions + 1 conv session | Shared in-memory store |
| `jina` | `JinaSearchAdapter` | composed (API key present) | Optional adapter |

## 3. TerminalPresenter — Runtime Styling State

When Chalk is available, `tui` composes `ChalkPresenter` for styled output. When absent, `PlainPresenter` is used. The object below shows the Chalk-composed state.

```mermaid
classDiagram
    class tui:TUIManager {
        chalk = Chalk
        currentThinking = researching...
        presenter = pres
    }

    class pres:ChalkPresenter {
        chalk = chalk instance
    }

    tui --> pres : optional composition
```

---

## Session State Transitions (ASCII View)

```
App Start           Query 1             Query 1             Query 2
                    Research Phase      Validation Phase
┌──────────┐       ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ conv     │──────>│ conv         │───>│ conv         │───>│ conv         │
│ session  │       │ session      │    │ session      │    │ session      │
│ []       │       │ [{user,q1}]  │    │ [{u,q1},{a,  │    │ [{u,q1},{a,  │
└──────────┘       ├──────────────┤    │   answer1}]  │    │   ans1},     │
                   │ temp-r1      │    └──────────────┘    │ {u,q2}]      │
                   │ temp-r2      │                        ├──────────────┤
                   │ temp-r3      │                        │ temp-r1'     │
                   └──────────────┘                        │ temp-r2'     │
                         │                                 │ temp-r3'     │
                         ▼                                 └──────────────┘
                   All temp sessions                            │
                   deleted after output                         ▼
                                                           Deleted after
                                                           output (new cycle)
```
