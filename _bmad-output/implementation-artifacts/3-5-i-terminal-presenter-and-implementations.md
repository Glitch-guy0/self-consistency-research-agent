# Story 3.5: ITerminalPresenter & Implementations

Status: ready-for-dev

## Story

As a developer,
I want an optional styled output layer with ChalkPresenter and PlainPresenter,
So that TUIManager can render styled output when Chalk is available.

## Acceptance Criteria

1. **AC1: ITerminalPresenter interface** — Interface with render(), success(), fail(), warning() methods
2. **AC2: ChalkPresenter** — `render({color, bgcolor, opacity})` applies Chalk ANSI styling
3. **AC3: PlainPresenter** — `PlainPresenter.render()` writes text directly without ANSI codes
4. **AC4: TUIManager integration** — TUIManager accepts optional ITerminalPresenter in constructor; when absent, all output renders as plain text

## Tasks / Subtasks

- [ ] Task 1: Create ITerminalPresenter interface (AC: 1)
  - [ ] Create `lib/interface/iterminal-presenter.interface.ts` with render(), success(), fail(), warning()
- [ ] Task 2: Implement ChalkPresenter (AC: 2)
  - [ ] `render()` applies chalk color/bgcolor from opts
  - [ ] `success()` delegates to render with green
  - [ ] `fail()` delegates to render with red
  - [ ] `warning()` delegates to render with yellow
- [ ] Task 3: Implement PlainPresenter (AC: 3)
  - [ ] All methods return text unchanged
- [ ] Task 4: Integrate with TUIManager (AC: 4)
  - [ ] Constructor accepts `presenter?: ITerminalPresenter`
  - [ ] `output()` delegates to presenter.render() when available
  - [ ] `warn()` delegates to presenter.warning() when available
- [ ] Task 5: Verify typecheck (AC: all)
  - [ ] Run `npm run typecheck` — zero errors

## Dev Notes

- `render` signature: `render(text: string, opts?: { color?: string; bgcolor?: string; opacity?: number }): string`
- `opacity` is accepted but not directly supported by chalk — silently ignored
- ChalkPresenter casts chalk through `unknown` to `Record<string, ChalkFn>` for dynamic color lookup
- JSDoc with `@example` on all public methods

### Key Files to Create

```
lib/interface/iterminal-presenter.interface.ts   — ITerminalPresenter interface (NEW)
lib/tui/chalkPresenter.ts                         — ChalkPresenter (NEW)
lib/tui/plainPresenter.ts                         — PlainPresenter (NEW)
lib/tui/tuiManager.ts                             — Updated constructor + output/warn delegation (UPDATE)
```

### References

- [Source: epics.md#Story-35-ITerminalPresenter--Implementations](/Users/prajwal/Documents/learning/self-consistency/_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

big-pickle (opencode/big-pickle)

### Completion Notes List

- Created `lib/interface/iterminal-presenter.interface.ts` with render(text, opts?), success(), fail(), warning()
- Created `lib/tui/chalkPresenter.ts` — ChalkPresenter with dynamic color/bgcolor lookup
- Created `lib/tui/plainPresenter.ts` — PlainPresenter returning text unmodified
- Updated `lib/tui/tuiManager.ts` — constructor accepts optional presenter; output() and warn() delegate
- `npm run typecheck` passes with zero errors

### File List

- lib/interface/iterminal-presenter.interface.ts — new
- lib/tui/chalkPresenter.ts — new
- lib/tui/plainPresenter.ts — new
- lib/tui/tuiManager.ts — updated

### Review Findings

- [x] [Review][Decision] `render()` signature widened from spec: added `text: string` as first parameter. The spec sketch showed `render(opts: { ... }): void` without text, which would make the method unusable. Added text param and return string to match how presenters work.
- [x] [Review][Patch] Dynamic chalk property access requires `unknown` cast — chalk's `ChalkInstance` type lacks index signature. Used `(chalk as unknown as Record<string, ChalkFn>)` pattern [lib/tui/chalkPresenter.ts:27]
