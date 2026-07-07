# Class Diagram: Self-Consistency Research Agent

## Mermaid Class Diagram

```mermaid
classDiagram
    class ILLMProvider~U, V~ {
        <<Interface>>
        +stream() Promise~ReadableStream~
        +message() Promise~string~
        +json() Promise~U~
        +outputFormat(schema: ZodType) ILLMProvider
    }

    class ITUIManager {
        <<Interface>>
        +showthinking(text: string, opts: string) void
        +clear() void
        +truncateLength() number
        +output(text: string) void
        +input(placeholder: string) string
        +useroutput() void
    }

    class IWebSearchPort {
        <<Interface>>
        +search(query: string) string
        +parse(url: string) string
    }

    class IJiraPort {
        <<Interface>>
        +query(params: string) any
    }

    class INoteToolPort {
        <<Interface>>
        +save(key: string, value: any) void
        +read(key: string) any
    }

    class ISessionPort {
        <<Interface>>
        +init(id: string) void
        +get(id: string) SessionData
        +set(id: string, data: SessionData) void
        +delete(id: string) void
    }

    class IConsistencyProtocol {
        <<Interface>>
        +participate(provider: ILLMProvider) void
        +submission() any
        +evaluation() string
    }

    class LLMProvider~U, V~ {
        -client: OpenAI
        -config: LLMConfig
        +stream() Promise~ReadableStream~
        +message() Promise~string~
        +json() Promise~U~
        +outputFormat(schema: ZodType) ILLMProvider
    }

    class LLMConfig {
        +baseUrl: string
        +model: string
        +apiKey: string
        +maxRetries: number
    }

    class JinaSearchAdapter {
        -apiKey: string
        +search(query: string) string
        +parse(url: string) string
    }

    class JiraAdapter {
        -apiKey: string
        -baseUrl: string
        +query(params: string) any
    }

    class NoteToolAdapter {
        -kvStore: KVCache
        +save(key: string, value: any) void
        +read(key: string) any
    }

    class SessionAdapter {
        -kvStore: KVCache
        +init(id: string) void
        +get(id: string) SessionData
        +set(id: string, data: SessionData) void
        +delete(id: string) void
    }

    class TUIManager {
        -chalk: string
        -currentThinking: string
        +showthinking(text: string, opts: string) void
        +clear() void
        +truncateLength() number
        +output(text: string) void
        +input(placeholder: string) string
        +useroutput() void
    }

    class Orchestrator {
        -tui: ITUIManager
        -sessionAdapter: ISessionPort
        -factory: AgentFactory
        -convSessionId: string
        +run() void
        -initConversation() void
        -spawnResearchAgents(query: string) AgentOutput[]
        -runValidation(results: AgentOutput[]) AgentOutput
        -cleanup() void
    }

    class AgentFactory {
        +createResearchAgent(config: AgentConfig) LLMAgentWrapper
        +createValidationAgent(config: AgentConfig) LLMAgentWrapper
    }

    class LLMAgentWrapper {
        -tools: ToolSet
        -systemPrompt: string
        -notebook: INoteToolPort
        -session: ISessionPort
        -llm: ILLMProvider
        -sessionId: string
        +run(query: string, convHistory: Message[]) AgentOutput
        -step() string
    }

    class AgentConfig {
        +tools: string[]
        +systemPrompt: string
        +llmConfig: LLMConfig
        +sessionId: string
    }

    class ToolSet {
        +websearch: IWebSearchPort
        +jira: IJiraPort
        +note: INoteToolPort
    }

    class KVCache {
        -store: string
        +get(key: string) any
        +set(key: string, value: any) void
        +delete(key: string) void
    }

    class SessionData {
        +notebook: any[]
    }

    class ConvSessionData {
        +pairs: Message[]
    }

    class Message {
        +role: string
        +content: string
    }

    class AgentOutput {
        +type: string
        +content: string
    }

    class StreamResult {
        +result: string
    }

    ILLMProvider <|.. LLMProvider : implements
    ITUIManager <|.. TUIManager : implements
    IWebSearchPort <|.. JinaSearchAdapter : implements
    IJiraPort <|.. JiraAdapter : implements
    INoteToolPort <|.. NoteToolAdapter : implements
    ISessionPort <|.. SessionAdapter : implements

    Orchestrator --> ITUIManager : uses
    Orchestrator --> ISessionPort : owns
    Orchestrator --> AgentFactory : configures

    AgentFactory --> LLMAgentWrapper : creates
    AgentFactory --> AgentConfig : reads

    LLMAgentWrapper --> ILLMProvider : uses
    LLMAgentWrapper --> ToolSet : composes
    LLMAgentWrapper --> INoteToolPort : writes
    LLMAgentWrapper --> ISessionPort : manages
    LLMAgentWrapper --> AgentOutput : produces

    ToolSet --> IWebSearchPort : optional
    ToolSet --> IJiraPort : optional
    ToolSet --> INoteToolPort : required

    LLMProvider --> LLMConfig : reads
    NoteToolAdapter --> KVCache : backs
    SessionAdapter --> KVCache : backs

    ISessionPort --> SessionData : agent scope
    ISessionPort --> ConvSessionData : conv scope

    LLMAgentWrapper <|.. IConsistencyProtocol : implements

    style ILLMProvider fill:#e3f2fd,stroke:#1565c0
    style ITUIManager fill:#e3f2fd,stroke:#1565c0
    style IWebSearchPort fill:#e3f2fd,stroke:#1565c0
    style IJiraPort fill:#e3f2fd,stroke:#1565c0
    style INoteToolPort fill:#e3f2fd,stroke:#1565c0
    style ISessionPort fill:#e3f2fd,stroke:#1565c0
    style IConsistencyProtocol fill:#e3f2fd,stroke:#1565c0
    style KVCache fill:#fce4ec,stroke:#c62828
    style Orchestrator fill:#e8f5e9,stroke:#2e7d32
    style AgentFactory fill:#e8f5e9,stroke:#2e7d32
    style LLMAgentWrapper fill:#e8f5e9,stroke:#2e7d32
```

## Ports (Interfaces)

| Interface | Methods | Purpose |
|-----------|---------|---------|
| `ILLMProvider<U,V>` | `stream()`, `message()`, `json()`, `outputFormat()` | LLM interaction; generic over input/output types |
| `ITUIManager` | `showthinking()`, `clear()`, `truncateLength()`, `output()`, `input()`, `useroutput()` | Terminal UI abstraction |
| `IWebSearchPort` | `search()`, `parse()` | Web search capability (optional) |
| `IJiraPort` | `query()` | Jira integration (optional) |
| `INoteToolPort` | `save()`, `read()` | Per-agent notebook KV |
| `ISessionPort` | `init()`, `get()`, `set()`, `delete()` | Session lifecycle |
| `IConsistencyProtocol` | `participate()`, `submission()`, `evaluation()` | Agent participation contract |

## Key Relationships

- **Orchestrator** owns the lifecycle: composes adapters, spawns agents, manages Conversation Session
- **AgentFactory** produces `LLMAgentWrapper` instances with different configs (research vs validation)
- **LLMAgentWrapper** is the single reusable primitive — takes a `ToolSet` + `systemPrompt` and runs CoT
- **ToolSet** is composed at factory time based on environment config (optional adapters excluded when keys missing)
- **KVCache** is the shared in-memory store backing both `NoteToolAdapter` and `SessionAdapter`
