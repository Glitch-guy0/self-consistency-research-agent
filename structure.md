# Folder Structure — Refactoring Reference

> **Purpose:** This document is the authoritative reference for the folder reorganisation.
> Agents and developers should read this before moving, creating, or renaming any file.

---

## Current Issues (pre-migration)

| # | Problem | Details |
|---|---------|---------|
| 1 | `interface/` naming inconsistency | Mix of `iNoteToolPort.interface.ts`, `illm-provider.interface.ts`, `llmProvider.interface.ts` (missing `i` prefix, inconsistent casing and suffix) |
| 2 | `session/` is a 1-file dir | Contains only `SessionAdapter` — should be grouped with other adapters |
| 3 | `.provider.ts` suffix inconsistency | `llmProvider.provider.ts` has it but `tuiManager.ts` does not |
| 4 | `type.ts` / `util.ts` split | KVCache type in `types/kvCache.type.ts` but class in `utils/kvCache.util.ts` — divorced |
| 5 | `ProviderFactory` misclassified | `providerFactory.util.ts` lives in `providers/` but is a composition utility, not a provider |
| 6 | Flat hexagonal mixing | Ports + adapters + domain logic all at same depth — obscures the hexagonal boundary |
| 7 | No `src/` root | Everything lives directly in `lib/` with no top-level `src/` grouping |
| 8 | Orphan `util/` at project root | `util/llmProvider.util.ts` is outside `lib/` entirely — not covered by the `#lib/*` alias |

---

## Target Structure (post-migration)

```
src/
├── interface/                      # Hexagonal port contracts (the "what")
│   ├── ILLMProvider.ts             #   (was illm-provider.interface.ts / llmProvider.interface.ts — merged)
│   ├── ITUIManager.ts              #   (was itui-manager.interface.ts)
│   ├── IWebSearchProvider.ts       #   (was iweb-search-provider.interface.ts)
│   ├── INoteToolPort.ts            #   (was iNoteToolPort.interface.ts)
│   ├── ISessionPort.ts             #   (was iSessionPort.interface.ts)
│   ├── ITerminalPresenter.ts       #   (was iterminal-presenter.interface.ts)
│   └── IConsistencyProtocol.ts     #   (was iconsistency-protocol.interface.ts)
│
├── types/                          # Shared cross-cutting type definitions
│   ├── kvCache.ts                  #   KVCache interface (was lib/types/kvCache.type.ts)
│   └── config.ts                   #   Config shape (was lib/types/config.type.ts)
│
├── utils/                          # Pure functions / stateless helpers
│   ├── kvCache.ts                  #   KVCache factory/impl (was lib/utils/kvCache.util.ts)
│   ├── config.ts                   #   Config loader (was lib/utils/config.util.ts)
│   └── llmProvider.ts              #   LLM provider utility (was root util/llmProvider.util.ts)
│
├── service/                        # Adapter implementations — hexagonal "how" layer
│   ├── LLMProvider.ts              #   OpenAI SDK -> ILLMProvider (was lib/providers/llmProvider.provider.ts)
│   ├── JinaSearchProvider.ts       #   Jina API -> IWebSearchProvider (was lib/providers/jinaSearchProvider.provider.ts)
│   ├── NoteToolAdapter.ts          #   KVCache -> INoteToolPort (was lib/providers/noteToolAdapter.provider.ts)
│   └── SessionAdapter.ts           #   KVCache -> ISessionPort (was lib/session/sessionAdapter.provider.ts)
│
├── plugins/                        # Terminal UI presenters — pluggable output strategies
│   ├── ChalkPresenter.ts           #   Chalk -> ITerminalPresenter (was lib/tui/chalkPresenter.ts)
│   ├── PlainPresenter.ts           #   No-op -> ITerminalPresenter (was lib/tui/plainPresenter.ts)
│   └── TUIManager.ts               #   TUI orchestration (was lib/tui/tuiManager.ts)
│
└── modules/                        # Application / domain orchestration logic
    ├── AgentFactory.ts             #   Two-phase lifecycle (was lib/agent/agentFactory.ts)
    ├── AgentWrapper.ts             #   CoT loop primitive (was lib/agent/llmAgentWrapper.ts)
    ├── Orchestrator.ts             #   Pipeline coordinator (was lib/agent/orchestrator.ts)
    └── ProviderFactory.ts          #   Provider composition (was lib/providers/providerFactory.util.ts)

main.ts                             # Entry point (stays at project root)
```

---

## Directory Responsibilities and Dependency Rules

| Directory | Role | May import from |
|-----------|------|-----------------|
| `src/interface/` | Port/contract definitions only — no implementations | nothing (pure TS interfaces) |
| `src/types/` | Shared data-shape types reused across multiple layers | `src/interface/` |
| `src/utils/` | Stateless pure helpers and loaders | `src/types/`, `src/interface/` |
| `src/service/` | Hexagonal adapters — one adapter per external concern | `src/interface/`, `src/types/`, `src/utils/` |
| `src/plugins/` | Pluggable output/UI strategies | `src/interface/`, `src/types/` |
| `src/modules/` | Application orchestration and domain logic | all of the above |

> **Rule:** Lower layers must never import from higher layers. `interface/` and `types/` are the foundation; `modules/` sits at the top.

---

## File Naming Convention

