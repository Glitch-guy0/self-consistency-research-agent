# S2 — Agent Internal Chain-of-Thought Loop

**Scope:** Inside a single LLMAgentWrapper instance — the 10-phase research loop per sherlock prompt
**Actors:** LLMAgentWrapper, ILLMProvider, ToolSet (websearch, jira, note), KVCache (temp session)

---

```mermaid
sequenceDiagram
    participant Agent as LLMAgentWrapper
    participant LLM as ILLMProvider
    participant Search as IWebSearchPort
    participant Jira as IJiraPort
    participant KV as KVCacheTemp

    Agent->>Agent: Intent - parse user query
    Agent->>Agent: Curate - plan research topics

    loop Research Loop
        Note over Agent,LLM: Think
        Agent->>LLM: step()
        LLM-->>Agent: thought + action decision

        alt action search
            Note over Agent,Search: Search Construct
            Agent->>Search: search(query)
            Search-->>Agent: markdown results
            Agent->>Search: parse(url)
            Search-->>Agent: page content

        else action jira_query
            Note over Agent,Jira: Jira Query
            Agent->>Jira: query(params)
            Jira-->>Agent: jira data

        else action note_save
            Note over Agent,KV: Save Note
            Agent->>KV: save(key, finding)
            KV-->>Agent: ok

        else action output
            Note over Agent,Agent: Produce Output
            Agent-->>Agent: type = output
        end

        Note over Agent: Analyse
        Agent->>Agent: check if enough info gathered

        alt missing info
            Agent->>Agent: identify remaining gaps
        else enough info
            Note over Agent: Validate
            Agent->>Agent: confirm depth satisfied
            Agent-->>Agent: exit loop
        end
    end

    Note over Agent,Agent: Final Output
    Agent-->>Agent: produce final result
```

## Loop State Machine

```
┌──────────┐     ┌──────────┐     ┌────────────┐
│  Intent  │────>│  Curate  │────>│    Loop    │
└──────────┘     └──────────┘     └─────┬──────┘
                                        │
                                   ┌────▼──────┐
                                   │   Think   │
                                   └────┬──────┘
                                        │
                              ┌─────────┼──────────┐
                              │         │          │
                         ┌────▼──┐ ┌───▼───┐ ┌───▼────┐
                         │Search │ │Jira   │ │Note    │
                         └───┬───┘ └───┬───┘ └───┬────┘
                             │         │          │
                         ┌───▼─────────▼──────────▼──┐
                         │       Analyse             │
                         └───┬─────────┬──────────┬──┘
                             │         │          │
                        ┌────▼──┐ ┌───▼────┐ ┌───▼─────┐
                        │Gap    │ │Enough  │ │Output   │
                        │found  │ │ info   │ │produced │
                        └───┬───┘ └───┬────┘ └───┬─────┘
                            │         │          │
                            └──►Loop──┘          │
                                      ┌──────────▼──────┐
                                      │  Final Output   │
                                      │  {type: output} │
                                      └─────────────────┘
```

## CoT Tool Access by Agent Type

| Tool | Research Agent | Validation Agent |
|------|---------------|------------------|
| `websearch` | ✅ (if composed) | ❌ |
| `jira` | ✅ (if composed) | ❌ |
| `note` | ✅ | ✅ |
