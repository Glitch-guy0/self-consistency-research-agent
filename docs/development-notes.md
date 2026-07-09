# Development Notes

## Implementation Decisions

### 1. Zod at the Hexagonal Boundary
`src/interface/ILLMProvider.ts` imports `ZodType` from `zod`. This couples the port contract to a specific validation library. Accepted as a known tradeoff because structured output is a core feature and Zod is the only validator in use. If swapping validators becomes necessary, the port interface will need to be refactored.

### 2. OpenAI Chat Completions API
`src/service/LLMProvider.ts` uses `client.chat.completions.create()` instead of the newer `responses.create()` API. The original implementation used `responses.create` with `text.format` for structured output. This was changed to `chat.completions` with `response_format: { type: "json_object" }` to stay on the stable, widely-supported API surface.

### 3. In-Memory KV Cache
`src/utils/kvCache.ts` uses a plain JS object instead of `Map`. This is intentional: values are stored and returned by reference, allowing in-place mutation by consumers like `SessionAdapter`. Redis was deferred to post-v1.

### 4. Session Isolation
Each research agent gets a unique session ID (`agent-session-${i}`) scoped to its notebook via `NoteToolAdapter`. The validation agent gets its own isolated session. Conversation history is a separate persistent session.

### 5. Error Handling in CoT Loop
`src/modules/AgentWrapper.ts` catches LLM call failures and returns them as `thinking` steps, allowing the agent to retry. This prevents a single failed API call from killing the entire research run.

### 6. Parallel Agent Execution with Failure Tolerance
`src/modules/Orchestrator.ts` uses `Promise.allSettled()` instead of `Promise.all()`. Failed agents are logged and the system continues with remaining results. If all agents fail, the user sees a clear message.

## Difficulties Encountered

### Chalk v5 TypeScript Types
Chalk v5 changed its type structure. Dynamic method access like `chalk[color]` doesn't type-check because TypeScript can't verify arbitrary string keys. Resolved by building static lookup maps (`colorFns`, `bgColorFns`) at module load time, which are type-safe and avoid the `as never` cast.

### TUIManager Presenter Wiring
The `ITerminalPresenter` was designed as an optional dependency injection, but `TUIManager` only used it in 2 of 6 methods. Fixed by wiring `ChalkPresenter` in `main.ts` and updating `TUIManager` to apply styling in `showthinking()` (cyan) and `write()` (default style).

### Line Clearing and Streaming Output
Streaming the validation result character-by-character with `setTimeout(10)` caused flickering and line artifacts. Resolved by using `tui.write()` for streaming chunks and `tui.output("")` for the final newline, combined with `\r\x1b[K` for proper line clearing.

### Empty API Key Runtime Errors
Missing `API_KEY` caused the OpenAI client to initialize with an empty string, producing confusing 401 errors at runtime. Fixed by gating startup in `config.ts` — `loadConfig()` now throws immediately if `API_KEY` is missing, with a clear message directing the user to `.env`.

## Known Limitations

- **Single-model diversity:** Research agents currently all use the same global config. Per-agent model overrides require manually setting `providerConfig` in `AgentFactory.registerResearchAgent()`.
- **No test framework:** The project has no automated tests. All validation is manual via the terminal.
- **Context window:** User input is capped at 500 characters. No token-counting against the model's actual context limit is implemented.
- **Conversation history:** Only the final validated answer and user queries are persisted. Individual research agent outputs were not persisted until this fix.

## Cleanup Actions

- Removed unused `IConsistencyProtocol` port interface (never wired into the codebase).
- Archived internal planning files (`prompt.md`, `validation.md`, `structure.md`, `research.md`) to `_archive/`.
- `docs/` contains the current authoritative documentation.