| Category | Convention | Example |
|----------|-----------|---------|
| Interfaces | `I` prefix + PascalCase, no suffix | `ILLMProvider.ts` |
| Types | camelCase noun, no suffix | `kvCache.ts`, `config.ts` |
| Utils | camelCase noun, no suffix | `config.ts`, `llmProvider.ts` |
| Services | PascalCase class name, no suffix | `LLMProvider.ts`, `SessionAdapter.ts` |
| Plugins | PascalCase class name, no suffix | `ChalkPresenter.ts`, `TUIManager.ts` |
| Modules | PascalCase class name, no suffix | `Orchestrator.ts`, `AgentFactory.ts` |

> **Dropped suffixes:** `.interface.ts`, `.provider.ts`, `.util.ts`, `.type.ts` — all redundant.
> **Dropped kebab-case** for all new files — PascalCase for classes/interfaces, camelCase for utils/types.

---

## Config Changes Required

### `tsconfig.json`

```diff
- "include": ["main.ts", "lib/**/*.ts"],
+ "include": ["main.ts", "src/**/*.ts"],
```

### `package.json` — path aliases

```diff
  "imports": {
-   "#lib/*": "./lib/*",
-   "#util/*": "./util/*"
+   "#src/*": "./src/*"
  },
```

> A single `#src/*` alias replaces both `#lib/*` and `#util/*`.

### `package.json` — directories field

```diff
  "directories": {
-   "lib": "lib"
+   "src": "src"
  },
```

---

## File Migration Map

| Old Path | New Path |
|----------|----------|
| `lib/interface/illm-provider.interface.ts` | `src/interface/ILLMProvider.ts` (merge with duplicate below) |
| `lib/interface/llmProvider.interface.ts` | `src/interface/ILLMProvider.ts` (merge — duplicate interface) |
| `lib/interface/itui-manager.interface.ts` | `src/interface/ITUIManager.ts` |
| `lib/interface/iweb-search-provider.interface.ts` | `src/interface/IWebSearchProvider.ts` |
| `lib/interface/iNoteToolPort.interface.ts` | `src/interface/INoteToolPort.ts` |
| `lib/interface/iSessionPort.interface.ts` | `src/interface/ISessionPort.ts` |
| `lib/interface/iterminal-presenter.interface.ts` | `src/interface/ITerminalPresenter.ts` |
| `lib/interface/iconsistency-protocol.interface.ts` | `src/interface/IConsistencyProtocol.ts` |
| `lib/types/kvCache.type.ts` | `src/types/kvCache.ts` |
| `lib/types/config.type.ts` | `src/types/config.ts` |
| `lib/utils/kvCache.util.ts` | `src/utils/kvCache.ts` |
| `lib/utils/config.util.ts` | `src/utils/config.ts` |
| `util/llmProvider.util.ts` (root-level orphan) | `src/utils/llmProvider.ts` |
| `lib/providers/llmProvider.provider.ts` | `src/service/LLMProvider.ts` |
| `lib/providers/jinaSearchProvider.provider.ts` | `src/service/JinaSearchProvider.ts` |
| `lib/providers/noteToolAdapter.provider.ts` | `src/service/NoteToolAdapter.ts` |
| `lib/session/sessionAdapter.provider.ts` | `src/service/SessionAdapter.ts` |
| `lib/tui/chalkPresenter.ts` | `src/plugins/ChalkPresenter.ts` |
| `lib/tui/plainPresenter.ts` | `src/plugins/PlainPresenter.ts` |
| `lib/tui/tuiManager.ts` | `src/plugins/TUIManager.ts` |
| `lib/agent/agentFactory.ts` | `src/modules/AgentFactory.ts` |
| `lib/agent/llmAgentWrapper.ts` | `src/modules/AgentWrapper.ts` |
| `lib/agent/orchestrator.ts` | `src/modules/Orchestrator.ts` |
| `lib/providers/providerFactory.util.ts` | `src/modules/ProviderFactory.ts` |

---

## Import Path Updates (examples)

All internal imports must be updated from `#lib/*` / `#util/*` to `#src/*`:

```diff
- import { config }         from "#lib/utils/config.util.ts";
+ import { config }         from "#src/utils/config.ts";

- import { kvCache }        from "#lib/utils/kvCache.util.ts";
+ import { kvCache }        from "#src/utils/kvCache.ts";

- import { SessionAdapter } from "#lib/session/sessionAdapter.provider.ts";
+ import { SessionAdapter } from "#src/service/SessionAdapter.ts";

- import { TUIManager }     from "#lib/tui/tuiManager.ts";
+ import { TUIManager }     from "#src/plugins/TUIManager.ts";

- import { Orchestrator }   from "#lib/agent/orchestrator.ts";
+ import { Orchestrator }   from "#src/modules/Orchestrator.ts";
```

---

## Migration Checklist

- [ ] Create `src/` with subdirs: `interface/`, `types/`, `utils/`, `service/`, `plugins/`, `modules/`
- [ ] Move and rename all files per the File Migration Map above
- [ ] Merge duplicate `ILLMProvider` interface files into a single `src/interface/ILLMProvider.ts`
- [ ] Update all internal import paths from `#lib/*` / `#util/*` to `#src/*` across all `.ts` files
- [ ] Update `tsconfig.json` include glob (`lib/**` to `src/**`)
- [ ] Update `package.json` `imports` aliases (`#lib/*` + `#util/*` to `#src/*`)
- [ ] Update `package.json` `directories` field
- [ ] Update `main.ts` imports to use new `#src/*` paths
- [ ] Delete old directories: `lib/`, `util/`
- [ ] Run `npm run typecheck` — must pass with 0 errors
- [ ] Run the agent end-to-end to confirm runtime correctness
